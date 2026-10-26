/**
 * Trilha 2, Módulo 2.3 — Verossimilhança dos dados reais para um universo plano com
 * radiação, matéria e energia escura CPL, w(a) = w₀ + w_a (1 − a).
 *
 * Reaproveita a equação de Friedmann dos Módulos 2.1 e 2.2 (`lnExpansionRate` em friedmann.ts).
 * Dados (src/data/cosmo/): BAO do DESI DR2, "distance priors" do Planck 2018 (Chen, Huang e
 * Wang, JCAP 02, 028, 2019) e supernovas comprimidas do Union3 (Rubin et al., 2023).
 *
 * Fórmulas, conferidas nas fontes (as mesmas de scripts/validacao_cosmo.py, que valida este código):
 *  - Radiação: Ω_r = Ω_m/(1 + z_eq), z_eq = 2,5 × 10⁴ Ω_m h² (T₀/2,7 K)⁻⁴ (Chen et al., eq. 6).
 *  - z*: Hu e Sugiyama, ApJ 471, 542 (1996), como no código do apêndice de Chen et al.
 *    (g₁ com 0,0783; a eq. 9 do texto traz 0,0738, um erro de digitação).
 *  - r_s(z) = ∫ c_s da/(a² H), c_s = c/√(3(1 + R_b a)), 3/(4ω_γ) = 31.500 (T₀/2,7 K)⁻⁴ (eq. 3).
 *  - R = √Ω_m H₀ D_M(z*)/c e l_A = π D_M(z*)/r_s(z*) (eqs. 1 e 2).
 *  - r_d = r_s(z_d) × 148,92/153,017, com z_d de Eisenstein e Hu, ApJ 496, 605 (1998), como no
 *    apêndice de Chen et al.
 *  - Supernovas: μ = 5 log₁₀(D_L/10 pc), com a magnitude absoluta marginalizada analiticamente.
 */
import { cmbTemperature, speedOfLight } from "./constants";
import { expansionRateSquared, type Cosmology } from "./friedmann";
import { quadraticForm } from "./linalg";
import { DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3, type BaoData, type CmbPriors, type SupernovaData } from "../data/cosmo";

export type CosmoParams = {
  omegaM: number;
  /** H₀ em km/s/Mpc. */
  h0: number;
  omegaBh2: number;
  w0: number;
  wa: number;
};

const C_KMS = speedOfLight / 1000;
const THETA_27 = cmbTemperature / 2.7;
/** Reescala de r_d do apêndice de Chen et al. (r_drag do CAMB / integral com z_d de Eisenstein e Hu). */
const RD_RESCALE = 148.92 / 153.017;

/** Universo plano dos distance priors: Ω_r pela eq. 6 de Chen et al. e energia escura CPL. */
export function cosmologyFor(p: CosmoParams): Cosmology {
  const h = p.h0 / 100;
  const zEq = 2.5e4 * p.omegaM * h * h * THETA_27 ** -4;
  const omegaR = p.omegaM / (1 + zEq);
  return { h0: p.h0, omegaM: p.omegaM, omegaR, omegaL: 1 - p.omegaM - omegaR, w0: p.w0, wa: p.wa };
}

/** Redshift do desacoplamento, ajuste de Hu e Sugiyama (1996). */
export function zStar(omegaBh2: number, omegaMh2: number): number {
  const g1 = (0.0783 * omegaBh2 ** -0.238) / (1 + 39.5 * omegaBh2 ** 0.763);
  const g2 = 0.56 / (1 + 21.1 * omegaBh2 ** 1.81);
  return 1048 * (1 + 0.00124 * omegaBh2 ** -0.738) * (1 + g1 * omegaMh2 ** g2);
}

/** Redshift da época de arrasto dos bárions, ajuste de Eisenstein e Hu (1998). */
export function zDrag(omegaBh2: number, omegaMh2: number): number {
  const b1 = 0.313 * omegaMh2 ** -0.419 * (1 + 0.607 * omegaMh2 ** 0.674);
  const b2 = 0.238 * omegaMh2 ** 0.223;
  return ((1291 * omegaMh2 ** 0.251) / (1 + 0.659 * omegaMh2 ** 0.828)) * (1 + b1 * omegaBh2 ** b2);
}

const GL_X = [0, -0.5384693101056831, 0.5384693101056831, -0.906179845938664, 0.906179845938664];
const GL_W = [0.5688888888888889, 0.47862867049936647, 0.47862867049936647, 0.23692688505618908, 0.23692688505618908];

/** ∫ f entre x0 e x1, Gauss-Legendre de 5 pontos em segmentos de largura ≤ `step`. */
export function integrate(f: (x: number) => number, x0: number, x1: number, step: number): number {
  const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / step));
  const h = (x1 - x0) / n;
  let sum = 0;
  for (let k = 0; k < n; k += 1) {
    const mid = x0 + (k + 0.5) * h;
    for (let i = 0; i < 5; i += 1) sum += GL_W[i] * f(mid + (h / 2) * GL_X[i]);
  }
  return (sum * h) / 2;
}

/** Início da integral de r_s em ln a; antes disso o integrando é ∝ a e a cauda vale f(X_EARLY). */
const X_EARLY = -30;
/** Malha de D_M em ln a, de a = 1 até depois de z*: nós a cada 0,2 (Gauss-Legendre de 5 pontos por trecho). */
const DM_STEP = 0.2;
const DM_NODES = 38;

