/**
 * =============================================================================
 *  ENDPOINT: POST /api/temas/aprender
 * =============================================================================
 *  ¿Qué hace?
 *    Cuando el bot responde con un tema candidato y el usuario confirma
 *    "Sí, era esto", aprovechamos esa señal para "enseñarle" al bot:
 *    guardamos la pregunta original del usuario como una palabra clave del
 *    tema. Así, la próxima vez que alguien escriba algo parecido, el
 *    buscador semántico encontrará el tema más rápido y con más confianza.
 *
 *  Body esperado:
 *    {
 *      titulo:   string,  // título exacto del tema que el usuario aceptó
 *      pregunta: string   // frase original que escribió el usuario
 *    }
 *
 *  Pasos:
 *    1) Autenticar al usuario.
 *    2) Normalizar la pregunta (minúsculas, sin tildes, sin puntuación).
 *    3) Buscar el tema por título (solo entre los aprobados).
 *    4) Si la pregunta ya estaba indexada, no hacemos nada.
 *    5) Hacer $push de la pregunta normalizada al array "palabras_clave".
 *    6) Avisar al servicio Python en localhost:8000/recargar para que
 *       reindexe los embeddings (si está corriendo).
 *
 *  Respuestas:
 *    200 -> Pregunta aprendida (o ya estaba).
 *    400 -> Faltan datos.
 *    401 -> No autenticado.
 *    404 -> Tema no encontrado.
 *    500 -> Error inesperado.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getTemasCollection } from "@/lib/mongodb";

/**
 * Normaliza un texto para poder compararlo / indexarlo:
 *   - todo a minúsculas
 *   - separa los acentos (NFD) y los borra (̀-ͯ)
 *   - quita signos de puntuación comunes
 *   - recorta espacios sobrantes
 * Ejemplo: "¿Qué es la Normalización?" -> "que es la normalizacion"
 */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:()]/g, "")
    .trim();
}

export async function POST(req) {
  // 1) Autenticación.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    const body = await req.json();
    const { titulo, pregunta } = body;

    if (!titulo || !pregunta) {
      return NextResponse.json(
        { detail: "Faltan datos" },
        { status: 400 }
      );
    }

    // 2) Normalizamos la pregunta antes de guardarla.
    const preguntaNormalizada = normalizar(pregunta);

    // Si después de limpiar quedó casi vacía, no aporta nada al índice.
    if (preguntaNormalizada.length < 3) {
      return NextResponse.json({ success: true, mensaje: "Pregunta muy corta" });
    }

    // 3) Buscamos el tema por título exacto (case-insensitive), pero solo
    //    entre los temas ya aprobados (no aprendemos sobre temas en revisión).
    //    Escapamos el título para que caracteres como "." o "?" no rompan
    //    la expresión regular.
    const col = await getTemasCollection();
    const tituloEscapado = titulo.replace(/[.*+?^${}()|[\]\\¿¡]/g, "\\$&");

    const tema = await col.findOne({
      titulo: { $regex: `^${tituloEscapado}$`, $options: "i" },
      aprobado: true,
    });

    if (!tema) {
      return NextResponse.json(
        { detail: "Tema no encontrado" },
        { status: 404 }
      );
    }

    // 4) Si la pregunta ya estaba en palabras_clave, no la duplicamos.
    const palabrasActuales = (tema.palabras_clave || []).map((p) => p.toLowerCase());
    if (palabrasActuales.includes(preguntaNormalizada)) {
      return NextResponse.json({ success: true, mensaje: "Ya tenía esta pregunta" });
    }

    // 5) $push agrega la pregunta al final del array sin reemplazar el resto.
    await col.updateOne(
      { _id: tema._id },
      { $push: { palabras_clave: preguntaNormalizada } }
    );

    // 6) Pedirle al servicio Python que recargue su índice de embeddings.
    //    Si Python no está corriendo, no es crítico: la pregunta queda en
    //    Mongo y se indexará en el próximo arranque.
    try {
      await fetch("http://127.0.0.1:8000/recargar", { method: "POST" });
    } catch (err) {
      console.warn("No se pudo recargar Python");
    }

    return NextResponse.json({
      success: true,
      mensaje: `Aprendí la pregunta: "${preguntaNormalizada}"`,
      pregunta_aprendida: preguntaNormalizada,
    });
  } catch (error) {
    console.error("Error en aprender:", error);
    return NextResponse.json(
      { detail: "Error al aprender" },
      { status: 500 }
    );
  }
}
