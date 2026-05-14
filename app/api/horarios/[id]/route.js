/**
 * =============================================================================
 *  ENDPOINT: DELETE /api/horarios/[id]
 * =============================================================================
 *  ¿Qué hace?
 *    Elimina una clase del horario. El [id] viene en la URL y es el _id de
 *    Mongo de la clase que se quiere borrar.
 *
 *  Reglas de seguridad:
 *    - El usuario debe estar logueado.
 *    - Solo puede borrar clases que le pertenezcan (filtramos por user_id en
 *      el deleteOne, no basta con verificar el id de la clase). Esto evita
 *      que un alumno pase otro id y borre el horario de un compañero.
 *
 *  Respuestas:
 *    200 -> Clase eliminada
 *    401 -> No autenticado
 *    404 -> La clase no existe o no pertenece a este usuario
 *    500 -> Error inesperado
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getHorariosCollection } from "@/lib/mongodb";

export async function DELETE(req, { params }) {
  // 1) Autenticación.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    const horariosCol = await getHorariosCollection();

    // 2) Borramos filtrando por _id (de la clase) Y user_id (del dueño).
    //    Si el id es de otro usuario, deletedCount será 0 y respondemos 404.
    const resultado = await horariosCol.deleteOne({
      _id: new ObjectId(params.id),
      user_id: usuario._id.toString(),
    });

    if (resultado.deletedCount === 0) {
      // No diferenciamos entre "no existe" y "no eres el dueño" a propósito:
      // de cara al cliente, el efecto es el mismo (no se borró nada).
      return NextResponse.json(
        { detail: "Clase no encontrada o no tienes permiso" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "🗑️ Clase eliminada del horario",
    });
  } catch (error) {
    console.error("Error eliminando horario:", error);
    return NextResponse.json(
      { detail: "Error al eliminar clase" },
      { status: 500 }
    );
  }
}
