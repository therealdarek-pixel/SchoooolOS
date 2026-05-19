"use client";
// "use client" le dice a Next.js que este componente corre en el navegador,
// porque usamos cosas como useState (estado) que no funcionan en el servidor.

// React: el useState guarda valores que cambian (inputs, etc.).
// useEffect corre codigo cuando el componente se monta o algo cambia.
import { useEffect, useState } from "react";
// Framer Motion para animaciones bonitas (entrada/salida del modal).
import { motion, AnimatePresence } from "framer-motion";
// Iconos.
import { X, Plus, Calendar, Save } from "lucide-react";
// Sonner: librería para mostrar mensajitos (toasts) arriba a la derecha.
import { toast } from "sonner";

// Componente que sirve para AGREGAR o EDITAR una clase del horario.
// Si recibe `horarioInicial` => modo edicion (PUT).
// Si no => modo creacion (POST).
export default function AgregarHorarioModal({
  abierto,         // booleano: si el modal se muestra o no
  onCerrar,        // funcion para cerrar el modal
  onAgregado,      // funcion que se llama cuando todo salio bien
  horarioInicial = null, // si viene, estamos editando
}) {
  // Si llego un horario inicial, estamos en modo edicion.
  const esEdicion = Boolean(horarioInicial);

  // Estados (uno por cada campo del formulario).
  const [codigoMateria, setCodigoMateria] = useState("BD-REL");
  const [dia, setDia] = useState("lunes");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("09:30");
  const [aula, setAula] = useState("");
  // enviando = true mientras hablamos con el servidor (para deshabilitar botones).
  const [enviando, setEnviando] = useState(false);

  // Cada vez que se abre el modal, llenamos el formulario.
  // Si estamos editando, con los datos viejos.
  // Si estamos creando, con valores por defecto.
  useEffect(() => {
    if (!abierto) return; // si no esta abierto, no hacemos nada
    if (horarioInicial) {
      // Modo EDICION: pre-cargamos lo que ya tenia la clase.
      setCodigoMateria(horarioInicial.materia_codigo || "BD-REL");
      setDia(horarioInicial.dia || "lunes");
      setHoraInicio(horarioInicial.hora_inicio || "08:00");
      setHoraFin(horarioInicial.hora_fin || "09:30");
      setAula(horarioInicial.aula || "");
    } else {
      // Modo CREACION: defaults.
      setCodigoMateria("BD-REL");
      setDia("lunes");
      setHoraInicio("08:00");
      setHoraFin("09:30");
      setAula("");
    }
  }, [abierto, horarioInicial]);

  // Funcion que se ejecuta cuando el usuario aprieta "Guardar/Agregar".
  async function enviar() {
    // Validacion basica antes de gastar un viaje al servidor.
    if (!horaInicio || !horaFin) {
      toast.error("Las horas son obligatorias");
      return;
    }
    // Comparar strings "HH:MM" funciona porque tienen el mismo formato.
    if (horaInicio >= horaFin) {
      toast.error("La hora de fin debe ser despues de la de inicio");
      return;
    }

    // Avisamos a la UI que estamos enviando (deshabilita los botones).
    setEnviando(true);
    try {
      // Sacamos el token JWT que se guardo al hacer login.
      const token = localStorage.getItem("schoolos_token");

      // Si es edicion, vamos a /api/horarios/[id] con PUT.
      // Si es nuevo, vamos a /api/horarios con POST.
      const url = esEdicion
        ? `/api/horarios/${horarioInicial._id}`
        : "/api/horarios";
      const metodo = esEdicion ? "PUT" : "POST";

      // Hacemos la peticion al backend.
      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Mandamos los datos del formulario.
        body: JSON.stringify({
          codigo_materia: codigoMateria,
          dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          aula: aula.trim() || null,
        }),
      });

      // Leemos la respuesta.
      const data = await respuesta.json();

      if (respuesta.ok) {
        // Salio bien: mensaje verde y avisamos al componente padre.
        toast.success(data.mensaje);
        onAgregado();
      } else {
        // Fallo (ej: traslape, validacion): mensaje rojo.
        toast.error(data.detail || "Error al guardar clase");
      }
    } catch (error) {
      // Si fallo la red (sin internet, servidor caido, etc.).
      toast.error("Error de conexion");
    } finally {
      // Pase lo que pase, dejamos de "estar enviando".
      setEnviando(false);
    }
  }

  return (
    // AnimatePresence permite que la salida del modal tambien sea animada.
    <AnimatePresence>
      {abierto && (
        // Capa oscura de fondo. Click aqui = cerrar.
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onCerrar}
        >
          {/* Caja del modal. stopPropagation para que el click adentro NO cierre. */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal: icono + titulo + boton cerrar */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  {/* El titulo cambia segun si estamos creando o editando */}
                  <h2 className="font-semibold">
                    {esEdicion ? "Editar clase" : "Agregar clase"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {esEdicion
                      ? "Modifica los datos de tu clase"
                      : "Llena los datos de tu clase"}
                  </p>
                </div>
              </div>
              {/* Boton "X" para cerrar */}
              <button
                onClick={onCerrar}
                className="btn-ghost p-2"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Campo: Materia (select con las opciones disponibles) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Materia *
                </label>
                <select
                  value={codigoMateria}
                  onChange={(e) => setCodigoMateria(e.target.value)}
                  className="input-glass"
                >
                  <option value="BD-REL">📊 Bases de Datos Relacionales</option>
                  <option value="BD-NOSQL">🗄️ Bases de Datos NoSQL</option>
                  <option value="ENG">🇬🇧 Inglés</option>
                </select>
              </div>

              {/* Campo: Dia (lunes a viernes) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Día *
                </label>
                <select
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  className="input-glass"
                >
                  <option value="lunes">🔵 Lunes</option>
                  <option value="martes">🟢 Martes</option>
                  <option value="miercoles">🟡 Miércoles</option>
                  <option value="jueves">🟠 Jueves</option>
                  <option value="viernes">🔴 Viernes</option>
                </select>
              </div>

              {/* Campos: Hora inicio y Hora fin (lado a lado) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Hora inicio *
                  </label>
                  {/* type="time" muestra el selector de hora del navegador */}
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Hora fin *
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="input-glass"
                  />
                </div>
              </div>

              {/* Campo: Aula (opcional) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Aula (opcional)
                </label>
                <input
                  type="text"
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                  placeholder="Ej: A-201"
                  className="input-glass"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Pie del modal: botones Cancelar / Guardar */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-2">
              <button
                onClick={onCerrar}
                className="btn-ghost text-sm"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={enviando}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {/* Icono distinto segun si editamos o creamos */}
                {esEdicion ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {/* Texto del boton: cambia con el estado */}
                {enviando
                  ? esEdicion
                    ? "Guardando..."
                    : "Agregando..."
                  : esEdicion
                  ? "Guardar cambios"
                  : "Agregar clase"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
