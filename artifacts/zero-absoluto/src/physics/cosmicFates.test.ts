import { describe, expect, it } from "vitest";
import {
  CPL_MAX_SCALE_FACTOR,
  DESI_DR2_DESY5,
  caldwellBigRipApproxS,
  constantWCosmology,
  desiCosmology,
  recollapse,
  recollapseNumericS,
  recollapseScaleFactor,
  ripLeadTimeS,
  ripStructures,
  secondsToGyr,
  timeToBigRipS,
  tooYoung,
} from "./cosmicFates";
import { ageOfUniverseS, bigRipTimeS, darkEnergyW, hubbleTimeS, lnScaleFactorAtTime, timeAtScaleFactorS } from "./friedmann";
import { julianYear } from "./constants";

const within = (value: number, reference: number, tolerance = 0.02) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(tolerance);
const gyr = (seconds: number) => secondsToGyr(seconds);

describe("parâmetros (H₀ = 67,4, Ω_m = 0,315, Ω_r h² = 4,158 × 10⁻⁵)", () => {
  it("1/H₀ ≈ 14,51 bilhões de anos", () => {
    within(gyr(hubbleTimeS()), 14.51, 0.002);
  });

  it("w = −1 reproduz o ΛCDM do Módulo 2.1: idade de 13,79 bilhões de anos", () => {
    const lcdm = constantWCosmology(-1);
    within(gyr(ageOfUniverseS(lcdm)), 13.79, 0.005);
    expect(ageOfUniverseS(lcdm)).toBe(ageOfUniverseS());
    expect(bigRipTimeS(lcdm)).toBe(Infinity);
  });
});

describe("w constante: Big Rip (Caldwell, Kamionkowski e Weinberg, 2003)", () => {
  it("tempo de hoje até o rasgo, pela integral exata: 115,9; 22,7; 11,2 bilhões de anos", () => {
    within(gyr(timeToBigRipS(constantWCosmology(-1.1))), 115.9);
    within(gyr(timeToBigRipS(constantWCosmology(-1.5))), 22.7);
    within(gyr(timeToBigRipS(constantWCosmology(-2))), 11.2);
    // Mais apertado que os 2%: a integral exata deve bater nas casas mostradas.
    within(gyr(timeToBigRipS(constantWCosmology(-1.5))), 22.72, 0.002);
  });

  it("aproximação de Caldwell, que despreza a matéria: 116,9; 23,4; 11,7", () => {
    within(gyr(caldwellBigRipApproxS(-1.1)), 116.9);
    within(gyr(caldwellBigRipApproxS(-1.5)), 23.4);
    within(gyr(caldwellBigRipApproxS(-2)), 11.7);
    // A matéria freia a expansão: o rasgo exato vem antes do aproximado.
    for (const w of [-1.1, -1.5, -2]) expect(timeToBigRipS(constantWCosmology(w))).toBeLessThan(caldwellBigRipApproxS(w));
  });

  it("valor do artigo: h = 0,7, Ω_m = 0,3 e w = −1,5 dão ≈ 22 bilhões de anos", () => {
    within(gyr(caldwellBigRipApproxS(-1.5, 70, 0.3)), 22, 0.03);
  });

  it("sem rasgo para w ≥ −1", () => {
    expect(timeToBigRipS(constantWCosmology(-0.8))).toBe(Infinity);
    expect(caldwellBigRipApproxS(-1)).toBe(Infinity);
  });

  it("a(t) diverge no rasgo e é o inverso de t(a) antes dele", () => {
    const c = constantWCosmology(-1.5);
    const rip = bigRipTimeS(c);
    expect(lnScaleFactorAtTime(rip * (1 - 1e-6), c)).toBeGreaterThan(10);
    expect(lnScaleFactorAtTime(rip * 1.001, c)).toBe(Infinity);
    const t = rip - 1e9 * julianYear;
    within(timeAtScaleFactorS(Math.exp(lnScaleFactorAtTime(t, c)), c), t, 1e-6);
  });

  it("regra do artigo para estruturas: t ≈ 0,3 P antes do fim com w = −3/2", () => {
    within(ripLeadTimeS(1, -1.5), 0.2807, 0.001);
    const lead = Object.fromEntries(ripStructures().map((s) => [s.id, ripLeadTimeS(s.periodS, -1.5)]));
    const year = julianYear;
    // Exemplos do artigo: aglomerados ~1 bilhão de anos, Via Láctea ~60 milhões, sistema solar ~3 meses, Terra ~30 min.
    expect(lead["aglomerados"] / year).toBeGreaterThan(0.5e9);
    expect(lead["aglomerados"] / year).toBeLessThan(1.5e9);
    within(lead["via-lactea"] / year, 60e6, 0.05);
    within(lead["sistema-solar"] / (year / 12), 3, 0.15);
    within(lead["terra"] / 60, 30, 0.25);
    // Átomos: a regra dá ~4 × 10⁻¹⁷ s; o artigo cita ~10⁻¹⁹ s, sem detalhar a conta.
    within(lead["atomos"], 4.27e-17);
  });
});

