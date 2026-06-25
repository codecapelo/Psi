import { describe, expect, it } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("combina classes e resolve conflitos do Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("formatDate", () => {
  it("retorna travessão para valores vazios ou inválidos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("não-é-data")).toBe("—");
  });

  it("formata uma data ISO válida em pt-BR", () => {
    const out = formatDate("2026-06-25T00:00:00.000Z");
    expect(out).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
