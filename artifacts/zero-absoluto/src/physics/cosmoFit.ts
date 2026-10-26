/**
 * Trilha 2, Módulo 2.3 — Ajustes no plano w₀ × w_a.
 *
 * Para cada (w₀, w_a), os outros parâmetros são escolhidos para minimizar o χ² (perfil, e não
 * marginalização por MCMC): Ω_m, H₀ e ω_b com o CMB; com BAO sozinho, Ω_m e a combinação H₀ r_d,
 * que o BAO mede sem calibração (resolvida analiticamente). A minimização é de Levenberg-Marquardt
 * sobre os resíduos "branqueados" pela covariância, r = Lᵀ Δ com C⁻¹ = L Lᵀ, de modo que χ² = |r|².
 *
 * Priors do DESI DR2 (Sec. VI do artigo): w₀ ∈ [−3, 1], w_a ∈ [−3, 2] e w₀ + w_a < 0.
 */
import { DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3 } from "../data/cosmo";
import { distances, type CosmoParams, type DataCombination, type Distances } from "./cosmoLikelihood";
import { cholesky, solveLinear } from "./linalg";

/** Δχ² para 1σ e 2σ com dois parâmetros (68,3% e 95,4%). */
export const DELTA_CHI2_1SIGMA = 2.2957;
export const DELTA_CHI2_2SIGMA = 6.1801;

// Branqueamento: com C⁻¹ = L Lᵀ, o resíduo Lᵀ Δ tem χ² = |Lᵀ Δ|².
const L_BAO = cholesky(DESI_DR2_BAO.invCov);
const L_CMB = cholesky(PLANCK_2018_DISTANCE_PRIORS.invCov);
const L_SN = cholesky(UNION3.invCov);
const SN_ONES_WEIGHT = UNION3.invCov.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
const SN_ROW_SUMS = UNION3.invCov.map((row) => row.reduce((a, b) => a + b, 0));

function whiten(l: number[][], delta: number[], out: number[]) {
  for (let j = 0; j < delta.length; j += 1) {
    let s = 0;
    for (let i = j; i < delta.length; i += 1) s += l[i][j] * delta[i];
    out.push(s);
  }
}

function baoModel(d: Distances): number[] {
  return DESI_DR2_BAO.z.map((z, i) => {
    const q = DESI_DR2_BAO.quantity[i];
    return q === 'DM_over_rs' ? d.dm(z) : q === 'DH_over_rs' ? d.dh(z) : d.dv(z);
  });
}

/** Resíduos branqueados de uma combinação de dados para os parâmetros completos. */
export function residuals(p: CosmoParams, combination: DataCombination): number[] {
  const d = distances(p);
  const out: number[] = [];
  const model = baoModel(d);
  if (combination === 'bao') {
    // BAO sozinho: a escala 1/r_d é livre (equivale a H₀ r_d livre) e sai em forma fechada.
    const inv = DESI_DR2_BAO.invCov;
    let num = 0;
    let den = 0;
    for (let i = 0; i < model.length; i += 1) {
      for (let j = 0; j < model.length; j += 1) {
        num += model[i] * inv[i][j] * DESI_DR2_BAO.value[j];
        den += model[i] * inv[i][j] * model[j];
      }
    }
    const scale = num / den;
    whiten(L_BAO, model.map((m, i) => m * scale - DESI_DR2_BAO.value[i]), out);
    return out;
  }
  whiten(L_BAO, model.map((m, i) => m / d.rd - DESI_DR2_BAO.value[i]), out);
  const cmb = PLANCK_2018_DISTANCE_PRIORS.mean;
  whiten(L_CMB, [d.shiftR - cmb[0], d.lA - cmb[1], p.omegaBh2 - cmb[2]], out);
  if (combination === 'bao+cmb+sn') {
    const delta = UNION3.z.map((z, i) => 5 * Math.log10((1 + z) * d.dm(z)) + 25 - UNION3.mu[i]);
    // Perfil da magnitude absoluta: M̂ = (1ᵀC⁻¹Δ)/(1ᵀC⁻¹1); |Lᵀ(Δ − M̂)|² é o χ² marginalizado.
    const offset = SN_ROW_SUMS.reduce((s, v, i) => s + v * delta[i], 0) / SN_ONES_WEIGHT;
    whiten(L_SN, delta.map((v) => v - offset), out);
  }
  return out;
}

const sumSquares = (r: number[]) => r.reduce((s, v) => s + v * v, 0);

