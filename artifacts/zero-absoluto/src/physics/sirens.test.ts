import { describe, expect, it } from "vitest";
import reference from "../data/cosmo/validacao_sirenes.json";
import { readFileSync } from "node:fs";
import { DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3 } from "../data/cosmo";
import { profileAt, scanGrid, type GridSpec } from "./cosmoFit";
import { TRUTHS, confidenceEllipse, expectedEvents, sirenFisherForecast, sirenFisherSeparation, sirenForecastAt, sirenLcdmRelativeErrors, sirenScenario, sirenSeparation, truthBetween, wSeparation, type SirenScenarioId } from "./sirens";

const within = (value: number, ref: number, tolerance: number) => expect(Math.abs(value / ref - 1)).toBeLessThan(tolerance);
const SCENARIOS: SirenScenarioId[] = ["lisa-otimista", "lisa-pessimista", "et-otimista", "et-realista"];
type Row = Record<"lcdm" | "desi", { atuais: { w0: number; wa: number }; combinado: { w0: number; wa: number }; sirenes_sozinhas: { w0: number; wa: number }; separacao_fisher_combinado: number[]; separacao_fisher_sirenes: number[]; separacao_sirenes: number[] }>;
const previsoes = reference.previsoes as unknown as Record<string, Row> & { atuais_sozinhos: Record<"lcdm" | "desi", number[]> };

describe("cenários publicados", () => {
  it("números de eventos: LISA 20,7 e 1,6 em 4 anos (Mangiagli et al. 2025); ET 389 e 128 em 10 anos (Belgacem et al. 2019)", () => {
    const total = (id: SirenScenarioId) => expectedEvents(id).weight.reduce((a, b) => a + b, 0);
    expect(total("lisa-otimista")).toBeCloseTo(20.7, 6);
    expect(total("lisa-pessimista")).toBeCloseTo(1.6, 6);
    expect(total("et-otimista")).toBeCloseTo(389, 6);
    expect(total("et-realista")).toBeCloseTo(128, 6);
    expect(sirenScenario("et-otimista").anos).toBe(10);
  });
});

describe("reprodução de previsões publicadas (Fisher, ΛCDM, só sirenes)", () => {
  it("Belgacem et al. (2019), Tabela 4: σ(H₀)/H₀ = 0,28% e σ(Ω_m)/Ω_m = 3,68% (ET otimista)", () => {
    const r = sirenLcdmRelativeErrors("et-otimista", { omegaM: 0.3087, h0: 67.64, omegaBh2: 0.0224, w0: -1, wa: 0 });
    within(r.h0, 0.0028, 0.05);
    // Fator 1,19. Uma MCMC em 40 catálogos com ruído dá 4,06% a 4,71% (mediana 4,35%, igual ao
    // Fisher): a diferença não vem do sorteio do catálogo; a causa não foi identificada (docs/achados.md).
    within(r.omegaM, 0.0368, 0.25);
  });

  it("Speri et al. (2021), Tabela I: 15 sirenes popIII, 3% em h e 16% em Ω_m (o Fisher dá ~1,4 vez menos; o publicado vem de MCMC num catálogo)", () => {
    const r = sirenLcdmRelativeErrors("speri-popIII-15", { omegaM: 0.3, h0: 70, omegaBh2: 0.0224, w0: -1, wa: 0 });
    expect(r.h0 / 0.03).toBeGreaterThan(0.6);
    expect(r.h0 / 0.03).toBeLessThan(1.1);
    expect(r.omegaM / 0.16).toBeGreaterThan(0.6);
    expect(r.omegaM / 0.16).toBeLessThan(1.1);
  });
});

describe("TypeScript × Python (scripts/validacao_sirenes.py)", () => {
  it("reproduções: mesmos números", () => {
    const r1 = sirenLcdmRelativeErrors("speri-popIII-15", { omegaM: 0.3, h0: 70, omegaBh2: 0.0224, w0: -1, wa: 0 });
    within(r1.h0, reference.reproducoes.speri2021.sigma_h_rel, 1e-4);
    within(r1.omegaM, reference.reproducoes.speri2021.sigma_om_rel, 1e-4);
    const r2 = sirenLcdmRelativeErrors("et-otimista", { omegaM: 0.3087, h0: 67.64, omegaBh2: 0.0224, w0: -1, wa: 0 });
    within(r2.h0, reference.reproducoes.belgacem2019_lcdm.sigma_h_rel, 1e-4);
  });

  it("Fisher: σ(w₀) e σ(w_a) com dados atuais, só sirenes e combinados", () => {
    for (const id of SCENARIOS) for (const t of ["lcdm", "desi"] as const) {
      const f = sirenFisherForecast(id, TRUTHS[t]);
      const ref = previsoes[id][t];
      within(f.current.w0, ref.atuais.w0, 1e-3);
      within(f.combined.wa, ref.combinado.wa, 1e-3);
      within(f.sirensOnly.w0, ref.sirenes_sozinhas.w0, 1e-3);
    }
  });

  it("separação esperada pelo Fisher centrado na verdade", () => {
    for (const t of ["lcdm", "desi"] as const) within(sirenFisherSeparation(null, t, true).deltaChi2, previsoes.atuais_sozinhos[t][0], 1e-3);
    for (const id of SCENARIOS) for (const t of ["lcdm", "desi"] as const) {
      within(sirenFisherSeparation(id, t, true).deltaChi2, previsoes[id][t].separacao_fisher_combinado[0], 1e-3);
      within(sirenFisherSeparation(id, t, false).deltaChi2, previsoes[id][t].separacao_fisher_sirenes[0], 1e-3);
    }
  });

  it("separação por perfil só com sirenes (catálogo sem ruído), ET otimista", () => {
    for (const t of ["lcdm", "desi"] as const) {
      expect(Math.abs(sirenSeparation("et-otimista", t, false).deltaChi2 - previsoes["et-otimista"][t].separacao_sirenes[0])).toBeLessThan(0.1);
    }
  });
});

