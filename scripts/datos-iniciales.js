/**
 * scripts/datos-iniciales.ts
 * --------------------------
 * Datos semilla para poblar la BD por primera vez.
 * Contiene: 3 materias, 30 temas (10 por materia), y planes de estudio.
 *
 * Estos datos los lee el script "seed.ts" para insertarlos en MongoDB.
 */

// ====================================================
// 1. MATERIAS (las 3 materias del proyecto)
// ====================================================
export const MATERIAS = [
  {
    nombre: "Bases de Datos Relacionales",
    codigo: "BD-REL",
    descripcion: "Estudio de SQL, modelo entidad-relación, normalización y diseño de bases de datos relacionales.",
    color: "#3b82f6",
    icono: "🗄️",
  },
  {
    nombre: "Bases de Datos No Relacionales",
    codigo: "BD-NOSQL",
    descripcion: "MongoDB, Redis, sistemas NoSQL, modelado de documentos y bases de datos distribuidas.",
    color: "#10b981",
    icono: "🍃",
  },
  {
    nombre: "Inglés",
    codigo: "ENG",
    descripcion: "Gramática, vocabulario, comprensión y producción oral y escrita en idioma inglés.",
    color: "#f59e0b",
    icono: "🌍",
  },
];

// ====================================================
// 2. TEMAS DE BASES DE DATOS RELACIONALES
// ====================================================
export const TEMAS_BD_REL = [
  {
    titulo: "Modelo Entidad-Relación",
    palabras_clave: ["modelo entidad relacion", "er", "diagrama er", "entidad relacion", "modelo er"],
    contenido: "El Modelo Entidad-Relación (E-R) es una técnica para diseñar bases de datos. Representa la realidad mediante ENTIDADES (objetos del mundo real como 'Estudiante' o 'Materia'), ATRIBUTOS (características de las entidades como 'nombre' o 'edad'), y RELACIONES (conexiones entre entidades como 'estudiante se inscribe en materia').",
    ejemplos: [
      "Entidad ESTUDIANTE con atributos: id, nombre, email",
      "Relación 'INSCRIBE' entre ESTUDIANTE y MATERIA es de tipo muchos a muchos (N:M)",
    ],
    nivel: "basico",
  },
  {
    titulo: "Llaves primarias y foráneas",
    palabras_clave: ["llave primaria", "primary key", "foreign key", "fk", "pk", "llave foranea", "clave primaria"],
    contenido: "Una LLAVE PRIMARIA (Primary Key) es un campo que identifica de forma única a cada registro de una tabla. No puede repetirse ni ser nula. Una LLAVE FORÁNEA (Foreign Key) es un campo que hace referencia a la llave primaria de otra tabla, estableciendo una relación entre ambas.",
    ejemplos: [
      "En la tabla USUARIOS, el campo 'id' es PK",
      "En la tabla TAREAS, el campo 'usuario_id' es FK que apunta a USUARIOS.id",
    ],
    nivel: "basico",
  },
  {
    titulo: "Normalización",
    palabras_clave: ["normalizacion", "normalizar", "1fn", "2fn", "3fn", "formas normales", "primera forma normal"],
    contenido: "La normalización es el proceso de organizar las tablas de una base de datos para reducir la redundancia y mejorar la integridad de los datos. Se aplican 'formas normales' progresivas: 1FN (valores atómicos), 2FN (sin dependencias parciales), 3FN (sin dependencias transitivas).",
    ejemplos: [
      "1FN: Una celda no puede contener una lista; ej: 'telefonos: 555-1, 555-2' debe separarse",
      "2FN: Si la PK es compuesta, todos los atributos deben depender de la PK completa",
      "3FN: Ningún atributo no-clave debe depender de otro atributo no-clave",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "JOINs",
    palabras_clave: ["join", "inner join", "left join", "right join", "full join", "joins"],
    contenido: "Los JOINs son operaciones SQL que combinan filas de dos o más tablas basándose en una condición. INNER JOIN devuelve solo las coincidencias. LEFT JOIN devuelve todas las filas de la tabla izquierda más las coincidencias. RIGHT JOIN es lo contrario. FULL JOIN devuelve todas las filas de ambas tablas.",
    ejemplos: [
      "SELECT * FROM usuarios INNER JOIN tareas ON usuarios.id = tareas.usuario_id",
      "LEFT JOIN incluye usuarios sin tareas (con NULL en columnas de tareas)",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Índices",
    palabras_clave: ["indice", "index", "indexar", "indices"],
    contenido: "Un ÍNDICE es una estructura de datos auxiliar que acelera las consultas en una tabla. Funciona como el índice de un libro: permite encontrar registros sin escanear toda la tabla. Tienen un costo: ocupan espacio y ralentizan las inserciones/actualizaciones.",
    ejemplos: [
      "CREATE INDEX idx_email ON usuarios(email);",
      "Una consulta SELECT * FROM usuarios WHERE email = 'x' será mucho más rápida con índice",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Transacciones ACID",
    palabras_clave: ["transaccion", "acid", "atomicidad", "consistencia", "aislamiento", "durabilidad"],
    contenido: "Una TRANSACCIÓN es un conjunto de operaciones que se ejecutan como una unidad. Las propiedades ACID son: ATOMICIDAD (todo o nada), CONSISTENCIA (la BD pasa de un estado válido a otro), AISLAMIENTO (transacciones concurrentes no se afectan), DURABILIDAD (los cambios persisten tras un fallo).",
    ejemplos: [
      "Transferencia bancaria: o se descuenta de cuenta A Y se suma a cuenta B, o no pasa nada",
      "BEGIN TRANSACTION ... COMMIT (confirma) o ROLLBACK (deshace)",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Procedimientos almacenados",
    palabras_clave: ["stored procedure", "procedimiento almacenado", "sp", "procedimiento"],
    contenido: "Un PROCEDIMIENTO ALMACENADO es un bloque de código SQL guardado en el servidor de la BD que puede ejecutarse con un nombre. Mejora el rendimiento (compilado una vez), reutiliza lógica y centraliza reglas de negocio.",
    ejemplos: [
      "CREATE PROCEDURE obtener_usuario(@id INT) AS SELECT * FROM usuarios WHERE id = @id",
      "Se ejecuta con: EXEC obtener_usuario @id = 5",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Triggers",
    palabras_clave: ["trigger", "disparador", "triggers"],
    contenido: "Un TRIGGER es un procedimiento que se ejecuta automáticamente cuando ocurre un evento (INSERT, UPDATE o DELETE) en una tabla. Sirve para mantener integridad, auditar cambios o automatizar tareas.",
    ejemplos: [
      "Trigger que actualiza 'fecha_modificacion' cada vez que se hace UPDATE en una fila",
      "Trigger que registra en una tabla de auditoría cualquier DELETE",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Vistas",
    palabras_clave: ["view", "vista", "vistas"],
    contenido: "Una VISTA es una consulta SQL guardada que se comporta como una tabla virtual. No almacena datos; los obtiene de las tablas base cada vez que se consulta. Sirve para simplificar consultas complejas, ocultar detalles y aplicar seguridad.",
    ejemplos: [
      "CREATE VIEW alumnos_activos AS SELECT * FROM usuarios WHERE rol = 'alumno' AND activo = TRUE",
      "Luego se consulta como tabla: SELECT * FROM alumnos_activos",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Subconsultas",
    palabras_clave: ["subconsulta", "subquery", "consulta anidada"],
    contenido: "Una SUBCONSULTA es una consulta SQL anidada dentro de otra. Pueden ir en SELECT, FROM o WHERE. Permiten resolver problemas complejos en una sola sentencia.",
    ejemplos: [
      "SELECT nombre FROM usuarios WHERE id IN (SELECT usuario_id FROM tareas)",
      "Subconsulta en FROM: SELECT promedio FROM (SELECT AVG(nota) FROM tareas) AS sub",
    ],
    nivel: "intermedio",
  },
];

// ====================================================
// 3. TEMAS DE BASES DE DATOS NO RELACIONALES
// ====================================================
export const TEMAS_BD_NOSQL = [
  {
    titulo: "Documentos vs Filas",
    palabras_clave: ["documento", "filas", "diferencia sql nosql", "documento vs fila"],
    contenido: "En bases relacionales los datos se guardan en FILAS de tablas con esquema fijo. En NoSQL (MongoDB) se guardan en DOCUMENTOS, que son objetos tipo JSON con estructura flexible. Cada documento puede tener campos distintos.",
    ejemplos: [
      "Fila SQL: (1, 'Juan', 25)",
      "Documento Mongo: { _id: 1, nombre: 'Juan', edad: 25, hobbies: ['leer', 'correr'] }",
    ],
    nivel: "basico",
  },
  {
    titulo: "Colecciones",
    palabras_clave: ["coleccion", "collection", "colecciones"],
    contenido: "Una COLECCIÓN en MongoDB es el equivalente a una tabla en SQL. Es un grupo de documentos. A diferencia de las tablas, los documentos en una colección no necesitan tener la misma estructura (esquema flexible).",
    ejemplos: [
      "Colección 'usuarios' contiene documentos de tipo usuario",
      "db.usuarios.find() devuelve todos los documentos de la colección",
    ],
    nivel: "basico",
  },
  {
    titulo: "ObjectId",
    palabras_clave: ["objectid", "id mongo", "_id"],
    contenido: "ObjectId es el tipo de dato que MongoDB usa por defecto como identificador único de cada documento. Es un valor de 12 bytes que incluye timestamp, identificador de máquina y contador. Se asigna automáticamente al campo '_id'.",
    ejemplos: [
      "_id: ObjectId('507f1f77bcf86cd799439011')",
      "Es único globalmente, no necesitas generar IDs manualmente",
    ],
    nivel: "basico",
  },
  {
    titulo: "Referencias vs Embebido",
    palabras_clave: ["referencia", "embebido", "embed", "referencias"],
    contenido: "En MongoDB hay 2 formas de relacionar datos: REFERENCIAS (guardar el _id de otro documento, como FK en SQL) o EMBEBIDO (guardar el documento completo dentro de otro). Embebido es bueno cuando los datos siempre se consultan juntos; referencias cuando los datos crecen mucho o se consultan independientes.",
    ejemplos: [
      "Embebido: usuario tiene 'direccion' anidada como objeto adentro",
      "Referencia: tarea tiene 'usuario_id' apuntando a otro documento de la colección usuarios",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Operaciones CRUD",
    palabras_clave: ["crud", "insertOne", "find", "updateOne", "deleteOne", "operaciones"],
    contenido: "CRUD significa Create, Read, Update, Delete. En MongoDB: insertOne/insertMany para crear, find/findOne para leer, updateOne/updateMany para actualizar, deleteOne/deleteMany para borrar.",
    ejemplos: [
      "db.usuarios.insertOne({ nombre: 'Ana', edad: 22 })",
      "db.usuarios.find({ edad: { $gt: 18 } }) - busca mayores de 18",
      "db.usuarios.updateOne({ _id: 1 }, { $set: { edad: 23 } })",
    ],
    nivel: "basico",
  },
  {
    titulo: "Aggregation Pipeline",
    palabras_clave: ["aggregation", "pipeline", "agregacion", "aggregate"],
    contenido: "El AGGREGATION PIPELINE es una potente herramienta de MongoDB para procesar datos en etapas. Cada etapa transforma los documentos. Permite filtrar, agrupar, ordenar, calcular y transformar datos de forma similar a SQL pero más flexible.",
    ejemplos: [
      "db.tareas.aggregate([ { $match: { estado: 'completada' } }, { $group: { _id: '$user_id', total: { $sum: 1 } } } ])",
      "Etapas comunes: $match, $group, $project, $sort, $limit, $lookup",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Índices en MongoDB",
    palabras_clave: ["indice mongo", "createIndex", "indexar mongodb", "indices mongo"],
    contenido: "Los ÍNDICES en MongoDB aceleran las consultas igual que en SQL. Se crean con createIndex(). MongoDB crea automáticamente un índice en _id. Pueden ser únicos, compuestos, de texto o geoespaciales.",
    ejemplos: [
      "db.usuarios.createIndex({ email: 1 }, { unique: true })",
      "db.tareas.createIndex({ user_id: 1, fecha: -1 }) - índice compuesto",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Operadores $match y $group",
    palabras_clave: ["match", "group", "operadores mongo", "$match", "$group"],
    contenido: "$match filtra documentos (como WHERE en SQL). $group agrupa documentos por un campo y permite calcular sumas, promedios, conteos (como GROUP BY en SQL). Son las etapas más usadas en agregaciones.",
    ejemplos: [
      "$match: { estado: 'pendiente' } - solo documentos con ese estado",
      "$group: { _id: '$materia', total: { $sum: 1 } } - cuenta tareas por materia",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Replicación",
    palabras_clave: ["replica", "replicacion", "replica set", "redundancia"],
    contenido: "La REPLICACIÓN consiste en mantener copias de la BD en múltiples servidores. En MongoDB se llama 'Replica Set'. Hay un nodo PRIMARIO que recibe escrituras y nodos SECUNDARIOS que se sincronizan. Si el primario falla, un secundario asume el rol automáticamente.",
    ejemplos: [
      "Replica Set típico: 1 primario + 2 secundarios = alta disponibilidad",
      "MongoDB Atlas usa replicación automática en sus clusters",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Sharding",
    palabras_clave: ["sharding", "particionar", "shard", "escalar horizontalmente"],
    contenido: "El SHARDING es la técnica de dividir una BD muy grande entre varios servidores (shards) para escalar horizontalmente. Cada shard contiene una parte de los datos. MongoDB lo hace automáticamente usando una 'shard key'.",
    ejemplos: [
      "BD de 1TB dividida en 4 shards de 250GB cada uno",
      "Shard key 'user_id': los datos de cada usuario quedan juntos en un solo shard",
    ],
    nivel: "avanzado",
  },
];

// ====================================================
// 4. TEMAS DE INGLÉS
// ====================================================
export const TEMAS_INGLES = [
  {
    titulo: "Past Simple",
    palabras_clave: ["past simple", "pasado simple", "simple past"],
    contenido: "El Past Simple se usa para acciones completadas en el pasado, en un momento específico. Estructura: Sujeto + verbo en pasado + complemento. Verbos regulares: añade -ed (worked, played). Verbos irregulares: cambian de forma (go→went, eat→ate).",
    ejemplos: [
      "I worked yesterday. (Yo trabajé ayer)",
      "She went to Paris last summer. (Ella fue a París el verano pasado)",
      "Negativa: I did not work. Pregunta: Did you work?",
    ],
    nivel: "basico",
  },
  {
    titulo: "Past Perfect",
    palabras_clave: ["past perfect", "pasado perfecto", "had"],
    contenido: "El Past Perfect describe una acción que ocurrió ANTES de otra acción pasada. Estructura: had + participio pasado. Se usa para indicar el orden de eventos pasados.",
    ejemplos: [
      "When I arrived, she had already left. (Cuando llegué, ella ya se había ido)",
      "He had finished his homework before dinner. (Había terminado la tarea antes de cenar)",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Present Perfect",
    palabras_clave: ["present perfect", "presente perfecto", "have", "has"],
    contenido: "El Present Perfect conecta el pasado con el presente. Se usa para experiencias, acciones recientes con efecto en el presente, o acciones que comenzaron en el pasado y continúan. Estructura: have/has + participio pasado.",
    ejemplos: [
      "I have lived here for 5 years. (He vivido aquí por 5 años, sigo viviendo)",
      "She has just finished her work. (Acaba de terminar su trabajo)",
      "Have you ever been to Japan? (¿Alguna vez has estado en Japón?)",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Future Tenses",
    palabras_clave: ["future", "futuro", "will", "going to", "future tenses"],
    contenido: "El inglés tiene varias formas de futuro: WILL para predicciones espontáneas o promesas. GOING TO para planes ya decididos. PRESENT CONTINUOUS para arreglos confirmados. PRESENT SIMPLE para horarios fijos.",
    ejemplos: [
      "It will rain tomorrow. (Lloverá mañana - predicción)",
      "I'm going to study tonight. (Voy a estudiar esta noche - plan)",
      "I'm meeting John at 5pm. (Voy a reunirme con John - arreglo)",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Conditionals",
    palabras_clave: ["conditional", "condicional", "if", "conditionals"],
    contenido: "Hay 4 tipos de condicionales en inglés: ZERO (verdades generales), FIRST (situaciones reales futuras), SECOND (situaciones hipotéticas presentes), THIRD (situaciones imposibles del pasado).",
    ejemplos: [
      "Zero: If you heat water, it boils. (Si calientas agua, hierve)",
      "First: If it rains, I will stay home. (Si llueve, me quedaré en casa)",
      "Second: If I were rich, I would travel. (Si fuera rico, viajaría)",
      "Third: If I had studied, I would have passed. (Si hubiera estudiado, habría aprobado)",
    ],
    nivel: "avanzado",
  },
  {
    titulo: "Modal Verbs",
    palabras_clave: ["modal", "can", "could", "should", "must", "modal verbs", "verbos modales"],
    contenido: "Los MODALES son verbos auxiliares que expresan habilidad, posibilidad, obligación, permiso o consejo. No cambian con la persona y van seguidos de infinitivo sin 'to'. Principales: can/could (poder), must (deber), should (debería), may/might (quizá), will/would.",
    ejemplos: [
      "I can swim. (Puedo nadar - habilidad)",
      "You should rest. (Deberías descansar - consejo)",
      "She must finish her work. (Debe terminar su trabajo - obligación)",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Phrasal Verbs",
    palabras_clave: ["phrasal verb", "verbos compuestos", "phrasal verbs"],
    contenido: "Los PHRASAL VERBS son combinaciones de verbo + preposición/adverbio que tienen un significado distinto al del verbo solo. Son muy comunes en inglés cotidiano. Hay separables (turn the TV off) e inseparables (look after the baby).",
    ejemplos: [
      "give up = rendirse",
      "look after = cuidar",
      "turn on/off = encender/apagar",
      "find out = descubrir",
    ],
    nivel: "intermedio",
  },
  {
    titulo: "Verbos Irregulares",
    palabras_clave: ["irregular verbs", "verbos irregulares", "irregular"],
    contenido: "Los VERBOS IRREGULARES no siguen la regla del -ed para formar el pasado. Tienen 3 formas: infinitivo, pasado simple y participio pasado. Hay aproximadamente 200 en uso común y deben memorizarse.",
    ejemplos: [
      "go - went - gone (ir)",
      "eat - ate - eaten (comer)",
      "see - saw - seen (ver)",
      "be - was/were - been (ser/estar)",
    ],
    nivel: "basico",
  },
  {
    titulo: "Vocabulary Building",
    palabras_clave: ["vocabulario", "vocabulary", "palabras", "aprender vocabulario"],
    contenido: "Construir vocabulario en inglés requiere estrategia: aprender palabras en CONTEXTO, no aisladas. Usar APPS de repetición espaciada (Anki, Quizlet). Leer material de tu nivel (libros graduados, noticias). Agrupar palabras por temas (cocina, viajes, trabajo).",
    ejemplos: [
      "Aprende: 'commute' (trayecto al trabajo) en una frase: 'My commute takes 30 minutes'",
      "Anki: 20 palabras nuevas por día con repaso automático",
    ],
    nivel: "basico",
  },
  {
    titulo: "Pronunciation Tips",
    palabras_clave: ["pronunciation", "pronunciacion", "pronunciar"],
    contenido: "La pronunciación inglesa puede ser desafiante. Tips: aprender el ALFABETO FONÉTICO (IPA), distinguir sonidos similares (/ɪ/ ship vs /iː/ sheep), practicar el SCHWA (sonido neutro /ə/), trabajar la entonación y el ritmo. Sitios útiles: YouGlish, Forvo, BBC Pronunciation.",
    ejemplos: [
      "ship /ʃɪp/ (corto) vs sheep /ʃiːp/ (largo)",
      "the /ðə/ → schwa neutro",
      "thought /θɔːt/ → 'th' sin voz, sacar la lengua",
    ],
    nivel: "intermedio",
  },
];

// ====================================================
// 5. PLANES DE ESTUDIO DE EJEMPLO
// ====================================================
export const PLANES = [
  {
    materia_codigo: "BD-REL",
    nivel: "principiante",
    titulo: "Plan introductorio: SQL en 7 días",
    duracion_dias: 7,
    pasos: [
      { dia: 1, actividad: "Modelo Entidad-Relación", duracion_min: 60, recurso: "Ver tema 'Modelo E-R'" },
      { dia: 2, actividad: "SELECT y WHERE básicos", duracion_min: 45, recurso: "Practicar en SQLZoo.net" },
      { dia: 3, actividad: "JOINs (INNER, LEFT)", duracion_min: 60, recurso: "Ver tema 'Joins' + 5 ejercicios" },
      { dia: 4, actividad: "Llaves primarias y foráneas", duracion_min: 45, recurso: "Diseñar BD de biblioteca" },
      { dia: 5, actividad: "Normalización 1FN, 2FN, 3FN", duracion_min: 60, recurso: "Ver tema 'Normalización'" },
      { dia: 6, actividad: "GROUP BY y agregaciones", duracion_min: 45, recurso: "LeetCode SQL fácil" },
      { dia: 7, actividad: "Proyecto integrador", duracion_min: 90, recurso: "Diseñar BD de tienda online" },
    ],
  },
  {
    materia_codigo: "BD-NOSQL",
    nivel: "principiante",
    titulo: "Plan: MongoDB desde cero en 7 días",
    duracion_dias: 7,
    pasos: [
      { dia: 1, actividad: "Documentos y colecciones", duracion_min: 60, recurso: "MongoDB University: M001" },
      { dia: 2, actividad: "CRUD básico", duracion_min: 60, recurso: "Practicar insertOne, find, updateOne" },
      { dia: 3, actividad: "Operadores de consulta", duracion_min: 45, recurso: "$gt, $lt, $in, $regex" },
      { dia: 4, actividad: "Referencias vs embebido", duracion_min: 60, recurso: "Ver tema correspondiente" },
      { dia: 5, actividad: "Índices", duracion_min: 45, recurso: "createIndex y explain" },
      { dia: 6, actividad: "Aggregation Pipeline", duracion_min: 60, recurso: "$match, $group, $project" },
      { dia: 7, actividad: "Proyecto: Diseñar BD de blog", duracion_min: 90, recurso: "Aplicar todo lo aprendido" },
    ],
  },
  {
    materia_codigo: "ENG",
    nivel: "intermedio",
    titulo: "Plan B1-B2: Inglés intermedio en 7 días",
    duracion_dias: 7,
    pasos: [
      { dia: 1, actividad: "Repaso Past Simple vs Past Perfect", duracion_min: 45, recurso: "Murphy capítulos 13-14" },
      { dia: 2, actividad: "Present Perfect en contexto", duracion_min: 30, recurso: "BBC 6 Minute English" },
      { dia: 3, actividad: "Conditionals (1st y 2nd)", duracion_min: 45, recurso: "Ejercicios online + ejemplos" },
      { dia: 4, actividad: "Modal verbs", duracion_min: 30, recurso: "Should, must, can, could" },
      { dia: 5, actividad: "Phrasal verbs comunes", duracion_min: 45, recurso: "Lista de 30 phrasal verbs" },
      { dia: 6, actividad: "Listening: podcast", duracion_min: 30, recurso: "All Ears English episode" },
      { dia: 7, actividad: "Speaking: monólogo de 5 min", duracion_min: 30, recurso: "Grabarse hablando de un tema" },
    ],
  },
];