/** Parâmetros livres de cada combinação e seus limites (escala típica, mínimo, máximo). */
export type Free = { key: keyof CosmoParams; scale: number; lo: number; hi: number };
const FREE_BAO: Free[] = [{ key: 'omegaM', scale: 0.01, lo: 0.05, hi: 0.7 }];
const FREE_CMB: Free[] = [
  { key: 'omegaM', scale: 0.01, lo: 0.05, hi: 0.7 },
  { key: 'h0', scale: 1, lo: 40, hi: 100 },
  { key: 'omegaBh2', scale: 0.0002, lo: 0.015, hi: 0.03 },
];
const FREE_W: Free[] = [{ key: 'w0', scale: 0.05, lo: -3, hi: 1 }, { key: 'wa', scale: 0.1, lo: -3, hi: 2 }];
export const freeParameters = (combination: DataCombination) => (combination === 'bao' ? FREE_BAO : FREE_CMB);
/** Só sirenes: Ω_m e H₀ livres (ω_b não afeta d_L). */
export const FREE_SIREN_ONLY: Free[] = FREE_CMB.slice(0, 2);

export type FitResult = { params: CosmoParams; chi2: number; evaluations: number };

/** Levenberg-Marquardt com jacobiano por diferenças finitas, dentro dos limites. */
export function minimize(start: CosmoParams, combination: DataCombination, free: Free[], maxIterations = 40): FitResult {
  return minimizeResiduals(start, (p) => residuals(p, combination), free, maxIterations);
}

/** O mesmo minimizador, para qualquer vetor de resíduos branqueados (usado também pela previsão com sirenes). */
export function minimizeResiduals(start: CosmoParams, residualFn: (p: CosmoParams) => number[], free: Free[], maxIterations = 40): FitResult {
  let evaluations = 0;
  const evaluate = (p: CosmoParams) => {
    evaluations += 1;
    if (p.w0 + p.wa >= 0) return null;
    const r = residualFn(p);
    return r.every(Number.isFinite) ? r : null;
  };
  const clamp = (f: Free, v: number) => Math.min(f.hi, Math.max(f.lo, v));
  let p = { ...start };
  let r = evaluate(p);
  if (!r) throw new RangeError("Ponto de partida fora do domínio.");
  let chi2 = sumSquares(r);
  let lambda = 1e-3;
  for (let it = 0; it < maxIterations; it += 1) {
    // Jacobiano: uma coluna por parâmetro livre.
    const columns = free.map((f) => {
      const h = f.scale * 1e-3;
      let sign = 1;
      let rq = evaluate({ ...p, [f.key]: p[f.key] + h });
      if (!rq) { sign = -1; rq = evaluate({ ...p, [f.key]: p[f.key] - h }); }
      return rq ? rq.map((v, i) => (sign * (v - r![i])) / h) : r!.map(() => 0);
    });
    const a = free.map((_, i) => free.map((__, j) => columns[i].reduce((s, v, k) => s + v * columns[j][k], 0)));
    const g = free.map((_, i) => columns[i].reduce((s, v, k) => s + v * r![k], 0));
    let improved = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const damped = a.map((row, i) => row.map((v, j) => (i === j ? v * (1 + lambda) + 1e-12 : v)));
      const step = solveLinear(damped, g.map((v) => -v));
      const q = { ...p };
      free.forEach((f, i) => { q[f.key] = clamp(f, p[f.key] + step[i]); });
      const rq = evaluate(q);
      const cq = rq ? sumSquares(rq) : Infinity;
      if (cq < chi2) {
        const gain = chi2 - cq;
        p = q;
        r = rq!;
        chi2 = cq;
        lambda = Math.max(1e-7, lambda / 4);
        improved = true;
        if (gain < 1e-6) return { params: p, chi2, evaluations };
        break;
      }
      lambda *= 8;
    }
    if (!improved) break;
  }
  return { params: p, chi2, evaluations };
}

/** Ponto de partida típico (próximo do ajuste com CMB). */
export const DEFAULT_START: CosmoParams = { omegaM: 0.31, h0: 68, omegaBh2: 0.02237, w0: -1, wa: 0 };

/** Melhor ajuste com w₀ e w_a fixos (perfil nos demais parâmetros). */
export function profileAt(w0: number, wa: number, combination: DataCombination, start: CosmoParams = DEFAULT_START): FitResult {
  return minimize({ ...start, w0, wa }, combination, freeParameters(combination));
}