export type Distances = {
  cosmology: Cosmology;
  /** Distância comóvel D_M(z), em Mpc (z até ~1.900). */
  dm: (z: number) => number;
  /** D_H(z) = c/H(z), em Mpc. */
  dh: (z: number) => number;
  /** D_V(z) = (z D_M² D_H)^(1/3), em Mpc. */
  dv: (z: number) => number;
  /** Horizonte sonoro comóvel r_s(z), em Mpc. */
  rs: (z: number) => number;
  zStar: number;
  zDrag: number;
  /** r_d = r_s(z_d) com a reescala de Chen et al., em Mpc. */
  rd: number;
  /** Parâmetro de deslocamento R e escala acústica l_A. */
  shiftR: number;
  lA: number;
};

/**
 * Distâncias do modelo. D_M vem de uma tabela acumulada em ln a (nós a cada 0,2) mais o
 * trecho final exato; assim, cada consulta custa só 5 avaliações de H, o que permite
 * calcular milhares de modelos no navegador (grade do Módulo 2.3).
 */
export function distances(p: CosmoParams): Distances {
  const c = cosmologyFor(p);
  const hubbleDistance = C_KMS / p.h0;
  const invE = (x: number) => 1 / Math.sqrt(expansionRateSquared(x, c));
  const dmIntegrand = (x: number) => Math.exp(-x) * invE(x);
  // cumDm[k] = ∫ de x = −k·DM_STEP até 0 (em unidades de c/H₀).
  const cumDm = new Float64Array(DM_NODES + 1);
  for (let k = 1; k <= DM_NODES; k += 1) cumDm[k] = cumDm[k - 1] + integrate(dmIntegrand, -k * DM_STEP, -(k - 1) * DM_STEP, DM_STEP);
  const dm = (z: number) => {
    const x = -Math.log1p(z);
    const k = Math.min(DM_NODES, Math.floor(-x / DM_STEP));
    if (k >= DM_NODES) return hubbleDistance * (cumDm[DM_NODES] + integrate(dmIntegrand, x, -DM_NODES * DM_STEP, DM_STEP));
    return hubbleDistance * (cumDm[k] + integrate(dmIntegrand, x, -k * DM_STEP, DM_STEP));
  };
  const dh = (z: number) => hubbleDistance * invE(-Math.log1p(z));
  const rb = 31500 * p.omegaBh2 * THETA_27 ** -4;
  const rsIntegrand = (x: number) => (Math.exp(-x) * invE(x)) / Math.sqrt(3 * (1 + rb * Math.exp(x)));
  const rs = (z: number) => hubbleDistance * (rsIntegrand(X_EARLY) + integrate(rsIntegrand, X_EARLY, -Math.log1p(z), 0.5));
  const omegaMh2 = p.omegaM * (p.h0 / 100) ** 2;
  const zs = zStar(p.omegaBh2, omegaMh2);
  const zd = zDrag(p.omegaBh2, omegaMh2);
  // r_s(z*) e r_s(z_d) numa só passada: z_d < z*, então r_s(z_d) = r_s(z*) + o trecho entre os dois.
  const rsStar = rs(zs);
  const rsDrag = rsStar + hubbleDistance * integrate(rsIntegrand, -Math.log1p(zs), -Math.log1p(zd), 0.5);
  const dmStar = dm(zs);
  return {
    cosmology: c,
    dm,
    dh,
    dv: (z) => Math.cbrt(z * dm(z) ** 2 * dh(z)),
    rs,
    zStar: zs,
    zDrag: zd,
    rd: rsDrag * RD_RESCALE,
    shiftR: (Math.sqrt(p.omegaM) * p.h0 * dmStar) / C_KMS,
    lA: (Math.PI * dmStar) / rsStar,
  };
}

// --- χ² -----------------------------------------------------------------------------

/** BAO: χ² = Δᵀ C⁻¹ Δ. Com `rd`, usa esse r_d (BAO sozinho calibra só H₀ r_d). */
export function chi2Bao(d: Distances, rd: number = d.rd, data: BaoData = DESI_DR2_BAO): number {
  const delta = data.z.map((z, i) => {
    const q = data.quantity[i];
    const model = q === 'DM_over_rs' ? d.dm(z) : q === 'DH_over_rs' ? d.dh(z) : d.dv(z);
    return model / rd - data.value[i];
  });
  return quadraticForm(delta, data.invCov);
}

/** CMB comprimido: R, l_A e ω_b contra os distance priors. */
export function chi2Cmb(d: Distances, omegaBh2: number, data: CmbPriors = PLANCK_2018_DISTANCE_PRIORS): number {
  const delta = [d.shiftR - data.mean[0], d.lA - data.mean[1], omegaBh2 - data.mean[2]];
  return quadraticForm(delta, data.invCov);
}

/**
 * Supernovas com a magnitude absoluta marginalizada analiticamente: com Δ = μ_modelo − μ_dados,
 * χ² = ΔᵀC⁻¹Δ − (Σ C⁻¹Δ)² / (Σ C⁻¹).
 */
export function chi2Supernovae(d: Distances, data: SupernovaData = UNION3): number {
  const delta = data.z.map((z, i) => 5 * Math.log10((1 + z) * d.dm(z)) + 25 - data.mu[i]);
  const ones = delta.map(() => 1);
  const a = quadraticForm(delta, data.invCov);
  const b = quadraticForm(ones, data.invCov, delta);
  const e = quadraticForm(ones, data.invCov);
  return a - (b * b) / e;
}

export type DataCombination = 'bao' | 'bao+cmb' | 'bao+cmb+sn';

/** χ² total da combinação de dados; para BAO sozinho, r_d vem do modelo (ω_b fixo). */
export function chi2Total(p: CosmoParams, combination: DataCombination): number {
  const d = distances(p);
  let total = chi2Bao(d);
  if (combination !== 'bao') total += chi2Cmb(d, p.omegaBh2);
  if (combination === 'bao+cmb+sn') total += chi2Supernovae(d);
  return total;
}
