import { describe, expect, it } from "vitest";
import {
  bekensteinHawkingEntropyOverK,
  evaporationTimeS,
  hawkingTemperatureK,
  massForHawkingTemperatureKg,
  schwarzschildRadiusM,
} from "./blackHole";
import { cmbTemperature, julianYear, solarMass } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("buracos negros (Módulo 5)", () => {
  it("1 massa solar: T_H ≈ 6,2 × 10⁻⁸ K", () => {
    within2(hawkingTemperatureK(solarMass), 6.17e-8);
  });

  it("1 massa solar: raio de Schwarzschild ≈ 2,95 km", () => {
    within2(schwarzschildRadiusM(solarMass), 2953);
  });

  it("1 massa solar: S/k ≈ 1,05 × 10⁷⁷", () => {
    within2(bekensteinHawkingEntropyOverK(solarMass), 1.05e77);
  });

  it("entropia proporcional à área (M²)", () => {
    within2(bekensteinHawkingEntropyOverK(2 * solarMass) / bekensteinHawkingEntropyOverK(solarMass), 4);
  });

  it("1 massa solar evapora em ≈ 2,1 × 10⁶⁷ anos (só fótons)", () => {
    within2(evaporationTimeS(solarMass) / julianYear, 2.1e67);
  });

  it("massa com T_H igual à da radiação cósmica de fundo ≈ 4,5 × 10²² kg", () => {
    within2(massForHawkingTemperatureKg(cmbTemperature), 4.50e22);
    within2(hawkingTemperatureK(massForHawkingTemperatureKg(1e3)), 1e3);
  });
});
