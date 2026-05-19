"use client";
// Componente que muestra el horario del alumno.
// Tiene dos vistas: cuadricula (tipo Google Calendar) y lista.
// Permite crear, editar y eliminar clases.

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Pencil,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import AgregarHorarioModal from "./AgregarHorarioModal";

// Orden de los dias en pantalla (igual que el backend).
const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"];

// Como se muestra cada dia (con acentos).
const NOMBRES_DIAS = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
};

// Color de los bloques en la cuadricula segun el dia.
const COLORES_DIAS = {
  lunes: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  martes: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  miercoles: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  jueves: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  viernes: "from-red-500/20 to-red-600/10 border-red-500/30",
};

// Configuracion de la cuadricula.
const HORA_INICIO = 7;   // se muestra desde las 07:00
const HORA_FIN = 22;     // hasta las 22:00
const PASO_MIN = 30;     // un slot = 30 minutos
const ALTURA_SLOT = 28;  // alto en pixeles de cada slot

// Convierte "HH:MM" en minutos totales. Ej: "08:30" -> 510.
function aMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Devuelve el nombre del dia de HOY ("lunes", "martes", etc.).
// getDay() devuelve 0=domingo, 1=lunes... lo traducimos a nuestras keys.
function diaActualKey() {
  const map = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  return map[new Date().getDay()];
}

