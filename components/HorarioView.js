"use client";
import {jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment} from "react/jsx-runtime";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import AgregarHorarioModal from "./AgregarHorarioModal";












const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const NOMBRES_DIAS = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};
const COLORES_DIAS = {
  lunes: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  martes: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  miercoles: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  jueves: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  viernes: "from-red-500/20 to-red-600/10 border-red-500/30",
  sabado: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  domingo: "from-gray-500/20 to-gray-600/10 border-gray-500/30",
};

export default function HorarioView() {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    cargarHorarios();
  }, []);

  async function cargarHorarios() {
    setCargando(true);
    try {
      const token = localStorage.getItem("schoolos_token");
      const res = await fetch("/api/horarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar horarios");
      const data = await res.json();
      setHorarios(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando horarios");
    } finally {
      setCargando(false);
    }
  }

  async function eliminarClase(id) {
    if (!confirm("¿Estás seguro de eliminar esta clase?")) return;
    
    try {
      const token = localStorage.getItem("schoolos_token");
      const res = await fetch(`/api/horarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar");
      
      toast.success(data.mensaje);
      setHorarios((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  function onClaseAgregada() {
    setModalAbierto(false);
    cargarHorarios();
  }

  // Agrupar por día
  const horariosPorDia = ORDEN_DIAS.reduce((acc, dia) => {
    acc[dia] = horarios
      .filter((h) => h.dia === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    return acc;
  }, {} );

  if (cargando) {
    return (
      _jsx('div', { className: "glass rounded-2xl p-8 text-center text-gray-400"    , children: "Cargando horario..."

      })
    );
  }

  return (
    _jsxs(_Fragment, { children: [
      _jsxs('div', { className: "space-y-4", children: [
        /* Header */
        _jsxs('div', { className: "glass rounded-2xl p-4 flex items-center gap-3"     , children: [
          _jsx(Calendar, { className: "w-5 h-5 text-brand-400"  ,} )
          , _jsxs('div', { className: "flex-1", children: [
            _jsx('h2', { className: "font-semibold", children: "Mi Horario" })
            , _jsx('p', { className: "text-xs text-gray-500" , children: "Organiza tus clases de la semana"

            })
          ]})
          , _jsxs('button', {
            onClick: () => setModalAbierto(true),
            className: "btn-primary text-sm flex items-center gap-2"    ,
 children: [
            _jsx(Plus, { className: "w-4 h-4" ,} ), "Agregar clase"

          ]})
        ]})

        /* Vista por días */
        , horarios.length === 0 ? (
          _jsxs('div', { className: "glass rounded-2xl p-12 text-center"   , children: [
            _jsx(Calendar, { className: "w-10 h-10 mx-auto mb-3 text-gray-500"    ,} )
            , _jsx('p', { className: "text-gray-400", children: "Aún no tienes clases en tu horario."      })
            , _jsx('p', { className: "text-xs text-gray-500 mt-1"  , children: "Click en \"Agregar clase\" para empezar."

            })
          ]})
        ) : (
          _jsx('div', { className: "grid gap-3" , children: 
            ORDEN_DIAS.map((dia) => {
              const clases = horariosPorDia[dia];
              if (clases.length === 0) return null;

              return (
                _jsxs(motion.div, {

                  layout: true,
                  className: `rounded-2xl border bg-gradient-to-br ${COLORES_DIAS[dia]} p-4`,
 children: [
                  _jsx('h3', { className: "font-semibold text-sm mb-3 capitalize"   , children: 
                    NOMBRES_DIAS[dia]
                  })
                  , _jsx('div', { className: "space-y-2", children: 
                    _jsx(AnimatePresence, { children: 
                      clases.map((clase) => (
                        _jsxs(motion.div, {

                          layout: true,
                          initial: { opacity: 0, x: -10 },
                          animate: { opacity: 1, x: 0 },
                          exit: { opacity: 0, x: 10 },
                          className: "glass rounded-xl p-3 flex items-center gap-3 group"      ,
 children: [
                          _jsx('span', { className: "text-2xl", children: clase.materia_icono})
                          , _jsxs('div', { className: "flex-1 min-w-0" , children: [
                            _jsx('p', { className: "font-medium text-sm truncate"  , children: 
                              clase.materia_nombre
                            })
                            , _jsxs('div', { className: "flex items-center gap-3 mt-0.5 text-xs text-gray-400"     , children: [
                              _jsxs('span', { className: "flex items-center gap-1"  , children: [
                                _jsx(Clock, { className: "w-3 h-3" ,} )
                                , clase.hora_inicio, " - "  , clase.hora_fin
                              ]})
                              , clase.aula && (
                                _jsxs('span', { className: "flex items-center gap-1"  , children: [
                                  _jsx(MapPin, { className: "w-3 h-3" ,} )
                                  , clase.aula
                                ]})
                              )
                            ]})
                          ]})
                          , _jsx('button', {
                            onClick: () => eliminarClase(clase._id),
                            className: "opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-500/10 text-red-400"      ,
                            title: "Eliminar clase" ,
 children: 
                            _jsx(Trash2, { className: "w-4 h-4" ,} )
                          })
                        ]}, clase._id)
                      ))
                    })
                  })
                ]}, dia)
              );
            })
          })
        )
      ]})

      /* Modal */
      , _jsx(AgregarHorarioModal, {
        abierto: modalAbierto,
        onCerrar: () => setModalAbierto(false),
        onAgregado: onClaseAgregada,}
      )
    ]})
  );
}