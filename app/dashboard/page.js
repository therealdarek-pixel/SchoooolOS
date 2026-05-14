"use client";
import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";/**
 * app/dashboard/page.tsx
 * Dashboard principal con tabs y modo día/noche.
 */


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LogOut,
  MessageSquare,
  FolderOpen,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Sun,
  Moon,
} from "lucide-react";
import { authApi } from "@/lib/api-client";

import ChatInterface from "@/components/ChatInterface";
import TareasList from "@/components/TareasList";
import PanelMaestro from "@/components/PanelMaestro";
import HorarioView from "@/components/HorarioView";



export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("chat");
  const [cargando, setCargando] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUsuario)
      .catch(() => router.push("/"))
      .finally(() => setCargando(false));
  }, [router]);

  // Cargar preferencia de tema
  useEffect(() => {
    const temaGuardado = localStorage.getItem("schoolos_tema");
    if (temaGuardado === "claro") {
      setModoOscuro(false);
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  function alternarTema() {
    const nuevoModo = !modoOscuro;
    setModoOscuro(nuevoModo);
    
    if (nuevoModo) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("schoolos_tema", "oscuro");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("schoolos_tema", "claro");
    }
  }

  function cerrarSesion() {
    authApi.logout();
    localStorage.removeItem("chat_session_id");
    router.push("/");
  }

  if (cargando || !usuario) {
    return (
      _jsx('div', { className: "min-h-screen flex items-center justify-center"   , children: 
        _jsx('div', { className: "glass rounded-xl px-5 py-3 text-sm"    , children: "Cargando sesion..."

        })
      })
    );
  }

  const esMaestro = usuario.rol === "maestro";
  const esAlumno = usuario.rol === "alumno";

  return (
    _jsxs('div', { className: "min-h-screen flex flex-col"  , children: [
      /* HEADER */
      _jsxs('header', { className: "border-b backdrop-blur-xl sticky top-0 z-30"    , style: { borderColor: "var(--border-color)", background: "var(--glass-bg)" }, children: [
        _jsxs('div', { className: "max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between"      , children: [
          _jsxs('div', { className: "flex items-center gap-3"  , children: [
            _jsx('div', { className: "w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/20"          , children: 
              _jsx(GraduationCap, { className: "w-5 h-5 text-white"  ,} )
            })
            , _jsxs('div', { children: [
              _jsx('h1', { className: "font-semibold tracking-tight" , children: "SchoolOS"})
              , _jsxs('p', { className: "text-[11px]", style: { color: "var(--text-secondary)" }, children: [
                usuario.nombre, " ·" , " "
                , _jsx('span', { className: esMaestro ? "text-accent-500" : "text-brand-500", children: 
                  esMaestro ? "Maestro" : "Alumno"
                })
              ]})
            ]})
          ]})

          , _jsxs('div', { className: "flex items-center gap-2"  , children: [
            /* Toggle día/noche */
            _jsx('button', {
              onClick: alternarTema,
              className: "relative p-2 rounded-xl transition-all hover:scale-110"    ,
              style: {
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              },
              title: modoOscuro ? "Cambiar a modo día" : "Cambiar a modo noche",
 children: 
              _jsx(motion.div, {

                initial: { rotate: -90, opacity: 0 },
                animate: { rotate: 0, opacity: 1 },
                exit: { rotate: 90, opacity: 0 },
                transition: { duration: 0.3 },
 children: 
                modoOscuro ? (
                  _jsx(Moon, { className: "w-4 h-4 text-blue-400"  ,} )
                ) : (
                  _jsx(Sun, { className: "w-4 h-4 text-amber-500"  ,} )
                )
              }, modoOscuro ? "moon" : "sun")
            })

            , _jsxs('button', { onClick: cerrarSesion, className: "btn-ghost text-sm" , children: [
              _jsx(LogOut, { className: "w-4 h-4" ,} ), "Salir"

            ]})
          ]})
        ]})

        /* TABS */
        , _jsxs('nav', { className: "max-w-6xl mx-auto px-5 flex gap-1"    , children: [
          _jsx(TabButton, {
            activo: tab === "chat",
            onClick: () => setTab("chat"),
            icono: _jsx(MessageSquare, { className: "w-4 h-4" ,} ),
            label: "Chat IA" ,}
          )
          , _jsx(TabButton, {
            activo: tab === "tareas",
            onClick: () => setTab("tareas"),
            icono: _jsx(FolderOpen, { className: "w-4 h-4" ,} ),
            label: "Mis Tareas" ,}
          )
          , esAlumno && (
            _jsx(TabButton, {
              activo: tab === "horario",
              onClick: () => setTab("horario"),
              icono: _jsx(Calendar, { className: "w-4 h-4" ,} ),
              label: "Horario",}
            )
          )
          , esMaestro && (
            _jsx(TabButton, {
              activo: tab === "panel",
              onClick: () => setTab("panel"),
              icono: _jsx(ShieldCheck, { className: "w-4 h-4" ,} ),
              label: "Panel Maestro" ,}
            )
          )
        ]})
      ]})

      /* CONTENIDO */
      , _jsx('main', { className: "flex-1 max-w-6xl w-full mx-auto px-5 py-6"     , children: 
        _jsxs(motion.div, {

          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.25 },
 children: [
          tab === "chat" && _jsx(ChatInterface, {} )
          , tab === "tareas" && _jsx(TareasList, {} )
          , tab === "horario" && esAlumno && _jsx(HorarioView, {} )
          , tab === "panel" && esMaestro && _jsx(PanelMaestro, {} )
        ]}, tab)
      })
    ]})
  );
}

function TabButton({
  activo,
  onClick,
  icono,
  label,
}




) {
  return (
    _jsxs('button', {
      onClick: onClick,
      className: "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"        ,
      style: {
        color: activo ? "var(--text-primary)" : "var(--text-secondary)",
      },
 children: [
      icono
      , label
      , activo && (
        _jsx(motion.div, {
          layoutId: "tab-indicator",
          className: "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-accent-500"       ,}
        )
      )
    ]})
  );
}