import { describe, expect, it } from "vitest";
import { SCALES, getScale } from "./registry";
import { bandFor, sumScore } from "./types";

describe("registro de escalas", () => {
  it("contém as 21 escalas com ids únicos", () => {
    expect(SCALES.length).toBe(21);
    const ids = SCALES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda escala tem itens e faixas de interpretação", () => {
    for (const s of SCALES) {
      expect(s.items.length, `${s.acronym} deve ter itens`).toBeGreaterThan(0);
      expect(s.bands.length, `${s.acronym} deve ter faixas`).toBeGreaterThan(0);
    }
  });
});

describe("pontuação", () => {
  it("sumScore soma as respostas", () => {
    expect(sumScore({ a: 1, b: 2, c: 3 })).toBe(6);
    expect(sumScore({})).toBe(0);
  });

  it("PHQ-9: pontua e classifica a gravidade pela faixa", () => {
    const phq9 = getScale("phq9")!;
    expect(phq9).toBeDefined();

    const zeros = Object.fromEntries(phq9.items.map((i) => [i.id, 0]));
    expect(sumScore(zeros)).toBe(0);
    expect(bandFor(phq9, 0)?.severity).toBe("normal");

    const max = Object.fromEntries(phq9.items.map((i) => [i.id, 3]));
    expect(sumScore(max)).toBe(27);
    expect(bandFor(phq9, 27)?.label).toBe("Grave");

    // 12 → faixa "Moderada"
    expect(bandFor(phq9, 12)?.label).toBe("Moderada");
  });
});
