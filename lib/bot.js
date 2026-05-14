
import { ObjectId } from "mongodb";
import {
  getTareasCollection,
  getHorariosCollection,
  getPlanesEstudioCollection,
  getMateriasCollection,
  getTemasCollection,
} from "./mongodb";

// ====================================================
// TIPOS
// ====================================================
 













// ====================================================
// NORMALIZADOR Y UTILIDADES
// "Normalizar" = limpiar el texto para que el bot no se trabe por
// mayusculas, acentos o signos. Ej:
//   "¿Qué es la Normalización?"  ->  "que es la normalizacion"
// ====================================================
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()'"]/g, "")
    .trim();
}

// STOPWORDS = palabras que NO sirven para buscar (rellenos como "que", "el", "de"...).
// Las ignoramos para quedarnos solo con las palabras importantes.
const STOPWORDS = new Set([
  "que", "es", "son", "el", "la", "los", "las", "un", "una", "unos", "unas",
  "explicame", "explica", "definir", "definicion", "concepto", "habla",
  "cuentame", "informacion", "info", "sobre", "de", "del", "y", "o", "u",
  "con", "para", "por", "como", "donde", "cuando", "cual", "cuales",
  "me", "te", "se", "lo", "le", "su", "mi", "tu", "nos", "les",
  "dime", "dame", "muestrame", "ensename", "platicame", "puede", "podes",
  "ese", "esa", "esto", "esta", "estos", "estas",
  "ser", "estar", "haber", "tener", "hacer", "muy", "mas", "menos",
  "todo", "todos", "alguno", "ningun", "algun", "algo",
]);

// De una frase saca solo las palabras importantes.
// Ej: "que es la normalizacion en bases de datos"
//      -> ["normalizacion", "bases", "datos"]
function extraerPalabrasClave(texto) {
  return normalizar(texto)
    .split(/\s+/)                                        // parte por espacios
    .filter((p) => p.length > 2 && !STOPWORDS.has(p));   // quita cortas y stopwords
}

// "stem" = encontrar la raiz de una palabra cortandole la terminacion.
// Asi "normalizacion", "normalizar" y "normalizado" se parecen entre si.
function stem(palabra) {
  const sufijos = [
    "iones", "icion", "acion", "ciones",
    "ables", "ibles", "able", "ible",
    "ando", "iendo",
    "amos", "emos", "imos",
    "aste", "iste",
    "ada", "ado", "ida", "ido",
    "as", "es", "os", "is",
    "ar", "er", "ir",
    "an", "en", "in",
    "a", "e", "o", "s",
  ];
  
  for (const sufijo of sufijos) {
    if (palabra.length > sufijo.length + 2 && palabra.endsWith(sufijo)) {
      return palabra.slice(0, -sufijo.length);
    }
  }
  return palabra;
}

// Compara dos palabras y dice si "se parecen lo suficiente".
// Si son iguales, una contiene a la otra, o tienen la misma raiz -> match.
function palabrasMatchean(p1, p2) {
  if (p1 === p2) return true;
  if (p1.includes(p2) || p2.includes(p1)) return true;
  const s1 = stem(p1);
  const s2 = stem(p2);
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
}

