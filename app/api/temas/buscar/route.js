/**
 * =============================================================================
 *  ENDPOINT: GET /api/temas/buscar?titulo=XXX
 * =============================================================================
 *  ¿Qué hace?
 *    Busca un tema por su título. Intenta primero una coincidencia exacta
 *    (case-insensitive) y, si no encuentra, hace una búsqueda parcial.
 *    Solo devuelve temas APROBADOS (los pendientes no son visibles aquí).
 *
 *  Query params:
 *    titulo (string, obligatorio)
 *
 *  Respuestas:
 *    200 -> Datos del tema (id, contenido, ejemplos, ejercicios, nivel).
 *    400 -> Falta el parámetro "titulo".
 *    401 -> No autenticado.
 *    404 -> No se encontró ningún tema aprobado con ese título.
 *    500 -> Error inesperado.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getTemasCollection } from "@/lib/mongodb";

export async function GET(req) {
  // 1) Autenticación.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  // 2) Leemos el parámetro ?titulo=... de la URL.
  const { searchParams } = new URL(req.url);
  const titulo = searchParams.get("titulo");

  if (!titulo) {
    return NextResponse.json(
      { detail: "Título requerido" },
      { status: 400 }
    );
  }

  try {
    const col = await getTemasCollection();

    // 3) Escapamos caracteres especiales para que no rompan la regex.
    //    Por ejemplo, si el título contiene "()" o "?", Mongo los
    //    interpretaría como operadores de regex y la búsqueda fallaría.
    const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\¿¡]/g, "\\$&");

    // 4) $or con dos patrones:
    //    - el primero es exacto (^...$), con prioridad implícita
    //    - el segundo es parcial (subcadena), de respaldo
    //    findOne devuelve el primer match. Filtramos aprobado: true para
    //    que los temas pendientes no se cuelen.
    const tema = await col.findOne({
      $or: [
        { titulo: { $regex: `^${tituloEscapado}$`, $options: "i" } },
        { titulo: { $regex: tituloEscapado, $options: "i" } },
      ],
      aprobado: true,
    });

    if (!tema) {
      return NextResponse.json(
        { detail: "Tema no encontrado" },
        { status: 404 }
      );
    }

    // 5) Devolvemos solo lo que el frontend necesita mostrar.
    return NextResponse.json({
      _id: tema._id.toString(),
      titulo: tema.titulo,
      contenido: tema.contenido,
      ejemplos: tema.ejemplos || [],
      ejercicios: tema.ejercicios || [],
      nivel: tema.nivel || "basico",
    });
  } catch (error) {
    console.error("Error buscando tema:", error);
    return NextResponse.json(
      { detail: "Error al buscar el tema" },
      { status: 500 }
    );
  }
}
