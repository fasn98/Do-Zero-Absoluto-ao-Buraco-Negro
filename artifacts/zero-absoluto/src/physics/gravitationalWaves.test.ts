import { describe, expect, it } from "vitest";
import {
  GW150914,
  chirpMass,
  chirpWaveform,
  detectorFrameMass,
  frequencyAtTimeToMergerHz,
  iscoFrequencyHz,
  phaseAtTimeToMerger,
  solarMassEnergyJ,
  timeToMergerS,
} from "./gravitationalWaves";
import { GW170817, H0_MEASUREMENTS, combineInQuadrature, hubbleConstant, tensionSigma } from "./hubble";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);
const byId = (id: string) => H0_MEASUREMENTS.find((m) => m.id === id)!;

describe("chirp de GW150914 (Módulo 8, Seção 1)", () => {
  it("massa de chirp (36, 29): ≈ 28,1 M☉ na fonte e ≈ 30,6 M☉ no detector (1 + z ≈ 1,09)", () => {
    within2(chirpMass(36, 29), 28.1);
    within2(detectorFrameMass(chirpMass(36, 29), GW150914.redshift), 30.6);
  });

  it("τ(35 Hz) com 𝓜 = 30 M☉ ≈ 0,170 s", () => {
    within2(timeToMergerS(35, 30), 0.17);
  });

  it("f(τ) inverte τ(f)", () => {
    within2(frequencyAtTimeToMergerHz(timeToMergerS(35, 30), 30), 35);
    within2(frequencyAtTimeToMergerHz(timeToMergerS(120, 8), 8), 120);
  });

  it("dΦ/dt = 2πf: a fase é consistente com a frequência", () => {
    const tau = 0.05;
    const dt = 1e-6;
    const dPhi = phaseAtTimeToMerger(tau - dt, 30) - phaseAtTimeToMerger(tau, 30);
    within2(dPhi / dt, 2 * Math.PI * frequencyAtTimeToMergerHz(tau, 30));
  });

  it("f_ISCO para M = 65 × 1,09 M☉ ≈ 62 Hz", () => {
    within2(iscoFrequencyHz(65 * 1.09), 62);
  });

  it("3 M☉ c² ≈ 5,36 × 10⁴⁷ J", () => {
    within2(solarMassEnergyJ(3), 5.36e47);
  });

  it("forma de onda termina em f_ISCO com amplitude igual ao pico", () => {
    const wave = chirpWaveform(30, 35, 62, 1e-21, 400);
    expect(wave[0].t).toBeLessThan(0);
    expect(Math.max(...wave.map((s) => Math.abs(s.h)))).toBeLessThanOrEqual(1e-21 * (1 + 1e-12));
    within2(Math.abs(wave.at(-1)!.h) / Math.abs(Math.cos(phaseAtTimeToMerger(timeToMergerS(62, 30), 30))), 1e-21);
  });
});

describe("sirene padrão e tensão de Hubble (Módulo 8, Seções 2 e 3)", () => {
  it("GW170817: v ≈ 3.017 km/s e d ≈ 43,8 Mpc → H₀ ≈ 68,9 km/s/Mpc", () => {
    within2(hubbleConstant(GW170817.recessionVelocityKmS, GW170817.distanceMpc), 68.9);
  });

  it("CCHP: 1,22 (estat.) e 1,33 (sist.) combinadas em quadratura ≈ 1,80", () => {
    within2(combineInQuadrature(1.22, 1.33), 1.805);
    within2(byId("cchp").plus, 1.805);
  });

  it("Planck × SH0ES ≈ 4,9σ; Planck × CCHP ≈ 1,6σ", () => {
    within2(tensionSigma(byId("planck"), byId("shoes")), 4.9);
    within2(tensionSigma(byId("planck"), byId("cchp")), 1.6);
    within2(tensionSigma(byId("shoes"), byId("planck")), 4.9);
  });

  it("incerteza assimétrica: usa o lado voltado para a outra medição", () => {
    // Planck (67,4 ± 0,5) abaixo de GW170817 (70 +12 −8): usa −8 de GW170817
    within2(tensionSigma(byId("planck"), byId("gw170817")), 2.6 / Math.hypot(0.5, 8));
    // H0DN (73,5 ± 0,81) acima: usa +12 de GW170817
    within2(tensionSigma(byId("h0dn"), byId("gw170817")), 3.5 / Math.hypot(0.81, 12));
  });
});
