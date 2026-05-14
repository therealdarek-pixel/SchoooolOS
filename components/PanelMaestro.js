"use client";
import {jsxs as _jsxs, jsx as _jsx} from "react/jsx-runtime";/**
 * components/PanelMaestro.tsx
 * Panel exclusivo de maestros:
 * - Tab "Tareas": ver todas las tareas y calificar
 * - Tab "Pendientes": revisar temas enviados por alumnos
 */


import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Save,
  ShieldCheck,
  User,
  CheckCircle,
  XCircle,
  BookOpen,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { tareasApi } from "@/lib/api-client";
import { formatearFecha } from "@/lib/utils";


















export default function PanelMaestro() {
  const [tabActivo, setTabActivo] = useState("tareas");
  const [tareas, setTareas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [notaInput, setNotaInput] = useState("");
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    if (tabActivo === "tareas") cargarTareas();
    else cargarPendientes();
  }, [tabActivo]);

  async function cargarTareas() {
    setCargando(true);
    try {
      const data = await tareasApi.listarTodas();
      setTareas(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando tareas");
    } finally {
      setCargando(false);
    }
  }

  async function cargarPendientes() {
    setCargando(true);
    try {
      const token = localStorage.getItem("schoolos_token");
      const res = await fetch("/api/temas/pendientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar pendientes");
      const data = await res.json();
      setPendientes(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando pendientes");
    } finally {
      setCargando(false);
    }
  }

  async function guardarNota(tareaId) {
    const nota = parseFloat(notaInput);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      toast.error("La nota debe estar entre 0 y 10");
      return;
    }
    try {
      const actualizada = await tareasApi.actualizarNota(tareaId, nota);
      setTareas((prev) => prev.map((t) => (t._id === tareaId ? actualizada : t)));
      setEditando(null);
      setNotaInput("");
      toast.success(`Nota guardada: ${nota.toFixed(1)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando nota");
    }
  }

  async function aprobarTema(temaId) {
    try {
      const token = localStorage.getItem("schoolos_token");
      const res = await fetch(`/api/temas/${temaId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al aprobar");
      
      toast.success(data.mensaje);
      setPendientes((prev) => prev.filter((t) => t._id !== temaId));
      
      // Notificar a Python para recargar embeddings
      try {
        await fetch("http://127.0.0.1:8000/recargar", { method: "POST" });
      } catch {}
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    }
  }

  async function rechazarTema(temaId) {
    if (!confirm("¿Estás seguro de rechazar este tema? Se eliminará permanentemente.")) {
      return;
    }
    try {
      const token = localStorage.getItem("schoolos_token");
      const res = await fetch(`/api/temas/${temaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al rechazar");
      
      toast.success(data.mensaje);
      setPendientes((prev) => prev.filter((t) => t._id !== temaId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al rechazar");
    }
  }

  return (
    _jsxs('div', { className: "space-y-4", children: [
      /* Header */
      _jsxs('div', { className: "glass rounded-2xl p-4 flex items-center gap-3"     , children: [
        _jsx(ShieldCheck, { className: "w-5 h-5 text-accent-400"  ,} )
        , _jsxs('div', { className: "flex-1", children: [
          _jsx('h2', { className: "font-semibold", children: "Panel de Maestro"  })
          , _jsx('p', { className: "text-xs text-gray-500" , children: "Gestiona tareas de alumnos y aprueba temas pendientes."

          })
        ]})
      ]})

      /* Tabs */
      , _jsxs('div', { className: "flex gap-2 border-b border-white/[0.06]"   , children: [
        _jsx(TabBtn, {
          activo: tabActivo === "tareas",
          onClick: () => setTabActivo("tareas"),
          icono: _jsx(FileText, { className: "w-4 h-4" ,} ),
          label: "Tareas",
          contador: tareas.length,}
        )
        , _jsx(TabBtn, {
          activo: tabActivo === "pendientes",
          onClick: () => setTabActivo("pendientes"),
          icono: _jsx(Clock, { className: "w-4 h-4" ,} ),
          label: "Temas pendientes" ,
          contador: pendientes.length,
          alerta: pendientes.length > 0,}
        )
      ]})

      /* Contenido */
      , cargando ? (
        _jsx('div', { className: "glass rounded-2xl p-8 text-center text-gray-400"    , children: "Cargando..."

        })
      ) : tabActivo === "tareas" ? (
        // ─── TAREAS ───
        tareas.length === 0 ? (
          _jsx('div', { className: "glass rounded-2xl p-12 text-center text-gray-400"    , children: "No hay tareas registradas todavía."

          })
        ) : (
          _jsx('div', { className: "grid gap-3" , children: 
            tareas.map((t) => (
              _jsxs(motion.div, {

                layout: true,
                className: "glass rounded-2xl p-4 flex items-center gap-4"     ,
 children: [
                _jsx('div', { className: "flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center"         , children: 
                  _jsx(User, { className: "w-4 h-4 text-gray-400"  ,} )
                })

                , _jsxs('div', { className: "flex-1 min-w-0" , children: [
                  _jsx('h3', { className: "font-medium truncate" , children: t.solucion?.titulo || "Sin título"})
                  , _jsxs('div', { className: "flex flex-wrap gap-3 mt-0.5 text-xs text-gray-500"     , children: [
                    _jsx('span', { children: t.solucion?.materia || "Sin materia"})
                    , _jsx('span', { children: "•"})
                    , _jsxs('span', { children: ["Alumno: " , t.user_id.slice(-6)]})
                    , _jsx('span', { children: "•"})
                    , _jsx('span', { children: formatearFecha(t.fecha_creacion)})
                  ]})
                ]})

                , editando === t._id ? (
                  _jsxs('div', { className: "flex items-center gap-2"  , children: [
                    _jsx('input', {
                      type: "number",
                      min: 0,
                      max: 10,
                      step: 0.1,
                      value: notaInput,
                      onChange: (e) => setNotaInput(e.target.value),
                      placeholder: "0-10",
                      autoFocus: true,
                      className: "input-glass !w-20 !py-1.5 text-sm"   ,}
                    )
                    , _jsxs('button', {
                      onClick: () => guardarNota(t._id),
                      className: "btn-primary !py-1.5 !px-3 text-xs"   ,
 children: [
                      _jsx(Save, { className: "w-3.5 h-3.5" ,} ), "Guardar"

                    ]})
                    , _jsx('button', {
                      onClick: () => {
                        setEditando(null);
                        setNotaInput("");
                      },
                      className: "btn-ghost !py-1.5 !px-2 text-xs"   ,
 children: "Cancelar"

                    })
                  ]})
                ) : (
                  _jsxs('button', {
                    onClick: () => {
                      setEditando(t._id);
                      setNotaInput(t.nota?.toString() || "");
                    },
                    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      t.nota !== null && t.nota !== undefined
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15"
                        : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200"
                    }`,
 children: [
                    _jsx(Star, {
                      className: `w-3.5 h-3.5 ${
                        t.nota !== null && t.nota !== undefined ? "fill-current" : ""
                      }`,}
                    )
                    , t.nota !== null && t.nota !== undefined
                      ? t.nota.toFixed(1)
                      : "Calificar"
                  ]})
                )
              ]}, t._id)
            ))
          })
        )
      ) : (
        // ─── PENDIENTES ───
        pendientes.length === 0 ? (
          _jsxs('div', { className: "glass rounded-2xl p-12 text-center"   , children: [
            _jsx(CheckCircle, { className: "w-10 h-10 mx-auto mb-3 text-emerald-500"    ,} )
            , _jsx('p', { className: "text-gray-400", children: "¡Todo al día!"  })
            , _jsx('p', { className: "text-xs text-gray-500 mt-1"  , children: "No hay temas pendientes de revisión."

            })
          ]})
        ) : (
          _jsx('div', { className: "grid gap-3" , children: 
            pendientes.map((t) => (
              _jsx(motion.div, { layout: true, className: "glass rounded-2xl overflow-hidden"  , children: 
                _jsxs('div', { className: "p-4", children: [
                  _jsxs('div', { className: "flex items-start gap-3 mb-3"   , children: [
                    _jsx('div', { className: "flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"         , children: 
                      _jsx(BookOpen, { className: "w-4 h-4 text-amber-400"  ,} )
                    })
                    , _jsxs('div', { className: "flex-1 min-w-0" , children: [
                      _jsx('h3', { className: "font-medium", children: t.titulo})
                      , _jsxs('div', { className: "flex flex-wrap gap-3 mt-0.5 text-xs text-gray-500"     , children: [
                        _jsx('span', { className: "px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400"    , children: 
                          t.materia
                        })
                        , _jsxs('span', { children: ["Por: " , t.creado_por_nombre, " (" , t.creado_por_rol, ")"]})
                        , _jsx('span', { children: "•"})
                        , _jsx('span', { children: formatearFecha(t.fecha_creacion)})
                      ]})
                    ]})
                  ]})

                  , _jsx('button', {
                    onClick: () => setExpandido(expandido === t._id ? null : t._id),
                    className: "text-xs text-brand-400 hover:text-brand-300 transition-colors"   ,
 children: 
                    expandido === t._id ? "Ocultar detalles ▲" : "Ver detalles ▼"
                  })

                  , expandido === t._id && (
                    _jsxs(motion.div, {
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: "auto" },
                      className: "mt-3 space-y-3 text-sm"  ,
 children: [
                      _jsxs('div', { children: [
                        _jsx('p', { className: "text-xs font-semibold text-gray-400 uppercase mb-1"    , children: "Contenido"

                        })
                        , _jsx('p', { className: "text-gray-300 whitespace-pre-wrap" , children: t.contenido})
                      ]})

                      , t.palabras_clave.length > 0 && (
                        _jsxs('div', { children: [
                          _jsx('p', { className: "text-xs font-semibold text-gray-400 uppercase mb-1"    , children: "Palabras clave"

                          })
                          , _jsx('div', { className: "flex flex-wrap gap-1.5"  , children: 
                            t.palabras_clave.map((p, i) => (
                              _jsx('span', {

                                className: "px-2 py-0.5 rounded-md bg-white/[0.05] text-xs text-gray-300"     ,
 children: 
                                p
                              }, i)
                            ))
                          })
                        ]})
                      )

                      , t.ejemplos.length > 0 && (
                        _jsxs('div', { children: [
                          _jsx('p', { className: "text-xs font-semibold text-gray-400 uppercase mb-1"    , children: "Ejemplos"

                          })
                          , _jsx('ul', { className: "space-y-1 text-gray-300" , children: 
                            t.ejemplos.map((ej, i) => (
                              _jsxs('li', { className: "text-xs", children: ["• " , ej]}, i)
                            ))
                          })
                        ]})
                      )

                      , _jsxs('div', { className: "text-xs text-gray-500" , children: ["Nivel: "
                         , _jsx('span', { className: "text-gray-300 capitalize" , children: t.nivel})
                      ]})
                    ]})
                  )

                  , _jsxs('div', { className: "flex gap-2 mt-4 pt-3 border-t border-white/[0.05]"     , children: [
                    _jsxs('button', {
                      onClick: () => aprobarTema(t._id),
                      className: "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 text-sm font-medium transition-colors"              ,
 children: [
                      _jsx(CheckCircle, { className: "w-4 h-4" ,} ), "Aprobar"

                    ]})
                    , _jsxs('button', {
                      onClick: () => rechazarTema(t._id),
                      className: "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/15 text-sm font-medium transition-colors"              ,
 children: [
                      _jsx(XCircle, { className: "w-4 h-4" ,} ), "Rechazar"

                    ]})
                  ]})
                ]})
              }, t._id)
            ))
          })
        )
      )
    ]})
  );
}

function TabBtn({
  activo,
  onClick,
  icono,
  label,
  contador,
  alerta,
}






) {
  return (
    _jsxs('button', {
      onClick: onClick,
      className: `relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        activo ? "text-white" : "text-gray-400 hover:text-gray-200"
      }`,
 children: [
      icono
      , label
      , contador > 0 && (
        _jsx('span', {
          className: `text-xs px-1.5 py-0.5 rounded-md ${
            alerta
              ? "bg-amber-500/20 text-amber-300"
              : "bg-white/[0.06] text-gray-400"
          }`,
 children: 
          contador
        })
      )
      , activo && (
        _jsx(motion.div, {
          layoutId: "panel-tab-indicator",
          className: "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-accent-500"       ,}
        )
      )
    ]})
  );
}