"use client";

/**
 * components/TareasList.js
 * Muestra la lista de tareas del alumno actual.
 * - Cada tarea aparece como una "card" que se puede expandir.
 * - Hay chips para filtrar por materia.
 * - Cada tarea se puede eliminar con un modal de confirmacion.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BookOpen,
  Star,
  Calendar,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { tareasApi } from "@/lib/api-client";
import { formatearFecha } from "@/lib/utils";

import MathRenderer from "./MathRenderer";

// Valor especial que usamos cuando queremos ver TODAS las materias.
// Lo guardamos como string porque null da problemas con React.
const FILTRO_TODAS = "__todas__";

export default function TareasList() {
  // ---- ESTADOS ----
  const [tareas, setTareas] = useState([]);             // lista de tareas
  const [cargando, setCargando] = useState(true);       // bandera de loading
  const [expandido, setExpandido] = useState(null);     // id de la tarea abierta
  const [filtroMateria, setFiltroMateria] = useState(FILTRO_TODAS); // chip activo
  const [confirmacionBorrar, setConfirmacionBorrar] = useState(null); // modal borrar

  // Al montar el componente, cargamos las tareas del usuario.
  useEffect(() => {
    tareasApi
      .listarMisTareas()
      .then(setTareas)
      .catch((e) => {
        console.error(e);
        toast.error("Error cargando tareas");
      })
      .finally(() => setCargando(false));
  }, []);

  // Lista de materias que aparecen en las tareas (sin repetir, ordenadas).
  // No la hardcodeamos: si manyana hay una materia nueva, sale sola.
  const materiasDisponibles = useMemo(() => {
    const set = new Set();
    for (const t of tareas) {
      const m = t.solucion?.materia;
      if (m) set.add(m);
    }
    return Array.from(set).sort();
  }, [tareas]);

  // Tareas que se ven en pantalla segun el chip seleccionado.
  const tareasFiltradas = useMemo(() => {
    if (filtroMateria === FILTRO_TODAS) return tareas;
    return tareas.filter((t) => t.solucion?.materia === filtroMateria);
  }, [tareas, filtroMateria]);

  // Se llama cuando el usuario aprieta "Eliminar" en el modal de confirmacion.
  async function eliminarConfirmado() {
    if (!confirmacionBorrar) return;
    const id = confirmacionBorrar._id;
    try {
      // Llamamos a la API.
      const data = await tareasApi.eliminar(id);
      toast.success(data.mensaje || "Tarea eliminada");
      // Sacamos la tarea de la lista local (sin recargar todo).
      setTareas((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      // Cerramos el modal.
      setConfirmacionBorrar(null);
    }
  }

  // Mientras carga, mostramos un mensaje.
  if (cargando) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-gray-400">
        Cargando...
      </div>
    );
  }

  // Si no hay ninguna tarea todavia, mostramos un estado vacio.
  if (tareas.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">Aún no has subido ninguna tarea.</p>
        <p className="text-xs text-gray-500 mt-1">
          Ve al chat y sube una imagen para empezar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* HEADER con titulo y contador */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis Tareas</h2>
          <span className="text-xs text-gray-500">
            {/* Mostramos cuantas tareas pasan el filtro y cuantas hay en total */}
            {tareasFiltradas.length} de {tareas.length} tarea
            {tareas.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* FILTROS por materia. Solo aparecen si hay 2 o mas materias. */}
        {materiasDisponibles.length >= 2 && (
          <div className="glass rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              Filtrar por materia
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Chip "Todas" */}
              <ChipMateria
                activo={filtroMateria === FILTRO_TODAS}
                onClick={() => setFiltroMateria(FILTRO_TODAS)}
                label={`Todas (${tareas.length})`}
              />
              {/* Un chip por cada materia, con su conteo */}
              {materiasDisponibles.map((mat) => {
                const cuenta = tareas.filter(
                  (t) => t.solucion?.materia === mat
                ).length;
                return (
                  <ChipMateria
                    key={mat}
                    activo={filtroMateria === mat}
                    onClick={() => setFiltroMateria(mat)}
                    label={`${mat} (${cuenta})`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* LISTA o estado vacio segun el filtro */}
        {tareasFiltradas.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-400">
            No hay tareas en{" "}
            <span className="text-white">{filtroMateria}</span>.
          </div>
        ) : (
          <AnimatePresence>
            {/* Recorremos las tareas filtradas y pintamos una card por cada una */}
            {tareasFiltradas.map((t) => (
              <motion.div
                key={t._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl overflow-hidden group"
              >
                <div className="flex items-stretch">
                  {/* Boton principal: expande/colapsa la tarea */}
                  <button
                    onClick={() =>
                      setExpandido(expandido === t._id ? null : t._id)
                    }
                    className="flex-1 flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Titulo de la tarea */}
                      <h3 className="font-medium truncate">
                        {t.solucion?.titulo || "Tarea sin título"}
                      </h3>
                      {/* Materia + fecha */}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {t.solucion?.materia || "Sin materia"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatearFecha(t.fecha_creacion)}
                        </span>
                      </div>
                    </div>

                    {/* Si la tarea tiene nota, mostramos la badge dorada */}
                    {t.nota !== null && t.nota !== undefined && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-semibold text-sm">
                          {t.nota.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Flecha que gira cuando esta expandido */}
                    <motion.div
                      animate={{ rotate: expandido === t._id ? 180 : 0 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  </button>

                  {/* Boton ELIMINAR (rojo) que aparece al pasar el mouse */}
                  <button
                    onClick={(e) => {
                      // Evitar que se dispare el click del padre.
                      e.stopPropagation();
                      // Abrimos el modal pasandole la tarea.
                      setConfirmacionBorrar(t);
                    }}
                    className="px-3 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 text-red-400 border-l border-white/[0.05]"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* DETALLE: aparece al expandir */}
                <AnimatePresence>
                  {expandido === t._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-white/[0.05]">
                        {/* Descripcion (si tiene) */}
                        {t.descripcion_texto && (
                          <p className="text-sm text-gray-400 italic mb-3 mt-3">
                            "{t.descripcion_texto}"
                          </p>
                        )}

                        {/* Pasos de la solucion (si los hay) */}
                        {t.solucion?.pasos && t.solucion.pasos.length > 0 && (
                          <>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-3">
                              Pasos
                            </h4>
                            <ol className="space-y-2">
                              {t.solucion.pasos.map((paso, i) => (
                                <li key={i} className="flex gap-3">
                                  {/* Numerito del paso */}
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium flex items-center justify-center">
                                    {i + 1}
                                  </span>
                                  {/* Renderizamos el paso (puede tener LaTeX) */}
                                  <div className="flex-1 pt-0.5">
                                    <MathRenderer contenido={paso} />
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </>
                        )}

                        {/* Respuesta final destacada */}
                        {t.solucion?.respuesta_final && (
                          <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                            <p className="text-xs font-semibold text-emerald-400 mb-1">
                              RESPUESTA FINAL
                            </p>
                            <MathRenderer
                              contenido={t.solucion.respuesta_final}
                            />
                          </div>
                        )}

                        {/* Mensaje si no hay solucion guardada */}
                        {!t.solucion && (
                          <p className="text-sm text-gray-500 italic mt-3">
                            Esta tarea no tiene solución registrada.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal para confirmar el borrado */}
      <ModalConfirmarEliminar
        tarea={confirmacionBorrar}
        onCancelar={() => setConfirmacionBorrar(null)}
        onConfirmar={eliminarConfirmado}
      />
    </>
  );
}

/* =========================================================================
 *  ChipMateria
 *  Boton chiquito para filtrar (estilo "pildora").
 * ========================================================================= */
function ChipMateria({ activo, onClick, label }) {
  return (
    <button
      onClick={onClick}
      // Si esta activo, se pinta con el color de marca; si no, neutro.
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        activo
          ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
          : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================================
 *  ModalConfirmarEliminar
 *  Modal animado para confirmar el borrado de una tarea.
 *  Si "tarea" es null, no se muestra.
 * ========================================================================= */
function ModalConfirmarEliminar({ tarea, onCancelar, onConfirmar }) {
  return (
    <AnimatePresence>
      {tarea && (
        // Fondo oscuro. Click aqui = cancelar.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCancelar}
        >
          {/* Caja del modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">¿Eliminar esta tarea?</h3>
                <p className="text-xs text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            {/* Detalle de la tarea */}
            <p className="text-sm text-gray-300 mb-5">
              Se eliminará{" "}
              <span className="font-medium text-white">
                {tarea.solucion?.titulo || "Tarea sin título"}
              </span>{" "}
              de tu lista.
            </p>

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <button onClick={onCancelar} className="btn-ghost text-sm">
                Cancelar
              </button>
              <button
                onClick={onConfirmar}
                className="btn-primary text-sm bg-red-500 hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
