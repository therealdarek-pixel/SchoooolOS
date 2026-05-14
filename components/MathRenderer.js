"use client";
import {jsx as _jsx} from "react/jsx-runtime";/**
 * components/MathRenderer.tsx
 * Renderiza texto con Markdown + formulas LaTeX usando KaTeX.
 *
 * Formato esperado del backend:
 *  - Inline: $x^2 + 1$
 *  - Bloque: $$\int_0^1 f(x) dx$$
 */


import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";






export default function MathRenderer({ contenido, className }) {
  return (
    _jsx('div', { className: cn("prose-chat", className), children: 
      _jsx(ReactMarkdown, {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
 children: 
        contenido
      })
    })
  );
}
