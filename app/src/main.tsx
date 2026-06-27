import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import App from "@/App";
// Fonte Inter auto-hospedada (sem requisições externas — privacidade/LGPD).
import "@fontsource-variable/inter";
import "@/index.css";
// Shell SOPsi 2.0 (layout/chrome do app: sidebar, topbar, tabs mobile, surfaces).
// Importado APÓS index.css para reger a aparência do shell sobre as bases Tailwind.
import "@/styles/shell.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
