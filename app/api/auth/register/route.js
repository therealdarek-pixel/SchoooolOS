/**
 * =============================================================================
 *  ENDPOINT: POST /api/auth/register
 * =============================================================================
 *  ¿Qué hace?
 *    Crea una cuenta nueva. Recibe email, contraseña, nombre y rol; verifica
 *    que el email no esté ocupado, guarda al usuario con la contraseña ya
 *    hasheada y devuelve un token JWT para que el frontend pueda iniciar
 *    sesión automáticamente (sin tener que llamar a /login después).
 *
 *  Flujo general:
 *    1) Validar el cuerpo de la petición (email, password, nombre, rol).
 *    2) Verificar que el email no esté registrado ya.
 *    3) Hashear la contraseña (NUNCA se guarda en texto plano).
 *    4) Insertar el usuario en MongoDB.
 *    5) Generar token JWT y devolverlo junto a los datos del usuario.
 *
 *  Respuestas posibles:
 *    200 -> Registro exitoso, devuelve { access_token, token_type, user }.
 *    400 -> Datos inválidos (formato de email, password corto, rol inválido).
 *    409 -> Ya existe un usuario con ese email.
 *    500 -> Error inesperado del servidor.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schemas";
import {
  hashearPassword,
  crearToken,
  serializarUsuario,
} from "@/lib/auth";
import { getUsuariosCollection } from "@/lib/mongodb";

export async function POST(req) {
  try {
    // -------------------------------------------------------------------------
    // PASO 1: Leer y validar los datos enviados por el frontend.
    // -------------------------------------------------------------------------
    // registerSchema (definido con Zod) valida que:
    //   - email tenga formato de email
    //   - password tenga la longitud mínima
    //   - rol sea uno permitido ("alumno" o "maestro")
    // Si falla, Zod lanza una excepción que atrapamos abajo.
    const body = await req.json();
    const datos = registerSchema.parse(body);

    const col = await getUsuariosCollection();

    // -------------------------------------------------------------------------
    // PASO 2: Comprobar que el email no esté ya registrado.
    // -------------------------------------------------------------------------
    // Si findOne devuelve un documento es que el email ya está en uso.
    // Respondemos con 409 Conflict, que es el código correcto para "duplicado".
    const existente = await col.findOne({ email: datos.email });
    if (existente) {
      return NextResponse.json(
        { detail: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    // -------------------------------------------------------------------------
    // PASO 3: Hashear la contraseña antes de guardar.
    // -------------------------------------------------------------------------
    // hashearPassword usa bcrypt. Nunca se guarda la contraseña en texto
    // plano para que, si alguien roba la BD, no pueda leer las contraseñas.
    const passwordHash = await hashearPassword(datos.password);

    // -------------------------------------------------------------------------
    // PASO 4: Construir el documento e insertarlo en MongoDB.
    // -------------------------------------------------------------------------
    const ahora = new Date();
    const doc = {
      email: datos.email,
      password: passwordHash,            // <- hash, no texto plano
      nombre: datos.nombre,
      rol: datos.rol,                    // "alumno" o "maestro"
      fecha_registro: ahora,
    };

    const resultado = await col.insertOne(doc);

    // Releemos el documento con el _id generado por Mongo para tenerlo completo.
    const usuarioCreado = await col.findOne({ _id: resultado.insertedId });

    // serializarUsuario quita el password y convierte el _id a string
    // para enviar al frontend solo lo que realmente debe ver.
    const usuarioSerializado = serializarUsuario(usuarioCreado);

    // -------------------------------------------------------------------------
    // PASO 5: Generar el token JWT y devolverlo.
    // -------------------------------------------------------------------------
    // Así el usuario queda logueado al instante después de registrarse,
    // sin tener que llamar manualmente a /login.
    const token = crearToken(usuarioSerializado._id, usuarioSerializado.rol);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: usuarioSerializado,
    });
  } catch (e) {
    // Error de validación de Zod -> devolvemos 400 con el primer mensaje.
    if (e.issues) {
      return NextResponse.json(
        { detail: e.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }
    // Cualquier otro fallo: lo loggeamos y devolvemos 500 al frontend.
    console.error(e);
    return NextResponse.json({ detail: "Error en el servidor" }, { status: 500 });
  }
}
