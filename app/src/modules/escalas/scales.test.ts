import { describe, expect, it } from "vitest";
import { SCALES, getScale } from "./registry";
import { bandFor, sumScore } from "./types";

describe("registro de escalas", () => {
  it("contém as 26 escalas com ids únicos", () => {
    expect(SCALES.length).toBe(26);
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

describe("escalas de dependência (faixas vs escore máximo)", () => {
  // Para escalas somadas, as faixas devem cobrir de 0 ao escore máximo
  // possível, contíguas e sem buracos.
  for (const id of ["audit", "cage", "fagerstrom", "ciwaar", "cows"]) {
    it(`${id}: faixas contíguas cobrindo 0..máximo`, () => {
      const def = getScale(id)!;
      expect(def, `${id} deve existir`).toBeDefined();

      const maxScore = def.items.reduce((sum, item) => {
        const opts = item.options ?? def.defaultOptions ?? [];
        const itemMax = Math.max(...opts.map((o) => o.value));
        return sum + itemMax;
      }, 0);

      const bands = [...def.bands].sort((a, b) => a.min - b.min);
      expect(bands[0].min, `${id}: 1ª faixa começa em 0`).toBe(0);
      for (let i = 1; i < bands.length; i++) {
        expect(bands[i].min, `${id}: faixa contígua`).toBe(bands[i - 1].max + 1);
      }
      expect(
        bands[bands.length - 1].max,
        `${id}: última faixa cobre o escore máximo (${maxScore})`,
      ).toBeGreaterThanOrEqual(maxScore);
      expect(bandFor(def, 0), `${id}: faixa para 0`).toBeDefined();
      expect(bandFor(def, maxScore), `${id}: faixa para o máximo`).toBeDefined();
    });
  }
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
