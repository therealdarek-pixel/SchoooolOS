"use client";
import {jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment} from "react/jsx-runtime";/**
 * components/FileUploader.tsx
 * Dropzone para subir foto/PDF de la tarea.
 * Incluye:
 *  - Preview de la imagen
 *  - Animacion tipo "scanner" mientras la IA procesa
 *  - Manejo de errores con toasts
 */


import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, X, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { tareasApi } from "@/lib/api-client";






export default function FileUploader({ onTareaResuelta }) {
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [procesando, setProcesando] = useState(false);

  const onDrop = useCallback((archivosAceptados) => {
    const f = archivosAceptados[0];
    if (!f) return;
    setArchivo(f);
    if (f.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  function limpiar() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivo(null);
    setPreviewUrl(null);
    setDescripcion("");
  }

  async function enviarTarea() {
    if (!archivo) return;
    setProcesando(true);
    try {
      const tarea = await tareasApi.subirTarea(archivo, descripcion || undefined);
      toast.success("¡Tarea resuelta!");
      onTareaResuelta(tarea);
      limpiar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error subiendo la tarea");
    } finally {
      setProcesando(false);
    }
  }

  return (
    _jsxs('div', { className: "glass rounded-2xl p-5 space-y-4"   , children: [
      _jsxs('div', { className: "flex items-center gap-2"  , children: [
        _jsx(Upload, { className: "w-4 h-4 text-brand-400"  ,} )
        , _jsx('h3', { className: "font-medium", children: "Sube una tarea"  })
        , _jsx('span', { className: "ml-auto text-xs text-gray-500"  , children: "JPG · PNG · PDF · 10MB max"       })
      ]})

      , _jsx(AnimatePresence, { mode: "wait", children: 
        !archivo ? (
          _jsxs(motion.div, {

            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            ...getRootProps(),
            className: `relative cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              isDragActive
                ? "border-brand-500 bg-brand-500/5"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
            }`,
 children: [
            _jsx('input', { ...getInputProps(),} )
            , _jsx(ImageIcon, { className: "w-10 h-10 mx-auto mb-3 text-gray-500"    ,} )
            , _jsx('p', { className: "text-sm text-gray-300" , children: 
              isDragActive
                ? "Suelta el archivo aqui..."
                : "Arrastra una imagen o haz click para seleccionar"
            })
            , _jsx('p', { className: "text-xs text-gray-500 mt-1"  , children: "La IA leera tu tarea y la resolvera paso a paso"

            })
          ]}, "dropzone")
        ) : (
          _jsxs(motion.div, {

            initial: { opacity: 0, scale: 0.96 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0 },
            className: "relative rounded-xl overflow-hidden border border-white/10 bg-black/40"     ,
 children: [
            previewUrl ? (
              _jsxs('div', { className: "relative", children: [
                _jsx('img', {
                  src: previewUrl,
                  alt: "preview",
                  className: "w-full max-h-96 object-contain bg-black"   ,}
                )
                , procesando && (
                  _jsxs(_Fragment, { children: [
                    _jsx('div', { className: "absolute inset-0 bg-black/30 backdrop-blur-[1px]"   ,} )
                    , _jsx('div', { className: "scanner-line",} )
                  ]})
                )
              ]})
            ) : (
              _jsxs('div', { className: "flex items-center gap-3 p-6"   , children: [
                _jsx(FileText, { className: "w-10 h-10 text-brand-400"  ,} )
                , _jsxs('div', { children: [
                  _jsx('p', { className: "font-medium", children: archivo.name})
                  , _jsxs('p', { className: "text-xs text-gray-500" , children: ["PDF · "
                      , (archivo.size / 1024).toFixed(0), " KB"
                  ]})
                ]})
              ]})
            )

            , !procesando && (
              _jsx('button', {
                onClick: limpiar,
                className: "absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"       ,
                'aria-label': "Quitar archivo" ,
 children: 
                _jsx(X, { className: "w-4 h-4" ,} )
              })
            )
          ]}, "preview")
        )
      })

      , archivo && (
        _jsxs(motion.div, {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          className: "space-y-3",
 children: [
          _jsx('textarea', {
            placeholder: "¿Quieres añadir contexto? (opcional, ej: 'es de calculo integral')"        ,
            value: descripcion,
            onChange: (e) => setDescripcion(e.target.value),
            rows: 2,
            className: "input-glass resize-none" ,
            disabled: procesando,}
          )
          , _jsx('button', {
            onClick: enviarTarea,
            disabled: procesando,
            className: "btn-primary w-full" ,
 children: 
            procesando ? (
              _jsxs(_Fragment, { children: [
                _jsx(Sparkles, { className: "w-4 h-4 animate-pulse"  ,} ), "Analizando con IA..."

              ]})
            ) : (
              _jsxs(_Fragment, { children: [
                _jsx(Sparkles, { className: "w-4 h-4" ,} ), "Resolver tarea"

              ]})
            )
          })
        ]})
      )
    ]})
  );
}
