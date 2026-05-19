/**
 * =============================================================================
 *  ENDPOINT: DELETE /api/tareas/[id]
 * =============================================================================
 *  Borra una tarea del alumno.
 *
 *  Reglas:
 *    - Hay que estar logueado.
 *    - Solo puedes borrar tus propias tareas (filtramos por user_id).
 * =============================================================================
 */

// Imports basicos.
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getTareasCollection } from "@/lib/mongodb";

export async function DELETE(req, { params }) {
  // 1) Vemos quien hace la peticion.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // 2) Comprobamos que el id de la URL tenga formato valido (24 chars hex).
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ detail: "Id invalido" }, { status: 400 });
  }

  try {
    // 3) Coleccion "tareas".
    const col = await getTareasCollection();

    // 4) Borramos filtrando por _id Y user_id.
    //    Asi, si alguien manda el id de otro alumno, no se borra nada.
    const resultado = await col.deleteOne({
      _id: new ObjectId(params.id),
      user_id: usuario._id.toString(),
    });

    // 5) Si no borro nada, la tarea no existia o era de otro alumno.
    //    Devolvemos 404 sin decir cual de los dos (mejor para seguridad).
    if (resultado.deletedCount === 0) {
      return NextResponse.json(
        { detail: "Tarea no encontrada o no tienes permiso" },
        { status: 404 }
      );
    }

    // 6) Todo OK.
    return NextResponse.json({
      success: true,
      mensaje: "🗑️ Tarea eliminada",
    });
  } catch (error) {
    // Si algo se rompe, lo registramos y devolvemos 500.
    console.error("Error eliminando tarea:", error);
    return NextResponse.json(
      { detail: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
