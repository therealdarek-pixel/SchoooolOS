/**
 * =============================================================================
 *  ENDPOINT: POST /api/temas/agregar
 * =============================================================================
 *  ¿Qué hace?
 *    Permite agregar un tema nuevo a la base de conocimiento del bot
 *    (por ejemplo: "Normalización 1FN", "Consultas SELECT", etc.).
 *
 *  Regla clave (¡importante!):
 *    - Si el que crea el tema es MAESTRO -> aprobado: true (queda publicado
 *      al instante, el bot ya lo puede usar).
 *    - Si es ALUMNO -> aprobado: false (queda pendiente de revisión, un
 *      maestro tendrá que aprobarlo desde /api/temas/pendientes).
 *
 *  Body esperado:
 *    {
 *      materia: "BD-REL" | "BD-NOSQL" | "ENG",
 *      titulo: string,
 *      contenido: string,
 *      palabras_clave?: string[],
 *      ejemplos?: any[],
 *      ejercicios?: any[],
 *      nivel?: "basico" | "intermedio" | "avanzado"
 *    }
 *
 *  Respuestas:
 *    200 -> Tema creado (mensaje cambia según rol).
 *    400 -> Datos obligatorios faltantes o materia inválida.
 *    401 -> No autenticado.
 *    500 -> Error inesperado.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getTemasCollection } from "@/lib/mongodb";

export async function POST(req) {
  // 1) Autenticación.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    // 2) Leer el body y desestructurar los campos esperados.
    const body = await req.json();
    const {
      materia,
      titulo,
      contenido,
      palabras_clave,
      ejemplos,
      ejercicios,
      nivel,
    } = body;

    // 3) Validar campos obligatorios.
    if (!materia || !titulo || !contenido) {
      return NextResponse.json(
        { detail: "Materia, título y contenido son obligatorios" },
        { status: 400 }
      );
    }

    // 4) Validar que la materia sea una de las soportadas. Si no, el bot
    //    no sabría dónde indexarlo.
    if (!["BD-REL", "BD-NOSQL", "ENG"].includes(materia)) {
      return NextResponse.json(
        { detail: "Materia inválida" },
        { status: 400 }
      );
    }

    // 5) La regla de aprobado depende del rol.
    const esMaestro = usuario.rol === "maestro";

    // 6) Construimos el documento que va a Mongo. Inicializamos las listas
    //    como vacías si no vinieron, para que el bot no se rompa al leerlas.
    const temasCol = await getTemasCollection();
    const nuevoTema = {
      materia,
      titulo,
      contenido,
      palabras_clave: palabras_clave || [],
      sinonimos: [],              // se irán llenando con el tiempo
      variantes_comunes: [],      // idem
      ejemplos: ejemplos || [],
      ejercicios: ejercicios || [],
      nivel: nivel || "basico",
      aprobado: esMaestro,        // <- el punto clave
      creado_por: usuario._id.toString(),
      creado_por_nombre: usuario.nombre,
      creado_por_rol: usuario.rol,
      fecha_creacion: new Date(),
    };

    const resultado = await temasCol.insertOne(nuevoTema);

    // 7) Respuesta amigable al frontend, distinta según rol.
    return NextResponse.json({
      success: true,
      tema_id: resultado.insertedId.toString(),
      mensaje: esMaestro
        ? "✅ Tema agregado y publicado exitosamente"
        : "✅ Tema enviado para revisión del maestro",
      aprobado: esMaestro,
    });
  } catch (error) {
    console.error("Error agregando tema:", error);
    return NextResponse.json(
      { detail: "Error al agregar el tema" },
      { status: 500 }
    );
  }
}
