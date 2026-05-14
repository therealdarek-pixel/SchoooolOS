/**
 * =============================================================================
 *  ENDPOINT: /api/horarios
 * =============================================================================
 *  Gestiona el horario de clases de cada alumno.
 *
 *    GET  -> Lista las clases del usuario actual, ya cruzadas con la
 *            colección "materias" para incluir nombre e icono.
 *    POST -> Agrega una nueva clase al horario del alumno.
 *
 *  Reglas de negocio:
 *    - Solo los alumnos pueden agregar clases (los maestros no tienen horario
 *      en este sistema).
 *    - Cada alumno solo puede ver y modificar su propio horario.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getHorariosCollection, getMateriasCollection } from "@/lib/mongodb";

/* ===========================================================================
 *  GET /api/horarios
 *  ---------------------------------------------------------------------------
 *  Devuelve todas las clases del usuario logueado, con el nombre e icono de
 *  la materia ya resueltos (no solo el id), para que el frontend no tenga
 *  que hacer un segundo viaje.
 * ===========================================================================
 */
export async function GET(req) {
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    // 1) Traer todos los horarios cuyo user_id coincida con el usuario actual.
    const horariosCol = await getHorariosCollection();
    const horarios = await horariosCol
      .find({ user_id: usuario._id.toString() })
      .toArray();

    // 2) Por cada horario, buscar la materia asociada para añadir nombre/icono.
    //    Promise.all permite hacer todas las búsquedas en paralelo.
    const materiasCol = await getMateriasCollection();
    const horariosConMateria = await Promise.all(
      horarios.map(async (h) => {
        const materia = await materiasCol.findOne({
          _id: new ObjectId(h.materia_id),
        });
        return {
          _id: h._id.toString(),
          materia_id: h.materia_id,
          // Si la materia ya no existe, ponemos valores por defecto para no
          // romper el render del frontend.
          materia_nombre: materia?.nombre || "Materia",
          materia_icono: materia?.icono || "📚",
          dia: h.dia,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          aula: h.aula || null,
        };
      })
    );

    return NextResponse.json(horariosConMateria);
  } catch (error) {
    console.error("Error listando horarios:", error);
    return NextResponse.json(
      { detail: "Error al cargar horarios" },
      { status: 500 }
    );
  }
}

/* ===========================================================================
 *  POST /api/horarios
 *  ---------------------------------------------------------------------------
 *  Body esperado:
 *    {
 *      codigo_materia: "BD-REL" | "BD-NOSQL" | "ENG",
 *      dia: "lunes" | "martes" | ...,
 *      hora_inicio: "08:00",
 *      hora_fin:    "09:30",
 *      aula?: string
 *    }
 *
 *  Pasos:
 *    1) Verificar autenticación y que el usuario sea alumno (no maestro).
 *    2) Validar que estén los campos obligatorios y el día sea válido.
 *    3) Buscar la materia por código para guardar el _id real.
 *    4) Insertar el horario y devolver el id generado.
 * ===========================================================================
 */
export async function POST(req) {
  // PASO 1: autenticación y rol.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // Los maestros no tienen horario propio, así que bloqueamos el endpoint
  // para ellos con un 403 Forbidden.
  if (usuario.rol !== "alumno") {
    return NextResponse.json(
      { detail: "Solo los alumnos pueden agregar clases" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { codigo_materia, dia, hora_inicio, hora_fin, aula } = body;

    // PASO 2a: campos obligatorios presentes.
    if (!codigo_materia || !dia || !hora_inicio || !hora_fin) {
      return NextResponse.json(
        { detail: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // PASO 2b: día válido. Aceptamos cualquier capitalización porque luego
    // lo guardamos en minúsculas (estandarización).
    const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
    if (!diasValidos.includes(dia.toLowerCase())) {
      return NextResponse.json(
        { detail: "Día inválido" },
        { status: 400 }
      );
    }

    // PASO 3: el frontend manda el código corto de la materia ("BD-REL"),
    // pero en la BD guardamos el _id real para mantener la integridad.
    const materiasCol = await getMateriasCollection();
    const materia = await materiasCol.findOne({ codigo: codigo_materia });
    if (!materia) {
      return NextResponse.json(
        { detail: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // PASO 4: insertar el horario para este usuario.
    const horariosCol = await getHorariosCollection();
    const resultado = await horariosCol.insertOne({
      user_id: usuario._id.toString(),
      materia_id: materia._id.toString(),
      dia: dia.toLowerCase(),
      hora_inicio,
      hora_fin,
      aula: aula || null,
      fecha_creacion: new Date(),
    });

    return NextResponse.json({
      success: true,
      _id: resultado.insertedId.toString(),
      mensaje: "✅ Clase agregada al horario",
    });
  } catch (error) {
    console.error("Error agregando horario:", error);
    return NextResponse.json(
      { detail: "Error al agregar clase" },
      { status: 500 }
    );
  }
}
