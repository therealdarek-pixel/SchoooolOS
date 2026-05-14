// ============================================================
//  lib/mongodb.js
//  Aqui se hace la CONEXION a la base de datos MongoDB Atlas.
//  Todo el proyecto entra a MongoDB pasando por este archivo.
// ============================================================

import { MongoClient, } from "mongodb";

// Si no encuentra la URL de Mongo en .env.local, truena de una vez.
// (sin URL no hay nada que conectar)
if (!process.env.MONGODB_URI) {
  throw new Error("Falta la variable MONGODB_URI en .env.local");
}

// Datos de conexion sacados de .env.local
const uri = process.env.MONGODB_URI;                 // direccion del cluster de Atlas
const dbName = process.env.MONGODB_DB || "schoolos"; // nombre de la base de datos

// client          -> objeto que representa la conexion
// clientPromise   -> promesa de esa conexion (asi no la reabrimos cada request)
let client;
let clientPromise;


// -------------------------------------------------------------
// En MODO DESARROLLO Next.js recarga el codigo seguido (hot reload).
// Para no abrir 200 conexiones cada vez que se guarda un archivo,
// guardamos la conexion en "global" y la reutilizamos.
// En produccion no pasa eso, asi que se crea una vez normalita.
// -------------------------------------------------------------
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/** Devuelve la BD lista para hacer queries. La usan todos los helpers de abajo. */
export async function getDb() {
  const conn = await clientPromise;
  return conn.db(dbName);
}

// ====================================================
// HELPERS PARA CADA COLECCION
// Cada funcion te entrega UNA coleccion ya con sus indices.
// Los indices son como el "indice de un libro": hacen
// que las busquedas sean rapidas.
// ====================================================

// 1. USUARIOS -> guarda alumnos, maestros y admins
export async function getUsuariosCollection() {
  const db = await getDb();
  const col = db.collection("usuarios");
  // No puede haber dos usuarios con el mismo email
  await col.createIndex({ email: 1 }, { unique: true });
  return col;
}

// 2. MATERIAS -> SQL, NoSQL, Ingles, etc.
export async function getMateriasCollection() {
  const db = await getDb();
  const col = db.collection("materias");
  await col.createIndex({ codigo: 1 }, { unique: true }); // codigo unico por materia
  await col.createIndex({ maestro_id: 1 });               // busqueda por maestro
  return col;
}

// 3. TEMAS (el CEREBRO del bot)
// Aqui viven todas las explicaciones, ejemplos y ejercicios.
// Cuando el usuario pregunta algo, el bot busca aqui por palabras clave.
export async function getTemasCollection() {
  const db = await getDb();
  const col = db.collection("temas");
  await col.createIndex({ palabras_clave: 1 });   // <- indice CLAVE para el bot
  await col.createIndex({ materia_id: 1 });
  return col;
}

// 4. TAREAS -> pendientes que el alumno guarda
export async function getTareasCollection() {
  const db = await getDb();
  const col = db.collection("tareas");
  // indice compuesto: "tareas del usuario X ordenadas por fecha"
  await col.createIndex({ user_id: 1, fecha_limite: 1 });
  await col.createIndex({ user_id: 1, estado: 1 });
  return col;
}

// 5. HORARIOS -> clases por dia y hora
export async function getHorariosCollection() {
  const db = await getDb();
  const col = db.collection("horarios");
  await col.createIndex({ user_id: 1, dia: 1 });
  return col;
}

// 6. PLANES DE ESTUDIO -> rutas de aprendizaje (dia 1, dia 2, etc.)
export async function getPlanesEstudioCollection() {
  const db = await getDb();
  const col = db.collection("planes_estudio");
  await col.createIndex({ materia_id: 1, nivel: 1 });
  return col;
}

// 7. CONVERSACIONES -> historial de chat con el bot por sesion
export async function getConversacionesCollection() {
  const db = await getDb();
  const col = db.collection("conversaciones");
  await col.createIndex({ user_id: 1, sesion_id: 1 });
  return col;
}

// 8. INSCRIPCIONES -> alumno <-> materia (relacion N:M)
export async function getInscripcionesCollection() {
  const db = await getDb();
  const col = db.collection("inscripciones");
  // un alumno solo puede inscribirse UNA vez a cada materia
  await col.createIndex({ user_id: 1, materia_id: 1 }, { unique: true });
  return col;
}

export default clientPromise;
