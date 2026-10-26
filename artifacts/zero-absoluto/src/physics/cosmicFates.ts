/**
 * Trilha 2, Módulo 2.2 — Os destinos possíveis do universo, sempre plano.
 *
 * Três famílias de energia escura:
 *  1. w constante: ρ_DE ∝ a^(−3(1+w)). Com w < −1 ("energia fantasma"), Big Rip.
 *  2. Λ negativo com matéria (sem radiação): recontração e Big Crunch, solução analítica.
 *  3. CPL, w(a) = w₀ + w_a (1 − a): só vale perto de a ≤ 1; aqui, até a = 2.
 *
 * As famílias 1 e 3 usam o resolvedor de Friedmann do Módulo 2.1 (`friedmann.ts`).
 *
 * Referências: R. R. Caldwell, M. Kamionkowski e N. N. Weinberg, PRL 91, 071301 (2003);
 * M. Chevallier e D. Polarski, IJMPD 10, 213 (2001); E. V. Linder, PRL 90, 091301 (2003);
 * DESI Collaboration, PRD 112, 083515 (2025).
 */
import {
  earthGM,
  earthRadius,
  gravitationalConstant,
  julianYear,
  parsec,
  reducedPlanckConstant,
  electronMass,
  fineStructureConstant,
  speedOfLight,
  solarMass,
} from "./constants";
import { assertPositive } from "./calculations";
import { hubbleRateSI } from "./vacuumEnergy";
import { PLANCK_2018_H0, PLANCK_2018_OMEGA_M, ageOfUniverseS, bigRipTimeS, makeDarkEnergyCosmology, type Cosmology } from "./friedmann";

/**
 * DESI DR2 + CMB + supernovas do DES (5 anos), modelo w₀w_aCDM: médias
 * marginalizadas da Tabela V de DESI Collaboration, PRD 112, 083515 (2025),
 * arXiv:2503.14738. Preferência de 4,2σ sobre o ΛCDM nessa combinação.
 */
export const DESI_DR2_DESY5 = { w0: -0.752, wa: -0.86, omegaM: 0.3191, h0: 66.74 };
/** As outras duas combinações com supernovas da mesma tabela (2,8σ e 3,8σ). */
export const DESI_DR2_PANTHEON = { w0: -0.838, wa: -0.62, omegaM: 0.3114, h0: 67.51 };
export const DESI_DR2_UNION3 = { w0: -0.667, wa: -1.09, omegaM: 0.3275, h0: 65.91 };

/**
 * Idade dos aglomerados globulares mais velhos: 13,32 ± 0,1 (estat.) ± 0,5 (sist.)
 * bilhões de anos (Valcin et al., JCAP 12, 002, 2020). Arredondamos para o limite
 * de ~13 bilhões de anos: um modelo em que o universo é mais novo que isso fica descartado.
 */
export const OLDEST_STARS_GYR = 13;

/** No modo CPL, a simulação para em a = 2: além disso a parametrização não tem base física. */
export const CPL_MAX_SCALE_FACTOR = 2;

const SECONDS_PER_GYR = 1e9 * julianYear;

// --- 1. w constante: Big Rip ------------------------------------------------

/** Universo plano com w constante e os parâmetros do Planck 2018 (por padrão). */
export function constantWCosmology(w: number, h0: number = PLANCK_2018_H0, omegaM: number = PLANCK_2018_OMEGA_M): Cosmology {
  return makeDarkEnergyCosmology(w, 0, h0, omegaM);
}

/**
 * Tempo de hoje até o Big Rip, ∫₁^∞ da/(aH), em segundos, com matéria,
 * radiação e energia fantasma (infinito se w ≥ −1).
 */
export function timeToBigRipS(c: Cosmology): number {
  return bigRipTimeS(c) - ageOfUniverseS(c);
}

/**
 * Aproximação de Caldwell, Kamionkowski e Weinberg (2003), que despreza a matéria:
 * t_rip − t₀ ≈ (2/3) |1 + w|⁻¹ H₀⁻¹ (1 − Ω_m)^(−1/2).
 */
