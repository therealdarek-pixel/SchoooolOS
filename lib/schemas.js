/**
 * lib/schemas.ts
 * --------------
 * Esquemas Zod para validación estricta de las 8 colecciones de SchoolOS.
 *
 * Cada esquema representa la "forma" de un documento en MongoDB.
 * Las relaciones se hacen mediante referencias (ObjectId como string).
 */
import { z } from "zod";

// ====================================================
// ROLES Y NIVELES
// ====================================================
export const userRoleSchema = z.enum(["maestro", "alumno"]);
 

export const nivelInglesSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
 

// ====================================================
// 1. USUARIOS (alumnos y maestros)
// ====================================================
export const registerSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
  nombre: z.string().min(2).max(100),
  rol: userRoleSchema.default("alumno"),
  nivel_ingles: nivelInglesSchema.optional(),
});
 

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
 

// ====================================================
// 2. MATERIAS
// ====================================================
export const materiaSchema = z.object({
  nombre: z.string().min(2).max(100),
  codigo: z.string().min(2).max(20),
  descripcion: z.string().max(500),
  maestro_id: z.string(),    // referencia a usuarios._id
  color: z.string().default("#3b82f6"),
  icono: z.string().default("📚"),
});
 

// ====================================================
// 3. TEMAS (el cerebro del bot)
// ====================================================
export const recursoSchema = z.object({
  tipo: z.enum(["video", "pdf", "link", "libro"]),
  url: z.string().url(),
  titulo: z.string(),
});

export const temaSchema = z.object({
  materia_id: z.string(),    // referencia a materias._id
  titulo: z.string().min(2).max(150),
  palabras_clave: z.array(z.string()).min(1),
  contenido: z.string().min(10),
  ejemplos: z.array(z.string()).default([]),
  recursos: z.array(recursoSchema).default([]),
  nivel: z.enum(["basico", "intermedio", "avanzado"]).default("basico"),
});
 

// ====================================================
// 4. TAREAS (cosas pendientes del alumno)
// ====================================================
export const tareaSchema = z.object({
  user_id: z.string(),
  materia_id: z.string().optional(),  // puede no tener materia asociada
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(1000).optional(),
  fecha_limite: z.string(),            // fecha en formato ISO
  estado: z.enum(["pendiente", "completada", "vencida"]).default("pendiente"),
  prioridad: z.enum(["alta", "media", "baja"]).default("media"),
});
 

// ====================================================
// 5. HORARIOS
// ====================================================
export const horarioSchema = z.object({
  user_id: z.string(),
  materia_id: z.string(),
  dia: z.enum(["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]),
  hora_inicio: z.string(),  // formato "HH:MM"
  hora_fin: z.string(),
  aula: z.string().optional(),
});
 

// ====================================================
// 6. PLANES DE ESTUDIO
// ====================================================
export const pasoPlanSchema = z.object({
  dia: z.number().int().positive(),
  actividad: z.string(),
  duracion_min: z.number().int().positive(),
  recurso: z.string().optional(),
});

export const planEstudioSchema = z.object({
  materia_id: z.string(),
  nivel: z.enum(["principiante", "intermedio", "avanzado"]),
  titulo: z.string().min(2).max(200),
  duracion_dias: z.number().int().positive(),
  pasos: z.array(pasoPlanSchema).min(1),
  creado_por: z.string(),    // user_id del maestro
});
 

// ====================================================
// 7. CONVERSACIONES (memoria del chat)
// ====================================================
export const mensajeChatSchema = z.object({
  rol: z.enum(["usuario", "bot"]),
  contenido: z.string(),
  timestamp: z.string(),
  intencion_detectada: z.string().optional(),
});
 

export const chatRequestSchema = z.object({
  mensaje: z.string().min(1).max(2000),
  session_id: z.string().optional(),
});
 

// ====================================================
// 8. INSCRIPCIONES (relación N:M alumnos↔materias)
// ====================================================
export const inscripcionSchema = z.object({
  user_id: z.string(),
  materia_id: z.string(),
  estado: z.enum(["activa", "finalizada", "abandonada"]).default("activa"),
  progreso: z.number().min(0).max(100).default(0),
  promedio: z.number().min(0).max(10).optional(),
});
 