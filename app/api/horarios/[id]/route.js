/**
 * =============================================================================
 *  ENDPOINTS: /api/horarios/[id]
 * =============================================================================
 *  [id] significa que la URL termina en el _id de la clase.
 *  Ejemplo: /api/horarios/65a1b2c3...
 *
 *    PUT    -> Actualiza una clase existente.
 *    DELETE -> Borra una clase.
 *
 *  Solo se puede tocar tu propia clase (filtramos por user_id).
 * =============================================================================
 */

// Imports basicos.
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getHorariosCollection, getMateriasCollection } from "@/lib/mongodb";
import { schemaHorario, detectarTraslape } from "@/lib/validaciones-horario";

/* ===========================================================================
 *  PUT /api/horarios/[id]
 *  Edita una clase. El body es igual al POST.
 * ===========================================================================
 */
export async function PUT(req, { params }) {
  // 1) Verificamos sesion.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // Solo alumnos pueden editar horarios.
  if (usuario.rol !== "alumno") {
    return NextResponse.json(
      { detail: "Solo los alumnos pueden editar clases" },
      { status: 403 }
    );
  }

  // 2) Revisamos que el id de la URL tenga formato valido.
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ detail: "Id invalido" }, { status: 400 });
  }

  try {
    // 3) Leemos el body.
    const body = await req.json();

    // 4) Validamos con Zod (mismo schema que POST).
    const parsed = schemaHorario.safeParse(body);
    if (!parsed.success) {
      const primerError = parsed.error.errors[0];
      return NextResponse.json(
        {
          detail: primerError?.message || "Datos invalidos",
          errores: parsed.error.errors,
        },
        { status: 400 }
      );
    }
    const datos = parsed.data;

    // 5) Comprobamos que la clase exista y sea de este usuario.
    const horariosCol = await getHorariosCollection();
    const horarioActual = await horariosCol.findOne({
      _id: new ObjectId(params.id),
      user_id: usuario._id.toString(),
    });
    // Si no existe (o es de otro), devolvemos 404 sin dar pistas.
    if (!horarioActual) {
      return NextResponse.json(
        { detail: "Clase no encontrada o no tienes permiso" },
        { status: 404 }
      );
    }

    // 6) Resolvemos la materia para guardar su _id real.
    const materiasCol = await getMateriasCollection();
    const materia = await materiasCol.findOne({ codigo: datos.codigo_materia });
    if (!materia) {
      return NextResponse.json(
        { detail: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // 7) Buscamos las clases del mismo dia para revisar choques.
    const delMismoDia = await horariosCol
      .find({ user_id: usuario._id.toString(), dia: datos.dia })
      .toArray();

    // IMPORTANTE: pasamos params.id como "idAExcluir" para que la propia
    // clase no se compare contra si misma (si no, siempre chocaria).
    const choque = detectarTraslape(datos, delMismoDia, params.id);
    if (choque) {
      return NextResponse.json(
        {
          detail: `Esta clase choca con otra el ${datos.dia} de ${choque.hora_inicio} a ${choque.hora_fin}`,
        },
        { status: 409 }
      );
    }

    // 8) Hacemos el update en Mongo.
    await horariosCol.updateOne(
      { _id: new ObjectId(params.id), user_id: usuario._id.toString() },
      {
        $set: {
          materia_id: materia._id.toString(),
          dia: datos.dia,
          hora_inicio: datos.hora_inicio,
          hora_fin: datos.hora_fin,
          aula: datos.aula?.trim() || null,
          fecha_actualizacion: new Date(),
        },
      }
    );

    // 9) Listo, devolvemos OK.
    return NextResponse.json({
      success: true,
      mensaje: "✏️ Clase actualizada",
    });
  } catch (error) {
    console.error("Error actualizando horario:", error);
    return NextResponse.json(
      { detail: "Error al actualizar clase" },
      { status: 500 }
    );
  }
}

/* ===========================================================================
 *  DELETE /api/horarios/[id]
 *  Borra la clase indicada.
 * ===========================================================================
 */
export async function DELETE(req, { params }) {
  // 1) Sesion.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // 2) Id valido.
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ detail: "Id invalido" }, { status: 400 });
  }

  try {
    const horariosCol = await getHorariosCollection();

    // 3) Borramos filtrando por _id y user_id (asi nadie borra lo ajeno).
    const resultado = await horariosCol.deleteOne({
      _id: new ObjectId(params.id),
      user_id: usuario._id.toString(),
    });

    // Si no se borro nada => no existia o era de otro.
    if (resultado.deletedCount === 0) {
      return NextResponse.json(
        { detail: "Clase no encontrada o no tienes permiso" },
        { status: 404 }
      );
    }

    // 4) Devolvemos OK con un mensaje para el toast.
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
