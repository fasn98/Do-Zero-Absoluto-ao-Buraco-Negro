/**
 * Módulo 11 — Energia do vácuo prevista contra a energia escura observada, e
 * efeito Casimir. Referência: S. Weinberg, Rev. Mod. Phys. 61, 1 (1989).
 */
import {
  elementaryCharge,
  gravitationalConstant,
  parsec,
  reducedPlanckConstant,
  speedOfLight,
} from "./constants";
import { assertPositive } from "./calculations";

/** Parâmetros cosmológicos do Planck 2018 (Aghanim et al., A&A 641, A6, 2020). */
export const PLANCK_2018_H0_KM_S_MPC = 67.4;
export const PLANCK_2018_OMEGA_LAMBDA = 0.685;

/** H₀ em s⁻¹ a partir de km/s/Mpc. */
export function hubbleRateSI(h0KmSMpc: number): number {
  return (h0KmSMpc * 1e3) / (1e6 * parsec);
}

/** Densidade crítica ρ_c = 3H₀²/(8πG), em kg/m³. */
export function criticalDensityKgM3(h0KmSMpc: number = PLANCK_2018_H0_KM_S_MPC): number {
  return (3 * hubbleRateSI(h0KmSMpc) ** 2) / (8 * Math.PI * gravitationalConstant);
}

/** Densidade de massa da energia escura ρ_Λ = Ω_Λ ρ_c, em kg/m³. */
export function darkEnergyDensityKgM3(h0KmSMpc: number = PLANCK_2018_H0_KM_S_MPC, omegaLambda: number = PLANCK_2018_OMEGA_LAMBDA): number {
  return omegaLambda * criticalDensityKgM3(h0KmSMpc);
}

/** Densidade de energia da energia escura u_Λ = ρ_Λ c², em J/m³. */
export function darkEnergyEnergyDensityJM3(): number {
  return darkEnergyDensityKgM3() * speedOfLight ** 2;
}

const GEV_J = 1e9 * elementaryCharge;

/**
 * Modelo de brinquedo: soma de ½ħω sobre os modos de um único campo até
 * k_máx = E_corte/(ħc): u_vac = ħ c k_máx⁴ / (16π²), em J/m³.
 */
export function vacuumEnergyDensityJM3(cutoffGeV: number): number {
  assertPositive(cutoffGeV, "A energia de corte");
  const kMax = (cutoffGeV * GEV_J) / (reducedPlanckConstant * speedOfLight);
  return (reducedPlanckConstant * speedOfLight * kMax ** 4) / (16 * Math.PI ** 2);
}

/** Energia de corte (GeV) para a qual u_vac = u. */
export function cutoffForEnergyDensityGeV(energyDensityJM3: number): number {
  const kMax = ((16 * Math.PI ** 2 * energyDensityJM3) / (reducedPlanckConstant * speedOfLight)) ** 0.25;
  return (kMax * reducedPlanckConstant * speedOfLight) / GEV_J;
}

/** Comprimento de onda λ = 2π/k associado a uma energia de corte (GeV), em metros. */
export function cutoffWavelengthM(cutoffGeV: number): number {
  const k = (cutoffGeV * GEV_J) / (reducedPlanckConstant * speedOfLight);
  return (2 * Math.PI) / k;
}

/** Densidade de energia de Planck c⁷/(ħG²), em J/m³. */
export function planckEnergyDensityJM3(): number {
  return speedOfLight ** 7 / (reducedPlanckConstant * gravitationalConstant ** 2);
}

/** Pressão de Casimir entre placas ideais, P = π²ħc/(240 d⁴), em Pa. */
export function casimirPressurePa(separationM: number): number {
  assertPositive(separationM, "A separação");
  return (Math.PI ** 2 * reducedPlanckConstant * speedOfLight) / (240 * separationM ** 4);
}

/**
 * Teste de Eöt-Wash (Lee et al., PRL 124, 101101, 2020): lei de Newton
 * confirmada até separações de 52 µm; interações de intensidade gravitacional
 * do tipo Yukawa excluídas para alcances acima de 38,6 µm (95% de confiança).
 */
export const EOT_WASH_MIN_SEPARATION_M = 52e-6;
export const EOT_WASH_YUKAWA_RANGE_M = 38.6e-6;
