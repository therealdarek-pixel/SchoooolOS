"use client";
import {jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx} from "react/jsx-runtime";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { chatApi, authApi } from "@/lib/api-client";

import MathRenderer from "./MathRenderer";
import AgregarTemaModal from "./AgregarTemaModal";

const TECNICAS_ESTUDIO = {
  concentracion: {
    titulo: "🍅 Técnica Pomodoro",
    contenido: `**Para mejorar tu concentración:**

La técnica Pomodoro divide tu estudio en bloques de tiempo enfocado.

**¿Cómo funciona?**
1. Estudia 25 minutos sin distracciones
2. Descansa 5 minutos
3. Repite 4 veces
4. Después del 4° pomodoro, descansa 15-30 minutos

**Tips:**
- Usa un temporizador visible
- Apaga notificaciones del celular
- Ten agua y snacks cerca para no levantarte
- En los descansos, **no uses redes sociales**`,
  },
  memoria: {
    titulo: "🧠 Repaso Espaciado + Método Feynman",
    contenido: `**Para que NO se te olvide lo que estudias:**

**1. Repaso Espaciado**
Repasa la información en intervalos crecientes:
- Día 1: Estudias el tema
- Día 2: Repasas (10 min)
- Día 4: Repasas (10 min)
- Día 7: Repasas (10 min)
- Día 14: Repasas (10 min)
- Día 30: Repasas (10 min)

**2. Método Feynman**
Explica el tema con tus propias palabras:
1. Elige un concepto
2. Explícalo como si fueras maestro
3. Identifica dónde te trabaste
4. Vuelve a estudiar esos puntos
5. Simplifica hasta que sea claro`,
  },
  examen: {
    titulo: "📚 Repaso Activo + Mapas Mentales",
    contenido: `**Para preparar un examen pronto:**

**1. Repaso Activo (NO subrayar)**
En vez de releer apuntes, **prueba tu memoria**:
- Cierra el libro y escribe lo que recuerdas
- Hazte preguntas a ti mismo
- Resuelve ejercicios sin ver la respuesta
- Explica el tema en voz alta

**2. Mapas Mentales**
Conecta visualmente los conceptos:
1. Pon el tema central en medio
2. Dibuja ramas con subtemas
3. Usa colores y dibujos
4. Conecta ideas relacionadas`,
  },
  tiempo: {
    titulo: "⏰ Priorización + Pomodoro",
    contenido: `**Para cuando no te da tiempo de estudiar:**

**1. Matriz de Eisenhower**
Clasifica tus tareas en 4 cuadrantes:
- 🔴 **Urgente + Importante**: Hazlo YA
- 🟡 **Importante NO Urgente**: Programa fecha
- 🟠 **Urgente NO Importante**: Delega o haz rápido
- 🟢 **Ni urgente ni importante**: Elimínalo

**2. Regla 80/20 (Pareto)**
El 20% del esfuerzo da el 80% del resultado.`,
  },
  comprension: {
    titulo: "💡 Método Feynman",
    contenido: `**Para entender mejor lo que estudias:**

El método Feynman te obliga a entender de verdad, no solo memorizar.

**4 pasos:**

**1. Elige un concepto**
Escribe el nombre del tema en una hoja en blanco.

**2. Explícalo a un niño de 12 años**
Usa palabras simples, sin jerga técnica.
Si no puedes explicarlo simple, **NO lo entiendes bien**.

**3. Identifica los huecos**
Marca dónde te trabas o usas palabras complicadas.

**4. Simplifica y usa analogías**
Compara con cosas de la vida real.`,
  },
};

