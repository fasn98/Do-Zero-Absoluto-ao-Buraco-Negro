import { describe, expect, it } from "vitest";
import reference from "../data/cosmo/validacao_inflacao.json";
import {
  FLATNESS_TIMES,
  OMEGA_K_BOUND_95,
  PLANCK_AS,
  R_LIMIT_BK18,
  R_UPPER_LIMIT,
  comovingDistanceMpc,
  curvatureAnalytic,
  curvatureAtTime,
  flatnessReduction,
  horizonAngleDeg,
  inflationEnergyScaleGeV,
  minimumEfolds,
  nsBelowOneSigma,
  particleHorizonAtMpc,
  reducedPlanckMassGeV,
  slowRoll,
} from "./inflation";

const within = (value: number, ref: number, tolerance = 0.02) => expect(Math.abs(value / ref - 1)).toBeLessThan(tolerance);

describe("rolamento lento (valores de referência)", () => {
  it("n_s = 1 − 2/N: N = 50 → 0,960; N = 60 → 0,9667", () => {
    expect(slowRoll("phi2", 50).ns).toBeCloseTo(0.96, 6);
    expect(slowRoll("starobinsky", 60).ns).toBeCloseTo(0.9667, 4);
  });

  it("Starobinsky, r = 12/N²: 0,0048 e 0,0033; φ², r = 8/N: 0,16 e 0,133, acima do limite de r", () => {
    within(slowRoll("starobinsky", 50).r, 0.0048, 1e-9);
    within(slowRoll("starobinsky", 60).r, 0.0033, 0.011);
    within(slowRoll("phi2", 50).r, 0.16, 1e-9);
    within(slowRoll("phi2", 60).r, 0.133, 0.003);
    expect(R_UPPER_LIMIT).toBe(0.034);
    for (const N of [50, 55, 60]) {
      expect(slowRoll("phi2", N).r).toBeGreaterThan(R_LIMIT_BK18);
      expect(slowRoll("phi2", N).r).toBeGreaterThan(R_UPPER_LIMIT);
      expect(slowRoll("starobinsky", N).r).toBeLessThan(R_UPPER_LIMIT);
    }
  });

  it("V^(1/4) com A_s = 2,1 × 10⁻⁹: r = 0,01 → 1,0 × 10¹⁶ GeV; r = 0,036 → 1,4 × 10¹⁶ GeV", () => {
    within(reducedPlanckMassGeV(), 2.435e18, 1e-3);
    within(inflationEnergyScaleGeV(0.01, 2.1e-9), 1.0e16, 0.03);
    within(inflationEnergyScaleGeV(0.036, 2.1e-9), 1.4e16, 0.02);
    within(PLANCK_AS, 2.1e-9, 0.01);
  });

  it("redução da planura e^(−2N): N = 60 → ~10⁻⁵²", () => {
    expect(Math.log10(flatnessReduction(60))).toBeCloseTo(-52.1, 1);
  });

  it("n_s < 1 a mais de 8σ no Planck 2018", () => {
    expect(nsBelowOneSigma()).toBeGreaterThan(8);
  });
});

describe("quebra-cabeças sem inflação", () => {
  it("horizonte na recombinação: ~1,2° no céu de hoje (entre 1 e 2 graus)", () => {
    const angle = horizonAngleDeg();
    expect(angle).toBeGreaterThan(1);
    expect(angle).toBeLessThan(2);
  });

  it("planura: |Ω − 1| ~ 10⁻¹⁸ em 1 s e ~10⁻⁶¹ no tempo de Planck, com |Ω_k| = 0,0045 hoje", () => {
    expect(OMEGA_K_BOUND_95).toBeCloseTo(0.0045, 6);
    expect(Math.log10(curvatureAtTime(FLATNESS_TIMES.nucleossintese))).toBeCloseTo(-17.7, 0);
    expect(Math.log10(curvatureAtTime(FLATNESS_TIMES.planck))).toBeCloseTo(-61, 0);
    // A estimativa por partes (∝ t, ∝ t^(2/3), sem Λ) fica a um fator ~3 do resolvedor.
    const ratio = curvatureAtTime(1) / curvatureAnalytic(1);
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(5);
  });

  it("e-dobras mínimas: ~61 (horizonte) e ~64 (planura) se a inflação termina a 10¹⁶ GeV; menos a energias menores", () => {
    const high = minimumEfolds(1e16);
    expect(high.horizon).toBeCloseTo(61.3, 0);
    expect(high.flatness).toBeCloseTo(64.0, 0);
    expect(minimumEfolds(1e9).horizon).toBeLessThan(high.horizon);
  });
});

describe("TypeScript × Python (scripts/validacao_inflacao.py)", () => {
  it("horizonte e distância até a recombinação", () => {
    within(particleHorizonAtMpc(1090), reference.horizonte.chi_p_mpc, 1e-5);
    within(comovingDistanceMpc(1090), reference.horizonte.d_m_mpc, 1e-6);
    within(horizonAngleDeg(), reference.horizonte.angulo_graus, 1e-5);
  });

  it("planura em 1 s e no tempo de Planck", () => {
    within(curvatureAtTime(1), reference.planura.t_1s, 1e-4);
    within(curvatureAtTime(reference.planura.t_planck_s), reference.planura.t_planck, 1e-4);
  });

  it("e-dobras mínimas, escala de energia e massa de Planck reduzida", () => {
    for (const [key, gev] of [["1e16", 1e16], ["1e12", 1e12], ["1e9", 1e9]] as const) {
      const n = minimumEfolds(gev);
      expect(n.horizon).toBeCloseTo(reference.efolds_minimos[key].horizon, 6);
      expect(n.flatness).toBeCloseTo(reference.efolds_minimos[key].flatness, 6);
    }
    within(inflationEnergyScaleGeV(0.036, 2.1e-9), reference.escala_energia_gev["r_0.036"], 1e-9);
    within(reducedPlanckMassGeV(), reference.M_P_gev, 1e-9);
  });
});
