/**
 * Módulo 7, Seção 4 — Emaranhamento mediado pela gravidade.
 * Bose et al., PRL 119, 240401 (2017); Marletto e Vedral, PRL 119, 240402 (2017).
 */
import {
  atomicMassConstant,
  diamondDensity,
  gravitationalConstant,
  reducedPlanckConstant,
  superpositionRecordRelativeMass,
} from "./constants";
import { assertPositive } from "./calculations";

/**
 * Fase gravitacional acumulada pelo par de ramos mais próximo:
 * φ = G m² τ / (ħ d), em radianos. É uma estimativa de ordem de grandeza;
 * o que se mede é a diferença de fase entre os ramos.
 */
export function gravitationalPhaseRad(massKg: number, distanceM: number, timeS: number): number {
  assertPositive(massKg, "A massa");
  assertPositive(distanceM, "A distância");
  assertPositive(timeS, "O tempo");
  return (gravitationalConstant * massKg ** 2 * timeS) / (reducedPlanckConstant * distanceM);
}

/** Ordem de grandeza da fase a partir da qual o efeito seria detectável (estimativa, não limiar exato). */
export const DETECTABLE_PHASE_ESTIMATE_RAD = 0.1;

/** Raio de uma esfera de diamante com essa massa, em metros. */
export function diamondSphereRadiusM(massKg: number): number {
  assertPositive(massKg, "A massa");
  return Math.cbrt((3 * massKg) / (4 * Math.PI * diamondDensity));
}

/** Maior massa já posta em superposição (~25.000 u, Fein et al. 2019), em kg. */
export const SUPERPOSITION_RECORD_KG = superpositionRecordRelativeMass * atomicMassConstant;

/** Quantas vezes a massa supera o recorde atual de superposição. */
export function ratioToSuperpositionRecord(massKg: number): number {
  return massKg / SUPERPOSITION_RECORD_KG;
}

/** Verdadeiro se, com essa distância entre centros, duas esferas de diamante dessa massa se sobreporiam (d < 2r). */
export function spheresOverlap(massKg: number, distanceM: number): boolean {
  return distanceM < 2 * diamondSphereRadiusM(massKg);
}
