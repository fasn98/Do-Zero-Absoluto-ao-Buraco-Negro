/**
 * Módulo 3 — Por que o Sol brilha: pico de Gamow.
 *
 * Energias em joules internamente; helpers convertem para keV/MeV.
 * A taxa de reação termonuclear é, com fator astrofísico S(E) constante,
 *   ⟨σv⟩ ∝ (kT)^(−3/2) ∫ exp(−E/kT − √(E_G/E)) dE
 * (Clayton, Principles of Stellar Evolution and Nucleosynthesis, cap. 4).
 */
import {
  alphaParticleMass,
  boltzmannConstant,
  deuteronMass,
  elementaryCharge,
  fineStructureConstant,
  neutronMass,
  protonMass,
  reducedPlanckConstant,
  solarCoreTemperature,
  speedOfLight,
  tritonMass,
} from "./constants";
import { assertPositive } from "./calculations";
import { logIntegrateLogGrid } from "./logmath";

export const JOULES_PER_EV = elementaryCharge;
export const jToKeV = (energyJ: number) => energyJ / JOULES_PER_EV / 1e3;
export const jToMeV = (energyJ: number) => energyJ / JOULES_PER_EV / 1e6;
export const keVToJ = (energyKeV: number) => energyKeV * 1e3 * JOULES_PER_EV;

/** Raio nuclear empírico r₀ = 1,2 fm (Krane, Introductory Nuclear Physics, cap. 3). */
export const NUCLEAR_RADIUS_PARAMETER_M = 1.2e-15;

export type Reaction = {
  id: "pp" | "dt" | "dd";
  label: string;
  Z1: number;
  Z2: number;
  A1: number;
  A2: number;
  m1Kg: number;
  m2Kg: number;
};

export const REACTIONS: Record<Reaction["id"], Reaction> = {
  pp: { id: "pp", label: "p + p", Z1: 1, Z2: 1, A1: 1, A2: 1, m1Kg: protonMass, m2Kg: protonMass },
  dt: { id: "dt", label: "D + T", Z1: 1, Z2: 1, A1: 2, A2: 3, m1Kg: deuteronMass, m2Kg: tritonMass },
  dd: { id: "dd", label: "D + D", Z1: 1, Z2: 1, A1: 2, A2: 2, m1Kg: deuteronMass, m2Kg: deuteronMass },
};

export function reducedMassKg(m1Kg: number, m2Kg: number): number {
  assertPositive(m1Kg, "A massa 1");
  assertPositive(m2Kg, "A massa 2");
  return (m1Kg * m2Kg) / (m1Kg + m2Kg);
}

/** kT em joules. */
export function kTJ(temperatureK: number): number {
  assertPositive(temperatureK, "A temperatura");
  return boltzmannConstant * temperatureK;
}

/** Energia de Gamow E_G = 2 m_r c² (π α Z₁ Z₂)², em joules. */
export function gamowEnergyJ(reaction: Reaction): number {
  const mr = reducedMassKg(reaction.m1Kg, reaction.m2Kg);
  return 2 * mr * speedOfLight ** 2 * (Math.PI * fineStructureConstant * reaction.Z1 * reaction.Z2) ** 2;
}

/** Pico de Gamow E₀ = (E_G (kT)² / 4)^(1/3). */
export function gamowPeakEnergyJ(gamowEnergy: number, kT: number): number {
  assertPositive(gamowEnergy, "A energia de Gamow");
  assertPositive(kT, "kT");
  return Math.cbrt((gamowEnergy * kT ** 2) / 4);
}

/** Largura (1/e) do pico: Δ = (4/√3) √(E₀ kT). */
export function gamowWidthJ(peakEnergy: number, kT: number): number {
  return (4 / Math.sqrt(3)) * Math.sqrt(peakEnergy * kT);
}

/** e²/(4πε₀) = α ħ c ≈ 1,44 MeV·fm, em J·m. */
export const COULOMB_COUPLING_JM = fineStructureConstant * reducedPlanckConstant * speedOfLight;

/** Distância de contato r = 1,2 (A₁^(1/3) + A₂^(1/3)) fm, em metros. */
export function contactRadiusM(reaction: Reaction): number {
  return NUCLEAR_RADIUS_PARAMETER_M * (Math.cbrt(reaction.A1) + Math.cbrt(reaction.A2));
}

/** Altura da barreira de Coulomb ≈ 1,44 MeV·fm × Z₁Z₂ / r, em joules. */
export function coulombBarrierJ(reaction: Reaction): number {
  return (COULOMB_COUPLING_JM * reaction.Z1 * reaction.Z2) / contactRadiusM(reaction);
}

