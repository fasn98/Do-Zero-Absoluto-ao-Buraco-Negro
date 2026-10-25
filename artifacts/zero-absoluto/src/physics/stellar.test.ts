import { describe, expect, it } from "vitest";
import { freeFallTimeS, goughLuminosityRatio, kelvinHelmholtzTimeS } from "./stellar";
import { atomicMassConstant, julianYear, solarAge, solarLuminosity, solarMass, solarRadius } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("nascimento do Sol (Módulo 6)", () => {
  it("Kelvin-Helmholtz para o Sol atual ≈ 3 × 10⁷ anos", () => {
    // G M☉² / (R☉ L☉) = 6,674e-11 · (1,989e30)² / (6,957e8 · 3,828e26) s ≈ 3,14 × 10⁷ anos
    within2(kelvinHelmholtzTimeS(solarMass, solarRadius, solarLuminosity) / julianYear, 3.14e7);
  });

  it("Gough: t = 0 → ≈ 0,71 L☉; hoje → 1 L☉", () => {
    within2(goughLuminosityRatio(0), 0.714);
    within2(goughLuminosityRatio(solarAge), 1);
    expect(() => goughLuminosityRatio(-1)).toThrow(RangeError);
  });

  it("queda livre de núcleo denso (n(H₂) = 10⁴ cm⁻³) ≈ 3,4 × 10⁵ anos", () => {
    // ρ = n · 2,33 u (massa média por molécula, incluindo hélio)
    const rho = 1e10 * 2.33 * atomicMassConstant;
    within2(freeFallTimeS(rho) / julianYear, 3.4e5);
  });
});
