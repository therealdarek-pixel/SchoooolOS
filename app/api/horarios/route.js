/**
 * =============================================================================
 *  ENDPOINT: /api/horarios
 * =============================================================================
 *  Aqui esta la API para el horario del alumno.
 *
 *  GET  -> Devuelve todas las clases del alumno logueado.
 *  POST -> Agrega una clase nueva (valida que no choque con otra).
 *
 *  Reglas:
 *    - Solo los alumnos pueden agregar clases.
 *    - Cada alumno solo ve su propio horario.
 *    - Si dos clases se pisan el mismo dia => error 409.
 * =============================================================================
 */

// Importamos lo que necesitamos de Next y Mongo.
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
// Funcion para saber quien es el usuario logueado (lee el token JWT).
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
// Helpers para entrar a las colecciones de Mongo.
import { getHorariosCollection, getMateriasCollection } from "@/lib/mongodb";
// Nuestras validaciones (Zod + detector de choques).
import { schemaHorario, detectarTraslape } from "@/lib/validaciones-horario";

/* ===========================================================================
 *  GET /api/horarios
 *  Devuelve la lista de clases del alumno, con el nombre e icono de
 *  cada materia ya resueltos (asi el frontend no hace doble viaje).
 * ===========================================================================
 */
export async function GET(req) {
  // 1) Vemos quien esta haciendo la peticion.
  const usuario = await obtenerUsuarioActual(req);
  // Si no hay sesion, respondemos 401 (no autorizado).
  if (!usuario) return respuesta401();

  try {
    // 2) Pedimos la coleccion "horarios" de Mongo.
    const horariosCol = await getHorariosCollection();
    // 3) Buscamos los horarios cuyo user_id sea el del usuario actual.
    const horarios = await horariosCol
      .find({ user_id: usuario._id.toString() })
      .toArray();

    // 4) Tambien necesitamos la coleccion "materias" para sacar nombre/icono.
    const materiasCol = await getMateriasCollection();

    // 5) Por cada horario, buscamos su materia. Promise.all las pide en paralelo.
    const horariosConMateria = await Promise.all(
      horarios.map(async (h) => {
        // Buscamos la materia por su _id.
        const materia = await materiasCol.findOne({
          _id: new ObjectId(h.materia_id),
        });
        // Devolvemos el horario "enriquecido" con datos de la materia.
        return {
          _id: h._id.toString(),
          materia_id: h.materia_id,
          // Si la materia fue borrada, ponemos un default para no romper la UI.
          materia_nombre: materia?.nombre || "Materia",
          materia_icono: materia?.icono || "📚",
          materia_codigo: materia?.codigo || null,
          dia: h.dia,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          aula: h.aula || null,
        };
      })
    );

    // 6) Devolvemos la lista en JSON.
    return NextResponse.json(horariosConMateria);
  } catch (error) {
    // Si algo falla, lo registramos y devolvemos error 500.
    console.error("Error listando horarios:", error);
    return NextResponse.json(
      { detail: "Error al cargar horarios" },
      { status: 500 }
    );
  }
}

/* ===========================================================================
 *  POST /api/horarios
 *  Crea una clase nueva en el horario del alumno.
 *  Body esperado: { codigo_materia, dia, hora_inicio, hora_fin, aula? }
 * ===========================================================================
 */
export async function POST(req) {
  // 1) Verificamos que haya sesion.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // Solo los alumnos pueden tener horario (los maestros no).
  if (usuario.rol !== "alumno") {
    return NextResponse.json(
      { detail: "Solo los alumnos pueden agregar clases" },
      { status: 403 }
    );
  }

  try {
    // 2) Leemos el body que mando el frontend.
    const body = await req.json();

    // 3) Lo pasamos por Zod para validar formato, horas, dia, etc.
    const parsed = schemaHorario.safeParse(body);
    if (!parsed.success) {
      // Si fallo, tomamos el primer error y lo mandamos al frontend.
      const primerError = parsed.error.errors[0];
      return NextResponse.json(
        {
          detail: primerError?.message || "Datos invalidos",
          errores: parsed.error.errors,
        },
        { status: 400 }
      );
    }
    // Si todo OK, sacamos los datos ya limpios.
    const datos = parsed.data;

    // 4) Buscamos la materia por su codigo (ej: "BD-REL") para guardar el _id real.
    const materiasCol = await getMateriasCollection();
    const materia = await materiasCol.findOne({ codigo: datos.codigo_materia });
    // Si la materia no existe, error 404.
    if (!materia) {
      return NextResponse.json(
        { detail: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // 5) Revisamos que no choque con otra clase del mismo dia.
    const horariosCol = await getHorariosCollection();
    // Solo traemos las del mismo dia para no cargar mas de lo necesario.
    const delMismoDia = await horariosCol
      .find({ user_id: usuario._id.toString(), dia: datos.dia })
      .toArray();

    // Usamos nuestra funcion para detectar traslapes.
    const choque = detectarTraslape(datos, delMismoDia, null);
    if (choque) {
      // Si hay choque, error 409 con mensaje claro.
      return NextResponse.json(
        {
          detail: `Esta clase choca con otra el ${datos.dia} de ${choque.hora_inicio} a ${choque.hora_fin}`,
        },
        { status: 409 }
      );
    }

    // 6) Insertamos el nuevo horario en la base.
    const resultado = await horariosCol.insertOne({
      user_id: usuario._id.toString(),
      materia_id: materia._id.toString(),
      dia: datos.dia,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      // Si no mandaron aula, guardamos null.
      aula: datos.aula?.trim() || null,
      fecha_creacion: new Date(),
    });

    // 7) Devolvemos el id generado y un mensaje bonito para el toast.
    return NextResponse.json(
      {
        success: true,
        _id: resultado.insertedId.toString(),
        mensaje: "✅ Clase agregada al horario",
      },
      { status: 201 }
    );
  } catch (error) {
    // Cualquier error inesperado => 500.
    console.error("Error agregando horario:", error);
    return NextResponse.json(
      { detail: "Error al agregar clase" },
      { status: 500 }
    );
  }
}
