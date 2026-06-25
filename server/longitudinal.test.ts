import { describe, expect, it } from "vitest";
import {
  buildEvolucaoSeed,
  computeExamHash,
  stableStringify,
} from "./longitudinal.ts";

describe("stableStringify", () => {
  it("é determinístico independente da ordem das chaves", () => {
    const a = stableStringify({ b: 1, a: { y: 2, x: 3 } });
    const b = stableStringify({ a: { x: 3, y: 2 }, b: 1 });
    expect(a).toBe(b);
  });

  it("preserva ordem de arrays", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("computeExamHash", () => {
  const base = {
    id: "e1",
    patientId: "p1",
    tipo: "evolucao",
    seq: 2,
    data: { evolucao: { s: "estável", eem: { humor: ["deprimido"] } } },
    lockedAt: "2026-06-25T12:00:00.000Z",
  };

  it("gera SHA-256 hex (64 chars) estável", () => {
    const h1 = computeExamHash(base);
    const h2 = computeExamHash({ ...base });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("muda quando o conteúdo muda", () => {
    const h1 = computeExamHash(base);
    const h2 = computeExamHash({ ...base, data: { evolucao: { s: "piorou" } } });
    expect(h1).not.toBe(h2);
  });

  it("muda quando o timestamp de assinatura muda", () => {
    const h1 = computeExamHash(base);
    const h2 = computeExamHash({ ...base, lockedAt: "2026-06-26T12:00:00.000Z" });
    expect(h1).not.toBe(h2);
  });
});

describe("buildEvolucaoSeed", () => {
  it("sem fonte → tudo vazio e prev null", () => {
    const seed = buildEvolucaoSeed(null);
    expect(seed).toEqual({ s: "", o: "", a: "", p: "", eem: {}, prev: null });
  });

  it("a partir de evolução anterior → carry-forward do SOAP+EEM", () => {
    const seed = buildEvolucaoSeed({
      tipo: "evolucao",
      date: "2026-06-24T10:00:00.000Z",
      data: {
        evolucao: {
          s: "refere melhora do sono",
          o: "calmo",
          a: "depressão em remissão parcial",
          p: "manter sertralina",
          eem: { humor: ["hipotimia"], pensamento: ["lentificado"] },
        },
      },
    });
    expect(seed.s).toBe("refere melhora do sono");
    expect(seed.a).toBe("depressão em remissão parcial");
    expect(seed.eem).toEqual({ humor: ["hipotimia"], pensamento: ["lentificado"] });
    expect(seed.prev?.sourceTipo).toBe("evolucao");
    expect(seed.prev?.sourceDate).toBe("2026-06-24T10:00:00.000Z");
    // A linha de base reflete o estado de origem.
    expect(seed.prev?.eem).toEqual({ humor: ["hipotimia"], pensamento: ["lentificado"] });
  });

  it("a partir da admissão → semeia EEM/A/P das fatias clínicas", () => {
    const seed = buildEvolucaoSeed({
      tipo: "admissao",
      date: "2026-06-20T09:00:00.000Z",
      data: {
        psicopatologia: {
          humor: { selected: ["deprimido", "anedonia"], notes: "" },
          consciencia: { selected: [], notes: "" },
        },
        diagnostico: { sindromico: "síndrome depressiva", nosologico: "F32.1" },
        pts: { orientacoes: "iniciar ISRS; retorno em 7 dias" },
      },
    });
    expect(seed.eem).toEqual({ humor: ["deprimido", "anedonia"] });
    expect(seed.a).toBe("síndrome depressiva — F32.1");
    expect(seed.p).toBe("iniciar ISRS; retorno em 7 dias");
    expect(seed.s).toBe("");
    expect(seed.prev?.sourceTipo).toBe("admissao");
  });

  it("carry-forward usa cópia profunda do EEM (não compartilha referência com prev)", () => {
    const seed = buildEvolucaoSeed({
      tipo: "evolucao",
      data: { evolucao: { s: "", o: "", a: "", p: "", eem: { humor: ["deprimido"] } } },
    });
    seed.eem.humor.push("ansioso");
    // Mutar o atual não pode afetar a linha de base.
    expect(seed.prev?.eem.humor).toEqual(["deprimido"]);
  });
});