describe("a pergunta do módulo", () => {
  it("só os dados atuais separam ΛCDM e DESI a ~3σ; o LISA quase não muda isso; o ET otimista passa de 5σ", () => {
    expect(sirenFisherSeparation(null, "desi", true).sigma).toBeLessThan(3.5);
    expect(sirenFisherSeparation("lisa-otimista", "desi", true).sigma).toBeLessThan(3.5);
    expect(sirenFisherSeparation("et-otimista", "desi", true).sigma).toBeGreaterThan(5);
    expect(sirenFisherSeparation("et-realista", "desi", true).sigma).toBeLessThan(5);
  });
});

describe("plano w₀ × w_a da previsão", () => {
  it("a elipse de nível Δχ² tem exatamente esse Δχ² em todos os pontos", () => {
    const f = sirenForecastAt("et-otimista", TRUTHS.desi);
    const center = { w0: TRUTHS.desi.w0, wa: TRUTHS.desi.wa };
    for (const [w0, wa] of confidenceEllipse(center, f.combined, 6.18, 24)) {
      expect(wSeparation(f.combined, center, { w0, wa }).deltaChi2).toBeCloseTo(6.18, 6);
    }
  });

  it("a elipse dos dados atuais tem a largura de σ(w₀) e σ(w_a) multiplicada por √Δχ²", () => {
    const f = sirenForecastAt(null, TRUTHS.desi);
    const pts = confidenceEllipse({ w0: 0, wa: 0 }, f.current, 2.3, 400);
    const maxW0 = Math.max(...pts.map((p) => p[0]));
    expect(maxW0 / Math.sqrt(2.3 * f.current[0][0])).toBeCloseTo(1, 3);
  });

  it("universo intermediário: f = 0 é o ΛCDM e f = 1 é o ponto do DESI", () => {
    expect(truthBetween(0)).toEqual(TRUTHS.lcdm);
    for (const k of ["omegaM", "h0", "w0", "wa"] as const) expect(truthBetween(1)[k]).toBeCloseTo(TRUTHS.desi[k], 12);
  });

  it("se a energia escura variar menos que o melhor ajuste do DESI, a separação cai (≈ proporcional à fração)", () => {
    const sep = (f: number) => {
      const t = truthBetween(f);
      return wSeparation(sirenForecastAt("et-otimista", t).combined, TRUTHS.lcdm, { w0: t.w0, wa: t.wa }).sigma;
    };
    const full = sep(1);
    const half = sep(0.5);
    expect(full).toBeCloseTo(sirenFisherSeparation("et-otimista", "desi", true).sigma, 6);
    expect(half).toBeLessThan(full);
    expect(half / full).toBeGreaterThan(0.4);
    expect(half / full).toBeLessThan(0.6);
    expect(sep(0)).toBeCloseTo(0, 6);
  });
});

describe("dados reais e simulados nunca se misturam", () => {
  const small: GridSpec = { w0: [-1.2, -0.2], wa: [-2.5, 0.5], n0: 9, na: 9 };
  const realPanel = () => {
    const grid = scanGrid("bao+cmb+sn", small);
    return { best: grid.best, lcdm: profileAt(-1, 0, "bao+cmb+sn", grid.best.params), desi: profileAt(-0.682, -0.999, "bao+cmb+sn", grid.best.params) };
  };

  it("o painel de dados reais dá exatamente os mesmos números antes e depois de usar a previsão", () => {
    const data = JSON.stringify([DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3]);
    const before = realPanel();
    for (const id of SCENARIOS) for (const f of [0, 0.5, 1]) sirenForecastAt(id, truthBetween(f));
    sirenSeparation("et-otimista", "lcdm", true);
    const after = realPanel();
    expect(after).toEqual(before);
    expect(JSON.stringify([DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3])).toBe(data);
    // Os números que o painel mostra hoje: ΛCDM a Δχ² = 14,1 do melhor ajuste (3,3σ).
    expect(before.lcdm.chi2 - before.best.chi2).toBeCloseTo(14.08, 1);
  });

  it("o código do painel real não importa nada da previsão", () => {
    const read = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
    for (const f of ["./cosmoLikelihood.ts", "./cosmoFit.ts", "../data/cosmo/index.ts", "../modules/confronto-com-dados-reais/gridProtocol.ts", "../modules/confronto-com-dados-reais/grid.worker.ts"]) {
      expect(read(f)).not.toMatch(/from ['"][^'"]*(sirens|SirenForecast)['"]|sirenes\.json/);
    }
    // A seção de previsão fica num componente próprio, que não recebe nada do painel real.
    expect(read("../modules/confronto-com-dados-reais/Page.tsx")).toMatch(/<SirenForecast \/>/);
  });
});
