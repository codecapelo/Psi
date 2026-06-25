import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Testes do frontend (funções puras: utilitários e pontuação de escalas).
// Ambiente "node" — não há testes de componentes que exijam DOM.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
