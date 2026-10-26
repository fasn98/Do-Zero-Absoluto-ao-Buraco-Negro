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

export function sirenFisherForecast(id: SirenScenarioId, truth: CosmoParams): SirenForecast {
  const sirens = sirenResidualFn(id, truth);
  const real = (p: CosmoParams) => residuals(p, 'bao+cmb+sn');
  const Fr = fisherOf(real, truth, KEYS);
  const Fs = fisherOf(sirens, truth, KEYS);
  const sKeys: (keyof CosmoParams)[] = ['omegaM', 'h0', 'w0', 'wa'];
  const Fso = fisherOf(sirens, truth, sKeys);
  const pick = (F: number[][], keys: (keyof CosmoParams)[]) => ({ w0: marginal(F, keys, 'w0'), wa: marginal(F, keys, 'wa') });
  return { current: pick(Fr, KEYS), sirensOnly: pick(Fso, sKeys), combined: pick(addMatrices(Fr, Fs), KEYS) };
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
  const keys: (keyof CosmoParams)[] = withCurrentData ? KEYS : ['omegaM', 'h0', 'w0', 'wa'];
  let F = keys.map(() => keys.map(() => 0));
  if (id) F = addMatrices(F, fisherOf(sirenResidualFn(id, truth), truth, keys));
  if (withCurrentData) F = addMatrices(F, fisherOf((p) => residuals(p, 'bao+cmb+sn'), truth, keys));
  const C = invertMatrix(F);
  const i = keys.indexOf('w0');
  const j = keys.indexOf('wa');
  const Cinv = invertMatrix([[C[i][i], C[i][j]], [C[j][i], C[j][j]]]);
  const d = [TRUTHS.lcdm.w0 - TRUTHS.desi.w0, TRUTHS.lcdm.wa - TRUTHS.desi.wa];
  const deltaChi2 = d[0] * (Cinv[0][0] * d[0] + Cinv[0][1] * d[1]) + d[1] * (Cinv[1][0] * d[0] + Cinv[1][1] * d[1]);
  return { deltaChi2, sigma: sigmaFromDeltaChi2(deltaChi2) };
}
