/**
 * Trilha 2, Módulo 2.4 — Inflação e perturbações.
 *
 * 1. Os dois quebra-cabeças do modelo sem inflação, com o resolvedor de Friedmann dos Módulos
 *    2.1 a 2.3 (universo plano do Planck 2018, radiação com N_eff = 3):
 *    - planura: |Ω − 1|(a) = |Ω_k| / (a² E²(a)), que cresce ∝ t na era da radiação e ∝ t^(2/3)
 *      na da matéria;
 *    - horizonte: horizonte de partículas comóvel na recombinação, χ_p(z*) = c ∫₀^{a*} da/(a²H),
 *      dividido pela distância comóvel até a recombinação, D_M(z*) = c ∫_{a*}^1 da/(a²H).
 * 2. Rolamento lento na primeira ordem: φ² (n_s ≈ 1 − 2/N, r ≈ 8/N) e Starobinsky
 *    (n_s ≈ 1 − 2/N, r ≈ 12/N²), e a escala de energia V^(1/4) = (3π² A_s r / 2)^(1/4) M_P.
 *
 * Validação independente em scripts/validacao_inflacao.py.
 */
import { boltzmannConstant, cmbTemperature, elementaryCharge, gravitationalConstant, reducedPlanckConstant, speedOfLight } from "./constants";
import { assertPositive } from "./calculations";
import { PLANCK_2018, RECOMBINATION_REDSHIFT, ageOfUniverseS, expansionRateSquared, lnScaleFactorAtTime, matterRadiationEqualityRedshift, planckTimeS, timeAtRedshiftS, type Cosmology } from "./friedmann";
import { integrate } from "./cosmoLikelihood";
import { hubbleRateSI } from "./vacuumEnergy";

/**
 * Planck 2018 X (A&A 641, A10, 2020), Planck TT,TE,EE+lowE+lensing, ΛCDM, k* = 0,05 Mpc⁻¹:
 * n_s = 0,9649 ± 0,0042 e ln(10¹⁰ A_s) = 3,044 ± 0,014.
 */
export const PLANCK_NS = 0.9649;
export const PLANCK_NS_SIGMA = 0.0042;
export const PLANCK_LN_1E10_AS = 3.044;
export const PLANCK_AS = Math.exp(PLANCK_LN_1E10_AS) / 1e10;
export const PIVOT_K_MPC = 0.05;

/**
 * Curvatura: Planck 2018 VI (A&A 641, A6, 2020), TT,TE,EE+lowE+lensing+BAO, 68%:
 * Ω_K = 0,0007 ± 0,0019. Usamos o limite de 95%, |Ω_K| < 0,0007 + 2 × 0,0019 ≈ 0,0045.
 */
export const OMEGA_K_CENTRAL = 0.0007;
export const OMEGA_K_SIGMA = 0.0019;
export const OMEGA_K_BOUND_95 = Math.abs(OMEGA_K_CENTRAL) + 2 * OMEGA_K_SIGMA;

/**
 * Limite superior de r a 95%, em k = 0,05 Mpc⁻¹, o mais recente publicado: r < 0,034, de Planck,
 * SPT, ACT e BICEP/Keck (Balkenhol et al., Open J. Astrophys. 9, 2026). Os anteriores:
 * r < 0,036 (BICEP/Keck 2021, PRL 127, 151301) e r < 0,032 (Tristram et al., PRD 105, 083524, 2022,
 * com BAO e lenteamento).
 */
export const R_UPPER_LIMIT = 0.034;
export const R_LIMIT_BK18 = 0.036;
/** n_s da mesma análise de Balkenhol et al. (2026): 0,9682 ± 0,0032 (sem DESI) e 0,9728 ± 0,0029 (com DESI BAO). */
export const NS_2026 = { value: 0.9682, sigma: 0.0032, withDesi: 0.9728, withDesiSigma: 0.0029 };

/** Massa de Planck reduzida, M_P = √(ħc/(8πG)), em GeV (≈ 2,435 × 10¹⁸ GeV). */
export function reducedPlanckMassGeV(): number {
  const energyJ = Math.sqrt((reducedPlanckConstant * speedOfLight ** 5) / (8 * Math.PI * gravitationalConstant));
  return energyJ / elementaryCharge / 1e9;
}

// --- Planura ---------------------------------------------------------------------------

/** |Ω − 1| no fator de escala a (a partir de ln a), dado |Ω_k| hoje: |Ω_k| / (a² E²). */
export function curvatureAtLnA(lnA: number, omegaK0: number = OMEGA_K_BOUND_95, c: Cosmology = PLANCK_2018): number {
  return omegaK0 / Math.exp(2 * lnA + Math.log(expansionRateSquared(lnA, c)));
}

/** |Ω − 1| no instante t (s), pelo resolvedor. */
export function curvatureAtTime(timeS: number, omegaK0: number = OMEGA_K_BOUND_95, c: Cosmology = PLANCK_2018): number {
  return curvatureAtLnA(lnScaleFactorAtTime(timeS, c), omegaK0, c);
}

