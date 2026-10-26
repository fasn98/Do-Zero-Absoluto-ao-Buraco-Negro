/**
 * Módulo 12 — Tempo de colapso de Diósi-Penrose para tubulinas em superposição, como propõe a
 * hipótese Orch-OR (Hameroff e Penrose, Physics of Life Reviews 11, 39, 2014). Usa a função do
 * Módulo 10 (`diosiPenroseEnergyJ`, esfera homogênea) em três modelos de distribuição de massa.
 *
 * As energias das N tubulinas se somam: E_G(N) = N · E_G(1), τ = ħ / E_G(N). Nos dois primeiros
 * modelos a separação é completa (d = 2R); no terceiro, a massa de cada núcleon fica espalhada
 * sobre R₀ (mínimo de Gran Sasso) e o deslocamento é do tamanho de um núcleon, muito menor que R₀,
 * o que reduz E_G pelo fator ~(d/R₀)². Derakhshani et al. (Phys. Life Rev. 42, 8, 2022), com um
 * modelo mais detalhado, chegam a ~4 × 10²³ tubulinas para 25 ms, contra ~10²⁰ no cérebro inteiro.
 *
 * O resultado depende muito do modelo: a mesma massa concentrada em esferas pequenas tem E_G
 * muito maior (E_G ∝ m²/R), e o colapso fica muito mais rápido.
 */
import { atomicMassConstant, protonChargeRadius, reducedPlanckConstant } from "./constants";
import { assertPositive } from "./calculations";
import { DP_R0_LOWER_BOUND_M, diosiPenroseEnergyJ, sphereRadiusM } from "./diosiPenrose";

/**
 * Massa do dímero de tubulina (α + β), em daltons, pelas sequências humanas no UniProt:
 * TUBA1A (Q71U36), 50.136 Da, e TUBB (P07437), 49.671 Da. Sem os nucleotídeos (GTP/GDP) nem
 * modificações pós-traducionais: ~100 kDa.
 */
export const TUBULIN_ALPHA_MASS_DA = 50136;
export const TUBULIN_BETA_MASS_DA = 49671;
export const TUBULIN_DIMER_MASS_DA = TUBULIN_ALPHA_MASS_DA + TUBULIN_BETA_MASS_DA;
/**
 * Número de tubulinas que o Orch-OR propõe para um evento de τ ≈ 25 ms (ritmo gama): ~2 × 10¹⁰
 * (Hameroff e Penrose, Phys. Life Rev. 11, 39, 2014, citado por McQueen, Phys. Life Rev. 44, 201, 2023).
 */
export const ORCH_OR_TUBULINS = 2e10;
export const ORCH_OR_TIME_S = 0.025;
/** Tubulinas no cérebro inteiro: ~10²⁰ (~10⁹ por neurônio; McQueen, 2023). */
export const BRAIN_TUBULINS = 1e20;
/** Densidade média de proteínas grandes: ~1,41 g/cm³ (Fischer, Polikarpov e Craievich, Protein Sci. 13, 2825, 2004). */
export const PROTEIN_DENSITY_KG_M3 = 1410;

export type MassModel = 'proteina' | 'nucleons' | 'nucleons-r0';

export const MASS_MODELS: { id: MassModel; label: string; detail: string }[] = [
  { id: 'proteina', label: 'Proteína como esfera homogênea', detail: 'toda a massa da tubulina numa esfera de ~3 nm de raio, deslocada por inteiro' },
  { id: 'nucleons', label: 'Massa concentrada nos núcleons', detail: 'cada próton ou nêutron como uma esfera de 0,84 fm, deslocada por inteiro' },
  { id: 'nucleons-r0', label: 'Núcleons espalhados pelo corte R₀', detail: 'cada núcleon espalhado sobre R₀ = 0,54 Å (o mínimo de Gran Sasso) e deslocado pelo tamanho de um núcleon' },
];

/** E_G de uma tubulina no modelo escolhido, em joules. */
export function tubulinCollapseEnergyJ(model: MassModel, massDa: number = TUBULIN_DIMER_MASS_DA): number {
  assertPositive(massDa, "A massa");
  const mass = massDa * atomicMassConstant;
  if (model === 'proteina') {
    const r = sphereRadiusM(mass, PROTEIN_DENSITY_KG_M3);
    return diosiPenroseEnergyJ(mass, r, 2 * r);
  }
  // Núcleons: n esferas de massa m_u; as contribuições se somam. Ignora que núcleons do mesmo
  // núcleo se movem juntos (isso aumentaria E_G por um fator de ~10).
  if (model === 'nucleons') return massDa * diosiPenroseEnergyJ(atomicMassConstant, protonChargeRadius, 2 * protonChargeRadius);
  return massDa * diosiPenroseEnergyJ(atomicMassConstant, DP_R0_LOWER_BOUND_M, 2 * protonChargeRadius);
}

/** τ = ħ / (N · E_G(1)) para N tubulinas em superposição, em segundos. */
export function orchORCollapseTimeS(tubulins: number, model: MassModel): number {
  assertPositive(tubulins, "O número de tubulinas");
  return reducedPlanckConstant / (tubulins * tubulinCollapseEnergyJ(model));
}

/** Quantas tubulinas seriam necessárias para um colapso em τ segundos. */
export function tubulinsForCollapseTime(timeS: number, model: MassModel): number {
  assertPositive(timeS, "O tempo");
  return reducedPlanckConstant / (timeS * tubulinCollapseEnergyJ(model));
}
