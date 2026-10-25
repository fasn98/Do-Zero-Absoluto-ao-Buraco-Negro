/**
 * Módulo 8, Seção 1 — Espiralamento de um binário compacto na aproximação
 * quadrupolar de ordem mais baixa (Peters e Mathews 1963; Maggiore,
 * Gravitational Waves, vol. 1, cap. 4). Massas em massas solares,
 * frequências da onda (o dobro da orbital) em Hz, tempos em segundos.
 */
import { gravitationalConstant, solarMass, speedOfLight } from "./constants";
import { assertPositive } from "./calculations";

/**
 * Dados medidos de GW150914 (Abbott et al., PRL 116, 061102, 2016), no
 * referencial da fonte: massas, redshift, energia irradiada e deformação de pico.
 */
export const GW150914 = {
  m1: 36,
  m2: 29,
  redshift: 0.09,
  radiatedSolarMasses: 3.0,
  peakStrain: 1.0e-21,
  peakFrequencyHz: 250,
};

/** Massa de chirp 𝓜 = (m₁m₂)^(3/5) / (m₁ + m₂)^(1/5), na mesma unidade das massas. */
export function chirpMass(m1: number, m2: number): number {
  assertPositive(m1, "A massa 1");
  assertPositive(m2, "A massa 2");
  return (m1 * m2) ** 0.6 / (m1 + m2) ** 0.2;
}

/** Massa no referencial do detector: a onda chega esticada por (1 + z). */
export function detectorFrameMass(sourceMass: number, redshift: number): number {
  return sourceMass * (1 + redshift);
}

/** Escala de tempo da massa de chirp, G𝓜/c³, em segundos (𝓜 em massas solares). */
function chirpTimeS(chirpMassSolar: number): number {
  return (gravitationalConstant * chirpMassSolar * solarMass) / speedOfLight ** 3;
}

/** Tempo até a fusão a partir da frequência f: τ = (5/256)(G𝓜/c³)^(−5/3)(πf)^(−8/3). */
export function timeToMergerS(frequencyHz: number, chirpMassSolar: number): number {
  assertPositive(frequencyHz, "A frequência");
  assertPositive(chirpMassSolar, "A massa de chirp");
  return (5 / 256) * chirpTimeS(chirpMassSolar) ** (-5 / 3) * (Math.PI * frequencyHz) ** (-8 / 3);
}

/** Inverso de timeToMergerS: f(τ) = (1/π)(5/(256τ))^(3/8)(G𝓜/c³)^(−5/8). */
export function frequencyAtTimeToMergerHz(tauS: number, chirpMassSolar: number): number {
  assertPositive(tauS, "O tempo até a fusão");
  return (1 / Math.PI) * (5 / (256 * tauS)) ** (3 / 8) * chirpTimeS(chirpMassSolar) ** (-5 / 8);
}

/** Fase da onda até a fusão: Φ(τ) = −2 (τ / (5 G𝓜/c³))^(5/8), com Φ = 0 na fusão. */
export function phaseAtTimeToMerger(tauS: number, chirpMassSolar: number): number {
  return -2 * (tauS / (5 * chirpTimeS(chirpMassSolar))) ** (5 / 8);
}

/** Frequência da onda na última órbita circular estável: f = c³ / (6^(3/2) π G M), M total em massas solares. */
export function iscoFrequencyHz(totalMassSolar: number): number {
  assertPositive(totalMassSolar, "A massa total");
  return speedOfLight ** 3 / (6 ** 1.5 * Math.PI * gravitationalConstant * totalMassSolar * solarMass);
}

/** Energia de repouso de uma massa em massas solares, em joules. */
export function solarMassEnergyJ(solarMasses: number): number {
  return solarMasses * solarMass * speedOfLight ** 2;
}

export type ChirpSample = { t: number; h: number };

/**
 * Forma de onda h(t) ∝ f^(2/3) cos Φ, de fStart até f_ISCO, com t = −τ
 * (zero na fusão) e amplitude normalizada para `peakStrain` em f_ISCO.
 */
export function chirpWaveform(chirpMassSolar: number, fStartHz: number, fEndHz: number, peakStrain: number, points = 1600): ChirpSample[] {
  const tauStart = timeToMergerS(fStartHz, chirpMassSolar);
  const tauEnd = timeToMergerS(fEndHz, chirpMassSolar);
  const samples: ChirpSample[] = [];
  for (let i = 0; i < points; i += 1) {
    const tau = tauStart + ((tauEnd - tauStart) * i) / (points - 1);
    const f = frequencyAtTimeToMergerHz(tau, chirpMassSolar);
    const amplitude = peakStrain * (f / fEndHz) ** (2 / 3);
    samples.push({ t: -tau, h: amplitude * Math.cos(phaseAtTimeToMerger(tau, chirpMassSolar)) });
  }
  return samples;
}

/** Número de ciclos da onda entre duas frequências: ΔΦ / 2π. */
export function cyclesBetween(fStartHz: number, fEndHz: number, chirpMassSolar: number): number {
  const a = phaseAtTimeToMerger(timeToMergerS(fStartHz, chirpMassSolar), chirpMassSolar);
  const b = phaseAtTimeToMerger(timeToMergerS(fEndHz, chirpMassSolar), chirpMassSolar);
  return (b - a) / (2 * Math.PI);
}
