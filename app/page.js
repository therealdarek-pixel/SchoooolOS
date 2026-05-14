"use client";
import {jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment} from "react/jsx-runtime";/**
 * app/page.tsx
 * Landing + autenticacion. Si ya hay sesion, redirige al dashboard.
 */


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, GraduationCap, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { authApi, tokenStorage } from "@/lib/api-client";


export default function HomePage() {
  const router = useRouter();
  const [modo, setModo] = useState("login");
  const [cargando, setCargando] = useState(false);

  // Estado del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("alumno");

  // Si ya hay token valido, vamos directo al dashboard
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) return;
    authApi.me()
      .then(() => router.push("/dashboard"))
      .catch(() => tokenStorage.clear());
  }, [router]);

  async function manejarSubmit(e) {
    e.preventDefault();
    setCargando(true);
    try {
      if (modo === "login") {// INICIAR SESION
        await authApi.login(email, password);
        toast.success("¡Bienvenido de vuelta!");
      } else {
        await authApi.register({ email, password, nombre, rol });//CREAR UNA CUENTA
        toast.success("Cuenta creada con exito");
      }
      router.push("/dashboard");
    } catch (err) {//ERROR GENERAL
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }
//pasar a modo oscuro o claro
  return (
    _jsx('main', { className: "min-h-screen flex items-center justify-center px-4 py-10"     , children: 
      _jsxs('div', { className: "w-full max-w-md" , children: [
        /* Logo + titulo */
        _jsxs(motion.div, {
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          className: "text-center mb-8" ,
 children: [
          _jsx('div', { className: "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/30 mb-4"           , children: 
            _jsx(GraduationCap, { className: "w-7 h-7 text-white"  ,} )
          })
          , _jsx('h1', { className: "text-3xl font-semibold tracking-tight"  , children: "SchoolOS"})
          , _jsx('p', { className: "text-gray-400 mt-2 text-sm"  , children: "Tu asistente educativo con IA"

          })
        ]})

        /* Card del formulario */
        , _jsxs(motion.div, {
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          transition: { delay: 0.1 },
          className: "glass-strong rounded-2xl p-7"  ,
 children: [
          /* Tabs */
          _jsx('div', { className: "flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-6"     , children: 
            (["login", "register"] ).map((m) => (
              _jsx('button', {

                onClick: () => setModo(m),
                className: `flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  modo === m
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`,
 children: 
                m === "login" ? "Iniciar sesion" : "Registrarse"
              }, m)
            ))
          })

          , _jsxs('form', { onSubmit: manejarSubmit, className: "space-y-4", children: [
            _jsx(AnimatePresence, { mode: "wait", children: 
              modo === "register" && (
                _jsxs(motion.div, {

                  initial: { opacity: 0, height: 0 },
                  animate: { opacity: 1, height: "auto" },
                  exit: { opacity: 0, height: 0 },
                  className: "space-y-4 overflow-hidden" ,
 children: [
                  _jsx(Campo, { icono: _jsx(User, { className: "w-4 h-4" ,} ), label: "Nombre completo" , children: 
                    _jsx('input', {
                      type: "text",
                      required: true,
                      value: nombre,
                      onChange: (e) => setNombre(e.target.value),
                      placeholder: "Ej: Maria Perez"  ,
                      className: "input-glass",}
                    )
                  })
                  , _jsxs('div', { children: [
                    _jsx('label', { className: "block text-xs font-medium text-gray-400 mb-2"    , children: "Soy..."

                    })
                    , _jsx('div', { className: "grid grid-cols-2 gap-2"  , children: 
                      (["alumno", "maestro"] ).map((r) => (
                        _jsx('button', {

                          type: "button",
                          onClick: () => setRol(r),
                          className: `py-2.5 rounded-xl text-sm font-medium border transition-all ${
                            rol === r
                              ? "bg-brand-500/15 border-brand-500/50 text-brand-400"
                              : "border-white/10 text-gray-400 hover:border-white/20"
                          }`,
 children: 
                          r === "alumno" ? "👨‍🎓 Alumno" : "👨‍🏫 Maestro"
                        }, r)
                      ))
                    })
                  ]})
                ]}, "register-fields")
              )
            })

            , _jsx(Campo, { icono: _jsx(Mail, { className: "w-4 h-4" ,} ), label: "Correo electronico" , children: 
              _jsx('input', {
                type: "email",
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "tu@correo.com",
                className: "input-glass",}
              )
            })

            , _jsx(Campo, { icono: _jsx(Lock, { className: "w-4 h-4" ,} ), label: "Contrasena", children: 
              _jsx('input', {
                type: "password",
                required: true,
                minLength: 6,
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: "Minimo 6 caracteres"  ,
                className: "input-glass",}
              )
            })

            , _jsx('button', {
              type: "submit",
              disabled: cargando,
              className: "btn-primary w-full mt-2"  ,
 children: 
              cargando ? (
                _jsxs('span', { className: "flex items-center gap-2"  , children: [
                  _jsx(Sparkles, { className: "w-4 h-4 animate-spin"  ,} ), "Procesando..."

                ]})
              ) : (
                _jsxs(_Fragment, { children: [
                  modo === "login" ? "Entrar" : "Crear cuenta"
                  , _jsx(ArrowRight, { className: "w-4 h-4" ,} )
                ]})
              )
            })
          ]})
        ]})

        , _jsx('p', { className: "text-center text-xs text-gray-500 mt-6"   , children: "Powered by Claude Vision · MongoDB · Next.js"

        })
      ]})
    })
  );
}

/** Campo de formulario reutilizable con label e icono. */
function Campo({
  icono,
  label,
  children,
}



) {
  return (
    _jsxs('div', { children: [
      _jsxs('label', { className: "flex items-center gap-2 text-xs font-medium text-gray-400 mb-2"      , children: [
        icono
        , label
      ]})
      , children
    ]})
  );
}
