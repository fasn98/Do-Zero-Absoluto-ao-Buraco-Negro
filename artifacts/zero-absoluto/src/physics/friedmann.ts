/**
 * Trilha 2, Módulo 2.1 — Equação de Friedmann para um universo plano com
 * radiação, matéria e constante cosmológica:
 *
 *   H(a) = H₀ √(Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_Λ),  Ω_Λ = 1 − Ω_m − Ω_r.
 *
 * Tempos em segundos; distâncias em metros. Para não estourar o ponto
 * flutuante no futuro distante (a ~ e⁵⁷⁰⁰ em 100 trilhões de anos), a
 * interface trabalha com ln a.
 *
 * Referências: N. Aghanim et al. (Planck), A&A 641, A6 (2020);
 * D. J. Fixsen, ApJ 707, 916 (2009).
 */
import {
  boltzmannConstant,
  cmbTemperature,
  gravitationalConstant,
  julianYear,
  reducedPlanckConstant,
  speedOfLight,
} from "./constants";
import { assertPositive } from "./calculations";
import { logSumExp } from "./logmath";
import { hubbleRateSI } from "./vacuumEnergy";

/**
 * Parâmetros cosmológicos do Planck 2018 (Aghanim et al., A&A 641, A6, 2020,
 * Tabela 2, valores arredondados): H₀ = 67,4 km/s/Mpc e Ω_m = 0,315.
 */
export const PLANCK_2018_H0 = 67.4;
export const PLANCK_2018_OMEGA_M = 0.315;
/** Idade publicada pelo Planck 2018 (TT,TE,EE+lowE+lensing+BAO): 13,787 ± 0,020 bilhões de anos. */
export const PLANCK_2018_AGE_GYR = 13.787;
export const PLANCK_2018_AGE_SIGMA_GYR = 0.02;
/** z_eq publicado pelo Planck 2018 (TT,TE,EE+lowE+lensing+BAO): 3.387 ± 21, com N_eff = 3,046 e Σm_ν = 0,06 eV. */
export const PLANCK_2018_Z_EQ = 3387;
/** Redshift de recombinação (último espalhamento) do Planck 2018: z* = 1.089,9 ≈ 1.090. */
export const RECOMBINATION_REDSHIFT = 1090;
/** Redshift de reionização (modelo instantâneo) do Planck 2018: z_re = 7,67 ± 0,73. */
export const REIONIZATION_REDSHIFT = 7.7;
/** H₀ local do SH0ES (Riess et al., ApJL 934, L7, 2022): 73,04 ± 1,04 km/s/Mpc. */
export const SHOES_H0 = 73.04;
/** Neutrinos sem massa, desacoplamento instantâneo: N_eff = 3. */
export const N_EFF_MASSLESS = 3;

const SECONDS_PER_GYR = 1e9 * julianYear;
/** Ano-luz: distância percorrida pela luz em um ano juliano (IAU). */
const LIGHT_YEAR_M = speedOfLight * julianYear;

export const secondsToGyr = (seconds: number) => seconds / SECONDS_PER_GYR;
export const gyrToSeconds = (gyr: number) => gyr * SECONDS_PER_GYR;
export const metersToGly = (meters: number) => meters / (1e9 * LIGHT_YEAR_M);

/**
 * Ω_r h² dos fótons do fundo cósmico mais N_eff espécies de neutrinos sem massa:
 * Ω_γ h² = a_rad T₀⁴ / (c² ρ_c,100), com a_rad = π²k⁴/(15ħ³c³) e
 * ρ_c,100 = 3 (100 km/s/Mpc)² / (8πG); cada neutrino soma (7/8)(4/11)^(4/3) Ω_γ.
 * Com T₀ = 2,7255 K: Ω_γ h² ≈ 2,47 × 10⁻⁵ e, com N_eff = 3, Ω_r h² ≈ 4,16 × 10⁻⁵.
 */
export function radiationDensityH2(nEff: number = N_EFF_MASSLESS): number {
  const radiationConstant = (Math.PI ** 2 * boltzmannConstant ** 4) / (15 * reducedPlanckConstant ** 3 * speedOfLight ** 3);
  const criticalDensity100 = (3 * hubbleRateSI(100) ** 2) / (8 * Math.PI * gravitationalConstant);
  const photons = (radiationConstant * cmbTemperature ** 4) / speedOfLight ** 2 / criticalDensity100;
  return photons * (1 + nEff * (7 / 8) * (4 / 11) ** (4 / 3));
}