export function caldwellBigRipApproxS(w: number, h0: number = PLANCK_2018_H0, omegaM: number = PLANCK_2018_OMEGA_M): number {
  if (w >= -1) return Infinity;
  return (2 / 3) / Math.abs(1 + w) / hubbleRateSI(h0) / Math.sqrt(1 - omegaM);
}

/**
 * Quanto tempo antes do Big Rip uma estrutura ligada de período orbital P se
 * desfaz: t ≈ P √(2|1 + 3w|) / (6π|1 + w|) (Caldwell, Kamionkowski e Weinberg, 2003).
 * Independe de H₀ e Ω_m. Com w = −3/2, t ≈ 0,3 P.
 */
export function ripLeadTimeS(periodS: number, w: number): number {
  assertPositive(periodS, "O período");
  if (w >= -1) return Infinity;
  return (periodS * Math.sqrt(2 * Math.abs(1 + 3 * w))) / (6 * Math.PI * Math.abs(1 + w));
}

/** Período de uma órbita circular de raio R em torno da massa M: P = 2π √(R³/(GM)). */
export function keplerPeriodS(massKg: number, radiusM: number): number {
  return 2 * Math.PI * Math.sqrt(radiusM ** 3 / (gravitationalConstant * massKg));
}

/** Período de Bohr do hidrogênio, 2π a₀ / (α c), com a₀ = ħ/(m_e c α). */
const bohrPeriodS = () => (2 * Math.PI * (reducedPlanckConstant / (electronMass * speedOfLight * fineStructureConstant))) / (fineStructureConstant * speedOfLight);

export type RipStructure = {
  id: string;
  name: string;
  /** Como o período foi obtido. */
  basis: string;
  periodS: number;
  /** Tempo antes do Big Rip citado por Caldwell et al. para w = −3/2, quando há. */
  paper?: string;
};

/**
 * Estruturas e períodos típicos. Aglomerado: 10¹⁵ massas solares e raio de 1 Mpc
 * (ordem de grandeza de um aglomerado rico). Via Láctea: órbita do Sol, R₀ = 8,2 kpc
 * e Θ₀ = 238 km/s (Bland-Hawthorn e Gerhard, ARA&A 54, 529, 2016). Sistema solar:
 * órbita da Terra, 1 ano. Terra: órbita rente à superfície. Átomo: período de Bohr,
 * uma extrapolação, porque a regra foi deduzida para sistemas ligados pela gravidade.
 */
export function ripStructures(): RipStructure[] {
  return [
    { id: "aglomerados", name: "Aglomerados de galáxias", basis: "órbita de 1 Mpc em torno de 10¹⁵ massas solares", periodS: keplerPeriodS(1e15 * solarMass, 1e6 * parsec), paper: "~1 bilhão de anos" },
    { id: "via-lactea", name: "Via Láctea", basis: "órbita do Sol em torno do centro da galáxia", periodS: (2 * Math.PI * 8.2e3 * parsec) / 238e3, paper: "~60 milhões de anos" },
    { id: "sistema-solar", name: "Sistema solar", basis: "órbita da Terra em torno do Sol, 1 ano", periodS: julianYear, paper: "~3 meses" },
    { id: "terra", name: "Terra", basis: "órbita rente à superfície da Terra", periodS: 2 * Math.PI * Math.sqrt(earthRadius ** 3 / earthGM), paper: "~30 minutos" },
    { id: "atomos", name: "Átomos", basis: "período de Bohr do elétron no hidrogênio", periodS: bohrPeriodS(), paper: "~10⁻¹⁹ s" },
  ];
}

// --- 2. Λ negativo: recontração ---------------------------------------------

export type Recollapse = {
  omegaL: number;
  omegaM: number;
  /** Fator de escala máximo, (Ω_m/|Ω_Λ|)^(1/3). */
  aMax: number;
  /** Tempo total de vida, do Big Bang ao Big Crunch, 2π/(3H₀√|Ω_Λ|), em s. */
  crunchS: number;
  /** Idade de hoje (a = 1), em s. */
  ageS: number;
  /** Instante da expansão máxima, metade da vida, em s. */
  turnaroundS: number;
};

