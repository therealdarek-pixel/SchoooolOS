/**
 * =============================================================================
 *  ENDPOINT: PATCH /api/tareas/[id]/nota
 * =============================================================================
 *  ¿Qué hace?
 *    Permite que un maestro asigne o modifique la nota de una tarea de un
 *    alumno. El [id] que viene en la URL es el _id de Mongo de la tarea.
 *
 *  Body esperado: { nota: number }
 *
 *  Sobre la ruta:
 *    En Next.js App Router, una carpeta entre corchetes como "[id]" significa
 *    "parámetro dinámico". Lo recibimos en la función a través de `params.id`,
 *    equivalente al {id} de FastAPI o al :id de Express.
 *
 *  Permisos:
 *    - El usuario debe estar logueado (401 si no).
 *    - El usuario debe ser maestro (403 si es alumno).
 *
 *  Respuestas:
 *    200 -> Tarea actualizada (devuelve el doc serializado).
 *    400 -> ID inválido o body inválido.
 *    401 -> No autenticado.
 *    403 -> No es maestro.
 *    404 -> Tarea no encontrada.
 *    500 -> Error inesperado.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  obtenerUsuarioActual,
  respuesta401,
  respuesta403,
  serializarDoc,
} from "@/lib/auth";
import { getTareasCollection } from "@/lib/mongodb";
import { notaUpdateSchema } from "@/lib/schemas";

export async function PATCH(req, { params }) {
  // 1) Autenticación + autorización.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();
  if (usuario.rol !== "maestro") return respuesta403();

  // 2) Validar que el id de la URL sea un ObjectId válido de Mongo.
  //    Si no lo es, devolvemos 400 antes de tocar la BD.
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ detail: "ID invalido" }, { status: 400 });
  }

  try {
    // 3) Validar el body con Zod (la nota debe estar en el rango permitido).
    const body = await req.json();
    const { nota } = notaUpdateSchema.parse(body);

    // 4) Actualizar la tarea: ponemos la nota y dejamos registrado qué
    //    maestro la corrigió (campo "editada_por") para trazabilidad.
    const col = await getTareasCollection();
    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { nota, editada_por: usuario._id.toString() } }
    );

    // 5) Releemos para devolver el documento ya actualizado al frontend.
    const actualizada = await col.findOne({ _id: new ObjectId(id) });
    if (!actualizada) {
      return NextResponse.json({ detail: "Tarea no encontrada" }, { status: 404 });
    }
    return NextResponse.json(serializarDoc(actualizada));
  } catch (e) {
    // Error de Zod (nota fuera de rango, tipo equivocado, etc).
    if (e.issues) {
      return NextResponse.json(
        { detail: e.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ detail: "Error en el servidor" }, { status: 500 });
  }
}
