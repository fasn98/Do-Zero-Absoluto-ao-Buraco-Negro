/**
 * Dados cosmológicos do Módulo 2.3, lidos dos arquivos de texto desta pasta (fonte, DOI,
 * versão, data de download e licença no cabeçalho de cada um). Os mesmos arquivos são
 * lidos por scripts/validacao_cosmo.py.
 */
import baoMeanText from './desi_dr2_bao_mean.txt?raw';
import baoCovText from './desi_dr2_bao_cov.txt?raw';
import cmbText from './planck2018_distance_priors.txt?raw';
import union3Text from './union3_compressed.txt?raw';
import { invertMatrix } from '../../physics/linalg';

/** Linhas de dados, sem comentários (#) nem linhas vazias. */
function rows(text: string): string[][] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
}
const numbers = (text: string) => rows(text).map((r) => r.map(Number));

export type BaoQuantity = 'DV_over_rs' | 'DM_over_rs' | 'DH_over_rs';
export type BaoData = { z: number[]; value: number[]; quantity: BaoQuantity[]; invCov: number[][] };
export type CmbPriors = { mean: [number, number, number]; invCov: number[][] };
export type SupernovaData = { z: number[]; mu: number[]; invCov: number[][] };

/** DESI DR2 BAO: 13 medidas e a covariância oficial (CobayaSampler/bao_data). */
export const DESI_DR2_BAO: BaoData = (() => {
  const r = rows(baoMeanText);
  return {
    z: r.map((x) => Number(x[0])),
    value: r.map((x) => Number(x[1])),
    quantity: r.map((x) => x[2] as BaoQuantity),
    invCov: invertMatrix(numbers(baoCovText)),
  };
})();

/** Planck 2018 TT,TE,EE+lowE: R, l_A e ω_b, com a inversa da covariância (Chen, Huang e Wang, 2019). */
export const PLANCK_2018_DISTANCE_PRIORS: CmbPriors = (() => {
  const r = numbers(cmbText);
  return { mean: [r[0][0], r[0][1], r[0][2]], invCov: r.slice(1) };
})();

/** Union3 + UNITY1.5: 22 nós de módulo de distância e a inversa da covariância (Rubin et al.). */
export const UNION3: SupernovaData = (() => {
  const r = numbers(union3Text);
  return { z: r[0], mu: r[1], invCov: r.slice(2) };
})();