export type Cosmology = {
  /** H₀ em km/s/Mpc. */
  h0: number;
  omegaM: number;
  omegaR: number;
  /** Ω_Λ hoje; com energia escura dinâmica (Módulo 2.2), Ω_DE hoje. */
  omegaL: number;
  /**
   * Equação de estado da energia escura na parametrização CPL,
   * w(a) = w₀ + w_a (1 − a). Sem estes campos, w = −1 (constante cosmológica).
   */
  w0?: number;
  wa?: number;
};

/** Universo plano: Ω_r = Ω_r h² / h² e Ω_Λ = 1 − Ω_m − Ω_r. */
export function makeCosmology(h0: number = PLANCK_2018_H0, omegaM: number = PLANCK_2018_OMEGA_M): Cosmology {
  assertPositive(h0, "H₀");
  const h = h0 / 100;
  const omegaR = radiationDensityH2() / h ** 2;
  return { h0, omegaM, omegaR, omegaL: 1 - omegaM - omegaR };
}

export const PLANCK_2018 = makeCosmology();

/**
 * Universo plano com energia escura de equação de estado w(a) = w₀ + w_a (1 − a)
 * (Chevallier e Polarski, 2001; Linder, 2003). w₀ = −1 e w_a = 0 dão o ΛCDM.
 */
export function makeDarkEnergyCosmology(w0: number, wa = 0, h0: number = PLANCK_2018_H0, omegaM: number = PLANCK_2018_OMEGA_M): Cosmology {
  return { ...makeCosmology(h0, omegaM), w0, wa };
}

/**
 * ln(ρ_DE(a)/ρ_DE(1)) para a CPL: −3(1 + w₀ + w_a) ln a − 3 w_a (1 − a).
 * Com w constante, ρ_DE ∝ a^(−3(1+w)); com Λ, zero.
 */
export function lnDarkEnergyDensity(lnA: number, c: Cosmology): number {
  const w0 = c.w0 ?? -1;
  const wa = c.wa ?? 0;
  if (w0 === -1 && wa === 0) return 0;
  return -3 * (1 + w0 + wa) * lnA - 3 * wa * (1 - Math.exp(lnA));
}

/** Equação de estado da energia escura w(a). */
export function darkEnergyW(a: number, c: Cosmology): number {
  return (c.w0 ?? -1) + (c.wa ?? 0) * (1 - a);
}
/** ln(H/H₀) em função de ln a, sem estouro em a → 0 ou a → ∞. */
export function lnExpansionRate(lnA: number, c: Cosmology): number {
  return 0.5 * logSumExp([Math.log(c.omegaR) - 4 * lnA, Math.log(c.omegaM) - 3 * lnA, Math.log(c.omegaL) + lnDarkEnergyDensity(lnA, c)]);
}

/** H(a) em km/s/Mpc. */
export function hubbleParameter(a: number, c: Cosmology): number {
  return c.h0 * Math.exp(lnExpansionRate(Math.log(a), c));
}

/** Frações de densidade (radiação, matéria, energia escura) em função de ln a, e seus log₁₀. */
export function densityFractions(lnA: number, c: Cosmology) {
  const logs = [Math.log(c.omegaR) - 4 * lnA, Math.log(c.omegaM) - 3 * lnA, Math.log(c.omegaL) + lnDarkEnergyDensity(lnA, c)];
  const total = logSumExp(logs);
  const [radiation, matter, darkEnergy] = logs.map((l) => (l - total) / Math.LN10);
  return {
    radiation: 10 ** radiation,
    matter: 10 ** matter,
    darkEnergy: 10 ** darkEnergy,
    log10: { radiation, matter, darkEnergy },
  };
}

/** Parâmetro de desaceleração q = (Ω_r a⁻⁴ + ½Ω_m a⁻³ + ½(1 + 3w) Ω_DE(a)) / E²; com Λ, o último termo é −Ω_Λ. */
export function decelerationParameter(a: number, c: Cosmology): number {
  const r = c.omegaR / a ** 4;
  const m = c.omegaM / a ** 3;
  const de = c.omegaL * Math.exp(lnDarkEnergyDensity(Math.log(a), c));
  return (r + m / 2 + ((1 + 3 * darkEnergyW(a, c)) / 2) * de) / (r + m + de);
}

