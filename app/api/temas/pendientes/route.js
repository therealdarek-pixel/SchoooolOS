/**
 * =============================================================================
 *  ENDPOINT: GET /api/temas/pendientes
 * =============================================================================
 *  ¿Qué hace?
 *    Lista los temas que aún NO están aprobados (aprobado: false). Es la
 *    bandeja de entrada del maestro: aquí ve qué temas propusieron los
 *    alumnos para revisarlos y luego aprobar (PATCH) o rechazar (DELETE)
 *    desde /api/temas/[id].
 *
 *  Permisos:
 *    - Login obligatorio.
 *    - Solo maestros (rol === "maestro"). Alumno -> 403.
 *
 *  Respuestas:
 *    200 -> Array de temas pendientes (puede ser vacío).
 *    401 -> No autenticado.
 *    403 -> Autenticado pero no es maestro.
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

  // 2) Autorización: solo maestros.
  if (usuario.rol !== "maestro") {
    return NextResponse.json(
      { detail: "Solo los maestros pueden ver pendientes" },
      { status: 403 }
    );
  }

  try {
    // 3) Buscamos los pendientes, los más recientes primero.
    const col = await getTemasCollection();
    const pendientes = await col
      .find({ aprobado: false })
      .sort({ fecha_creacion: -1 })
      .toArray();

    // 4) Damos forma plana al documento para el frontend: convertimos
    //    _id a string y dejamos valores por defecto en campos opcionales.
    const temasFormateados = pendientes.map((t) => ({
      _id: t._id.toString(),
      materia: t.materia,
      titulo: t.titulo,
      contenido: t.contenido,
      palabras_clave: t.palabras_clave || [],
      ejemplos: t.ejemplos || [],
      ejercicios: t.ejercicios || [],
      nivel: t.nivel || "basico",
      creado_por_nombre: t.creado_por_nombre || "Desconocido",
      creado_por_rol: t.creado_por_rol || "alumno",
      fecha_creacion: t.fecha_creacion,
    }));

    return NextResponse.json(temasFormateados);
  } catch (error) {
    console.error("Error listando pendientes:", error);
    return NextResponse.json(
      { detail: "Error al cargar pendientes" },
      { status: 500 }
    );
  }
}
