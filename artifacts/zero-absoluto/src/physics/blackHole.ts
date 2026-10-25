/**
 * Módulo 5 — Termodinâmica de buracos negros de Schwarzschild
 * (sem carga, sem rotação), na aproximação semiclássica de Hawking (1974).
 */
import {
  boltzmannConstant,
  gravitationalConstant,
  reducedPlanckConstant,
  speedOfLight,
} from "./constants";
import { assertPositive, schwarzschildRadiusM } from "./calculations";

export { hawkingTemperatureK, schwarzschildRadiusM } from "./calculations";

/** Área do horizonte A = 4π r_s², em m². */
export function horizonAreaM2(massKg: number): number {
  return 4 * Math.PI * schwarzschildRadiusM(massKg) ** 2;
}

/** Entropia de Bekenstein-Hawking em unidades de k: S/k = c³ A / (4 G ħ). */
export function bekensteinHawkingEntropyOverK(massKg: number): number {
  return (speedOfLight ** 3 * horizonAreaM2(massKg)) / (4 * gravitationalConstant * reducedPlanckConstant);
}

/** Entropia de Bekenstein-Hawking em J/K. */
export function bekensteinHawkingEntropyJK(massKg: number): number {
  return boltzmannConstant * bekensteinHawkingEntropyOverK(massKg);
}

/**
 * Tempo de evaporação t ≈ 5120 π G² M³ / (ħ c⁴), em segundos. Considera
 * apenas emissão de fótons; partículas adicionais encurtam esse tempo.
 */
export function evaporationTimeS(massKg: number): number {
  assertPositive(massKg, "A massa");
  return (5120 * Math.PI * gravitationalConstant ** 2 * massKg ** 3) / (reducedPlanckConstant * speedOfLight ** 4);
}

/** Massa cuja temperatura de Hawking é T: M = ħ c³ / (8π G k T). */
export function massForHawkingTemperatureKg(temperatureK: number): number {
  assertPositive(temperatureK, "A temperatura");
  return (reducedPlanckConstant * speedOfLight ** 3) / (8 * Math.PI * gravitationalConstant * boltzmannConstant * temperatureK);
}
