import { describe, expect, it } from "vitest";
import {
  bekensteinBoundOverK,
  entropyOverKToBits,
  holographicBoundOverK,
  isInsideOwnHorizon,
  planckLengthM,
  planckVolumeBits,
  restEnergyJ,
} from "./holography";
import { bekensteinHawkingEntropyOverK, schwarzschildRadiusM } from "./blackHole";
import { solarMass } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("limite holográfico e de Bekenstein (Módulo 7, Seção 1)", () => {
  it("comprimento de Planck: l_P ≈ 1,616 × 10⁻³⁵ m e l_P² ≈ 2,61 × 10⁻⁷⁰ m²", () => {
    within2(planckLengthM(), 1.616e-35);
    within2(planckLengthM() ** 2, 2.61e-70);
  });

  it("R = 1 m: S_máx/k ≈ 1,20 × 10⁷⁰, ou ≈ 1,74 × 10⁷⁰ bits", () => {
    within2(holographicBoundOverK(1), 1.2e70);
    within2(entropyOverKToBits(holographicBoundOverK(1)), 1.74e70);
  });

  it("Bekenstein para 1 kg em R = 1 m: S/k ≤ 1,79 × 10⁴³, ou ≈ 2,58 × 10⁴³ bits", () => {
    within2(bekensteinBoundOverK(1, restEnergyJ(1)), 1.79e43);
    within2(entropyOverKToBits(bekensteinBoundOverK(1, restEnergyJ(1))), 2.58e43);
  });

  it("buraco negro de 1 massa solar: limite holográfico no horizonte = Bekenstein-Hawking ≈ 1,05 × 10⁷⁷ (Módulo 5)", () => {
    const rs = schwarzschildRadiusM(solarMass);
    within2(holographicBoundOverK(rs), 1.05e77);
    within2(holographicBoundOverK(rs), bekensteinHawkingEntropyOverK(solarMass));
  });

  it("no próprio horizonte, o limite de Bekenstein coincide com a entropia do buraco negro", () => {
    const rs = schwarzschildRadiusM(solarMass);
    within2(bekensteinBoundOverK(rs, restEnergyJ(solarMass)), bekensteinHawkingEntropyOverK(solarMass));
  });

  it("a contagem por volume ultrapassa o limite holográfico já a partir de ~1,08 l_P", () => {
    const lP = planckLengthM();
    const bitsHolo = (R: number) => entropyOverKToBits(holographicBoundOverK(R));
    expect(planckVolumeBits(1.0 * lP)).toBeLessThan(bitsHolo(1.0 * lP));
    expect(planckVolumeBits(1.2 * lP)).toBeGreaterThan(bitsHolo(1.2 * lP));
    expect(planckVolumeBits(1e-15)).toBeGreaterThan(bitsHolo(1e-15));
  });

  it("detecta quando a massa já estaria dentro do próprio horizonte", () => {
    expect(isInsideOwnHorizon(1, 1)).toBe(false);
    expect(isInsideOwnHorizon(solarMass, 1000)).toBe(true);
  });
});
