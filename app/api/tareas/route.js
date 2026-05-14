/**
 * =============================================================================
 *  ENDPOINT: GET /api/tareas
 * =============================================================================
 *  ¿Qué hace?
 *    Devuelve las tareas del usuario actualmente logueado, ordenadas de la
 *    más reciente a la más antigua. Pensado para que cada alumno vea SOLO
 *    sus propias tareas en el dashboard.
 *
 *  Notas:
 *    - Filtramos por user_id en el find, por lo tanto un alumno nunca puede
 *      ver tareas de otro alumno usando este endpoint.
 *    - Limitamos a 50 resultados para que la respuesta sea rápida y la UI
 *      no se sature. Si en el futuro hace falta más, se puede paginar.
 *    - Los maestros que quieran ver TODAS las tareas usan /api/tareas/all.
 *
 *  Respuestas:
 *    200 -> Array de tareas (puede ser vacío).
 *    401 -> No autenticado.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { obtenerUsuarioActual, respuesta401, serializarDoc } from "@/lib/auth";
import { getTareasCollection } from "@/lib/mongodb";

export async function GET(req) {
  // Validamos sesión.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // Buscamos las tareas del usuario, ordenadas por fecha descendente.
  const col = await getTareasCollection();
  const tareas = await col
    .find({ user_id: usuario._id.toString() })
    .sort({ fecha_creacion: -1 })
    .limit(50)
    .toArray();

  // serializarDoc convierte _id (ObjectId) a string y arregla las fechas
  // para que el frontend (JSON) las pueda consumir sin problemas.
  return NextResponse.json(tareas.map((t) => serializarDoc(t)));
}