// ====================================================
// PATRONES DE INTENCIONES
// Aqui decimos: "si el mensaje contiene X, el usuario quiere Y".
// Es como un diccionario de frases tipicas agrupadas por intencion.
// Ej: si escribe "hola" -> intencion = saludo
//     si escribe "que es..." -> intencion = consultar_tema
// ====================================================
const PATRONES = {
  saludo: ["hola", "buenos dias", "buenas tardes", "buenas noches", "que tal", "que onda", "hey", "saludos"],
  ayuda: ["ayuda", "help", "que puedes hacer", "que sabes hacer", "como funciona", "que haces", "menu", "comandos"],
  consultar_tema: [
    "que es", "que son", "explicame", "explica", "definicion de",
    "definir", "concepto de", "habla de", "informacion sobre",
    "informacion de", "cuentame de", "cuentame sobre",
    "como funciona", "como se", "para que sirve", "diferencia entre",
  ],
  guardar_tarea: [
    "recordar tarea", "agregar tarea", "nueva tarea", "guarda esta tarea",
    "anotar tarea", "agendar", "recuerdame que", "tengo que hacer",
    "guardar tarea", "crear tarea", "anadir tarea",
  ],
  ver_tareas: ["mis tareas", "que tengo pendiente", "ver tareas", "mostrar tareas", "lista de tareas", "tareas pendientes"],
  ver_horario: ["mi horario", "ver horario", "mostrar horario", "que clase tengo", "horario semanal", "horario de clases"],
  pedir_plan: [
    "plan de estudio", "recomiendame un plan", "como estudio",
    "como estudiar", "ruta de aprendizaje", "que estudio",
    "tecnicas de estudio", "tecnica de estudio", "ayuda para estudiar",
    "no puedo estudiar", "como memorizar", "como aprender mejor",
    "tips para estudiar", "consejos para estudiar",
  ],
  listar_materias: ["que materias hay", "lista de materias", "materias disponibles", "ver materias", "mostrar materias", "todas las materias"],
};