// --- Tempo cósmico ---------------------------------------------------------
//
// t(a) = ∫₀ᵃ da′/(a′H) = ∫ d(ln a′)/H. Abaixo de A_START a radiação domina
// (Ω_m a/Ω_r < 10⁻⁸) e vale a solução analítica t = a²/(2H₀√Ω_r); acima,
// integramos em ln a por Gauss-Legendre de 5 pontos numa malha fina e
// guardamos a tabela. Acima de A_END (a = 1000) só a energia escura importa:
// com Λ, ln a cresce linearmente com t, à taxa H₀√Ω_Λ; com w constante,
// H = H₀√Ω_DE a^β, β = −3(1+w)/2, e a integral também é analítica (ver `farFuture`).

const LN_A_START = Math.log(1e-12);
const LN_A_END = Math.log(1e3);
const STEPS = 3000;
const GL_X = [0, -0.5384693101056831, 0.5384693101056831, -0.906179845938664, 0.906179845938664];
const GL_W = [0.5688888888888889, 0.47862867049936647, 0.47862867049936647, 0.23692688505618908, 0.23692688505618908];

type Table = { cosmology: Cosmology; h0SI: number; lnA: Float64Array; t: Float64Array };
const tables = new Map<string, Table>();

const radiationTime = (a: number, h0SI: number, c: Cosmology) => a ** 2 / (2 * h0SI * Math.sqrt(c.omegaR));

/** ∫ d(ln a)/H entre x0 e x1 (Gauss-Legendre de 5 pontos). */
function segment(x0: number, x1: number, h0SI: number, c: Cosmology): number {
  const mid = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  let sum = 0;
  for (let i = 0; i < 5; i += 1) sum += GL_W[i] * Math.exp(-lnExpansionRate(mid + half * GL_X[i], c));
  return (sum * half) / h0SI;
}

function table(c: Cosmology): Table {
  const key = `${c.h0}|${c.omegaM}|${c.omegaR}|${c.w0 ?? -1}|${c.wa ?? 0}`;
  const cached = tables.get(key);
  if (cached) return cached;
  const h0SI = hubbleRateSI(c.h0);
  const lnA = new Float64Array(STEPS + 1);
  const t = new Float64Array(STEPS + 1);
  const dx = (LN_A_END - LN_A_START) / STEPS;
  lnA[0] = LN_A_START;
  t[0] = radiationTime(Math.exp(LN_A_START), h0SI, c);
  for (let i = 1; i <= STEPS; i += 1) {
    lnA[i] = LN_A_START + i * dx;
    t[i] = t[i - 1] + segment(lnA[i - 1], lnA[i], h0SI, c);
  }
  const built = { cosmology: c, h0SI, lnA, t };
  tables.set(key, built);
  return built;
}

/**
 * Depois de a = 1000, só a energia escura conta: H = H₀√Ω_DE e^(−βx), com
 * x = ln a e β = 3(1+w)/2 (β = 0 para Λ). Então
 * t(x) = t_END + (e^(βx) − e^(βX))/(β H₀√Ω_DE). Com w < −1 (β < 0), t tende a um
 * valor finito quando a → ∞: o Big Rip. A CPL não tem esse trecho (só vale até a ~ 1).
 */
function farFuture(c: Cosmology, tab: Table) {
  if ((c.wa ?? 0) !== 0) throw new RangeError("A parametrização CPL não vale no futuro distante (a > 1000).");
  const beta = (3 * (1 + (c.w0 ?? -1))) / 2;
  const rate = tab.h0SI * Math.sqrt(c.omegaL);
  const tEnd = tab.t[STEPS];
  return {
    beta,
    time: (lnA: number) => (beta === 0 ? tEnd + (lnA - LN_A_END) / rate : tEnd + Math.expm1(beta * (lnA - LN_A_END)) * Math.exp(beta * LN_A_END) / (beta * rate)),
    lnA: (timeS: number) => {
      if (beta === 0) return LN_A_END + (timeS - tEnd) * rate;
      const arg = 1 + (beta * rate * (timeS - tEnd)) / Math.exp(beta * LN_A_END);
      return arg > 0 ? LN_A_END + Math.log(arg) / beta : Infinity;
    },
    /** Instante do Big Rip (a → ∞), só para w < −1. */
    rip: beta < 0 ? tEnd - Math.exp(beta * LN_A_END) / (beta * rate) : Infinity,
  };
}