describe("Λ negativo, só matéria: recontração", () => {
  it("Ω_Λ = −0,685: t_crunch ≈ 36,7 bilhões de anos, a_máx ≈ 1,35, idade ≈ 8,08 (descartado)", () => {
    const r = recollapse(-0.685);
    within(gyr(r.crunchS), 36.7);
    within(r.aMax, 1.35);
    within(gyr(r.ageS), 8.08);
    expect(tooYoung(r.ageS)).toBe(true);
  });

  it("Ω_Λ = −0,1: t_crunch ≈ 96,1 bilhões de anos, a_máx ≈ 2,22, idade ≈ 9,37 (também descartado)", () => {
    const r = recollapse(-0.1);
    within(gyr(r.crunchS), 96.1);
    within(r.aMax, 2.22);
    within(gyr(r.ageS), 9.37);
    expect(tooYoung(r.ageS)).toBe(true);
  });

  it("a integral numérica coincide com a fórmula analítica", () => {
    for (const omegaL of [-0.685, -0.1, -1, -0.01]) {
      const r = recollapse(omegaL);
      const [age, crunch] = recollapseNumericS(omegaL);
      within(age, r.ageS, 1e-5);
      within(crunch, r.crunchS, 1e-5);
    }
  });

  it("a(t): 1 hoje, a_máx na metade da vida e 0 no Big Crunch", () => {
    const r = recollapse(-0.1);
    within(recollapseScaleFactor(r.ageS, -0.1), 1, 1e-9);
    within(recollapseScaleFactor(r.turnaroundS, -0.1), r.aMax, 1e-9);
    expect(recollapseScaleFactor(r.crunchS, -0.1)).toBe(0);
  });
});

describe("CPL: w(a) = w₀ + w_a (1 − a)", () => {
  it("valores do DESI DR2 + CMB + DESY5 (Tabela V)", () => {
    expect(DESI_DR2_DESY5).toEqual({ w0: -0.752, wa: -0.86, omegaM: 0.3191, h0: 66.74 });
    const c = desiCosmology();
    expect(darkEnergyW(1, c)).toBeCloseTo(-0.752, 12);
    // No passado, w(a) cruza −1: w(a = 0,5) = −0,752 − 0,43 = −1,18.
    expect(darkEnergyW(0.5, c)).toBeCloseTo(-1.182, 12);
  });

  it("w₀ = −1 e w_a = 0 dão o ΛCDM", () => {
    const c = desiCosmology({ w0: -1, wa: 0, omegaM: 0.315, h0: 67.4 });
    within(ageOfUniverseS(c), ageOfUniverseS(), 1e-9);
  });

  it("idade e tempo até a = 2 ficam finitos; além de a = 1000 a CPL não é calculada", () => {
    const c = desiCosmology();
    within(gyr(ageOfUniverseS(c)), 13.76, 0.005);
    const t2 = timeAtScaleFactorS(CPL_MAX_SCALE_FACTOR, c);
    expect(t2).toBeGreaterThan(ageOfUniverseS(c));
    expect(() => timeAtScaleFactorS(1e4, c)).toThrow(RangeError);
  });
});
