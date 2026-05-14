/**
 * lib/auth.ts
 * -----------
 * Modulo de seguridad: hashing de contrasenas + JSON Web Tokens.
 *
 * Provee tambien helpers para validar el token desde una NextRequest,
 * que se usan en cada API Route protegida.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getUsuariosCollection } from "./mongodb";


// "secreto" con el que se firma el token. Si alguien lo sabe puede hacerse pasar por cualquier usuario.
const JWT_SECRET = process.env.JWT_SECRET || "cambia-esto-en-produccion";
// Tiempo de vida del token: 7 dias. Despues de eso te pide volver a iniciar sesion.
const JWT_EXPIRES_IN = "7d";

// ====================================================
// HASHING DE CONTRASENAS (bcrypt)
// NUNCA se guarda la contrasena tal cual en la BD.
// Se guarda un "hash" (una version revuelta que no se puede deshacer).
// ====================================================

// Convierte la contrasena a hash antes de guardarla en Mongo.
export async function hashearPassword(password) {
  return bcrypt.hash(password, 10); // el 10 = nivel de seguridad (mas alto = mas lento)
}

// Compara lo que el usuario escribio con el hash guardado.
// Devuelve true si coinciden, false si no.
export async function verificarPassword(
  passwordPlano,
  passwordHash
) {
  return bcrypt.compare(passwordPlano, passwordHash);
}

// ====================================================
// JWT
// ====================================================





// Genera un TOKEN cuando el usuario inicia sesion correctamente.
// Ese token es la "credencial" que el frontend manda en cada request despues.
// Adentro guarda el id del usuario y su rol (alumno/maestro/admin).
export function crearToken(userId, rol) {
  return jwt.sign({ sub: userId, rol }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Revisa que el token sea valido y no este vencido.
// Si esta chido devuelve los datos; si no, devuelve null.
export function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET) ;
  } catch {
    return null;
  }
}

// ====================================================
// HELPERS PARA API ROUTES
// ====================================================
/**
 * Extrae el token del header "Authorization: Bearer XXX" y devuelve
 * el documento completo del usuario logueado.
 *
 * Si algo falla, devuelve null. Quien llama decide si responder 401.
 */
export async function obtenerUsuarioActual(req) {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const payload = verificarToken(token);
  if (!payload) return null;

  if (!ObjectId.isValid(payload.sub)) return null;
  const col = await getUsuariosCollection();
  const usuario = await col.findOne({ _id: new ObjectId(payload.sub) });
  return usuario;
}

/**
 * Helper de respuesta: 401 estandar.
 */
export function respuesta401() {
  return NextResponse.json(
    { detail: "Credenciales invalidas o expiradas" },
    { status: 401 }
  );
}

/**
 * Helper de respuesta: 403 (no tienes permisos).
 */
export function respuesta403() {
  return NextResponse.json(
    { detail: "Solo los maestros pueden realizar esta accion" },
    { status: 403 }
  );
}

/**
 * Convierte un documento de Mongo (con _id ObjectId) a un objeto JSON-friendly.
 * Tambien quita el password si existe.
 */
export function serializarUsuario(doc) {
  if (!doc) return null;
  const { password, ...resto } = doc;
  return { ...resto, _id: doc._id.toString() };
}

/**
 * Igual que serializarUsuario pero generico para cualquier documento.
 */
export function serializarDoc(doc) {
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}
