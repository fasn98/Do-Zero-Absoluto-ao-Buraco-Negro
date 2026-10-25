import { describe, expect, it } from "vitest";
import {
  REACTIONS,
  coulombBarrierJ,
  dtFusionEnergyJ,
  gamowCurves,
  gamowEnergyJ,
  gamowPeakEnergyJ,
  gamowWidthJ,
  jToKeV,
  jToMeV,
  kTJ,
  lnClassicalProbability,
  lnReactionIntegral,
  lnRelativeRate,
} from "./gamow";
import { lnBinomial, lnGamma, logIntegrateLogGrid, logSumExp } from "./logmath";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("logmath", () => {
  it("log-sum-exp não sofre underflow", () => {
    expect(logSumExp([-1000, -1000])).toBeCloseTo(-1000 + Math.log(2), 10);
    expect(logSumExp([])).toBe(-Infinity);
  });
  it("integra exp(−x) de 1e-6 a 50 ≈ 1", () => {
    expect(Math.exp(logIntegrateLogGrid((x) => -x, 1e-6, 50))).toBeCloseTo(1, 3);
  });
  it("lnGamma e lnBinomial", () => {
    expect(lnGamma(5)).toBeCloseTo(Math.log(24), 10);
    expect(lnGamma(0.5)).toBeCloseTo(0.5 * Math.log(Math.PI), 10);
    expect(lnBinomial(4, 2)).toBeCloseTo(Math.log(6), 10);
  });
});

describe("pico de Gamow (Módulo 3)", () => {
  const pp = REACTIONS.pp;

  it("energia de Gamow p+p ≈ 493 keV", () => {
    within2(jToKeV(gamowEnergyJ(pp)), 493);
  });

  it("núcleo do Sol, 15,7 milhões K: kT ≈ 1,35 keV e E₀ ≈ 6,1 keV", () => {
    const kT = kTJ(15.7e6);
    within2(jToKeV(kT), 1.35);
    within2(jToKeV(gamowPeakEnergyJ(gamowEnergyJ(pp), kT)), 6.1);
  });

  it("ITER, 150 milhões K: E₀ ≈ 27 keV (p+p)", () => {
    within2(jToKeV(gamowPeakEnergyJ(gamowEnergyJ(pp), kTJ(150e6))), 27);
  });

  it("largura Δ = (4/√3)√(E₀kT) no núcleo do Sol ≈ 6,6 keV", () => {
    const kT = kTJ(15.7e6);
    const E0 = gamowPeakEnergyJ(gamowEnergyJ(pp), kT);
    // (4/√3)·√(6,09 × 1,353) keV
    within2(jToKeV(gamowWidthJ(E0, kT)), 6.63);
  });

  it("barreira de Coulomb: p+p ≈ 0,60 MeV e D+T ≈ 0,44 MeV", () => {
    // 1,44 MeV·fm / (1,2 × 2 fm) e 1,44 / (1,2 × (2^(1/3) + 3^(1/3)))
    within2(jToMeV(coulombBarrierJ(pp)), 0.6);
    within2(jToMeV(coulombBarrierJ(REACTIONS.dt)), 0.444);
  });

  it("integral numérica concorda com a aproximação gaussiana do pico", () => {
    // ∫ ≈ (√π/2) Δ exp(−τ) (1 + 5/(12τ)), τ = 3E₀/kT (Clayton 1968, eq. 4-64)
    const T = 15.7e6;
    const kT = kTJ(T);
    const EG = gamowEnergyJ(pp);
    const E0 = gamowPeakEnergyJ(EG, kT);
    const delta = gamowWidthJ(E0, kT);
    const tau = (3 * E0) / kT;
    const lnApprox =
      Math.log((Math.sqrt(Math.PI) / 2) * jToKeV(delta) * (1 + 5 / (12 * tau))) - tau - 1.5 * Math.log(jToKeV(kT));
    within2(Math.exp(lnReactionIntegral(pp, T) - lnApprox), 1);
  });

  it("taxa relativa: 1 no núcleo do Sol, cresce com T e não sofre underflow a 300 K", () => {
    expect(lnRelativeRate(pp, 1.57e7)).toBeCloseTo(0, 10);
    expect(lnRelativeRate(pp, 4e7)).toBeGreaterThan(0);
    const ln300 = lnRelativeRate(pp, 300);
    expect(Number.isFinite(ln300)).toBe(true);
    // 3E₀/kT a 300 K ≈ 505 contra ≈ 13,5 no Sol: diferença ≈ −490 em ln
    expect(ln300).toBeLessThan(-450);
  });

  it("previsão clássica no Sol é exp(−443) ≈ 10⁻¹⁹²", () => {
    const ln = lnClassicalProbability(pp, 15.7e6);
    within2(ln, -0.6e3 / 1.353);
  });

  it("curvas normalizadas têm máximo 1 e o produto atinge o pico perto de E₀", () => {
    const kT = kTJ(15.7e6);
    const E0 = gamowPeakEnergyJ(gamowEnergyJ(pp), kT);
    const { curve, lnProductAmplification } = gamowCurves(pp, 15.7e6, 4 * E0, 400);
    const peak = curve.reduce((a, b) => (b.product > a.product ? b : a));
    within2(peak.energyJ, E0);
    expect(Math.max(...curve.map((p) => p.boltzmann))).toBeCloseTo(1);
    expect(lnProductAmplification).toBeGreaterThan(0);
  });

  it("D + T libera ≈ 17,59 MeV", () => {
    within2(jToMeV(dtFusionEnergyJ()), 17.59);
  });
});