/** Instante do Big Rip, em segundos desde o Big Bang (infinito se w ≥ −1). Só para w constante. */
export function bigRipTimeS(c: Cosmology): number {
  return farFuture(c, table(c)).rip;
}

/** Tempo cósmico t(a), em segundos, a partir de ln a. */
export function timeAtLnScaleFactorS(lnA: number, c: Cosmology = PLANCK_2018): number {
  const tab = table(c);
  if (lnA <= LN_A_START) return radiationTime(Math.exp(lnA), tab.h0SI, c);
  if (lnA >= LN_A_END) return farFuture(c, tab).time(lnA);
  const dx = (LN_A_END - LN_A_START) / STEPS;
  const i = Math.floor((lnA - LN_A_START) / dx);
  return tab.t[i] + segment(tab.lnA[i], lnA, tab.h0SI, c);
}

/** Tempo cósmico t(a), em segundos. */
export function timeAtScaleFactorS(a: number, c: Cosmology = PLANCK_2018): number {
  assertPositive(a, "O fator de escala");
  return timeAtLnScaleFactorS(Math.log(a), c);
}

/** Tempo cósmico no redshift z, em segundos. */
export function timeAtRedshiftS(z: number, c: Cosmology = PLANCK_2018): number {
  return timeAtLnScaleFactorS(-Math.log1p(z), c);
}

/** Idade do universo t₀ = t(a = 1), em segundos. */
export function ageOfUniverseS(c: Cosmology = PLANCK_2018): number {
  return timeAtLnScaleFactorS(0, c);
}

/** ln a(t): inverso de t(a), com interpolação de Hermite (d ln a/dt = H) e um passo de Newton. */
export function lnScaleFactorAtTime(timeS: number, c: Cosmology = PLANCK_2018): number {
  assertPositive(timeS, "O tempo");
  const tab = table(c);
  if (timeS <= tab.t[0]) return 0.5 * Math.log(2 * tab.h0SI * Math.sqrt(c.omegaR) * timeS);
  if (timeS >= tab.t[STEPS]) return farFuture(c, tab).lnA(timeS);
  let lo = 0;
  let hi = STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tab.t[mid] <= timeS) lo = mid; else hi = mid;
  }
  // Hermite em (ln t, ln a), com inclinação d ln a / d ln t = t H.
  const slope = (i: number) => tab.t[i] * tab.h0SI * Math.exp(lnExpansionRate(tab.lnA[i], c));
  const u0 = Math.log(tab.t[lo]);
  const u1 = Math.log(tab.t[hi]);
  const h = u1 - u0;
  const s = (Math.log(timeS) - u0) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  const h11 = s ** 3 - s ** 2;
  let lnA = h00 * tab.lnA[lo] + h10 * h * slope(lo) + h01 * tab.lnA[hi] + h11 * h * slope(hi);
  // Newton: t(ln a) − t = 0, com dt/d(ln a) = 1/H.
  lnA -= (timeAtLnScaleFactorS(lnA, c) - timeS) * tab.h0SI * Math.exp(lnExpansionRate(lnA, c));
  return lnA;
}

/** Redshift z = 1/a − 1 no instante t (negativo no futuro). */
export function redshiftAtTime(timeS: number, c: Cosmology = PLANCK_2018): number {
  return Math.expm1(-lnScaleFactorAtTime(timeS, c));
}

/** log₁₀ da temperatura do fundo de radiação, T = T₀ (1 + z) = T₀/a. */
export function log10TemperatureAtTime(timeS: number, c: Cosmology = PLANCK_2018): number {
  return Math.log10(cmbTemperature) - lnScaleFactorAtTime(timeS, c) / Math.LN10;
}

/** Temperatura do fundo de radiação T = T₀ (1 + z), em K. */
export function temperatureAtTimeK(timeS: number, c: Cosmology = PLANCK_2018): number {
  return 10 ** log10TemperatureAtTime(timeS, c);
}

/** Instante em que a radiação tem temperatura T, em segundos. */
export function timeAtTemperatureS(temperatureK: number, c: Cosmology = PLANCK_2018): number {
  assertPositive(temperatureK, "A temperatura");
  return timeAtLnScaleFactorS(Math.log(cmbTemperature / temperatureK), c);
}

