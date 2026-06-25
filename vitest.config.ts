import { defineConfig } from "vitest/config";

// Testes do backend (Node). Os arquivos ficam em server/**/*.test.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts"],
  },
});
