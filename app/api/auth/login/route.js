/**
 * =============================================================================
 *  ENDPOINT: POST /api/auth/login
 * =============================================================================
 *  ¿Qué hace?
 *    Recibe un email y una contraseña, verifica que el usuario exista en la
 *    base de datos y que la contraseña coincida con la guardada (que está
 *    hasheada). Si todo está correcto, devuelve un token JWT que el frontend
 *    usará para identificar al usuario en las siguientes peticiones.
 *
 *  Flujo general:
 *    1) Lee y valida el cuerpo de la petición (email + password).
 *    2) Busca al usuario en MongoDB usando el email.
 *    3) Compara la contraseña enviada con el hash guardado.
 *    4) Genera un token JWT con el id del usuario y su rol.
 *    5) Devuelve el token + los datos públicos del usuario.
 *
 *  Respuestas posibles:
 *    200 -> Login correcto, devuelve { access_token, token_type, user }.
 *    400 -> El cuerpo de la petición no cumple el schema (zod).
 *    401 -> Email no existe o la contraseña es incorrecta.
 *    500 -> Error inesperado del servidor.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import {
  verificarPassword,
  crearToken,
  serializarUsuario,
} from "@/lib/auth";
import { getUsuariosCollection } from "@/lib/mongodb";

export async function POST(req) {
  try {
    // -------------------------------------------------------------------------
    // PASO 1: Leer y validar la información que mandó el frontend.
    // -------------------------------------------------------------------------
    // req.json() lee el cuerpo de la petición en formato JSON.
    // loginSchema.parse(...) usa Zod para revisar que vengan los campos
    // correctos (email con formato válido, password con longitud mínima, etc).
    // Si algo está mal, Zod lanza un error que cae en el catch de abajo.
    const body = await req.json();
    const datos = loginSchema.parse(body);

    // -------------------------------------------------------------------------
    // PASO 2: Buscar al usuario en la colección "usuarios" de MongoDB.
    // -------------------------------------------------------------------------
    // findOne devuelve null si no existe ningún usuario con ese email.
    const col = await getUsuariosCollection();
    const usuario = await col.findOne({ email: datos.email });

    if (!usuario) {
      // IMPORTANTE: usamos un mensaje genérico ("email o contraseña incorrectos")
      // a propósito. Si dijéramos "el email no existe" estaríamos ayudando a
      // un atacante a descubrir qué cuentas existen en el sistema.
      return NextResponse.json(
        { detail: "Email o contrasena incorrectos" },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // PASO 3: Verificar la contraseña.
    // -------------------------------------------------------------------------
    // La contraseña en la BD está hasheada (bcrypt), no en texto plano.
    // verificarPassword compara el texto plano que mandó el usuario contra
    // el hash guardado, sin tener que "desencriptarlo".
    const valida = await verificarPassword(datos.password, usuario.password);
    if (!valida) {
      return NextResponse.json(
        { detail: "Email o contrasena incorrectos" },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // PASO 4: Preparar la respuesta para el frontend.
    // -------------------------------------------------------------------------
    // serializarUsuario quita campos sensibles (como el password hasheado)
    // y convierte el _id de ObjectId a string para que el frontend lo lea bien.
    const usuarioSerializado = serializarUsuario(usuario);

    // crearToken arma un JWT firmado que contiene el id y el rol del usuario.
    // Este token se usará en las próximas peticiones para saber quién es.
    const token = crearToken(usuarioSerializado._id, usuarioSerializado.rol);

    // -------------------------------------------------------------------------
    // PASO 5: Responder con el token y la información pública del usuario.
    // -------------------------------------------------------------------------
    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: usuarioSerializado,
    });
  } catch (e) {
    // Si el error viene de Zod (validación fallida), tiene la propiedad
    // "issues" con la lista de problemas encontrados.
    if (e.issues) {
      return NextResponse.json(
        { detail: e.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }
    // Cualquier otro error (BD caída, bug en el código, etc.) se loggea
    // en consola para poder depurarlo y devolvemos un 500 al frontend.
    console.error(e);
    return NextResponse.json({ detail: "Error en el servidor" }, { status: 500 });
  }
}
