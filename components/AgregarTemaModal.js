"use client";
import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, BookOpen } from "lucide-react";
import { toast } from "sonner";








export default function AgregarTemaModal({
  abierto,
  onCerrar,
  temaSugerido = "",
  esMaestro,
}) {
  const [materia, setMateria] = useState("BD-REL");
  const [titulo, setTitulo] = useState(temaSugerido);
  const [contenido, setContenido] = useState("");
  const [palabrasClave, setPalabrasClave] = useState("");
  const [ejemplos, setEjemplos] = useState("");
  const [nivel, setNivel] = useState("basico");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!titulo.trim() || !contenido.trim()) {
      toast.error("El título y contenido son obligatorios");
      return;
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem("schoolos_token");
      const respuesta = await fetch("/api/temas/agregar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materia,
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          palabras_clave: palabrasClave
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0),
          ejemplos: ejemplos
            .split("\n")
            .map((e) => e.trim())
            .filter((e) => e.length > 0),
          nivel,
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success(data.mensaje);
        // Resetear formulario
        setTitulo("");
        setContenido("");
        setPalabrasClave("");
        setEjemplos("");
        setNivel("basico");
        onCerrar();
      } else {
        toast.error(data.detail || "Error al agregar el tema");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    _jsx(AnimatePresence, { children: 
      abierto && (
        _jsx(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"        ,
          onClick: onCerrar,
 children: 
          _jsxs(motion.div, {
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
            transition: { duration: 0.2 },
            className: "glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"     ,
            onClick: (e) => e.stopPropagation(),
 children: [
            /* Header */
            _jsxs('div', { className: "px-6 py-4 border-b border-white/[0.06] flex items-center justify-between sticky top-0 glass z-10"          , children: [
              _jsxs('div', { className: "flex items-center gap-3"  , children: [
                _jsx('div', { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center"        , children: 
                  _jsx(BookOpen, { className: "w-5 h-5 text-white"  ,} )
                })
                , _jsxs('div', { children: [
                  _jsx('h2', { className: "font-semibold", children: "Agregar nuevo tema"  })
                  , _jsx('p', { className: "text-xs text-gray-500" , children: 
                    esMaestro
                      ? "Se publicará inmediatamente"
                      : "Se enviará al maestro para revisión"
                  })
                ]})
              ]})
              , _jsx('button', {
                onClick: onCerrar,
                className: "btn-ghost p-2" ,
                'aria-label': "Cerrar",
 children: 
                _jsx(X, { className: "w-4 h-4" ,} )
              })
            ]})

            /* Formulario */
            , _jsxs('div', { className: "p-6 space-y-4" , children: [
              /* Materia */
              _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Materia *"

                })
                , _jsxs('select', {
                  value: materia,
                  onChange: (e) => setMateria(e.target.value),
                  className: "input-glass",
 children: [
                  _jsx('option', { value: "BD-REL", children: "📊 Bases de Datos Relacionales"    })
                  , _jsx('option', { value: "BD-NOSQL", children: "🗄️ Bases de Datos NoSQL"    })
                  , _jsx('option', { value: "ENG", children: "🇬🇧 Inglés" })
                ]})
              ]})

              /* Título */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Título *"

                })
                , _jsx('input', {
                  type: "text",
                  value: titulo,
                  onChange: (e) => setTitulo(e.target.value),
                  placeholder: "Ej: Triggers en SQL"   ,
                  className: "input-glass",
                  maxLength: 150,}
                )
              ]})

              /* Contenido */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Contenido / Explicación *"

                })
                , _jsx('textarea', {
                  value: contenido,
                  onChange: (e) => setContenido(e.target.value),
                  placeholder: "Explica el concepto con tus propias palabras..."      ,
                  rows: 6,
                  className: "input-glass resize-none" ,}
                )
                , _jsx('p', { className: "text-xs text-gray-500 mt-1"  , children: "Mínimo 50 caracteres. Sé claro y didáctico."

                })
              ]})

              /* Palabras clave */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Palabras clave (separadas por coma)"

                })
                , _jsx('input', {
                  type: "text",
                  value: palabrasClave,
                  onChange: (e) => setPalabrasClave(e.target.value),
                  placeholder: "trigger, disparador, evento, automatico"   ,
                  className: "input-glass",}
                )
              ]})

              /* Ejemplos */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Ejemplos (uno por línea)"

                })
                , _jsx('textarea', {
                  value: ejemplos,
                  onChange: (e) => setEjemplos(e.target.value),
                  placeholder: "CREATE TRIGGER actualiza_stock...\nCREATE TRIGGER log_cambios..."    ,
                  rows: 3,
                  className: "input-glass resize-none" ,}
                )
              ]})

              /* Nivel */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Nivel"

                })
                , _jsxs('select', {
                  value: nivel,
                  onChange: (e) => setNivel(e.target.value),
                  className: "input-glass",
 children: [
                  _jsx('option', { value: "basico", children: "🟢 Básico" })
                  , _jsx('option', { value: "intermedio", children: "🟡 Intermedio" })
                  , _jsx('option', { value: "avanzado", children: "🔴 Avanzado" })
                ]})
              ]})
            ]})

            /* Footer */
            , _jsxs('div', { className: "px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2 sticky bottom-0 glass"         , children: [
              _jsx('button', {
                onClick: onCerrar,
                className: "btn-ghost text-sm" ,
                disabled: enviando,
 children: "Cancelar"

              })
              , _jsxs('button', {
                onClick: enviar,
                disabled: enviando,
                className: "btn-primary text-sm" ,
 children: [
                _jsx(Send, { className: "w-4 h-4" ,} )
                , enviando ? "Enviando..." : esMaestro ? "Publicar" : "Enviar para revisión"
              ]})
            ]})
          ]})
        })
      )
    })
  );
}