import { describe, expect, it } from "vitest";
import reference from "../data/cosmo/validacao_sirenes.json";
import { TRUTHS, expectedEvents, sirenFisherForecast, sirenFisherSeparation, sirenLcdmRelativeErrors, sirenScenario, sirenSeparation, type SirenScenarioId } from "./sirens";

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
    within(r.omegaM, 0.0368, 0.25); // Fisher × MCMC publicado: fator 1,19
  });

  it("Speri et al. (2021), Tabela I: 15 sirenes popIII, 3% em h e 16% em Ω_m (o Fisher dá ~1,4 vez menos)", () => {
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
