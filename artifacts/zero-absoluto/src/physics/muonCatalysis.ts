/**
 * Módulo 4 — Fusão catalisada por múons e o balanço de energia.
 * Referências: Jackson, Phys. Rev. 106, 330 (1957); Jones, Nature 321, 127 (1986);
 * Breunlich, Kammel, Cohen & Leon, Annu. Rev. Nucl. Part. Sci. 39, 311 (1989).
 */
import {
  electronMass,
  fineStructureConstant,
  muonLifetime,
  muonMass,
  reducedPlanckConstant,
  speedOfLight,
} from "./constants";
import { dtFusionEnergyJ, JOULES_PER_EV, reducedMassKg } from "./gamow";

export const MUON_ELECTRON_MASS_RATIO = muonMass / electronMass;

/**
 * Estimativas da literatura (não são constantes fundamentais):
 * - custo energético de produzir um múon negativo num acelerador: ~5 GeV
 *   (Jones 1986; Breunlich et al. 1989);
 * - fração de aderência ω_s do múon ao ⁴He em dtμ: ~0,4% a 0,9%;
 * - recorde experimental de fusões por múon: ~150 (Jones et al., LAMPF, 1983–86).
 */
export const MUON_COST_ESTIMATE_J = 5e9 * JOULES_PER_EV;
export const STICKING_FRACTION_RANGE: [number, number] = [0.004, 0.009];
export const RECORD_FUSIONS_PER_MUON = 150;

/** Raio de Bohr para uma partícula de massa reduzida m_r: a = ħ / (m_r c α), em metros. */
export function bohrRadiusM(reducedMass: number): number {
  return reducedPlanckConstant / (reducedMass * speedOfLight * fineStructureConstant);
}

/** Quantas vezes o átomo múonico é menor que o eletrônico para um mesmo núcleo. */
export function muonicSizeRatio(nucleusMassKg: number): number {
  return reducedMassKg(muonMass, nucleusMassKg) / reducedMassKg(electronMass, nucleusMassKg);
}

/** Número médio de fusões antes de o múon aderir a um ⁴He: ≈ 1/ω_s. */
export function fusionsBeforeSticking(stickingFraction: number): number {
  return 1 / stickingFraction;
}

/** Energia liberada por um múon que catalisa n fusões D+T, em joules. */
export function energyPerMuonJ(fusions: number): number {
  return fusions * dtFusionEnergyJ();
}

/** Fusões por múon necessárias para igualar o custo de produzi-lo. */
export function breakEvenFusions(costJ: number = MUON_COST_ESTIMATE_J): number {
  return costJ / dtFusionEnergyJ();
}

/** Fração de múons ainda vivos após t segundos: exp(−t/τ). */
export function muonSurvival(timeS: number): number {
  return Math.exp(-timeS / muonLifetime);
}
