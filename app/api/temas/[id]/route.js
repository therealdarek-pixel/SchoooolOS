/**
 * =============================================================================
 *  ENDPOINT: /api/temas/[id]
 * =============================================================================
 *  Acciones del maestro sobre un tema concreto:
 *
 *    PATCH  -> APROBAR el tema. Cambia aprobado=true, registra qué maestro
 *              lo aprobó y la fecha. A partir de ese momento el bot lo
 *              puede usar como respuesta.
 *
 *    DELETE -> RECHAZAR el tema. Lo borra de la BD (no hay papelera).
 *              Pensado para temas que el alumno propuso pero que no
 *              corresponden o están mal redactados.
 *
 *  Permisos (ambos métodos):
 *    - Login obligatorio (401 si no).
 *    - Solo maestros (403 si es alumno).
 *
 *  El [id] viene en la URL como parámetro dinámico (Next.js App Router).
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getTemasCollection } from "@/lib/mongodb";

/* ===========================================================================
 *  PATCH /api/temas/[id]  -> Aprobar tema
 * ===========================================================================
 */
export async function PATCH(req, { params }) {
  // 1) Autenticación + autorización.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  if (usuario.rol !== "maestro") {
    return NextResponse.json(
      { detail: "Solo los maestros pueden aprobar temas" },
      { status: 403 }
    );
  }

  try {
    // 2) Actualizamos el documento: aprobado=true + auditoría (quién y cuándo).
    const col = await getTemasCollection();
    const resultado = await col.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          aprobado: true,
          aprobado_por: usuario._id.toString(),
          fecha_aprobacion: new Date(),
        },
      }
    );

    // 3) matchedCount=0 significa que no había ningún tema con ese id.
    if (resultado.matchedCount === 0) {
      return NextResponse.json(
        { detail: "Tema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "✅ Tema aprobado y publicado",
    });
  } catch (error) {
    console.error("Error aprobando tema:", error);
    return NextResponse.json(
      { detail: "Error al aprobar el tema" },
      { status: 500 }
    );
  }
}

/* ===========================================================================
 *  DELETE /api/temas/[id]  -> Rechazar (borrar) tema
 * ===========================================================================
 */
export async function DELETE(req, { params }) {
  // 1) Autenticación + autorización.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  if (usuario.rol !== "maestro") {
    return NextResponse.json(
      { detail: "Solo los maestros pueden rechazar temas" },
      { status: 403 }
    );
  }

  try {
    // 2) Borrado físico. No hay "papelera": el tema desaparece.
    const col = await getTemasCollection();
    const resultado = await col.deleteOne({
      _id: new ObjectId(params.id),
    });

    if (resultado.deletedCount === 0) {
      return NextResponse.json(
        { detail: "Tema no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "🗑️ Tema rechazado y eliminado",
    });
  } catch (error) {
    console.error("Error rechazando tema:", error);
    return NextResponse.json(
      { detail: "Error al rechazar el tema" },
      { status: 500 }
    );
  }
}
