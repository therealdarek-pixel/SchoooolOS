"use client";
import {jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment} from "react/jsx-runtime";/**
 * components/TareasList.tsx
 * Lista de tareas resueltas del alumno actual.
 * Muestra cada tarea como una card expandible con LaTeX y nota (si aplica).
 */


import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Star, Calendar } from "lucide-react";
import { tareasApi } from "@/lib/api-client";
import { formatearFecha } from "@/lib/utils";

import MathRenderer from "./MathRenderer";

export default function TareasList() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    tareasApi
      .listarMisTareas()
      .then(setTareas)
      .catch((e) => console.error(e))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      _jsx('div', { className: "glass rounded-2xl p-8 text-center text-gray-400"    , children: "Cargando..."

      })
    );
  }

  if (tareas.length === 0) {
    return (
      _jsxs('div', { className: "glass rounded-2xl p-12 text-center"   , children: [
        _jsx(BookOpen, { className: "w-10 h-10 mx-auto mb-3 text-gray-500"    ,} )
        , _jsx('p', { className: "text-gray-400", children: "Aun no has subido ninguna tarea."     })
        , _jsx('p', { className: "text-xs text-gray-500 mt-1"  , children: "Ve al chat y sube una imagen para empezar."

        })
      ]})
    );
  }

  return (
    _jsxs('div', { className: "space-y-3", children: [
      _jsxs('div', { className: "flex items-center justify-between"  , children: [
        _jsx('h2', { className: "text-lg font-semibold" , children: "Mis Tareas" })
        , _jsxs('span', { className: "text-xs text-gray-500" , children: [tareas.length, " tarea(s)" ]})
      ]})

      , tareas.map((t) => (
        _jsxs(motion.div, { layout: true, className: "glass rounded-2xl overflow-hidden"  , children: [
          _jsxs('button', {
            onClick: () => setExpandido(expandido === t._id ? null : t._id),
            className: "w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"       ,
 children: [
            _jsxs('div', { className: "flex-1 min-w-0" , children: [
              _jsx('h3', { className: "font-medium truncate" , children: 
                t.solucion?.titulo || "Tarea sin título"
              })
              , _jsxs('div', { className: "flex flex-wrap gap-3 mt-1 text-xs text-gray-500"     , children: [
                _jsxs('span', { className: "flex items-center gap-1"  , children: [
                  _jsx(BookOpen, { className: "w-3 h-3" ,} )
                  , t.solucion?.materia || "Sin materia"
                ]})
                , _jsxs('span', { className: "flex items-center gap-1"  , children: [
                  _jsx(Calendar, { className: "w-3 h-3" ,} )
                  , formatearFecha(t.fecha_creacion)
                ]})
              ]})
            ]})

            , t.nota !== null && t.nota !== undefined && (
              _jsxs('div', { className: "flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300"         , children: [
                _jsx(Star, { className: "w-3.5 h-3.5 fill-current"  ,} )
                , _jsx('span', { className: "font-semibold text-sm" , children: t.nota.toFixed(1)})
              ]})
            )

            , _jsx(motion.div, { animate: { rotate: expandido === t._id ? 180 : 0 }, children: 
              _jsx(ChevronDown, { className: "w-4 h-4 text-gray-400"  ,} )
            })
          ]})

          , _jsx(AnimatePresence, { children: 
            expandido === t._id && (
              _jsx(motion.div, {
                initial: { height: 0, opacity: 0 },
                animate: { height: "auto", opacity: 1 },
                exit: { height: 0, opacity: 0 },
                transition: { duration: 0.25 },
                className: "overflow-hidden",
 children: 
                _jsxs('div', { className: "px-5 pb-5 pt-1 border-t border-white/[0.05]"    , children: [
                  t.descripcion_texto && (
                    _jsxs('p', { className: "text-sm text-gray-400 italic mb-3 mt-3"    , children: ["\""
                      , t.descripcion_texto, "\""
                    ]})
                  )

                  , t.solucion?.pasos && t.solucion.pasos.length > 0 && (
                    _jsxs(_Fragment, { children: [
                      _jsx('h4', { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-3"      , children: "Pasos"

                      })
                      , _jsx('ol', { className: "space-y-2", children: 
                        t.solucion.pasos.map((paso, i) => (
                          _jsxs('li', { className: "flex gap-3" , children: [
                            _jsx('span', { className: "flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium flex items-center justify-center"          , children: 
                              i + 1
                            })
                            , _jsx('div', { className: "flex-1 pt-0.5" , children: 
                              _jsx(MathRenderer, { contenido: paso,} )
                            })
                          ]}, i)
                        ))
                      })
                    ]})
                  )

                  , t.solucion?.respuesta_final && (
                    _jsxs('div', { className: "mt-4 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20"     , children: [
                      _jsx('p', { className: "text-xs font-semibold text-emerald-400 mb-1"   , children: "RESPUESTA FINAL"

                      })
                      , _jsx(MathRenderer, { contenido: t.solucion.respuesta_final,} )
                    ]})
                  )

                  , !t.solucion && (
                    _jsx('p', { className: "text-sm text-gray-500 italic mt-3"   , children: "Esta tarea no tiene solución registrada."

                    })
                  )
                ]})
              })
            )
          })
        ]}, t._id)
      ))
    ]})
  );
}