/** Melhor ajuste global, com w₀ e w_a também livres. */
export function globalFit(combination: DataCombination, start: CosmoParams): FitResult {
  return minimize(start, combination, [...freeParameters(combination), ...FREE_W], 80);
}

// --- Estatística ---------------------------------------------------------------------

/** Quantil da normal padrão (algoritmo de Acklam, erro relativo < 1,2 × 10⁻⁹). */
export function normalQuantile(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lowTail = (q: number) => {
    const t = Math.sqrt(-2 * Math.log(q));
    return (((((c[0] * t + c[1]) * t + c[2]) * t + c[3]) * t + c[4]) * t + c[5]) / ((((d[0] * t + d[1]) * t + d[2]) * t + d[3]) * t + 1);
  };
  if (p < 0.02425) return lowTail(p);
  if (p > 1 - 0.02425) return -lowTail(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Δχ² com 2 parâmetros → σ gaussiano bilateral, como no DESI: p = exp(−Δχ²/2) (χ² com 2 graus
 * de liberdade) e σ = Φ⁻¹(1 − p/2). Acima de ~1.400 o p some no ponto flutuante: Infinity.
 */
export function sigmaFromDeltaChi2(deltaChi2: number): number {
  if (deltaChi2 <= 0) return 0;
  const p = Math.exp(-deltaChi2 / 2);
  if (p === 0) return Infinity;
  return -normalQuantile(p / 2);
}

// --- Grade ---------------------------------------------------------------------------

export type GridSpec = { w0: [number, number]; wa: [number, number]; n0: number; na: number };
export const DEFAULT_GRID: GridSpec = { w0: [-1.6, 0.2], wa: [-3, 1.4], n0: 37, na: 37 };

export type GridResult = {
  combination: DataCombination;
  spec: GridSpec;
  w0: number[];
  wa: number[];
  /** χ² de perfil, chi2[j][i] para wa[j] e w0[i]; NaN fora do prior (w₀ + w_a ≥ 0). */
  chi2: number[][];
  best: FitResult;
  evaluations: number;
};

const linspace = ([a, b]: [number, number], n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/**
 * χ² de perfil em toda a grade. Percorre as linhas em zigue-zague e parte sempre do ajuste do
 * vizinho, o que reduz cada ponto a poucas iterações. `onProgress` recebe a fração concluída.
 */
export function scanGrid(combination: DataCombination, spec: GridSpec = DEFAULT_GRID, onProgress?: (fraction: number) => void): GridResult {
  const w0 = linspace(spec.w0, spec.n0);
  const wa = linspace(spec.wa, spec.na);
  const chi2 = wa.map(() => w0.map(() => Number.NaN));
  let evaluations = 0;
  let start: CosmoParams = { ...DEFAULT_START };
  let rowStart: CosmoParams = { ...DEFAULT_START };
  let best: FitResult | null = null;
  for (let j = 0; j < spec.na; j += 1) {
    const order = j % 2 === 0 ? w0.map((_, i) => i) : w0.map((_, i) => spec.n0 - 1 - i);
    start = { ...rowStart };
    let first = true;
    for (const i of order) {
      if (w0[i] + wa[j] >= 0) continue;
      const fit = profileAt(w0[i], wa[j], combination, start);
      evaluations += fit.evaluations;
      chi2[j][i] = fit.chi2;
      start = fit.params;
      if (first) { rowStart = fit.params; first = false; }
      if (!best || fit.chi2 < best.chi2) best = fit;
    }
    onProgress?.((j + 1) / spec.na);
  }
  const refined = globalFit(combination, best!.params);
  evaluations += refined.evaluations;
  return { combination, spec, w0, wa, chi2, best: refined.chi2 < best!.chi2 ? refined : best!, evaluations };
}

/**
 * Faixa de 1σ de w(z) = w₀ + w_a z/(1 + z): mínimo e máximo de w(z) entre os pontos da grade
 * com Δχ² ≤ 2,30 (região de confiança de perfil), em cada z.
 */
export function wBand(grid: GridResult, zs: number[]): { z: number; lo: number; hi: number }[] {
  return zs.map((z) => {
    const f = z / (1 + z);
    let lo = Infinity;
    let hi = -Infinity;
    grid.chi2.forEach((row, j) => row.forEach((c, i) => {
      if (!(c - grid.best.chi2 <= DELTA_CHI2_1SIGMA)) return;
      const w = grid.w0[i] + grid.wa[j] * f;
      lo = Math.min(lo, w);
      hi = Math.max(hi, w);
    }));
    return { z, lo, hi };
  });
}