/**
 * Estimativa analítica por partes: |Ω − 1| ∝ t^(2/3) de hoje até a igualdade matéria-radiação
 * (ignorando Λ) e ∝ t antes dela.
 */
export function curvatureAnalytic(timeS: number, omegaK0: number = OMEGA_K_BOUND_95, c: Cosmology = PLANCK_2018): number {
  assertPositive(timeS, "O tempo");
  const t0 = ageOfUniverseS(c);
  const tEq = timeAtRedshiftS(matterRadiationEqualityRedshift(c), c);
  const atEq = omegaK0 * (tEq / t0) ** (2 / 3);
  return timeS >= tEq ? omegaK0 * (timeS / t0) ** (2 / 3) : atEq * (timeS / tEq);
}

/** Instantes de referência: nucleossíntese (~1 s) e o tempo de Planck (extrapolação). */
export const FLATNESS_TIMES = { nucleossintese: 1, planck: planckTimeS() };

// --- Horizonte -------------------------------------------------------------------------

const MPC_M = 3.0856775814913673e22;

/** Horizonte de partículas comóvel no redshift z, χ_p(z) = c ∫₀^{a} da/(a²H), em Mpc. */
export function particleHorizonAtMpc(z: number, c: Cosmology = PLANCK_2018): number {
  const hubbleMpc = speedOfLight / hubbleRateSI(c.h0) / MPC_M;
  const f = (x: number) => Math.exp(-x) / Math.sqrt(expansionRateSquared(x, c));
  const x0 = -40; // antes disso o integrando é ∝ a: a cauda vale f(x0)
  return hubbleMpc * (f(x0) + integrate(f, x0, -Math.log1p(z), 0.25));
}

/** Distância comóvel até o redshift z, D_M(z) = c ∫_{a}^1 da/(a²H), em Mpc. */
export function comovingDistanceMpc(z: number, c: Cosmology = PLANCK_2018): number {
  const hubbleMpc = speedOfLight / hubbleRateSI(c.h0) / MPC_M;
  const f = (x: number) => Math.exp(-x) / Math.sqrt(expansionRateSquared(x, c));
  return hubbleMpc * integrate(f, -Math.log1p(z), 0, 0.05);
}

/** Ângulo, hoje, do horizonte de partículas na recombinação: χ_p(z*)/D_M(z*), em graus. */
export function horizonAngleDeg(z: number = RECOMBINATION_REDSHIFT, c: Cosmology = PLANCK_2018): number {
  return (particleHorizonAtMpc(z, c) / comovingDistanceMpc(z, c)) * (180 / Math.PI);
}

// --- E-dobras --------------------------------------------------------------------------

/** Fator de redução de |Ω − 1| por N e-dobras de inflação: e^(−2N). */
export const flatnessReduction = (efolds: number) => Math.exp(-2 * efolds);

/** Temperatura (K) com kT igual a uma energia em GeV. */
const gevToKelvin = (gev: number) => (gev * 1e9 * elementaryCharge) / boltzmannConstant;

/**
 * E-dobras mínimas para resolver o horizonte, se a inflação termina com o universo à energia
 * E_fim (reaquecimento instantâneo): N ≥ ln(a_fim H_fim / a₀H₀). Com |Ω − 1| ~ 1 no início,
 * a planura exige mais ½ ln(1/|Ω_k|). Usa T = T₀/a com o conteúdo de radiação de hoje.
 */
export function minimumEfolds(endEnergyGeV: number, omegaK0: number = OMEGA_K_BOUND_95, c: Cosmology = PLANCK_2018) {
  assertPositive(endEnergyGeV, "A energia");
  const lnA = Math.log(cmbTemperature / gevToKelvin(endEnergyGeV));
  const lnAH = lnA + 0.5 * Math.log(expansionRateSquared(lnA, c));
  return { horizon: lnAH, flatness: lnAH + 0.5 * Math.log(1 / omegaK0) };
}

// --- Rolamento lento -------------------------------------------------------------------

export type InflationModel = 'phi2' | 'starobinsky';
/** n_s e r em primeira ordem de rolamento lento, para N e-dobras antes do fim da inflação. */
export function slowRoll(model: InflationModel, efolds: number): { ns: number; r: number } {
  assertPositive(efolds, "O número de e-dobras");
  const ns = 1 - 2 / efolds;
  return { ns, r: model === 'phi2' ? 8 / efolds : 12 / efolds ** 2 };
}

/** Escala de energia da inflação, V^(1/4) = (3π² A_s r / 2)^(1/4) M_P, em GeV. */
export function inflationEnergyScaleGeV(r: number, as: number = PLANCK_AS): number {
  assertPositive(r, "r");
  return ((3 * Math.PI ** 2 * as * r) / 2) ** 0.25 * reducedPlanckMassGeV();
}

/** Significância de n_s < 1: (1 − n_s)/σ. */
export const nsBelowOneSigma = () => (1 - PLANCK_NS) / PLANCK_NS_SIGMA;
