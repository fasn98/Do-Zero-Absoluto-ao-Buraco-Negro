import { describe, expect, it } from "vitest";
import reference from "../data/cosmo/validacao_python.json";
import { DESI_DR2_BAO, PLANCK_2018_DISTANCE_PRIORS, UNION3 } from "../data/cosmo";
import { chi2Bao, chi2Supernovae, chi2Total, distances, zDrag, zStar, type CosmoParams, type DataCombination } from "./cosmoLikelihood";
import { invertMatrix, quadraticForm } from "./linalg";

const within = (value: number, ref: number, tolerance: number) => expect(Math.abs(value / ref - 1)).toBeLessThan(tolerance);

describe("dados", () => {
  it("DESI DR2: 13 medidas, médias da Tabela IV do artigo", () => {
    expect(DESI_DR2_BAO.z).toHaveLength(13);
    expect(DESI_DR2_BAO.invCov).toHaveLength(13);
    const pick = (z: number, q: string) => DESI_DR2_BAO.value[DESI_DR2_BAO.z.findIndex((zi, i) => zi === z && DESI_DR2_BAO.quantity[i] === q)];
    expect(pick(0.295, "DV_over_rs")).toBeCloseTo(7.942, 3);
    expect(pick(0.51, "DM_over_rs")).toBeCloseTo(13.588, 3);
    expect(pick(0.934, "DH_over_rs")).toBeCloseTo(17.641, 3);
    expect(pick(2.33, "DH_over_rs")).toBeCloseTo(8.632, 3);
  });

  it("Planck 2018 (Chen et al.): médias e desvios da Tabela I", () => {
    const { mean, invCov } = PLANCK_2018_DISTANCE_PRIORS;
    expect(mean).toEqual([1.750235, 301.4707, 0.02235976]);
    const cov = invertMatrix(invCov);
    within(Math.sqrt(cov[0][0]), 0.0046, 0.01);
    within(Math.sqrt(cov[1][1]), 0.0895, 0.01);
    within(Math.sqrt(cov[2][2]), 0.00015, 0.01);
    within(cov[0][1] / Math.sqrt(cov[0][0] * cov[1][1]), 0.46, 0.02);
  });

  it("Union3: 22 nós, z de 0,05 a 2,26", () => {
    expect(UNION3.z).toHaveLength(22);
    expect(UNION3.invCov).toHaveLength(22);
    expect(UNION3.z[0]).toBe(0.05);
    expect(UNION3.mu[0]).toBeCloseTo(36.630361, 6);
  });

  it("álgebra: inversa e forma quadrática", () => {
    const m = [[4, 1], [1, 3]];
    const inv = invertMatrix(m);
    expect(inv[0][0]).toBeCloseTo(3 / 11, 12);
    expect(quadraticForm([1, 2], m)).toBe(4 + 2 + 2 + 12);
  });
});

describe("fórmulas de ajuste", () => {
  it("z* de Hu e Sugiyama e z_d de Eisenstein e Hu para o Planck 2018", () => {
    // ω_b = 0,02236, ω_m = 0,1432: z* ≈ 1.092 pela fórmula (o Planck dá 1.089,9 com a recombinação completa).
    within(zStar(0.02236, 0.1432), 1092, 0.001);
    within(zDrag(0.02236, 0.1432), 1020.7, 0.001);
  });

  it("r_d ≈ 147 Mpc para os parâmetros do Planck 2018 (147,05 ± 0,30 publicado)", () => {
    const d = distances({ omegaM: 0.3166, h0: 67.27, omegaBh2: 0.02236, w0: -1, wa: 0 });
    within(d.rd, 147.05, 0.003);
    within(d.shiftR, 1.7502, 0.001);
  });
});

describe("TypeScript × Python (scripts/validacao_cosmo.py), tolerância de 0,1 em χ²", () => {
  for (const point of reference.pontos) {
    it(point.nome, () => {
      const p = point.params as CosmoParams;
      const d = distances(p);
      within(d.rd, point.rd, 1e-5);
      within(d.shiftR, point.R, 1e-6);
      within(d.lA, point.lA, 1e-6);
      for (const [combination, value] of Object.entries(point.chi2)) {
        expect(Math.abs(chi2Total(p, combination as DataCombination) - value)).toBeLessThan(0.1);
      }
      expect(Math.abs(chi2Supernovae(d) - point.chi2_sn)).toBeLessThan(0.1);
      expect(chi2Bao(d)).toBeCloseTo(point.chi2.bao, 1);
    });
  }
});
