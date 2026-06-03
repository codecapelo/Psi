import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// O Express serve o conteúdo de app/build (express.static('app/build')),
// então o outDir é "build" (não o padrão "dist").
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      // Em desenvolvimento, encaminha /api para o Express (porta 8080).
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
