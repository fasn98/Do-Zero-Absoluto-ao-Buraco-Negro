/**
 * Módulo 2.3, previsão — sirenes padrão de ondas gravitacionais (dados SIMULADOS a partir de
 * previsões publicadas; nunca misturados ao painel de dados reais).
 *
 * Cenários e números de eventos: src/data/cosmo/sirenes.json (Mangiagli et al. 2022, 2025 para o
 * LISA; Belgacem et al. 2019 para o Einstein Telescope + THESEUS).
 *
 * Erros de d_L, somados em quadratura:
 *  - LISA (Speri et al., PRD 103, 083526, 2021, eqs. A1–A6): σ_GW/d_L = 0,05 d_L/36,6 Gpc;
 *    lentes 0,066 [(1 − (1+z)^−0,25)/0,25]^1,8 vezes F_delens = 1 − (0,3/(π/2)) arctan(z/0,073);
 *    velocidade peculiar [1 + c(1+z)²/(H d_L)] (500 km/s)/c; redshift fotométrico 0,03(1+z) para z > 2.
 *  - ET (Belgacem et al., JCAP 08 (2019) 015): ΔdL/dL instrumental por faixa (Tabelas 24 e 26),
 *    lentes 0,05 z e um erro em z de 200 km/s / c.
 *
 * Validação independente em scripts/validacao_sirenes.py.
 */
import sirensData from "../data/cosmo/sirenes.json";
import { speedOfLight } from "./constants";
import { expansionRateSquared } from "./friedmann";
import { cosmologyFor, distances, type CosmoParams } from "./cosmoLikelihood";
import { FREE_SIREN_ONLY, freeParameters, minimizeResiduals, residuals, sigmaFromDeltaChi2 } from "./cosmoFit";
import { invertMatrix } from "./linalg";

const C_KMS = speedOfLight / 1000;

export type SirenScenarioId = 'lisa-otimista' | 'lisa-pessimista' | 'et-otimista' | 'et-realista' | 'speri-popIII-15';
type Scenario = { nome: string; detector: string; eventos_total: number; anos: number; bins: number[][]; erro: 'speri2021' | 'belgacem2019'; origem: string };
const SCENARIOS = sirensData.cenarios as unknown as Record<SirenScenarioId, Scenario>;
export const sirenScenario = (id: SirenScenarioId) => SCENARIOS[id];

/** Universos "verdadeiros" da previsão: ΛCDM (Planck 2018) e o melhor ajuste de BAO + CMB + Union3 do app. */
export const TRUTHS: Record<'lcdm' | 'desi', CosmoParams> = {
  lcdm: { omegaM: 0.315, h0: 67.4, omegaBh2: 0.02237, w0: -1, wa: 0 },
  desi: { omegaM: 0.326, h0: 66.22, omegaBh2: 0.02242, w0: -0.682, wa: -0.999 },
};

/** Distâncias de luminosidade (Mpc) numa lista de redshifts. */
export function luminosityDistances(zs: number[], p: CosmoParams): number[] {
  const d = distances(p);
  return zs.map((z) => (1 + z) * d.dm(z));
}

/** Pontos que representam os eventos esperados: (z, peso = número de eventos, ΔdL/dL instrumental). */
export function expectedEvents(id: SirenScenarioId, sub = 5): { z: number[]; weight: number[]; relInst: number[] } {
  const s = SCENARIOS[id];
  const total = s.bins.reduce((a, b) => a + b[2], 0);
  const scale = s.eventos_total / total;
  const out = { z: [] as number[], weight: [] as number[], relInst: [] as number[] };
  for (const b of s.bins) {
    const n = b[2] * scale;
    if (s.erro === 'belgacem2019') {
      out.z.push(b[3]); out.weight.push(n); out.relInst.push(b[4]);
    } else {
      const lo = id.startsWith('speri') ? Math.max(b[0], 0.1) : Math.max(b[0], 1e-3);
      for (let k = 0; k < sub; k += 1) {
        out.z.push(lo + ((b[1] - lo) * (k + 0.5)) / sub); out.weight.push(n / sub); out.relInst.push(0);
      }
    }
  }
  return out;
}

/** Desvio total de d_L (Mpc) para cada evento, no universo verdadeiro. */
export function distanceErrors(id: SirenScenarioId, truth: CosmoParams): number[] {
  const s = SCENARIOS[id];
  const ev = expectedEvents(id);
  const d = luminosityDistances(ev.z, truth);
  const h = 1e-4;
  const up = luminosityDistances(ev.z.map((z) => z + h), truth);
  const dn = luminosityDistances(ev.z.map((z) => z - h), truth);
  const c = cosmologyFor(truth);
  return ev.z.map((z, i) => {
    const dz = (up[i] - dn[i]) / (2 * h);
    if (s.erro === 'belgacem2019') {
      const inst = ev.relInst[i] * d[i];
      const lens = 0.05 * z * d[i];
      const vel = (dz * 200) / C_KMS;
      return Math.hypot(inst, lens, vel);
    }
    const gw = ((0.05 * d[i]) / 36.6e3) * d[i];
    const fDelens = 1 - (0.3 / (Math.PI / 2)) * Math.atan(z / 0.073);
    const lens = fDelens * 0.066 * ((1 - (1 + z) ** -0.25) / 0.25) ** 1.8 * d[i];
    const H = truth.h0 * Math.sqrt(expansionRateSquared(-Math.log1p(z), c));
    const vel = (1 + (C_KMS * (1 + z) ** 2) / (H * d[i])) * (500 / C_KMS) * d[i];
    const photo = z > 2 ? dz * 0.03 * (1 + z) : 0;
    return Math.sqrt(gw ** 2 + lens ** 2 + vel ** 2 + photo ** 2);
  });
}