/**
 * Plano, só matéria e Λ < 0, com Ω_m = 1 − Ω_Λ. H² = H₀² (Ω_m a⁻³ − |Ω_Λ|), cuja
 * solução é a³ = (Ω_m/|Ω_Λ|) sen²(3/2 · H₀√|Ω_Λ| · t).
 */
export function recollapse(omegaL: number, h0: number = PLANCK_2018_H0): Recollapse {
  if (!(omegaL < 0)) throw new RangeError("A recontração exige Ω_Λ < 0.");
  const omegaM = 1 - omegaL;
  const k = 1.5 * hubbleRateSI(h0) * Math.sqrt(-omegaL);
  const crunchS = Math.PI / k;
  return {
    omegaL,
    omegaM,
    aMax: Math.cbrt(omegaM / -omegaL),
    crunchS,
    ageS: Math.asin(Math.sqrt(-omegaL / omegaM)) / k,
    turnaroundS: crunchS / 2,
  };
}

/** Fator de escala da recontração no instante t (0 no Big Bang e no Big Crunch). */
export function recollapseScaleFactor(timeS: number, omegaL: number, h0: number = PLANCK_2018_H0): number {
  const r = recollapse(omegaL, h0);
  if (timeS <= 0 || timeS >= r.crunchS) return 0;
  const k = Math.PI / r.crunchS;
  return r.aMax * Math.sin(k * timeS) ** (2 / 3);
}

/**
 * Conferência numérica da recontração: t(a₁ → a₂) = ∫ da/(aH), por Simpson,
 * com a = a_máx (1 − u²) para remover a singularidade integrável em a_máx (H = 0).
 * Devolve [idade de hoje, tempo total de vida], em s.
 */
export function recollapseNumericS(omegaL: number, h0: number = PLANCK_2018_H0, n = 20000): [number, number] {
  const omegaM = 1 - omegaL;
  const h0SI = hubbleRateSI(h0);
  const aMax = Math.cbrt(omegaM / -omegaL);
  // dt/du = 2 a_máx u / (a H), com a = a_máx (1 − u²); vai a 0 quando u → 0 (a = a_máx).
  const integrand = (u: number) => {
    const a = aMax * (1 - u * u);
    if (a <= 0) return 0;
    // Em u → 0, H ≈ H₀√(3|Ω_Λ|) u: o limite do integrando é 2/(H₀√(3|Ω_Λ|)).
    if (u < 1e-6) return 2 / (h0SI * Math.sqrt(-3 * omegaL));
    const H = h0SI * Math.sqrt(omegaM / a ** 3 + omegaL);
    return (2 * aMax * u) / (a * H);
  };
  const simpson = (lo: number, hi: number) => {
    const h = (hi - lo) / n;
    let sum = integrand(lo) + integrand(hi);
    for (let i = 1; i < n; i += 1) sum += integrand(lo + i * h) * (i % 2 ? 4 : 2);
    return (sum * h) / 3;
  };
  const half = simpson(0, 1);
  // a = 1 corresponde a u₁ = √(1 − 1/a_máx); de a = 0 (u = 1) até a = 1 (u₁).
  const u1 = Math.sqrt(1 - 1 / aMax);
  return [simpson(u1, 1), 2 * half];
}

// --- Utilidades ---------------------------------------------------------------

export const secondsToGyr = (seconds: number) => seconds / SECONDS_PER_GYR;
export const gyrToSeconds = (gyr: number) => gyr * SECONDS_PER_GYR;

/** Um modelo cuja idade de hoje fica abaixo da das estrelas mais velhas está descartado. */
export const tooYoung = (ageS: number) => secondsToGyr(ageS) < OLDEST_STARS_GYR;

/** Universo da CPL com os parâmetros de um ajuste do DESI. */
export function desiCosmology(fit: { w0: number; wa: number; omegaM: number; h0: number } = DESI_DR2_DESY5): Cosmology {
  return makeDarkEnergyCosmology(fit.w0, fit.wa, fit.h0, fit.omegaM);
}