// Recibe el mensaje del usuario y decide QUE quiere hacer.
// Recorre los patrones de arriba y devuelve la primera intencion que coincida.
// Si no coincide nada -> "desconocida".
export function detectarIntencion(mensaje) {
  const texto = normalizar(mensaje);
  for (const intencion of Object.keys(PATRONES) ) {
    for (const patron of PATRONES[intencion]) {
      if (texto.includes(patron)) return intencion;
    }
  }
  return "desconocida";
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// =========================================================
//  BUSQUEDA DEL TOP 3
//  Esta es la parte mas importante del bot.
//  Le entra una pregunta y devuelve los 3 temas que MEJOR
//  se parecen, ordenados por puntaje (score).
//
//  COMO FUNCIONA:
//    1. Saca las palabras importantes de la pregunta.
//    2. Trae TODOS los temas aprobados de Mongo.
//    3. A cada tema le da un "score" segun cuanto coincide:
//         - Si la palabra aparece en el TITULO: +10
//         - Si esta en las palabras_clave:      +7
//         - Si esta en el contenido:            +2 por cada vez
//         - Bonus si TODAS las palabras estan en el titulo
//    4. Ordena de mayor a menor score y se queda con los 3 mejores.
// =========================================================
async function buscarTopTemas(consulta, limite = 3) {
  const palabrasUsuario = extraerPalabrasClave(consulta);
  
  if (palabrasUsuario.length === 0) return [];
  
  console.log(`🔍 Búsqueda para: "${consulta}"`);
  console.log(`📝 Palabras extraídas: ${palabrasUsuario.join(", ")}`);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  try {// conecta mongodb y trea los temas aprobados
    const col = await getTemasCollection();////estas 2 lienas traen todos los documentos de la COLECCION T E M A S que tienen el APROBADO : TRUE  esos son los unicos que el bot nos va a mostrar
    const todosTemas = await col.find({ aprobado: true }).toArray(); 
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    if (todosTemas.length === 0) return [];
    
    // SCORING
    const temasConScore = todosTemas.map((tema) => {//calcular score para cada tema 
      // compara con titulo
      // compara con palabras clave 
      //compara con contenido
      let score = 0;
      const tituloNorm = normalizar(tema.titulo || "");
      const contenidoNorm = normalizar(tema.contenido || "").substring(0, 500);
      const palabrasClave = (tema.palabras_clave || []).map((p) => normalizar(p));
      const palabrasTitulo = tituloNorm.split(/\s+/).filter(p => p.length > 2);
      
      for (const palabraUsuario of palabrasUsuario) {
        // Capa 1: título (peso 10)
        for (const palabraTitulo of palabrasTitulo) {
          if (palabrasMatchean(palabraUsuario, palabraTitulo)) {
            score += 10;
            break;
          }
        }
        
        // Capa 2: palabras_clave (peso 7)
        for (const pc of palabrasClave) {
          const palabrasPC = pc.split(/\s+/);
          for (const ppc of palabrasPC) {
            if (palabrasMatchean(palabraUsuario, ppc)) {
              score += 7;
              break;
            }
          }
        }
        
        // Capa 3: título completo (bonus 5)
        if (tituloNorm.includes(palabraUsuario)) {
          score += 5;
        }
        
        // Capa 4: contenido (peso 2 por aparición)
        const apariciones = (contenidoNorm.match(new RegExp(palabraUsuario, "g")) || []).length;
        score += Math.min(apariciones, 3) * 2;
      }
      
      //  consulta completa en palabras_clave
      const consultaNorm = normalizar(consulta);
      if (palabrasClave.some(pc => pc === consultaNorm || consultaNorm.includes(pc))) {
        score += 15;
      }
      
      // TODAS las palabras del usuario en título
      const todasEnTitulo = palabrasUsuario.every(pu => 
        palabrasTitulo.some(pt => palabrasMatchean(pu, pt))
      );
      if (todasEnTitulo) {
        score += 20;
      }
      
      return { tema, score };
    });
    
    // Ordenar por score y delvolver el top 3
     //DEFINICION DE SCORE: PUNTAJE O PUNTUACION QUE LE DA EL BOT A CADA TEMA PARA SABER QUE TAN BIEN COINSIDE CON LA PREGUNTA DEL USUARIOOOO 
    const ordenados = temasConScore
      .filter(t => t.score >= 5) // mínimo de score para considerarlo candidato
      .sort((a, b) => b.score - a.score)
      .slice(0, limite); // top N
    
    console.log(`🏆 TOP ${ordenados.length} encontrados:`);
    ordenados.forEach((t, i) => {
      console.log(`   ${i + 1}. "${t.tema.titulo}" (score: ${t.score})`);
    });
    
    return ordenados.map(t => ({
      id: t.tema._id.toString(),
      titulo: t.tema.titulo,
      contenido: t.tema.contenido || "",
      nivel: t.tema.nivel || "basico",
      ejemplos: t.tema.ejemplos || [],
      ejercicios: t.tema.ejercicios || [],
      score: t.score,
    }));
    
  } catch (err) {
    console.warn("Error en búsqueda:", err);
    return [];
  }
}

// ====================================================
// EJECUTORES
// ====================================================
function ejecutarSaludo() {
  const saludos = [
    "👋 ¡Hola! Soy SchoolOS, tu asistente educativo. ¿En qué puedo ayudarte?",
    "👋 ¡Que bueno verte! ¿Qué tema quieres explorar hoy?",
    "👋 ¡Hola! Estoy aquí para ayudarte con tus dudas y tareas.",
  ];
  return saludos[Math.floor(Math.random() * saludos.length)] +
    "\n\n💡 Escribe **\"ayuda\"** para ver todo lo que puedo hacer.";
}

function ejecutarAyuda() {
  return `🤖 **Esto es lo que puedo hacer por ti:**

📚 **Resolver dudas académicas**
   _"¿Qué es la normalización?"_
   _"Explícame los JOINs"_

✅ **Gestionar tus tareas**
   _"Recordar tarea: estudiar SQL"_
   _"Mis tareas"_

📅 **Consultar tu horario**
   _"Mi horario"_

🧠 **Recomendar técnicas de estudio**
   _"Necesito técnicas de estudio"_

📖 **Listar materias disponibles**
   _"¿Qué materias hay?"_`;
}

async function ejecutarConsultarTema(mensaje)




 {
  const palabras = extraerPalabrasClave(mensaje);

  if (palabras.length === 0) {
    return { contenido: "🤔 No entendí qué tema quieres consultar. Intenta con: _\"¿qué es la normalización?\"_" };
  }

  // LLAMA A LA BUSQUEDAAAA //////////////////////////////////////////////////
  const candidatos = await buscarTopTemas(mensaje, 3);                    ////
  ////////////////////////////////////////////////////////////////////////////


  // SI NO ENCUENTRA NADA //////////////////////////////////////////////////////////////////////////////////////////
  if (candidatos.length === 0) {
    const temaSugerido = palabras.join(" ");
    return {
      contenido: `😅 No tengo información sobre **"${temaSugerido}"** todavía.\n\n¿Te gustaría agregarla? Haz click en el botón de abajo para agregar este tema.`,
      sugerirAgregar: true,
      temaSugerido,
    };
  }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // AQUI NOS MUESTRA EL PRIMER CANTIDADO Y NOS PREGUNTA SI ES CORRECTO////////////////////////////////////////
  const primero = candidatos[0];
  const ejemplos = (primero.ejemplos )
    .map((e) => `   • ${e}`)
    .join("\n");
  
  let ejercicio = "";
  if (primero.ejercicios?.length > 0) {
    const ej = primero.ejercicios[0];
    if (ej.pregunta && ej.respuesta) {
      ejercicio = `\n\n**💡 Ejercicio:**\n${ej.pregunta}\n\n_Respuesta: ${ej.respuesta}_`;
    }
  }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////CONSTRUYE EL MENSAJE Q VE EL USUARIO
  const contenido = `🤔 **¿Buscabas esto?**\n\n📘 **${primero.titulo}**\n\n${primero.contenido}\n\n**Ejemplos:**\n${ejemplos}${ejercicio}\n\n📊 _Nivel: ${primero.nivel}_`;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return {
    contenido,
    candidatos,////////////////////////////////////////////////////////////////////////////////////////////////////////// TOP 3 DE LOS CANDIDATOS
    temaSugerido: palabras.join(" "),
  };
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function ejecutarGuardarTarea(mensaje, userId) {
  let titulo = "";
  const patrones = [
    /tarea:?\s+(.+)/i,
    /recuerdame que\s+(.+)/i,
    /tengo que hacer\s+(.+)/i,
    /agendar\s+(.+)/i,
  ];
  for (const p of patrones) {
    const match = mensaje.match(p);
    if (match && match[1]) { titulo = match[1].trim(); break; }
  }
/////////////////////// AQUI NOS PIEDE el tirula de la tarea para poder guardarlo //////////////////////////////////
  if (!titulo || titulo.length < 3) {
    return `📝 Para guardar una tarea dime el título así:\n\n_"Recordar tarea: estudiar para el examen de SQL"_`;
  }

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 7);

  const tareasCol = await getTareasCollection();
  await tareasCol.insertOne({
    user_id: userId,
    titulo,
    descripcion: null,
    fecha_limite: fechaLimite,
    estado: "pendiente",
    prioridad: "media",
    fecha_creacion: new Date(),
  });
////////////////////////// aqui ABAJO es el mensaje de que la tarea se guarda
  return `✅ **Tarea guardada:** "${titulo}"\n📅 Fecha límite: ${fechaLimite.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}\n\nEscribe **"mis tareas"** para ver todas tus pendientes.`;
}

async function ejecutarVerTareas(userId) {
  const tareasCol = await getTareasCollection();
  const tareas = await tareasCol
    .find({ user_id: userId, estado: "pendiente" })
    .sort({ fecha_limite: 1 })
    .limit(10)
    .toArray();

  if (tareas.length === 0) {
    return "🎉 ¡No tienes tareas pendientes! Estás al día.\n\n💡 Para agregar una: _\"Recordar tarea: ...\"_";
  }

  const lista = tareas.map((t, i) => {
    const fecha = new Date(t.fecha_limite).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    const emoji = t.prioridad === "alta" ? "🔴" : t.prioridad === "baja" ? "🟢" : "🟡";
    return `${i + 1}. ${emoji} **${t.titulo}** _(${fecha})_`;
  }).join("\n");

  return `📋 **Tienes ${tareas.length} tarea(s) pendiente(s):**\n\n${lista}`;
}

async function ejecutarVerHorario(userId) {
  const horariosCol = await getHorariosCollection();
  const horarios = await horariosCol.find({ user_id: userId }).toArray();

  if (horarios.length === 0) {
    return "📅 Aún no tienes horario registrado.\n\n💡 Pídele a tu maestro que te ayude a configurarlo.";
  }

  const ordenDias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const emojiDias = {
    lunes: "🔵", martes: "🟢", miercoles: "🟡",
    jueves: "🟠", viernes: "🔴", sabado: "🟣", domingo: "⚪",
  };

  const materiasCol = await getMateriasCollection();
  const materiasIds = horarios.map((h) => new ObjectId(h.materia_id));
  const materias = await materiasCol.find({ _id: { $in: materiasIds } }).toArray();
  const materiasMap = new Map(materias.map((m) => [m._id.toString(), m.nombre]));

  horarios.sort((a, b) => {
    const da = ordenDias.indexOf(a.dia);
    const db = ordenDias.indexOf(b.dia);
    return da !== db ? da - db : a.hora_inicio.localeCompare(b.hora_inicio);
  });

  const lista = horarios.map((h) => {
    const nombre = materiasMap.get(h.materia_id) || "Materia";
    const emoji = emojiDias[h.dia] || "📅";
    return `${emoji} **${h.dia.charAt(0).toUpperCase() + h.dia.slice(1)}** ${h.hora_inicio}-${h.hora_fin} → ${nombre}`;
  }).join("\n");

  return `📅 **Tu horario:**\n\n${lista}`;
}

async function ejecutarPedirPlan(mensaje) {
  const texto = normalizar(mensaje);
  
  const palabrasTecnicas = [
    "tecnica", "tecnicas", "memorizar", "concentrar", "estudiar mejor",
    "tips", "consejos", "no puedo", "se me olvida", "examen",
    "ayuda para estudiar", "como estudio", "como estudiar",
    "como aprender", "como memorizar",
  ];
  ////////////////////////////////////////////AQUI PODEMOS PEDIR TECNICAS DE ESTUDIO ///////////////////////////////////////
  const pidetecnicas = palabrasTecnicas.some(p => texto.includes(p));
  const tieneMateria = texto.includes("ingles") || texto.includes("english") ||
                       texto.includes("nosql") || texto.includes("mongo") ||
                       texto.includes("relacional") || texto.includes("sql");
  
  if (pidetecnicas && !tieneMateria) {
    return {
      contenido: `🧠 **Te puedo recomendar técnicas de estudio según tu problema.**\n\n¿Con cuál te identificas más?`,
      mostrarBotonesTecnicas: true,
    };
  }

  let codigoMateria = null;
  if (texto.includes("ingles") || texto.includes("english")) codigoMateria = "ENG";
  else if (texto.includes("nosql") || texto.includes("mongo")) codigoMateria = "BD-NOSQL";
  else if (texto.includes("relacional") || texto.includes("sql")) codigoMateria = "BD-REL";

  if (!codigoMateria) {
    return {
      contenido: "🎯 **¿Qué necesitas?**\n\n• **Plan de estudio por materia**: pregunta por _\"plan de inglés\"_, _\"plan de SQL\"_, _\"plan de MongoDB\"_\n\n• **Técnicas de estudio**: pregunta por _\"técnicas de estudio\"_ o cuéntame tu problema",
      mostrarBotonesTecnicas: true,
    };
  }

//////////////////////// SI NO TENEMOS LA MATERIA QUE LE PUSISMOS 
  const materiasCol = await getMateriasCollection();
  const materia = await materiasCol.findOne({ codigo: codigoMateria });
  if (!materia) return { contenido: "😅 No encuentro esa materia." };

  const planesCol = await getPlanesEstudioCollection();
  const plan = await planesCol.findOne({ materia_id: materia._id.toString() });
  if (!plan) return { contenido: `😅 Aún no hay planes para **${materia.nombre}**.` };

  const pasos = (plan.pasos )
    .map((p) => `**Día ${p.dia}** (${p.duracion_min} min) — ${p.actividad}${p.recurso ? `\n   📎 _${p.recurso}_` : ""}`)
    .join("\n\n");

  return {
    contenido: `🎯 **${plan.titulo}**\n📚 ${materia.icono} ${materia.nombre}\n📊 Nivel: ${plan.nivel}\n⏱️ ${plan.duracion_dias} días\n\n${pasos}`,
  };
}

async function ejecutarListarMaterias() {
  const materiasCol = await getMateriasCollection();
  const materias = await materiasCol.find({}).toArray();

  if (materias.length === 0) return "😅 No hay materias registradas.";

  const lista = materias
    .map((m) => `${m.icono} **${m.nombre}** _(${m.codigo})_\n   ${m.descripcion}`)
    .join("\n\n");


////////////////////////////// AQUI JSUTO ABAJO NOS VA A MOSTRAR LAS MATERIAS DISPONIBLES 
  return `📖 **Materias disponibles:**\n\n${lista}\n\n💡 Pregúntame sobre cualquier tema, ej: _"¿qué es la normalización?"_`;
}

function ejecutarDesconocida() {/////////////////// CUANDO NO ENTENDIO XDDDDDDD /////////////////////
  return `🤔 No entendí muy bien lo que quieres.

Algunas cosas que puedo hacer:
- 📚 _"¿qué es la normalización?"_
- ✅ _"recordar tarea: estudiar SQL"_
- 📅 _"mi horario"_
- 🧠 _"técnicas de estudio"_

Escribe **"ayuda"** para ver todo.`;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////





// =========================================================
// FUNCION PRINCIPAL DEL BOT
//
// Esta es la "puerta de entrada". El endpoint /api/chat
// llama esta funcion con el mensaje del usuario.
//
// Pasos que hace:
//   1. Detecta la intencion (saludo, consultar tema, ver tareas, etc.)
//   2. Segun la intencion, llama al "ejecutor" correspondiente.
//   3. Devuelve la respuesta lista para que el front la pinte.
// =========================================================






export async function procesarMensaje(
  mensaje,
  userId
) {////////////////////////// DETECTA LO QUE QUEREMOS //////////////////////
  const intencion = detectarIntencion(mensaje);                                                  //
  let contenido;                                                                         //
  let sugerirAgregar = false;                                                                    //
  let temaSugerido = "";                                                                         //
  let mostrarBotonesTecnicas = false;                                                            //
  let candidatos = undefined;                                                 //
///////////////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////// Si es una consulta o otro tipo de casos /////////////
  switch (intencion) {       
    case "saludo":
      contenido = ejecutarSaludo();
      break;
    case "ayuda":
      contenido = ejecutarAyuda();
      break;
    case "consultar_tema":
      const resultado = await ejecutarConsultarTema(mensaje);
      contenido = resultado.contenido;
      sugerirAgregar = resultado.sugerirAgregar || false;
      temaSugerido = resultado.temaSugerido || "";
      candidatos = resultado.candidatos;
      break;
    case "guardar_tarea":
      contenido = await ejecutarGuardarTarea(mensaje, userId);
      break;
    case "ver_tareas":
      contenido = await ejecutarVerTareas(userId);
      break;
    case "ver_horario":
      contenido = await ejecutarVerHorario(userId);
      break;
    case "pedir_plan":
      const resultadoPlan = await ejecutarPedirPlan(mensaje);
      contenido = resultadoPlan.contenido;
      mostrarBotonesTecnicas = resultadoPlan.mostrarBotonesTecnicas || false;
      break;
    case "listar_materias":
      contenido = await ejecutarListarMaterias();
      break;
    default:
      contenido = ejecutarDesconocida();
  }

  return { contenido, intencion, sugerirAgregar, temaSugerido, mostrarBotonesTecnicas, candidatos };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////