/** Resíduos branqueados das sirenes do catálogo sem ruído (d_L observado = verdadeiro). */
export function sirenResidualFn(id: SirenScenarioId, truth: CosmoParams) {
  const ev = expectedEvents(id);
  const sig = distanceErrors(id, truth);
  const target = luminosityDistances(ev.z, truth);
  return (p: CosmoParams) => {
    const model = luminosityDistances(ev.z, p);
    return model.map((m, i) => (Math.sqrt(ev.weight[i]) * (m - target[i])) / sig[i]);
  };
}

const KEYS: (keyof CosmoParams)[] = ['omegaM', 'h0', 'omegaBh2', 'w0', 'wa'];
const STEPS: Record<keyof CosmoParams, number> = { omegaM: 0.002, h0: 0.2, omegaBh2: 0.00005, w0: 0.01, wa: 0.03 };

/** Fisher de Gauss-Newton, F = Jᵀ J, de um vetor de resíduos branqueados. */
function fisherOf(residualFn: (p: CosmoParams) => number[], at: CosmoParams, keys: (keyof CosmoParams)[]): number[][] {
  const J = keys.map((k) => {
    const up = residualFn({ ...at, [k]: at[k] + STEPS[k] });
    const dn = residualFn({ ...at, [k]: at[k] - STEPS[k] });
    return up.map((u, i) => (u - dn[i]) / (2 * STEPS[k]));
  });
  return keys.map((_, a) => keys.map((__, b) => J[a].reduce((s, v, i) => s + v * J[b][i], 0)));
}

const addMatrices = (a: number[][], b: number[][]) => a.map((row, i) => row.map((v, j) => v + b[i][j]));
const marginal = (F: number[][], keys: (keyof CosmoParams)[], key: keyof CosmoParams) => Math.sqrt(invertMatrix(F)[keys.indexOf(key)][keys.indexOf(key)]);

export type SirenForecast = {
  /** σ(w₀) e σ(w_a) previstos (Fisher): dados atuais, sirenes sozinhas e combinados. */
  current: { w0: number; wa: number };
  sirensOnly: { w0: number; wa: number };
  combined: { w0: number; wa: number };
};

/** Covariância marginal 2×2 de (w₀, w_a). */
export type Cov2 = [[number, number], [number, number]];
export type WPoint = { w0: number; wa: number };

const SIREN_KEYS: (keyof CosmoParams)[] = ['omegaM', 'h0', 'w0', 'wa'];

function wCovariance(F: number[][], keys: (keyof CosmoParams)[]): Cov2 {
  const C = invertMatrix(F);
  const i = keys.indexOf('w0');
  const j = keys.indexOf('wa');
  return [[C[i][i], C[i][j]], [C[j][i], C[j][j]]];
}

/**
 * Previsão de Fisher centrada no universo verdadeiro `truth`: covariâncias de (w₀, w_a) com os dados
 * atuais (mesma precisão, mas centrados na verdade), com as sirenes sozinhas e com os dois somados.
 * `id = null`: só os dados atuais.
 */
export function sirenForecastAt(id: SirenScenarioId | null, truth: CosmoParams) {
  const Fr = fisherOf((p) => residuals(p, 'bao+cmb+sn'), truth, KEYS);
  const current = wCovariance(Fr, KEYS);
  if (!id) return { current, combined: current, sirensOnly: null };
  const sirens = sirenResidualFn(id, truth);
  return {
    current,
    combined: wCovariance(addMatrices(Fr, fisherOf(sirens, truth, KEYS)), KEYS),
    sirensOnly: wCovariance(fisherOf(sirens, truth, SIREN_KEYS), SIREN_KEYS),
  };
}

/** Δχ² = Δθᵀ C⁻¹ Δθ entre dois pontos do plano, com a covariância C. */
export function wSeparation(cov: Cov2, a: WPoint, b: WPoint) {
  const det = cov[0][0] * cov[1][1] - cov[0][1] * cov[1][0];
  const d0 = a.w0 - b.w0;
  const d1 = a.wa - b.wa;
  const deltaChi2 = (cov[1][1] * d0 * d0 - 2 * cov[0][1] * d0 * d1 + cov[0][0] * d1 * d1) / det;
  return { deltaChi2, sigma: sigmaFromDeltaChi2(deltaChi2) };
}