export default function ChatInterface() {
  const [sesionId, setSesionId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chat_session_id");
      if (stored && stored !== "undefined" && stored !== "null") {
        return stored;
      }
      localStorage.removeItem("chat_session_id");
    }
    return undefined;
  });

  const [mensajes, setMensajes] = useState([
    {
      rol: "asistente",
      contenido:
        "👋 Hola, soy **SchoolOS**. Puedo ayudarte a resolver dudas, gestionar tus tareas, organizar tu horario y recomendarte técnicas de estudio.\n\n💡 Escribe **\"ayuda\"** para ver todo lo que puedo hacer.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [temaSugerido, setTemaSugerido] = useState("");
  const [mostrarBotonesTecnicas, setMostrarBotonesTecnicas] = useState(false);
  const [ultimaPregunta, setUltimaPregunta] = useState("");
  
  // Estados para el sistema de candidatos
  const [candidatosActuales, setCandidatosActuales] = useState([]);
  const [indiceCandidato, setIndiceCandidato] = useState(0);
  const [mostrarBotonesConfirmacion, setMostrarBotonesConfirmacion] = useState(false);

  const finRef = useRef(null);

  useEffect(() => {
    authApi.me().then(setUsuario).catch(() => {});
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, enviando]);

  useEffect(() => {
    async function cargarConversacion() {
      if (!sesionId) return;
      
      setCargandoHistorial(true);
      try {
        const respuesta = await fetch(`/api/chat?session_id=${sesionId}`);
        if (respuesta.ok) {
          const data = await respuesta.json();
          if (data.mensajes && data.mensajes.length > 0) {
            setMensajes(data.mensajes);
          }
        }
      } catch (error) {
        console.error("Error cargando conversación:", error);
      } finally {
        setCargandoHistorial(false);
      }
    }
    
    cargarConversacion();
  }, [sesionId]);

  async function enviarMensaje(textoCustom) {
    const texto = (textoCustom || input).trim();
    if (!texto || enviando) return;

    const msgUsuario = {
      rol: "usuario",
      contenido: texto,
      timestamp: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, msgUsuario]);
    if (!textoCustom) setInput("");
    setEnviando(true);
    setMostrarBotonesTecnicas(false);
    setMostrarBotonesConfirmacion(false);
    setCandidatosActuales([]);
    setIndiceCandidato(0);
    setUltimaPregunta(texto);

    try {
      const respuesta = await chatApi.enviarMensaje(texto, sesionId);
      
      if (!sesionId && respuesta.session_id) {
        setSesionId(respuesta.session_id);
        localStorage.setItem("chat_session_id", respuesta.session_id);
      }
      
      setMensajes((prev) => [...prev, respuesta.mensaje]);
      
      const msgBot = respuesta.mensaje ;
      
      // Si hay candidatos, activar el flujo de confirmación
      if (msgBot.candidatos && msgBot.candidatos.length > 0) {
        setCandidatosActuales(msgBot.candidatos);
        setIndiceCandidato(0);
        setMostrarBotonesConfirmacion(true);
        if (msgBot.tema_sugerido) setTemaSugerido(msgBot.tema_sugerido);
      }
      
      // Si bot sugiere agregar (no encontró nada)
      if (msgBot.contenido.includes("No tengo información sobre")) {
        const match = msgBot.contenido.match(/\*\*"([^"]+)"\*\*/);
        if (match) setTemaSugerido(match[1]);
      }
      
      if (msgBot.mostrar_botones_tecnicas) {
        setMostrarBotonesTecnicas(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar mensaje");
      setMensajes((prev) => prev.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  }

  function mostrarTecnica(tipo) {
    const tecnica = TECNICAS_ESTUDIO[tipo];
    if (!tecnica) return;
    
    const mensajeBot = {
      rol: "asistente",
      contenido: `${tecnica.titulo}\n\n${tecnica.contenido}`,
      timestamp: new Date().toISOString(),
    };
    
    setMensajes((prev) => [...prev, mensajeBot]);
    setMostrarBotonesTecnicas(false);
  }

  // ====================================================
  // CONFIRMAR QUE SÍ ERA EL TEMA CORRECTO
  // ====================================================
  async function confirmarSiEsCorrecto() {
    const candidato = candidatosActuales[indiceCandidato];
    if (!candidato) return;

    // Marcar como confirmado
    const mensajeBot = {
      rol: "asistente",
      contenido: `✅ ¡Perfecto! Espero que la información te sea útil. Si tienes otra duda, pregúntame.`,
      timestamp: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, mensajeBot]);
    
    // Aprender de la confirmación
    if (ultimaPregunta) {
      try {
        const token = localStorage.getItem("schoolos_token");
        fetch("/api/temas/aprender", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            titulo: candidato.titulo,
            pregunta: ultimaPregunta,
          }),
        }).catch(() => {});
      } catch {}
    }
    
    // Limpiar estado
    setMostrarBotonesConfirmacion(false);
    setCandidatosActuales([]);
    setIndiceCandidato(0);
  }

  // ====================================================
  // MOSTRAR SIGUIENTE CANDIDATO
  // ====================================================
  function mostrarSiguienteCandidato() {
    const siguienteIndice = indiceCandidato + 1;
    
    // Si ya no hay más candidatos, ofrecer agregar
    if (siguienteIndice >= candidatosActuales.length) {
      const mensajeBot = {
        rol: "asistente",
        contenido: `😅 No encontré más temas que coincidan con tu búsqueda.\n\n¿Te gustaría **agregar** este tema? Haz click en el botón de abajo.`,
        timestamp: new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, mensajeBot]);
      setMostrarBotonesConfirmacion(false);
      // Mantenemos temaSugerido para el botón "Agregar tema"
      return;
    }

    // Mostrar el siguiente candidato
    const siguiente = candidatosActuales[siguienteIndice];
    const ejemplos = (siguiente.ejemplos )
      .map((e) => `   • ${e}`)
      .join("\n");
    
    let ejercicio = "";
    if (siguiente.ejercicios?.length > 0) {
      const ej = siguiente.ejercicios[0];
      if (ej.pregunta && ej.respuesta) {
        ejercicio = `\n\n**💡 Ejercicio:**\n${ej.pregunta}\n\n_Respuesta: ${ej.respuesta}_`;
      }
    }

    const numeroOpcion = siguienteIndice + 1;
    const contenido = `🤔 **¿Y esto era lo que buscabas?** (opción ${numeroOpcion} de ${candidatosActuales.length})\n\n📘 **${siguiente.titulo}**\n\n${siguiente.contenido}\n\n**Ejemplos:**\n${ejemplos}${ejercicio}\n\n📊 _Nivel: ${siguiente.nivel}_`;

    const mensajeBot = {
      rol: "asistente",
      contenido,
      timestamp: new Date().toISOString(),
    };
    
    setMensajes((prev) => [...prev, mensajeBot]);
    setIndiceCandidato(siguienteIndice);
  }

  function manejarKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  function nuevaConversacion() {
    setSesionId(undefined);
    localStorage.removeItem("chat_session_id");
    setMensajes([
      {
        rol: "asistente",
        contenido:
          "👋 Hola, soy **SchoolOS**. Puedo ayudarte a resolver dudas, gestionar tus tareas, organizar tu horario y recomendarte técnicas de estudio.\n\n💡 Escribe **\"ayuda\"** para ver todo lo que puedo hacer.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setMostrarBotonesTecnicas(false);
    setMostrarBotonesConfirmacion(false);
    setCandidatosActuales([]);
    setIndiceCandidato(0);
    toast.success("Nueva conversación iniciada");
  }

  const esMaestro = usuario?.rol === "maestro";
  const ultimoMensaje = mensajes[mensajes.length - 1];
  const mostrarBotonAgregar = ultimoMensaje?.contenido.includes("No encontré más temas") || 
                               ultimoMensaje?.contenido.includes("No tengo información sobre");

  return (
    _jsxs(_Fragment, { children: [
      _jsxs('div', { className: "glass rounded-2xl flex flex-col h-[calc(100vh-180px)] min-h-[500px]"     , children: [
        _jsxs('div', { className: "px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2"      , children: [
          _jsx('div', { className: "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"    ,} )
          , _jsx('span', { className: "text-sm font-medium" , children: "Asistente IA" })
          , _jsx('span', { className: "ml-auto text-xs text-gray-500"  , children: 
            sesionId ? "Memoria activa" : "Nueva sesion"
          })
          , sesionId && (
            _jsx('button', {
              onClick: nuevaConversacion,
              className: "text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"     ,
              title: "Iniciar nueva conversación"  ,
 children: "Nueva sesión"

            })
          )
        ]})

        , _jsxs('div', { className: "flex-1 overflow-y-auto px-5 py-4 space-y-4"    , children: [
          cargandoHistorial ? (
            _jsxs('div', { className: "flex items-center justify-center py-8 text-gray-500 text-sm"     , children: [
              _jsx(Sparkles, { className: "w-4 h-4 animate-spin mr-2"   ,} ), "Cargando conversación..."

            ]})
          ) : (
            _jsx(AnimatePresence, { initial: false, children: 
              mensajes.map((m, i) => (
                _jsx(Mensaje, { mensaje: m,}, i )
              ))
            })
          )

          /* Botones de técnicas de estudio */
          , mostrarBotonesTecnicas && !enviando && (
            _jsxs(motion.div, {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              className: "flex flex-wrap justify-center gap-2 pt-2"    ,
 children: [
              _jsx('button', {
                onClick: () => mostrarTecnica("concentracion"),
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors"            ,
 children: "😴 No puedo concentrarme"

              })
              , _jsx('button', {
                onClick: () => mostrarTecnica("memoria"),
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors"            ,
 children: "🤯 Se me olvida lo que estudio"

              })
              , _jsx('button', {
                onClick: () => mostrarTecnica("examen"),
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors"            ,
 children: "📚 Tengo examen pronto"

              })
              , _jsx('button', {
                onClick: () => mostrarTecnica("tiempo"),
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"            ,
 children: "⏰ No me da tiempo"

              })
              , _jsx('button', {
                onClick: () => mostrarTecnica("comprension"),
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"            ,
 children: "💡 Quiero entender mejor"

              })
            ]})
          )

          /* Botones de Sí / No para confirmar candidato */
          , mostrarBotonesConfirmacion && !enviando && (
            _jsxs(motion.div, {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              className: "flex justify-center gap-2 pt-2 flex-wrap"    ,
 children: [
              _jsx('button', {
                onClick: confirmarSiEsCorrecto,
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"           ,
 children: "✅ Sí, era esto"

              })
              , _jsx('button', {
                onClick: mostrarSiguienteCandidato,
                className: "text-sm flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 transition-colors"            ,
 children: "❌ No, mostrar otro"

              })
            ]})
          )

          /* Botón Agregar tema (cuando no hay más candidatos) */
          , mostrarBotonAgregar && !mostrarBotonesConfirmacion && !enviando && (
            _jsx(motion.div, {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              className: "flex justify-center pt-2"  ,
 children: 
              _jsxs('button', {
                onClick: () => setModalAbierto(true),
                className: "btn-primary text-sm flex items-center gap-2"    ,
 children: [
                _jsx(Plus, { className: "w-4 h-4" ,} ), "Agregar este tema"

              ]})
            })
          )

          , enviando && _jsx(IndicadorEscribiendo, {} )
          , _jsx('div', { ref: finRef,} )
        ]})

        , _jsx('div', { className: "border-t border-white/[0.06] p-3"  , children: 
          _jsxs('div', { className: "flex gap-2 items-end"  , children: [
            _jsx('textarea', {
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: manejarKeyDown,
              placeholder: "Preguntame lo que sea..."   ,
              rows: 1,
              className: "input-glass resize-none max-h-32"  ,
              disabled: enviando,}
            )
            , _jsx('button', {
              onClick: () => enviarMensaje(),
              disabled: enviando || !input.trim(),
              className: "btn-primary p-2.5 aspect-square"  ,
              'aria-label': "Enviar",
 children: 
              _jsx(Send, { className: "w-4 h-4" ,} )
            })
          ]})
        })
      ]})

      , _jsx(AgregarTemaModal, {
        abierto: modalAbierto,
        onCerrar: () => setModalAbierto(false),
        temaSugerido: temaSugerido,
        esMaestro: esMaestro,}
      )
    ]})
  );
}

function Mensaje({ mensaje }) {
  const esUsuario = mensaje.rol === "usuario";
  return (
    _jsxs(motion.div, {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25 },
      className: `flex gap-3 ${esUsuario ? "justify-end" : ""}`,
 children: [
      !esUsuario && (
        _jsx('div', { className: "flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/20"           , children: 
          _jsx(Bot, { className: "w-4 h-4 text-white"  ,} )
        })
      )
      , _jsx('div', {
        className: `max-w-[78%] rounded-2xl px-4 py-2.5 ${
          esUsuario
            ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white"
            : "glass"
        }`,
 children: 
        _jsx(MathRenderer, { contenido: mensaje.contenido,} )
      })
      , esUsuario && (
        _jsx('div', { className: "flex-shrink-0 w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center"         , children: 
          _jsx(UserIcon, { className: "w-4 h-4 text-gray-300"  ,} )
        })
      )
    ]})
  );
}

function IndicadorEscribiendo() {
  return (
    _jsxs(motion.div, {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      className: "flex gap-3" ,
 children: [
      _jsx('div', { className: "w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center"        , children: 
        _jsx(Sparkles, { className: "w-4 h-4 text-white animate-pulse"   ,} )
      })
      , _jsx('div', { className: "glass rounded-2xl px-4 py-3 flex gap-1.5 items-center"      , children: 
        [0, 1, 2].map((i) => (
          _jsx(motion.span, {

            className: "w-1.5 h-1.5 rounded-full bg-white/60"   ,
            animate: { y: [0, -4, 0] },
            transition: {
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            },}, i
          )
        ))
      })
    ]})
  );
}