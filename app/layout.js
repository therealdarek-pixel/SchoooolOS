import {jsx as _jsx, jsxs as _jsxs} from "react/jsx-runtime";




import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "SchoolOS — Asistente Educativo Inteligente",
  description:
    "Resuelve tareas con IA, gestiona notas y manten una conversacion con tu tutor virtual.",
};

export default function RootLayout({
  children,
}

) {
  return (
    _jsx('html', { lang: "es", className: "dark", children: 
      _jsxs('body', { children: [
        children
        , _jsx(Toaster, {
          position: "bottom-right",
          theme: "dark",
          toastOptions: {
            style: {
              background: "rgba(20, 20, 30, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          },}
        )
      ]})
    })
  );
}