/** Universo intermediário: fração f do caminho entre o ΛCDM (f = 0) e o melhor ajuste do DESI (f = 1), em todos os parâmetros. */
export function truthBetween(fraction: number): CosmoParams {
  const a = TRUTHS.lcdm;
  const b = TRUTHS.desi;
  const mix = (k: keyof CosmoParams) => a[k] + fraction * (b[k] - a[k]);
  return { omegaM: mix('omegaM'), h0: mix('h0'), omegaBh2: mix('omegaBh2'), w0: mix('w0'), wa: mix('wa') };
}

/** Elipse de confiança de nível Δχ² (2,30 para 1σ e 6,18 para 2σ, com 2 parâmetros) em torno de `center`. */
export function confidenceEllipse(center: WPoint, cov: Cov2, deltaChi2: number, n = 96): [number, number][] {
  const a = cov[0][0];
  const b = cov[0][1];
  const c = cov[1][1];
  const half = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = (a + c) / 2 + half;
  const l2 = (a + c) / 2 - half;
  const angle = Math.atan2(l1 - a, b || 1e-300);
  const r1 = Math.sqrt(deltaChi2 * l1);
  const r2 = Math.sqrt(deltaChi2 * Math.max(l2, 0));
  return Array.from({ length: n + 1 }, (_, k) => {
    const t = (2 * Math.PI * k) / n;
    const u = r1 * Math.cos(t);
    const v = r2 * Math.sin(t);
    return [center.w0 + u * Math.cos(angle) - v * Math.sin(angle), center.wa + u * Math.sin(angle) + v * Math.cos(angle)];
  });
}

const marginalOf = (cov: Cov2) => ({ w0: Math.sqrt(cov[0][0]), wa: Math.sqrt(cov[1][1]) });

export function sirenFisherForecast(id: SirenScenarioId, truth: CosmoParams): SirenForecast {
  const f = sirenForecastAt(id, truth);
  return { current: marginalOf(f.current), sirensOnly: marginalOf(f.sirensOnly!), combined: marginalOf(f.combined) };
}

/** Fisher em ΛCDM (Ω_m e H₀ livres) só com sirenes: incertezas relativas de H₀ e Ω_m. */
export function sirenLcdmRelativeErrors(id: SirenScenarioId, truth: CosmoParams) {
  const keys: (keyof CosmoParams)[] = ['omegaM', 'h0'];
  const F = fisherOf(sirenResidualFn(id, truth), truth, keys);
  return { h0: marginal(F, keys, 'h0') / truth.h0, omegaM: marginal(F, keys, 'omegaM') / truth.omegaM };
}

/**
 * Separação esperada entre ΛCDM e o ponto do DESI quando o universo verdadeiro é um deles:
 * Δχ² = χ²(ponto falso) − χ²(ponto verdadeiro), com perfil nos outros parâmetros, no catálogo sem
 * ruído. Com os dados atuais (combined) ou só com as sirenes.
 */
export function sirenSeparation(id: SirenScenarioId, truthId: 'lcdm' | 'desi', withCurrentData: boolean) {
  const truth = TRUTHS[truthId];
  const sirens = sirenResidualFn(id, truth);
  const fn = withCurrentData ? (p: CosmoParams) => [...residuals(p, 'bao+cmb+sn'), ...sirens(p)] : sirens;
  const free = withCurrentData ? freeParameters('bao+cmb+sn') : FREE_SIREN_ONLY;
  const profileAt = (point: CosmoParams) => {
    const start = { ...truth, w0: point.w0, wa: point.wa };
    return minimizeResiduals(start, fn, free, 60).chi2;
  };
  const wrong = truthId === 'lcdm' ? TRUTHS.desi : TRUTHS.lcdm;
  const deltaChi2 = profileAt(wrong) - profileAt(truth);
  return { deltaChi2, sigma: sigmaFromDeltaChi2(Math.max(0, deltaChi2)) };
}

/**
 * Separação esperada pelo Fisher centrado no universo verdadeiro (procedimento padrão de previsão):
 * Δχ² = Δθᵀ C⁻¹ Δθ, com Δθ = (Δw₀, Δw_a) entre ΛCDM e o ponto do DESI e C a covariância marginal de
 * (w₀, w_a). Os dados atuais entram com a precisão real, mas centrados na verdade, para não misturar
 * o universo medido com um universo simulado diferente. `id = null`: só os dados atuais.
 */
export function sirenFisherSeparation(id: SirenScenarioId | null, truthId: 'lcdm' | 'desi', withCurrentData: boolean) {
  const truth = TRUTHS[truthId];
  if (withCurrentData) return wSeparation(sirenForecastAt(id, truth).combined, TRUTHS.lcdm, TRUTHS.desi);
  return wSeparation(sirenForecastAt(id, truth).sirensOnly!, TRUTHS.lcdm, TRUTHS.desi);
}