export default function HorarioView() {
  // Estados principales:
  const [horarios, setHorarios] = useState([]);        // lista de clases
  const [cargando, setCargando] = useState(true);      // si estamos cargando
  const [modalAbierto, setModalAbierto] = useState(false); // modal crear/editar
  const [horarioEditando, setHorarioEditando] = useState(null); // clase que se edita
  const [confirmacionBorrar, setConfirmacionBorrar] = useState(null); // clase a borrar
  const [vista, setVista] = useState("semana");        // "semana" o "lista"

  // Calculamos que dia es hoy (para resaltarlo).
  const diaHoy = diaActualKey();
  // Si hoy es sabado o domingo, no resaltamos nada.
  const esDiaLaboral = ORDEN_DIAS.includes(diaHoy);

  // Cuando se monta el componente, cargamos los horarios.
  useEffect(() => {
    cargarHorarios();
  }, []);

  // Pide al backend la lista de horarios del alumno.
  async function cargarHorarios() {
    setCargando(true);
    try {
      // Sacamos el token guardado al hacer login.
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

  // Se ejecuta cuando el usuario confirma eliminar.
  async function eliminarConfirmado() {
    if (!confirmacionBorrar) return;
    const id = confirmacionBorrar._id;
    try {
      const token = localStorage.getItem("schoolos_token");
      // Llamamos al endpoint DELETE.
      const res = await fetch(`/api/horarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al eliminar");

      // Mostramos el mensaje y quitamos la clase de la lista local.
      toast.success(data.mensaje);
      setHorarios((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      // Cerramos el modal de confirmacion.
      setConfirmacionBorrar(null);
    }
  }

  // Abre el modal en modo CREACION (sin datos previos).
  function abrirNuevo() {
    setHorarioEditando(null);
    setModalAbierto(true);
  }
  // Abre el modal en modo EDICION (con los datos de la clase).
  function abrirEditar(horario) {
    setHorarioEditando(horario);
    setModalAbierto(true);
  }
  // Cuando se guarda algo, cerramos el modal y recargamos.
  function onGuardado() {
    setModalAbierto(false);
    setHorarioEditando(null);
    cargarHorarios();
  }

  // Para la vista LISTA: agrupamos las clases por dia y las ordenamos por hora.
  // useMemo evita recalcular esto si las clases no cambiaron.
  const horariosPorDia = useMemo(() => {
    return ORDEN_DIAS.reduce((acc, dia) => {
      acc[dia] = horarios
        .filter((h) => h.dia === dia)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      return acc;
    }, {});
  }, [horarios]);

  // Mientras carga, mostramos un mensaje.
  if (cargando) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-gray-400">
        Cargando horario...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* HEADER: titulo + toggle de vista + boton agregar */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <Calendar className="w-5 h-5 text-brand-400" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">Mi Horario</h2>
            <p className="text-xs text-gray-500">
              Organiza tus clases de la semana
            </p>
          </div>

          {/* Toggle SEMANA / LISTA */}
          <div className="flex bg-white/[0.04] rounded-lg p-1">
            <button
              onClick={() => setVista("semana")}
              className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                vista === "semana"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Vista semana"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Semana
            </button>
            <button
              onClick={() => setVista("lista")}
              className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
                vista === "lista"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              title="Vista lista"
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
          </div>

          {/* Boton para abrir el modal en modo CREACION */}
          <button
            onClick={abrirNuevo}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar clase
          </button>
        </div>

        {/* CUERPO: depende del estado */}
        {horarios.length === 0 ? (
          // Caso 1: no hay clases todavia.
          <div className="glass rounded-2xl p-12 text-center">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">Aún no tienes clases en tu horario.</p>
            <p className="text-xs text-gray-500 mt-1">
              Click en "Agregar clase" para empezar.
            </p>
          </div>
        ) : vista === "semana" ? (
          // Caso 2: vista cuadricula.
          <VistaSemana
            horarios={horarios}
            diaHoy={esDiaLaboral ? diaHoy : null}
            onEditar={abrirEditar}
            onEliminar={(h) => setConfirmacionBorrar(h)}
          />
        ) : (
          // Caso 3: vista lista.
          <VistaLista
            horariosPorDia={horariosPorDia}
            diaHoy={esDiaLaboral ? diaHoy : null}
            onEditar={abrirEditar}
            onEliminar={(h) => setConfirmacionBorrar(h)}
          />
        )}
      </div>

      {/* Modal para crear o editar una clase */}
      <AgregarHorarioModal
        abierto={modalAbierto}
        onCerrar={() => {
          setModalAbierto(false);
          setHorarioEditando(null);
        }}
        onAgregado={onGuardado}
        horarioInicial={horarioEditando}
      />

      {/* Modal para confirmar el borrado */}
      <ModalConfirmarEliminar
        clase={confirmacionBorrar}
        onCancelar={() => setConfirmacionBorrar(null)}
        onConfirmar={eliminarConfirmado}
      />
    </>
  );
}

/* =========================================================================
 *  VistaSemana: la cuadricula tipo Google Calendar
 *  - Columna izquierda: las horas (07:00 .. 22:00).
 *  - 5 columnas: lunes a viernes.
 *  - Cada clase es un bloque posicionado por su hora.
 * =========================================================================
 */
function VistaSemana({ horarios, diaHoy, onEditar, onEliminar }) {
  // Calculamos cuanto mide la cuadricula en total.
  const totalMinutos = (HORA_FIN - HORA_INICIO) * 60;  // 15 horas = 900 min
  const totalSlots = totalMinutos / PASO_MIN;          // 30 slots de 30 min
  const altoTotal = totalSlots * ALTURA_SLOT;          // alto total en px

  // Lista de etiquetas de hora ("07:00", "08:00", ..., "22:00").
  // Solo cada hora cerrada para no saturar la UI.
  const horasEtiquetas = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
    horasEtiquetas.push(`${String(h).padStart(2, "0")}:00`);
  }

  // Calcula la posicion (top) y la altura del bloque para una clase.
  function posicionBloque(h) {
    // Cuantos minutos pasaron desde las HORA_INICIO hasta la clase.
    const inicio = aMinutos(h.hora_inicio) - HORA_INICIO * 60;
    // Cuanto dura la clase.
    const duracion = aMinutos(h.hora_fin) - aMinutos(h.hora_inicio);
    // Convertimos minutos a pixeles.
    const top = (inicio / PASO_MIN) * ALTURA_SLOT;
    const alto = (duracion / PASO_MIN) * ALTURA_SLOT;
    return { top, alto };
  }

  return (
    <div className="glass rounded-2xl p-3 overflow-x-auto">
      {/* min-width para que en pantalla chica se haga scroll horizontal */}
      <div className="min-w-[640px]">
        {/* Fila superior: nombres de los dias */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-px mb-2">
          <div /> {/* esquina vacia arriba de la columna de horas */}
          {ORDEN_DIAS.map((dia) => {
            const esHoy = dia === diaHoy;
            return (
              <div
                key={dia}
                className={`text-center py-2 rounded-md text-xs font-medium ${
                  esHoy
                    ? "bg-brand-500/15 text-brand-300"  // resaltado si es hoy
                    : "text-gray-400"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {/* Puntito que parpadea para el dia actual */}
                  {esHoy && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  )}
                  {NOMBRES_DIAS[dia]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cuerpo: columna de horas + 5 columnas de dias */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-px">
          {/* Columna de horas (izquierda) */}
          <div className="relative" style={{ height: altoTotal }}>
            {horasEtiquetas.map((etq, i) => (
              <div
                key={etq}
                className="absolute left-0 right-0 text-[10px] text-gray-500 pr-2 text-right"
                // Posicion de cada etiqueta (cada hora entera = 2 slots).
                style={{ top: i * ALTURA_SLOT * 2 - 6 }}
              >
                {etq}
              </div>
            ))}
          </div>

          {/* Columnas de cada dia */}
          {ORDEN_DIAS.map((dia) => {
            const esHoy = dia === diaHoy;
            // Filtramos las clases de este dia.
            const clasesDelDia = horarios.filter((h) => h.dia === dia);
            return (
              <div
                key={dia}
                className={`relative rounded-md ${
                  esHoy ? "bg-brand-500/5" : "bg-white/[0.02]"
                }`}
                style={{ height: altoTotal }}
              >
                {/* Lineas guia horizontales (una por cada hora) */}
                {Array.from({ length: HORA_FIN - HORA_INICIO + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-white/[0.04]"
                    style={{ top: i * ALTURA_SLOT * 2 }}
                  />
                ))}

                {/* Los bloques de las clases */}
                {clasesDelDia.map((c) => {
                  const { top, alto } = posicionBloque(c);
                  return (
                    <motion.div
                      key={c._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute left-1 right-1 rounded-md border bg-gradient-to-br ${COLORES_DIAS[dia]} p-1.5 overflow-hidden group cursor-pointer hover:brightness-125 transition-all`}
                      style={{ top, height: alto, minHeight: 24 }}
                      // Click en el bloque = editar.
                      onClick={() => onEditar(c)}
                      title={`${c.materia_nombre} (${c.hora_inicio}-${c.hora_fin})`}
                    >
                      {/* Contenido del bloque: icono + nombre + horas + aula */}
                      <div className="flex items-start gap-1 text-[10px] leading-tight">
                        <span className="text-sm leading-none">
                          {c.materia_icono}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate text-white">
                            {c.materia_nombre}
                          </p>
                          <p className="text-gray-300 truncate">
                            {c.hora_inicio}-{c.hora_fin}
                          </p>
                          {/* Solo mostramos aula si el bloque es alto */}
                          {c.aula && alto > 50 && (
                            <p className="text-gray-400 truncate">
                              📍 {c.aula}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botones que aparecen al pasar el mouse */}
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Boton editar */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // evita que se dispare el onClick del bloque
                            onEditar(c);
                          }}
                          className="p-1 rounded bg-black/30 hover:bg-black/50 text-white"
                          title="Editar"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {/* Boton eliminar */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminar(c);
                          }}
                          className="p-1 rounded bg-black/30 hover:bg-red-500/60 text-white"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 *  VistaLista: el formato anterior, pero ahora con boton editar.
 *  Se muestran cards agrupadas por dia.
 * =========================================================================
 */
function VistaLista({ horariosPorDia, diaHoy, onEditar, onEliminar }) {
  return (
    <div className="grid gap-3">
      {/* Para cada dia... */}
      {ORDEN_DIAS.map((dia) => {
        const clases = horariosPorDia[dia];
        // Si no hay clases ese dia, no mostramos la seccion.
        if (!clases || clases.length === 0) return null;
        const esHoy = dia === diaHoy;

        return (
          <motion.div
            key={dia}
            layout
            className={`rounded-2xl border bg-gradient-to-br ${COLORES_DIAS[dia]} p-4 ${
              esHoy ? "ring-1 ring-brand-400/50" : ""
            }`}
          >
            {/* Titulo del dia, con punto pulsante si es hoy */}
            <h3 className="font-semibold text-sm mb-3 capitalize flex items-center gap-2">
              {esHoy && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              )}
              {NOMBRES_DIAS[dia]}
              {esHoy && (
                <span className="text-[10px] text-brand-300 font-normal">
                  (hoy)
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {/* AnimatePresence permite animar la salida cuando se borra */}
              <AnimatePresence>
                {clases.map((clase) => (
                  <motion.div
                    key={clase._id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="glass rounded-xl p-3 flex items-center gap-3 group"
                  >
                    {/* Icono de la materia */}
                    <span className="text-2xl">{clase.materia_icono}</span>
                    {/* Datos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {clase.materia_nombre}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {clase.hora_inicio} - {clase.hora_fin}
                        </span>
                        {clase.aula && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clase.aula}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Botones (aparecen al hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditar(clase)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-300"
                        title="Editar clase"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEliminar(clase)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                        title="Eliminar clase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* =========================================================================
 *  ModalConfirmarEliminar
 *  Reemplaza el confirm() feo del navegador con uno animado.
 *  Recibe la "clase" a borrar. Si es null, no muestra nada.
 * =========================================================================
 */
function ModalConfirmarEliminar({ clase, onCancelar, onConfirmar }) {
  return (
    <AnimatePresence>
      {clase && (
        // Fondo oscurecido. Click aqui = cancelar.
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
            {/* Cabecera con icono de basura */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold">¿Eliminar esta clase?</h3>
                <p className="text-xs text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            {/* Detalle de la clase que se va a borrar */}
            <p className="text-sm text-gray-300 mb-5">
              Se eliminará{" "}
              <span className="font-medium text-white">
                {clase.materia_nombre}
              </span>{" "}
              ({clase.hora_inicio} - {clase.hora_fin}) de tu horario.
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
