/**
 * Módulo 10, Seção 3 — Tempo de colapso de Diósi-Penrose (hipótese) para uma
 * esfera homogênea: τ ≈ ħ / E_G. Diósi, Phys. Lett. A 120, 377 (1987);
 * Penrose, Gen. Relativ. Gravit. 28, 581 (1996).
 */
import { gravitationalConstant, reducedPlanckConstant } from "./constants";
import { assertPositive } from "./calculations";

/** Raio de uma esfera homogênea de massa m e densidade ρ, em metros. */
export function sphereRadiusM(massKg: number, densityKgM3: number): number {
  assertPositive(massKg, "A massa");
  assertPositive(densityKgM3, "A densidade");
  return Math.cbrt((3 * massKg) / (4 * Math.PI * densityKgM3));
}

/**
 * Energia gravitacional da diferença entre duas posições de uma esfera
 * homogênea de massa m e raio R, deslocada de d:
 *   d ≥ 2R: E_G = G m² (6/(5R) − 1/d);
 *   d < 2R, λ = d/(2R): E_G = (G m²/R)(2λ² − (3/2)λ³ + (1/5)λ⁵).
 */
export function diosiPenroseEnergyJ(massKg: number, radiusM: number, separationM: number): number {
  assertPositive(massKg, "A massa");
  assertPositive(radiusM, "O raio");
  assertPositive(separationM, "A separação");
  const gm2 = gravitationalConstant * massKg ** 2;
  if (separationM >= 2 * radiusM) return gm2 * (6 / (5 * radiusM) - 1 / separationM);
  const l = separationM / (2 * radiusM);
  return (gm2 / radiusM) * (2 * l ** 2 - 1.5 * l ** 3 + 0.2 * l ** 5);
}

/** Tempo de colapso τ ≈ ħ / E_G, em segundos. */
export function diosiPenroseTimeS(massKg: number, radiusM: number, separationM: number): number {
  return reducedPlanckConstant / diosiPenroseEnergyJ(massKg, radiusM, separationM);
}

/**
 * Teste de Gran Sasso (Donadi et al., Nature Physics 17, 74, 2021): R₀ > 0,54 × 10⁻¹⁰ m.
 * A versão sem parâmetros livres (R₀ ≈ 0,05 × 10⁻¹⁰ m para o cristal de germânio) fica excluída.
 */
export const DP_R0_LOWER_BOUND_M = 0.54e-10;
