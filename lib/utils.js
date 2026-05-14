/**
 * lib/utils.ts
 * Utilidades compartidas del frontend.
 */
import { clsx, } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina y deduplica clases de Tailwind. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Formatea fechas ISO a un formato legible en español. */
export function formatearFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
