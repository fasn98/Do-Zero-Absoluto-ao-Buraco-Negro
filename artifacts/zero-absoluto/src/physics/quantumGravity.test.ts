import { describe, expect, it } from "vitest";
import {
  PAGE_TIME_FRACTION,
  blackHoleEntropyFraction,
  hawkingRadiationEntropyFraction,
  massFraction,
  pageRadiationEntropyFraction,
} from "./pageCurve";
import {
  SUPERPOSITION_RECORD_KG,
  diamondSphereRadiusM,
  gravitationalPhaseRad,
  ratioToSuperpositionRecord,
  spheresOverlap,
} from "./gravityEntanglement";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("curva de Page (Módulo 7, Seção 2)", () => {
  it("tempo de Page: t = 1 − 2^(−3/2) ≈ 0,646 t_evap, quando S_BH = S₀/2", () => {
    within2(PAGE_TIME_FRACTION, 0.646);
    within2(blackHoleEntropyFraction(PAGE_TIME_FRACTION), 0.5);
  });

  it("extremos: no início nada foi irradiado; no fim o buraco sumiu", () => {
    expect(massFraction(0)).toBe(1);
    expect(massFraction(1)).toBe(0);
    expect(hawkingRadiationEntropyFraction(0)).toBe(0);
    expect(hawkingRadiationEntropyFraction(1)).toBe(1);
    expect(pageRadiationEntropyFraction(1)).toBe(0);
  });

  it("Hawking só cresce; Page sobe até 1/2 no tempo de Page e depois desce", () => {
    within2(pageRadiationEntropyFraction(PAGE_TIME_FRACTION), 0.5);
    expect(pageRadiationEntropyFraction(0.3)).toBeCloseTo(hawkingRadiationEntropyFraction(0.3), 12);
    expect(pageRadiationEntropyFraction(0.9)).toBeLessThan(hawkingRadiationEntropyFraction(0.9));
    expect(pageRadiationEntropyFraction(0.9)).toBeLessThan(pageRadiationEntropyFraction(0.6));
    expect(() => massFraction(1.1)).toThrow(RangeError);
  });
});

describe("emaranhamento mediado pela gravidade (Módulo 7, Seção 4)", () => {
  it("m = 10⁻¹⁴ kg, d = 200 µm, τ = 2,5 s → φ ≈ 0,79 rad", () => {
    within2(gravitationalPhaseRad(1e-14, 200e-6, 2.5), 0.79);
  });

  it("esfera de diamante de 10⁻¹⁴ kg tem raio ≈ 0,88 µm", () => {
    within2(diamondSphereRadiusM(1e-14), 8.79e-7);
  });

  it("10⁻¹⁴ kg é ~10⁸ vezes o recorde de superposição (~25.000 u ≈ 4,15 × 10⁻²³ kg)", () => {
    within2(SUPERPOSITION_RECORD_KG, 4.15e-23);
    within2(ratioToSuperpositionRecord(1e-14), 2.41e8);
  });

  it("detecta esferas que se sobreporiam: 10⁻¹¹ kg (raio ≈ 8,8 µm) a 10 µm, sim; 10⁻¹⁴ kg a 200 µm, não", () => {
    expect(spheresOverlap(1e-11, 10e-6)).toBe(true);
    expect(spheresOverlap(1e-14, 200e-6)).toBe(false);
  });
});
