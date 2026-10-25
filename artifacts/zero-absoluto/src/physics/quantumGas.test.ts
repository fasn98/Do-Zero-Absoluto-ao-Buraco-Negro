import { describe, expect, it } from "vitest";
import {
  CRITICAL_PHASE_SPACE_DENSITY,
  HELIUM_4_MASS_KG,
  RUBIDIUM_87_MASS_KG,
  condensateFraction,
  criticalDensityM3,
  criticalTemperatureK,
  phaseSpaceDensity,
  sampleVelocity2D,
  thermalWavelengthM,
  velocityComponentSigma,
  zeroPointEnergyJ,
} from "./quantumGas";
import { boltzmannConstant } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("gás de Bose perto do zero absoluto (Módulo 1)", () => {
  it("λ térmico do rubídio-87 a 170 nK ≈ 0,454 μm", () => {
    // h / √(2π · 1,443e-25 kg · 1,381e-23 J/K · 1,7e-7 K)
    within2(thermalWavelengthM(RUBIDIUM_87_MASS_KG, 1.7e-7), 4.54e-7);
  });

  it("λ cresce como 1/√T", () => {
    const ratio = thermalWavelengthM(RUBIDIUM_87_MASS_KG, 1e-6) / thermalWavelengthM(RUBIDIUM_87_MASS_KG, 1e-4);
    within2(ratio, 10);
  });

  it("valor crítico n·λ³ = ζ(3/2) ≈ 2,612", () => {
    within2(CRITICAL_PHASE_SPACE_DENSITY, 2.612);
  });

  it("T_c e densidade crítica são consistentes entre si", () => {
    const n = criticalDensityM3(RUBIDIUM_87_MASS_KG, 1.7e-7);
    within2(criticalTemperatureK(n, RUBIDIUM_87_MASS_KG), 1.7e-7);
    within2(phaseSpaceDensity(n, RUBIDIUM_87_MASS_KG, 1.7e-7), 2.612);
  });

  it("estimativa de London para o hélio-4 líquido (145 kg/m³): T_c ≈ 3,1 K", () => {
    // F. London (1938): gás ideal de Bose com a densidade do hélio líquido → 3,13 K
    within2(criticalTemperatureK(145 / HELIUM_4_MASS_KG, HELIUM_4_MASS_KG), 3.13);
  });

  it("fração condensada: 0 acima de T_c, 1 em T = 0", () => {
    expect(condensateFraction(2, 1)).toBe(0);
    expect(condensateFraction(0, 1)).toBe(1);
    within2(condensateFraction(0.5, 1), 1 - 0.5 ** 1.5);
  });

  it("energia de ponto zero para ω = 2π × 100 Hz ≈ 3,31 × 10⁻³² J (≈ 2,4 nK)", () => {
    const E0 = zeroPointEnergyJ(2 * Math.PI * 100);
    within2(E0, 3.313e-32);
    within2(E0 / boltzmannConstant, 2.4e-9);
  });

  it("velocidades sorteadas têm a variância de Maxwell-Boltzmann", () => {
    let seed = 12345;
    const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const samples = Array.from({ length: 20000 }, () => sampleVelocity2D(RUBIDIUM_87_MASS_KG, 1e-6, random));
    const variance = samples.reduce((sum, [vx]) => sum + vx * vx, 0) / samples.length;
    within2(Math.sqrt(variance), velocityComponentSigma(RUBIDIUM_87_MASS_KG, 1e-6));
  });
});
