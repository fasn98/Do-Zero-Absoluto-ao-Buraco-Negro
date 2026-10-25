import { describe, expect, it } from "vitest";
import {
  MAX_FUSIONS_BY_STICKING,
  MUON_ELECTRON_MASS_RATIO,
  bohrRadiusM,
  breakEvenFusions,
  energyPerMuonJ,
  fusionsBeforeSticking,
  isBeyondStickingLimit,
  muonSurvival,
  muonicSizeRatio,
} from "./muonCatalysis";
import { REACTIONS, gamowEnergyJ, gamowPeakEnergyJ, jToMeV, kTJ, lnTunnelingProbability } from "./gamow";
import { deuteronMass, electronMass, muonLifetime, protonMass } from "./constants";
import { reducedMassKg } from "./gamow";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("fusão por múons (Módulo 4)", () => {
  it("múon é ~207 vezes mais pesado que o elétron", () => {
    within2(MUON_ELECTRON_MASS_RATIO, 206.77);
  });

  it("raio de Bohr do hidrogênio ≈ 52,9 pm (com massa reduzida)", () => {
    within2(bohrRadiusM(reducedMassKg(electronMass, protonMass)), 5.2946e-11);
  });

  it("átomo múonico de deutério é ~196 vezes menor (massa reduzida)", () => {
    within2(muonicSizeRatio(deuteronMass), 195.8);
  });

  it("vida média do múon ≈ 2,2 μs", () => {
    within2(muonLifetime, 2.2e-6);
    within2(muonSurvival(muonLifetime), Math.exp(-1));
  });

  it("aderência de 0,7% limita a ~143 fusões; 150 fusões liberam ≈ 2,64 GeV", () => {
    within2(fusionsBeforeSticking(0.007), 142.9);
    within2(jToMeV(energyPerMuonJ(150)), 2638);
  });

  it("com custo de ~5 GeV por múon, o empate exige ~284 fusões", () => {
    within2(breakEvenFusions(), 284.3);
  });

  it("a 300 K, a chance de tunelamento D+D no pico de Gamow é < 10⁻¹⁵⁰", () => {
    const dd = REACTIONS.dd;
    const EG = gamowEnergyJ(dd);
    // E_G(D+D) = 2 · (m_d/2) c² (πα)² ≈ 0,986 MeV
    within2(jToMeV(EG), 0.986);
    const log10P = lnTunnelingProbability(gamowPeakEnergyJ(EG, kTJ(300)), EG) / Math.LN10;
    expect(log10P).toBeLessThan(-150);
  });

  it("acima de ~250 fusões por múon (aderência de 0,4%) o valor é hipotético", () => {
    within2(MAX_FUSIONS_BY_STICKING, 250);
    expect(isBeyondStickingLimit(150)).toBe(false);
    expect(isBeyondStickingLimit(250)).toBe(false);
    expect(isBeyondStickingLimit(251)).toBe(true);
    expect(isBeyondStickingLimit(2000)).toBe(true);
  });

  it("2 raios de Bohr ≈ 106 pm: distância de equilíbrio do íon H₂⁺ (2,00 a₀), não da molécula H₂ (74 pm)", () => {
    within2(2 * bohrRadiusM(reducedMassKg(electronMass, deuteronMass)), 1.057e-10);
  });
});
