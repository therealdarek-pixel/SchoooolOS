/**
 * =============================================================================
 *  ENDPOINT: GET /api/auth/me
 * =============================================================================
 *  ¿Qué hace?
 *    Devuelve los datos del usuario que está actualmente logueado, leyendo
 *    el token JWT que viene en el header Authorization de la petición.
 *
 *  ¿Cuándo se usa?
 *    - Al recargar la página: el frontend tiene el token guardado en
 *      localStorage pero necesita refrescar los datos del usuario (nombre,
 *      rol, etc.) para mostrarlos.
 *    - Para validar que el token sigue siendo válido (no expirado).
 *
 *  Respuestas posibles:
 *    200 -> Devuelve el usuario serializado (sin password).
 *    401 -> No hay token, está mal formado o el usuario no existe.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { obtenerUsuarioActual, respuesta401, serializarUsuario } from "@/lib/auth";

export async function GET(req) {
  // obtenerUsuarioActual:
  //   1) Lee el header "Authorization: Bearer <token>"
  //   2) Verifica la firma del JWT y extrae el user_id
  //   3) Busca al usuario en MongoDB y lo devuelve (o null si algo falla)
  const usuario = await obtenerUsuarioActual(req);

  // Si no hay usuario válido, respondemos 401 (no autorizado).
  if (!usuario) return respuesta401();

  // serializarUsuario elimina el password y deja un objeto seguro de devolver.
  return NextResponse.json(serializarUsuario(usuario));
}