/** Redshift de um evento ocorrido há `lookbackS` segundos. */
export function redshiftForLookbackS(lookbackS: number, c: Cosmology = PLANCK_2018): number {
  return redshiftAtTime(ageOfUniverseS(c) - lookbackS, c);
}

// --- Marcos derivados do modelo -------------------------------------------

/** Igualdade matéria-radiação: Ω_m a⁻³ = Ω_r a⁻⁴ ⇒ 1 + z = Ω_m/Ω_r. */
export function matterRadiationEqualityRedshift(c: Cosmology = PLANCK_2018): number {
  return c.omegaM / c.omegaR - 1;
}

/** Igualdade matéria-energia escura: Ω_m a⁻³ = Ω_Λ. */
export function matterLambdaEqualityRedshift(c: Cosmology = PLANCK_2018): number {
  return Math.cbrt(c.omegaL / c.omegaM) - 1;
}

/**
 * Início da aceleração: q(a) = 0, por bisseção em ln a. Sem radiação,
 * 1 + z = (2Ω_Λ/Ω_m)^(1/3); a radiação muda o resultado em ~10⁻⁴.
 */
export function accelerationOnsetRedshift(c: Cosmology = PLANCK_2018): number {
  let lo = Math.log(1e-3);
  let hi = Math.log(10);
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (decelerationParameter(Math.exp(mid), c) > 0) lo = mid; else hi = mid;
  }
  return Math.expm1(-(lo + hi) / 2);
}

/** Integral de Simpson simples, para os horizontes. */
function simpson(f: (x: number) => number, lo: number, hi: number, n = 2000): number {
  const h = (hi - lo) / n;
  let sum = f(lo) + f(hi);
  for (let i = 1; i < n; i += 1) sum += f(lo + i * h) * (i % 2 ? 4 : 2);
  return (sum * h) / 3;
}

/**
 * Horizonte de partículas comóvel: c ∫₀¹ da/(a² H). Em ln a o integrando é
 * 1/(a H), que vai a 1/(H₀√Ω_r)·a → 0 quando a → 0; começamos em a = 10⁻¹².
 */
export function particleHorizonM(c: Cosmology = PLANCK_2018): number {
  const h0SI = hubbleRateSI(c.h0);
  const early = (1e-12 * speedOfLight) / (h0SI * Math.sqrt(c.omegaR));
  return early + (speedOfLight / h0SI) * simpson((x) => Math.exp(-x - lnExpansionRate(x, c)), LN_A_START, 0);
}

/**
 * Horizonte de eventos comóvel: c ∫₁^∞ da/(a² H). Com u = 1/a vira
 * c ∫₀¹ du / H(1/u), um integrando suave.
 */
export function eventHorizonM(c: Cosmology = PLANCK_2018): number {
  const h0SI = hubbleRateSI(c.h0);
  return (speedOfLight / h0SI) * simpson((u) => 1 / Math.sqrt(c.omegaR * u ** 4 + c.omegaM * u ** 3 + c.omegaL), 0, 1);
}

/** Tempo de Hubble 1/H₀, em segundos. */
export function hubbleTimeS(c: Cosmology = PLANCK_2018): number {
  return 1 / hubbleRateSI(c.h0);
}

/** Tempo de e-dobra do futuro dominado por Λ, 1/(H₀√Ω_Λ), em segundos. */
export function lambdaEfoldTimeS(c: Cosmology = PLANCK_2018): number {
  return 1 / (hubbleRateSI(c.h0) * Math.sqrt(c.omegaL));
}

/** Tempo de Planck t_P = √(ħG/c⁵), em segundos. */
export function planckTimeS(): number {
  return Math.sqrt((reducedPlanckConstant * gravitationalConstant) / speedOfLight ** 5);
}

/**
 * Temperatura de Gibbons-Hawking do horizonte de de Sitter, T = ħH_Λ/(2πk),
 * com H_Λ = H₀√Ω_Λ (Gibbons e Hawking, Phys. Rev. D 15, 2738, 1977).
 * Previsão teórica, nunca medida.
 */
export function deSitterTemperatureK(c: Cosmology = PLANCK_2018): number {
  return (reducedPlanckConstant / lambdaEfoldTimeS(c)) / (2 * Math.PI * boltzmannConstant);
}
