/**
 * =============================================================================
 *  ENDPOINT: POST /api/tareas/upload
 * =============================================================================
 *  El endpoint estrella del sistema. El alumno sube una foto o un PDF con su
 *  tarea (un ejercicio, una consulta, una pregunta) y le devolvemos una
 *  solución generada por IA (Anthropic Claude con visión).
 *
 *  Body (multipart/form-data):
 *    archivo:      File (jpg, png, webp, gif o pdf, máx 10 MB)
 *    descripcion?: string (texto opcional con contexto extra para la IA)
 *
 *  Flujo paso a paso:
 *    1) Verificar que el usuario esté logueado.
 *    2) Leer el archivo del FormData y validar tipo + tamaño.
 *    3) Convertir el archivo a base64 (formato que espera la API de Anthropic).
 *    4) Llamar al servicio de IA para que "lea" el archivo y resuelva.
 *    5) Guardar la tarea + solución en MongoDB.
 *    6) Devolver al frontend la tarea completa (id, archivo, solución, etc).
 *
 *  Respuestas:
 *    200 -> Tarea resuelta y guardada.
 *    400 -> Falta archivo o el tipo es inválido.
 *    401 -> No autenticado.
 *    413 -> Archivo demasiado grande (> 10 MB).
 *    500 -> Error en la IA, en la BD, o problema procesando.
 * =============================================================================
 */
import { NextResponse } from "next/server";
import {
  obtenerUsuarioActual,
  respuesta401,
  serializarDoc,
} from "@/lib/auth";
import { getTareasCollection } from "@/lib/mongodb";
import { resolverTareaDesdeImagen } from "@/lib/vision";

// Tipos MIME que aceptamos. Si llega otro, lo rechazamos con 400.
const TIPOS_VALIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// Tamaño máximo permitido. La API de Anthropic tiene su propio límite y
// además queremos evitar que un archivo enorme se quede dando vueltas en
// memoria del servidor.
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req) {
  // ---------------------------------------------------------------------------
  // PASO 1: Autenticación.
  // ---------------------------------------------------------------------------
  const usuario = await obtenerUsuarioActual(req);
  if (!usuario) return respuesta401();

  try {
    // -------------------------------------------------------------------------
    // PASO 2: Leer el archivo del FormData y validar.
    // -------------------------------------------------------------------------
    // formData() lee el cuerpo multipart. El frontend manda un campo
    // "archivo" con el File y opcionalmente "descripcion" con texto.
    const formData = await req.formData();
    const archivo = formData.get("archivo");
    const descripcion = formData.get("descripcion");

    // 2a) ¿Vino archivo?
    if (!archivo) {
      return NextResponse.json(
        { detail: "Falta el archivo" },
        { status: 400 }
      );
    }

    // 2b) ¿El tipo MIME está permitido?
    if (!TIPOS_VALIDOS.includes(archivo.type)) {
      return NextResponse.json(
        { detail: `Tipo de archivo no soportado: ${archivo.type}` },
        { status: 400 }
      );
    }

    // 2c) ¿Supera el límite de tamaño?
    if (archivo.size > MAX_SIZE) {
      return NextResponse.json(
        { detail: "El archivo supera los 10 MB" },
        { status: 413 }
      );
    }

    // -------------------------------------------------------------------------
    // PASO 3: Convertir el archivo a base64.
    // -------------------------------------------------------------------------
    // Anthropic recibe los archivos como string base64 dentro del JSON.
    // arrayBuffer() lee todo el binario en memoria; Buffer.from lo envuelve
    // como Buffer de Node y toString("base64") lo serializa.
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const base64 = buffer.toString("base64");

    // -------------------------------------------------------------------------
    // PASO 4: Pedir a la IA que resuelva la tarea.
    // -------------------------------------------------------------------------
    // resolverTareaDesdeImagen arma el prompt y llama a Claude con la
    // imagen/pdf adjunto. Si Anthropic responde con error, lanza excepción.
    const solucion = await resolverTareaDesdeImagen(
      base64,
      archivo.type,
      descripcion || undefined
    );

    // -------------------------------------------------------------------------
    // PASO 5: Guardar la tarea en la BD.
    // -------------------------------------------------------------------------
    // No guardamos el binario (sería caro y lento). Solo el nombre del
    // archivo + la descripción + la solución generada por la IA.
    const col = await getTareasCollection();
    const doc = {
      user_id: usuario._id.toString(),
      descripcion_texto: descripcion || null,
      nombre_archivo: archivo.name,
      solucion,
      nota: null,            // <- el maestro la pondrá después con PATCH
      editada_por: null,     // <- se llena cuando un maestro la corrige
      fecha_creacion: new Date(),
    };

    const resultado = await col.insertOne(doc);

    // Releemos el documento para devolverlo con el _id ya generado.
    const tareaGuardada = await col.findOne({ _id: resultado.insertedId });

    // -------------------------------------------------------------------------
    // PASO 6: Devolver la tarea al frontend.
    // -------------------------------------------------------------------------
    return NextResponse.json(serializarDoc(tareaGuardada));
  } catch (e) {
    // Si la IA falla o la BD se cae, devolvemos el mensaje real del error
    // (útil en dev). En producción podría convenir ocultarlo.
    console.error("Error en /api/tareas/upload:", e);
    return NextResponse.json(
      { detail: e.message || "Error procesando la tarea" },
      { status: 500 }
    );
  }
}
