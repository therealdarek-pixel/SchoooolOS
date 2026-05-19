// ============================================================
//  lib/validaciones-horario.js
//  Aqui validamos los datos del horario antes de guardarlos.
//  Tambien tenemos la funcion que detecta si dos clases chocan.
// ============================================================

// Importamos Zod, una libreria que sirve para validar objetos.
import { z } from "zod";

// Lista de dias permitidos. Si manyana queremos sabado, lo agregamos aqui.
export const DIAS_VALIDOS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

// Regla para que la hora tenga formato HH:MM (24 horas).
// Ej: "08:30" si, "8:30" no, "25:00" no.
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Convierte una hora "HH:MM" en minutos.
 * Ejemplo: "08:30" -> 510 (8*60 + 30).
 * Se usa para comparar horas como numeros (mas seguro que strings).
 */
export function aMinutos(hhmm) {
  // Cortamos el string en ":" y lo convertimos a numero.
  const [h, m] = hhmm.split(":").map(Number);
  // Devolvemos los minutos totales.
  return h * 60 + m;
}

/**
 * Schema (las "reglas") que debe cumplir un horario para ser valido.
 * Si algo no cumple, Zod nos devuelve un error claro.
 */
export const schemaHorario = z
  .object({
    // El codigo de la materia es obligatorio (ej: "BD-REL").
    codigo_materia: z
      .string()
      .min(1, "codigo_materia es obligatorio")
      .max(50),
    // El dia debe ser uno de la lista DIAS_VALIDOS.
    dia: z.enum(DIAS_VALIDOS, {
      errorMap: () => ({ detail: "Dia invalido" }),
    }),
    // La hora de inicio debe tener formato HH:MM.
    hora_inicio: z
      .string()
      .regex(REGEX_HORA, "hora_inicio debe tener formato HH:MM (24h)"),
    // La hora de fin debe tener formato HH:MM.
    hora_fin: z
      .string()
      .regex(REGEX_HORA, "hora_fin debe tener formato HH:MM (24h)"),
    // El aula es opcional (puede no estar).
    aula: z.string().max(50).optional().nullable(),
  })
  // Regla extra: la hora_fin tiene que ser mayor a hora_inicio.
  .refine((d) => aMinutos(d.hora_fin) > aMinutos(d.hora_inicio), {
    message: "hora_fin debe ser mayor que hora_inicio",
    path: ["hora_fin"],
  });

/**
 * Dice si dos rangos de tiempo se pisan.
 * Usamos "abierto a la derecha": 08-09 y 09-10 NO chocan (estan pegadas).
 */
function rangosSeTraslapan(a, b, c, d) {
  // Si el primer rango empieza antes de que termine el segundo
  // Y el segundo empieza antes de que termine el primero => se cruzan.
  return a < d && c < b;
}

/**
 * Revisa si una clase nueva choca con las que ya tiene el alumno.
 *
 * @param candidato            la clase que se quiere agregar/editar
 * @param horariosExistentes   las clases que ya tiene el alumno
 * @param idAExcluir           si estamos editando, el id de la propia
 *                             clase para no compararla contra si misma
 * @returns el horario con el que choca, o null si todo bien
 */
export function detectarTraslape(candidato, horariosExistentes, idAExcluir = null) {
  // Pasamos las horas del candidato a minutos para compararlos.
  const inicio = aMinutos(candidato.hora_inicio);
  const fin = aMinutos(candidato.hora_fin);

  // Recorremos cada clase existente.
  for (const existente of horariosExistentes) {
    // Si estamos editando, ignoramos la propia clase (no choca contra si misma).
    if (idAExcluir && existente._id?.toString() === idAExcluir.toString()) continue;
    // Solo nos interesan las clases del mismo dia.
    if (existente.dia !== candidato.dia) continue;

    // Pasamos a minutos las horas de la clase existente.
    const exInicio = aMinutos(existente.hora_inicio);
    const exFin = aMinutos(existente.hora_fin);

    // Si hay traslape, devolvemos esa clase para mostrar mensaje claro.
    if (rangosSeTraslapan(inicio, fin, exInicio, exFin)) {
      return existente;
    }
  }
  // Si llegamos hasta aqui, ninguna choco: todo OK.
  return null;
}
