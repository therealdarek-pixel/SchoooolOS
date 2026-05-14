/**
 * =============================================================================
 *  ENDPOINT: /api/chat
 * =============================================================================
 *  El corazón del chatbot. Tiene dos métodos:
 *
 *    GET  -> recupera el historial de una conversación por su session_id.
 *            Útil para que el frontend muestre mensajes anteriores cuando
 *            el usuario vuelve a abrir el chat.
 *
 *    POST -> recibe un mensaje del usuario, lo procesa con el bot (detección
 *            de intención + búsqueda de tema), guarda el par
 *            (mensaje usuario, respuesta bot) en la conversación y devuelve
 *            la respuesta del asistente al frontend.
 *
 *  Almacenamiento:
 *    Las conversaciones se guardan en la colección "conversaciones" en Mongo.
 *    Cada documento agrupa todos los mensajes de una sesión (session_id).
 * =============================================================================
 */
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { obtenerUsuarioActual, respuesta401 } from "@/lib/auth";
import { getConversacionesCollection } from "@/lib/mongodb";
import { procesarMensaje } from "@/lib/bot";
import { chatRequestSchema } from "@/lib/schemas";

/* ===========================================================================
 *  GET /api/chat?session_id=XXX
 *  ---------------------------------------------------------------------------
 *  Devuelve el historial completo de mensajes de una sesión.
 *
 *  Respuestas:
 *    200 -> { session_id, mensajes: [...] }  (lista vacía si no existe)
 *    400 -> No se mandó session_id en la query
 *    500 -> Error de base de datos
 * ===========================================================================
 */
export async function GET(req) {
  // Leemos el parámetro ?session_id=... de la URL.
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  // Sin session_id no podemos saber qué conversación buscar.
  if (!sessionId) {
    return NextResponse.json(
      { detail: "session_id requerido" },
      { status: 400 }
    );
  }

  try {
    const col = await getConversacionesCollection();
    const conversacion = await col.findOne({ session_id: sessionId });

    // Si no existe la conversación (sesión nueva), devolvemos lista vacía.
    // De esta forma el frontend siempre recibe el mismo formato de respuesta
    if (!conversacion) {
      return NextResponse.json({ mensajes: [] }, { status: 200 });
    }

    // Devolvemos la lista de mensajes tal cual está guardada.
    return NextResponse.json({
      session_id: sessionId,
      mensajes: conversacion.mensajes || [],
    });
  } catch (error) {
    console.error("Error obteniendo conversación:", error);
    return NextResponse.json(
      { detail: "Error al cargar conversación" },
      { status: 500 }
    );
  }
}

/* ===========================================================================
 *  POST /api/chat
 *  ---------------------------------------------------------------------------
 *  Body esperado: { mensaje: string, session_id?: string }
 *
 *  Pasos:
 *    1) Verificar que el usuario esté logueado (token JWT válido).
 *    2) Validar el body con Zod.
 *    3) Procesar el mensaje con el bot (detecta intención + busca tema).
 *    4) Guardar el mensaje del usuario y la respuesta del bot en la BD.
 *    5) Devolver la respuesta al frontend.
 *
 *  Respuestas:
 *    200 -> { session_id, mensaje }  (mensaje = la respuesta del asistente)
 *    400 -> body inválido
 *    401 -> No hay token / token inválido
 *    500 -> Error procesando o guardando
 * ===========================================================================
 */
export async function POST(req) {
  // ---------------------------------------------------------------------------
  // PASO 1: Comprobar que el usuario esté autenticado.
  // ---------------------------------------------------------------------------
  // Si no hay token o no es válido, devolvemos 401 antes de tocar la BD.
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    // -------------------------------------------------------------------------
    // PASO 2: Leer y validar el cuerpo de la petición.
    // -------------------------------------------------------------------------
    // El frontend manda: { mensaje: "...", session_id: "..." (opcional) }
    const body = await req.json();
    const { mensaje, session_id } = chatRequestSchema.parse(body);

    // Si es la primera vez que el usuario habla, no hay session_id.
    // En ese caso generamos uno nuevo (UUID v4) y a partir de ahí
    // todos los mensajes de esa conversación se agrupan bajo ese id.
    const sesionId = session_id || randomUUID();
    const userId = usuario._id.toString();

    // -------------------------------------------------------------------------
    // PASO 3: El bot procesa el mensaje.
    // -------------------------------------------------------------------------
    // procesarMensaje hace todo el trabajo "inteligente":
    //   - Detecta la intención del usuario (saludo, pregunta, despedida...)
    //   - Si es pregunta, busca el tema más parecido en la BD (embeddings)
    //   - Devuelve el contenido a responder + los candidatos TOP 3 +
    //     metadatos como "mostrarBotonesTecnicas".
    const respuestaBot = await procesarMensaje(mensaje, userId);

    // -------------------------------------------------------------------------
    // PASO 4: Guardar el par de mensajes en la conversación.
    // -------------------------------------------------------------------------
    const col = await getConversacionesCollection();
    const ahora = new Date();

    // Mensaje del usuario (el que escribió en el chat).
    const mensajeUsuario = {
      rol: "usuario",
      contenido: mensaje,
      timestamp: ahora.toISOString(),
      intencion_detectada: respuestaBot.intencion,
    };

    // Respuesta del asistente, con todos los extras que el frontend necesita
    // para renderizar botones, tarjetas de candidatos, etc.
    const mensajeAsistente = {
      rol: "asistente",
      contenido: respuestaBot.contenido,
      timestamp: new Date().toISOString(),
      intencion_detectada: respuestaBot.intencion,
      mostrar_botones_tecnicas: respuestaBot.mostrarBotonesTecnicas || false,
      candidatos: respuestaBot.candidatos || null,
      tema_sugerido: respuestaBot.temaSugerido || null,
    };

    // Si la conversación ya existe, hacemos push de los dos mensajes nuevos.
    // Si es nueva, creamos el documento con la lista inicial de mensajes.
    const conversacionExistente = await col.findOne({ session_id: sesionId });

    if (conversacionExistente) {
      await col.updateOne(
        { session_id: sesionId },
        {
          $push: {
            mensajes: {
              $each: [mensajeUsuario, mensajeAsistente],
            },
          },
        }
      );
    } else {
      await col.insertOne({
        session_id: sesionId,
        user_id: userId,
        mensajes: [mensajeUsuario, mensajeAsistente],
        fecha_creacion: ahora,
      });
    }

    // -------------------------------------------------------------------------
    // PASO 5: Responder al frontend solo con el último mensaje del bot.
    // -------------------------------------------------------------------------
    // No hace falta mandar todo el historial: el frontend ya lo tiene en
    // memoria y solo necesita la respuesta nueva para añadirla al final.
    return NextResponse.json({
      session_id: sesionId,
      mensaje: mensajeAsistente,
    });
  } catch (e) {
    // Error de validación de Zod -> 400 con el primer issue.
    if (e.issues) {
      return NextResponse.json(
        { detail: e.issues[0]?.message || "Datos invalidos" },
        { status: 400 }
      );
    }
    // Cualquier otro error: log + 500.
    console.error(e);
    return NextResponse.json({ detail: "Error en el servidor" }, { status: 500 });
  }
}
