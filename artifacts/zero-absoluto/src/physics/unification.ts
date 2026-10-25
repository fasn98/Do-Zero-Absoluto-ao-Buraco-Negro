/**
 * Módulo 9 — Evolução das constantes de acoplamento com a energia (grupo de
 * renormalização em um laço) e comparação com a gravidade. Energias em GeV.
 * Referências: Particle Data Group, Review of Particle Physics (2024 e 2026);
 * Amaldi, de Boer e Fürstenau, Phys. Lett. B 260, 447 (1991).
 */
import { elementaryCharge, gravitationalConstant, reducedPlanckConstant, speedOfLight } from "./constants";
import { assertPositive } from "./calculations";

/**
 * Insumos em M_Z, esquema MS-barra:
 * - M_Z = 91,1879 GeV (PDG 2026);
 * - α̂⁽⁵⁾(M_Z)⁻¹ = 127,930 ± 0,008 (PDG 2024, revisão do Modelo Eletrofraco;
 *   a edição de 2026 não traz esse valor explícito);
 * - ŝ²_Z = 0,23122 ± 0,00006 (PDG 2026, Tabela 10.2);
 * - α_s(M_Z) = 0,1180 ± 0,0009 (PDG 2026, média mundial).
 */
export const Z_MASS_GEV = 91.1879;
export const ALPHA_EM_INV_MZ = 127.93;
export const SIN2_THETA_W_MZ = 0.23122;
export const ALPHA_S_MZ = 0.118;

/** Energia alcançada no LHC (centro de massa), em GeV. */
export const LHC_ENERGY_GEV = 1.4e4;

export type Couplings = [number, number, number];

/** α₁⁻¹, α₂⁻¹, α₃⁻¹ em M_Z, com a normalização de grande unificação para U(1): α₁ = (5/3) α_Y. */
export function inverseCouplingsAtMZ(): Couplings {
  return [
    (3 / 5) * (1 - SIN2_THETA_W_MZ) * ALPHA_EM_INV_MZ,
    SIN2_THETA_W_MZ * ALPHA_EM_INV_MZ,
    1 / ALPHA_S_MZ,
  ];
}

/** Coeficientes de um laço b_i (Modelo Padrão e supersimetria mínima). */
export const B_STANDARD_MODEL: Couplings = [41 / 10, -19 / 6, -7];
export const B_MSSM: Couplings = [33 / 5, 1, -3];

export type Scenario = { susy: boolean; susyScaleGeV: number };

/**
 * α_i⁻¹(μ) = α_i⁻¹(M_Z) − (b_i/2π) ln(μ/M_Z). No cenário supersimétrico, os
 * coeficientes do Modelo Padrão valem até M_SUSY e os do MSSM acima dele
 * (limiar abrupto, uma simplificação).
 */
export function inverseCouplings(energyGeV: number, scenario: Scenario): Couplings {
  assertPositive(energyGeV, "A energia");
  const start = inverseCouplingsAtMZ();
  const run = (a: number, b: number, from: number, to: number) => a - (b / (2 * Math.PI)) * Math.log(to / from);
  if (!scenario.susy || energyGeV <= scenario.susyScaleGeV) {
    return start.map((a, i) => run(a, B_STANDARD_MODEL[i], Z_MASS_GEV, energyGeV)) as Couplings;
  }
  return start.map((a, i) => run(run(a, B_STANDARD_MODEL[i], Z_MASS_GEV, scenario.susyScaleGeV), B_MSSM[i], scenario.susyScaleGeV, energyGeV)) as Couplings;
}

export type Crossing = { pair: [number, number]; energyGeV: number; inverseCoupling: number };

/** Energia em que α_i⁻¹ = α_j⁻¹, por bisseção em log₁₀ μ entre M_Z e 10²⁰ GeV; null se não cruzam. */
export function crossing(i: number, j: number, scenario: Scenario): Crossing | null {
  const diff = (log10E: number) => {
    const a = inverseCouplings(10 ** log10E, scenario);
    return a[i] - a[j];
  };
  let lo = Math.log10(Z_MASS_GEV);
  let hi = 20;
  if (diff(lo) * diff(hi) > 0) return null;
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    if (diff(lo) * diff(mid) <= 0) hi = mid; else lo = mid;
  }
  const energyGeV = 10 ** hi;
  return { pair: [i, j], energyGeV, inverseCoupling: inverseCouplings(energyGeV, scenario)[i] };
}

/** Os três cruzamentos de pares: (1,2), (1,3), (2,3). */
export function allCrossings(scenario: Scenario): (Crossing | null)[] {
  return [crossing(0, 1, scenario), crossing(0, 2, scenario), crossing(1, 2, scenario)];
}

/** Dispersão dos cruzamentos em ordens de grandeza: log₁₀(E_máx / E_mín). */
export function crossingSpreadDecades(crossings: (Crossing | null)[]): number {
  const energies = crossings.filter((c): c is Crossing => c !== null).map((c) => c.energyGeV);
  return Math.log10(Math.max(...energies) / Math.min(...energies));
}

/** Média geométrica das energias dos cruzamentos: a "região de convergência". */
export function convergenceEnergyGeV(crossings: (Crossing | null)[]): number {
  const logs = crossings.filter((c): c is Crossing => c !== null).map((c) => Math.log10(c.energyGeV));
  return 10 ** (logs.reduce((s, x) => s + x, 0) / logs.length);
}

/** Energia de Planck √(ħc⁵/G), em GeV. */
export function planckEnergyGeV(): number {
  return Math.sqrt((reducedPlanckConstant * speedOfLight ** 5) / gravitationalConstant) / elementaryCharge / 1e9;
}

/** Acoplamento gravitacional adimensional para duas partículas de energia E: α_G = (E/E_Planck)². */
export function gravitationalCoupling(energyGeV: number): number {
  assertPositive(energyGeV, "A energia");
  return (energyGeV / planckEnergyGeV()) ** 2;
}

/**
 * Limite inferior da vida média do próton no canal p → e⁺π⁰: τ/B > 2,4 × 10³⁴ anos
 * (90% CL), Super-Kamiokande (Takenaka et al., PRD 102, 112011, 2020), citado na PDG 2026.
 */
export const PROTON_LIFETIME_LIMIT_YEARS = 2.4e34;
