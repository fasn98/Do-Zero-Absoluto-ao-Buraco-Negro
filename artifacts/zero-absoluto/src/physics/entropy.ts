/**
 * Módulo 2 — Entropia de Boltzmann, demônio de Maxwell e princípio de Landauer.
 * Contagens de microestados ficam sempre em ln W para não estourar.
 */
import { avogadroConstant, boltzmannConstant } from "./constants";
import { assertFiniteNumber } from "./calculations";
import { lnBinomial } from "./logmath";

/**
 * ln W para N partículas distinguíveis com nLeft na metade esquerda da caixa:
 * W = C(N, nLeft), contando quais partículas estão de cada lado.
 */
export function lnMicrostates(total: number, nLeft: number): number {
  return lnBinomial(total, nLeft);
}

/** S = k ln W, em J/K. */
export function boltzmannEntropyJK(lnW: number): number {
  return boltzmannConstant * lnW;
}

/** log₁₀ da probabilidade de todas as N partículas estarem na mesma metade: 2^(−N). */
export function log10ProbabilityAllInOneHalf(total: number): number {
  return -total * Math.log10(2);
}

/** ΔS de 1 mol de gás ideal que dobra de volume a temperatura constante: R ln 2, em J/K. */
export function molarFreeExpansionEntropyJK(): number {
  return avogadroConstant * boltzmannConstant * Math.LN2;
}

/** Princípio de Landauer: energia mínima dissipada ao apagar 1 bit, kT ln 2, em J. */
export function landauerLimitJ(temperatureK: number): number {
  assertFiniteNumber(temperatureK, "A temperatura");
  if (temperatureK < 0) throw new RangeError("A temperatura não pode ser negativa.");
  return boltzmannConstant * temperatureK * Math.LN2;
}

/** Entropia mínima produzida no ambiente ao apagar n bits: n k ln 2, em unidades de k. */
export function erasureEntropyOverK(bits: number): number {
  return bits * Math.LN2;
}

export type TwoChamberState = { nLeft: number; nRight: number; tLeft: number; tRight: number };

/**
 * Entropia (em unidades de k, a menos de constante) de um gás ideal
 * monoatômico 2D em duas câmaras de mesma área. Em 2D, a capacidade
 * térmica é k por partícula, logo S/k = Σ Nᵢ ln Tᵢ + ln C(N, N_esq) + const.
 */
export function twoChamberEntropyOverK(state: TwoChamberState): number {
  const total = state.nLeft + state.nRight;
  const thermal =
    (state.nLeft > 0 ? state.nLeft * Math.log(state.tLeft) : 0) +
    (state.nRight > 0 ? state.nRight * Math.log(state.tRight) : 0);
  return thermal + lnBinomial(total, state.nLeft);
}
