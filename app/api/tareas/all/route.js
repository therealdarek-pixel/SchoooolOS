/**
 * =============================================================================
 *  ENDPOINT: GET /api/tareas/all
 * =============================================================================
 *  ¿Qué hace?
 *    Devuelve TODAS las tareas del sistema (de todos los alumnos), pensado
 *    para que el maestro pueda revisarlas y ponerles nota desde el panel
 *    de profesor.
 *
 *  Permisos:
 *    - Requiere estar logueado.
 *    - El usuario DEBE tener rol = "maestro". Cualquier otro rol recibe 403.
 *
 *  Notas:
 *    - Limitamos a 200 tareas para evitar respuestas gigantes. Si se llega
 *      a ese límite, conviene añadir paginación en el futuro.
 *    - Ordenadas de más reciente a más antigua para que el maestro vea
 *      primero las que acaban de entregar.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import {
  obtenerUsuarioActual,
  respuesta401,
  respuesta403,
  serializarDoc,
} from "@/lib/auth";
import { getTareasCollection } from "@/lib/mongodb";

export async function GET(req) {
  // 1) Autenticación.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // 2) Autorización: solo maestros.
  if (usuario.rol !== "maestro") return respuesta403();

  // 3) Buscamos todas las tareas, sin filtro de user_id.
  const col = await getTareasCollection();
  const tareas = await col
    .find({})
    .sort({ fecha_creacion: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json(tareas.map((t) => serializarDoc(t)));
}