/** ln do fator de Maxwell-Boltzmann exp(−E/kT). */
export const lnBoltzmannFactor = (energy: number, kT: number) => -energy / kT;

/** ln da probabilidade de tunelamento (fator de Gamow) exp(−√(E_G/E)). */
export const lnTunnelingProbability = (energy: number, gamowEnergy: number) =>
  -Math.sqrt(gamowEnergy / energy);

/**
 * ln da previsão clássica: fração de colisões com energia acima da barreira,
 * (1/kT) ∫_barreira^∞ exp(−E/kT) dE = exp(−barreira/kT).
 */
export function lnClassicalProbability(reaction: Reaction, temperatureK: number): number {
  return -coulombBarrierJ(reaction) / kTJ(temperatureK);
}

/** ln ∫ exp(−E/kT − √(E_G/E)) dE, com E em joules (malha logarítmica e log-sum-exp). */
export function lnGamowIntegralJ(reaction: Reaction, temperatureK: number): number {
  const kT = kTJ(temperatureK);
  const EG = gamowEnergyJ(reaction);
  const E0 = gamowPeakEnergyJ(EG, kT);
  const low = Math.min(E0, kT) * 1e-4;
  const high = Math.max(E0, kT) * 1e2;
  return logIntegrateLogGrid(
    (E) => lnBoltzmannFactor(E, kT) + lnTunnelingProbability(E, EG),
    low,
    high,
  );
}

/**
 * ln[(kT)^(−3/2) ∫ exp(−E/kT − √(E_G/E)) dE], com energias em keV para a
 * parte dimensional.
 */
export function lnReactionIntegral(reaction: Reaction, temperatureK: number): number {
  const kT = kTJ(temperatureK);
  return lnGamowIntegralJ(reaction, temperatureK) + Math.log(jToKeV(1)) - 1.5 * Math.log(jToKeV(kT));
}

/**
 * ln da fração efetiva de colisões que fundem, com tunelamento:
 *   (1/kT) ∫ exp(−E/kT − √(E_G/E)) dE.
 * Mesma normalização da fração clássica exp(−barreira/kT) = (1/kT) ∫_barreira^∞ exp(−E/kT) dE,
 * por isso as duas são diretamente comparáveis.
 */
export function lnFusingFraction(reaction: Reaction, temperatureK: number): number {
  return lnGamowIntegralJ(reaction, temperatureK) - Math.log(kTJ(temperatureK));
}

/** ln da taxa relativa: mesma reação, normalizada pelo núcleo do Sol (S(E) constante). */
export function lnRelativeRate(
  reaction: Reaction,
  temperatureK: number,
  referenceK: number = solarCoreTemperature,
): number {
  return lnReactionIntegral(reaction, temperatureK) - lnReactionIntegral(reaction, referenceK);
}

export type GamowCurvePoint = { energyJ: number; boltzmann: number; tunneling: number; product: number };

/**
 * Amostras das três curvas, cada uma normalizada ao seu máximo no intervalo.
 * Retorna também ln do fator de escala aplicado ao produto, para que a
 * interface diga o quanto ele foi ampliado em relação às outras duas.
 */
export function gamowCurves(reaction: Reaction, temperatureK: number, maxEnergyJ: number, points = 240) {
  const kT = kTJ(temperatureK);
  const EG = gamowEnergyJ(reaction);
  const samples: { energyJ: number; lnB: number; lnT: number }[] = [];
  for (let i = 1; i <= points; i += 1) {
    const energyJ = (maxEnergyJ * i) / points;
    samples.push({ energyJ, lnB: lnBoltzmannFactor(energyJ, kT), lnT: lnTunnelingProbability(energyJ, EG) });
  }
  const maxB = Math.max(...samples.map((s) => s.lnB));
  const maxT = Math.max(...samples.map((s) => s.lnT));
  const maxP = Math.max(...samples.map((s) => s.lnB + s.lnT));
  const curve: GamowCurvePoint[] = samples.map((s) => ({
    energyJ: s.energyJ,
    boltzmann: Math.exp(s.lnB - maxB),
    tunneling: Math.exp(s.lnT - maxT),
    product: Math.exp(s.lnB + s.lnT - maxP),
  }));
  // Quanto o produto foi ampliado em relação ao produto de B e T já normalizados.
  const lnProductAmplification = maxB + maxT - maxP;
  return { curve, lnProductAmplification };
}

/** Energia liberada na reação D + T → ⁴He + n, a partir das massas CODATA. */
export function dtFusionEnergyJ(): number {
  return (deuteronMass + tritonMass - alphaParticleMass - neutronMass) * speedOfLight ** 2;
}
