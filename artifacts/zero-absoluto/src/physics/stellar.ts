/**
 * Módulo 6 — Formação do Sol: escalas de tempo e o Sol jovem fraco.
 */
import { gravitationalConstant, solarAge } from "./constants";
import { assertPositive } from "./calculations";

/** Escala de tempo de Kelvin-Helmholtz t_KH = G M² / (R L), em segundos. */
export function kelvinHelmholtzTimeS(massKg: number, radiusM: number, luminosityW: number): number {
  assertPositive(massKg, "A massa");
  assertPositive(radiusM, "O raio");
  assertPositive(luminosityW, "A luminosidade");
  return (gravitationalConstant * massKg ** 2) / (radiusM * luminosityW);
}

/** Tempo de queda livre de uma nuvem homogênea t_ff = √(3π / (32 G ρ)), em segundos. */
export function freeFallTimeS(densityKgM3: number): number {
  assertPositive(densityKgM3, "A densidade");
  return Math.sqrt((3 * Math.PI) / (32 * gravitationalConstant * densityKgM3));
}

/**
 * Aproximação de Gough (1981) para a luminosidade do Sol na sequência principal:
 * L(t)/L☉ = 1 / (1 + 0,4 (1 − t/t☉)), com t em anos desde a chegada à
 * sequência principal e t☉ = 4,57 bilhões de anos.
 */
export function goughLuminosityRatio(timeYears: number): number {
  if (timeYears < 0) throw new RangeError("A aproximação de Gough vale a partir da sequência principal.");
  return 1 / (1 + 0.4 * (1 - timeYears / solarAge));
}
