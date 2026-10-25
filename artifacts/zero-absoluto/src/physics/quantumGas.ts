/**
 * Módulo 1 — Gás ideal de bósons perto do zero absoluto.
 * Referência: Pethick & Smith, Bose-Einstein Condensation in Dilute Gases, cap. 2.
 */
import {
  atomicMassConstant,
  boltzmannConstant,
  helium4RelativeMass,
  planckConstant,
  reducedPlanckConstant,
  rubidium87RelativeMass,
  zeta3Over2,
} from "./constants";
import { assertPositive } from "./calculations";

export const RUBIDIUM_87_MASS_KG = rubidium87RelativeMass * atomicMassConstant;
export const HELIUM_4_MASS_KG = helium4RelativeMass * atomicMassConstant;

/** Comprimento de onda térmico de de Broglie λ = h / √(2π m k T), em metros. */
export function thermalWavelengthM(massKg: number, temperatureK: number): number {
  assertPositive(massKg, "A massa");
  assertPositive(temperatureK, "A temperatura");
  return planckConstant / Math.sqrt(2 * Math.PI * massKg * boltzmannConstant * temperatureK);
}

/** Densidade no espaço de fase n·λ³ (adimensional). */
export function phaseSpaceDensity(densityM3: number, massKg: number, temperatureK: number): number {
  return densityM3 * thermalWavelengthM(massKg, temperatureK) ** 3;
}

/** Valor crítico de n·λ³ para condensação de um gás ideal uniforme: ζ(3/2) ≈ 2,612. */
export const CRITICAL_PHASE_SPACE_DENSITY = zeta3Over2;

/** Temperatura crítica do gás ideal uniforme: T_c = (2πħ²/(m k)) (n/ζ(3/2))^(2/3). */
export function criticalTemperatureK(densityM3: number, massKg: number): number {
  assertPositive(densityM3, "A densidade");
  assertPositive(massKg, "A massa");
  return ((2 * Math.PI * reducedPlanckConstant ** 2) / (massKg * boltzmannConstant)) *
    (densityM3 / zeta3Over2) ** (2 / 3);
}

/** Densidade que torna n·λ³ = ζ(3/2) a uma dada temperatura. */
export function criticalDensityM3(massKg: number, temperatureK: number): number {
  return zeta3Over2 / thermalWavelengthM(massKg, temperatureK) ** 3;
}

/** Fração condensada do gás ideal uniforme: 1 − (T/T_c)^(3/2) abaixo de T_c, zero acima. */
export function condensateFraction(temperatureK: number, criticalK: number): number {
  if (temperatureK >= criticalK) return 0;
  return 1 - (temperatureK / criticalK) ** 1.5;
}

/** Energia de ponto zero do oscilador harmônico E₀ = ½ ħ ω, em joules (ω em rad/s). */
export function zeroPointEnergyJ(angularFrequency: number): number {
  assertPositive(angularFrequency, "A frequência angular");
  return 0.5 * reducedPlanckConstant * angularFrequency;
}

/** Desvio-padrão de cada componente da velocidade de Maxwell-Boltzmann: √(kT/m), em m/s. */
export function velocityComponentSigma(massKg: number, temperatureK: number): number {
  return Math.sqrt((boltzmannConstant * temperatureK) / massKg);
}

/**
 * Sorteia uma velocidade 2D de Maxwell-Boltzmann (cada componente gaussiana
 * com σ = √(kT/m)) pelo método de Box-Muller. `random` é injetável para testes.
 */
export function sampleVelocity2D(massKg: number, temperatureK: number, random: () => number = Math.random): [number, number] {
  const sigma = velocityComponentSigma(massKg, temperatureK);
  const u1 = Math.max(random(), 1e-12);
  const u2 = random();
  const radius = Math.sqrt(-2 * Math.log(u1));
  return [sigma * radius * Math.cos(2 * Math.PI * u2), sigma * radius * Math.sin(2 * Math.PI * u2)];
}

export type BecRegime = "gas" | "threshold" | "condensate";

/** Abaixo deste n·λ³ o gás é tratado como comum; entre ele e ζ(3/2), está no limiar. */
export const THRESHOLD_PHASE_SPACE_DENSITY = 2.5;

/**
 * Regime do gás ideal de Bose pela densidade no espaço de fase. A tolerância
 * relativa de 10⁻⁹ faz T = T_c exato (n·λ³ = ζ(3/2) a menos de arredondamento)
 * contar como limiar, não como condensado.
 */
export function becRegime(psd: number): BecRegime {
  if (psd < THRESHOLD_PHASE_SPACE_DENSITY) return "gas";
  if (psd <= CRITICAL_PHASE_SPACE_DENSITY * (1 + 1e-9)) return "threshold";
  return "condensate";
}
