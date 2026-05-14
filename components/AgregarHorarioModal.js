"use client";
import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";







export default function AgregarHorarioModal({
  abierto,
  onCerrar,
  onAgregado,
}) {
  const [codigoMateria, setCodigoMateria] = useState("BD-REL");
  const [dia, setDia] = useState("lunes");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("09:30");
  const [aula, setAula] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!horaInicio || !horaFin) {
      toast.error("Las horas son obligatorias");
      return;
    }

    if (horaInicio >= horaFin) {
      toast.error("La hora de fin debe ser después de la hora de inicio");
      return;
    }

    setEnviando(true);
    try {
      const token = localStorage.getItem("schoolos_token");
      const respuesta = await fetch("/api/horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo_materia: codigoMateria,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          aula: aula.trim() || null,
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        toast.success(data.mensaje);
        // Resetear formulario
        setAula("");
        onAgregado();
      } else {
        toast.error(data.detail || "Error al agregar clase");
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
            className: "glass rounded-2xl w-full max-w-md"   ,
            onClick: (e) => e.stopPropagation(),
 children: [
            /* Header */
            _jsxs('div', { className: "px-6 py-4 border-b border-white/[0.06] flex items-center justify-between"      , children: [
              _jsxs('div', { className: "flex items-center gap-3"  , children: [
                _jsx('div', { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center"        , children: 
                  _jsx(Calendar, { className: "w-5 h-5 text-white"  ,} )
                })
                , _jsxs('div', { children: [
                  _jsx('h2', { className: "font-semibold", children: "Agregar clase" })
                  , _jsx('p', { className: "text-xs text-gray-500" , children: "Llena los datos de tu clase"

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
                  value: codigoMateria,
                  onChange: (e) => setCodigoMateria(e.target.value),
                  className: "input-glass",
 children: [
                  _jsx('option', { value: "BD-REL", children: "📊 Bases de Datos Relacionales"    })
                  , _jsx('option', { value: "BD-NOSQL", children: "🗄️ Bases de Datos NoSQL"    })
                  , _jsx('option', { value: "ENG", children: "🇬🇧 Inglés" })
                ]})
              ]})

              /* Día */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Día *"

                })
                , _jsxs('select', {
                  value: dia,
                  onChange: (e) => setDia(e.target.value),
                  className: "input-glass",
 children: [
                  _jsx('option', { value: "lunes", children: "🔵 Lunes" })
                  , _jsx('option', { value: "martes", children: "🟢 Martes" })
                  , _jsx('option', { value: "miercoles", children: "🟡 Miércoles" })
                  , _jsx('option', { value: "jueves", children: "🟠 Jueves" })
                  , _jsx('option', { value: "viernes", children: "🔴 Viernes" })
                  , _jsx('option', { value: "sabado", children: "🟣 Sábado" })
                  , _jsx('option', { value: "domingo", children: "⚪ Domingo" })
                ]})
              ]})

              /* Horas */
              , _jsxs('div', { className: "grid grid-cols-2 gap-3"  , children: [
                _jsxs('div', { children: [
                  _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Hora inicio *"

                  })
                  , _jsx('input', {
                    type: "time",
                    value: horaInicio,
                    onChange: (e) => setHoraInicio(e.target.value),
                    className: "input-glass",}
                  )
                ]})
                , _jsxs('div', { children: [
                  _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Hora fin *"

                  })
                  , _jsx('input', {
                    type: "time",
                    value: horaFin,
                    onChange: (e) => setHoraFin(e.target.value),
                    className: "input-glass",}
                  )
                ]})
              ]})

              /* Aula */
              , _jsxs('div', { children: [
                _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-1.5"    , children: "Aula (opcional)"

                })
                , _jsx('input', {
                  type: "text",
                  value: aula,
                  onChange: (e) => setAula(e.target.value),
                  placeholder: "Ej: A-201" ,
                  className: "input-glass",
                  maxLength: 50,}
                )
              ]})
            ]})

            /* Footer */
            , _jsxs('div', { className: "px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2"      , children: [
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
                _jsx(Plus, { className: "w-4 h-4" ,} )
                , enviando ? "Agregando..." : "Agregar clase"
              ]})
            ]})
          ]})
        })
      )
    })
  );
}