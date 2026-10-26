import { describe, expect, it } from "vitest";
import { DELTA_CHI2_1SIGMA, DELTA_CHI2_2SIGMA, normalQuantile, profileAt, residuals, scanGrid, sigmaFromDeltaChi2, wBand, type GridSpec } from "./cosmoFit";
import { chi2Total, type CosmoParams } from "./cosmoLikelihood";
import { handleGridRequest, type GridMessage } from "../modules/confronto-com-dados-reais/gridProtocol";
import { isoline, upsample } from "../lib/contours";

const sumSquares = (r: number[]) => r.reduce((s, v) => s + v * v, 0);

describe("estatística", () => {
  it("quantil da normal e conversão Δχ² → σ como no DESI (2 parâmetros)", () => {
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.5)).toBeCloseTo(0, 9);
    // Tabela VI do DESI DR2: −4,7 → 1,7σ; −12,5 → 3,1σ; −17,4 → 3,8σ; −21,0 → 4,2σ.
    expect(sigmaFromDeltaChi2(4.7)).toBeCloseTo(1.7, 1);
    expect(sigmaFromDeltaChi2(12.5)).toBeCloseTo(3.1, 1);
    expect(sigmaFromDeltaChi2(17.4)).toBeCloseTo(3.8, 1);
    expect(sigmaFromDeltaChi2(21.0)).toBeCloseTo(4.2, 1);
    // Níveis de 1σ e 2σ com dois parâmetros.
    expect(sigmaFromDeltaChi2(DELTA_CHI2_1SIGMA)).toBeCloseTo(1, 3);
    expect(sigmaFromDeltaChi2(DELTA_CHI2_2SIGMA)).toBeCloseTo(2, 3);
    expect(sigmaFromDeltaChi2(5000)).toBe(Infinity);
  });
});

describe("resíduos branqueados", () => {
  it("|r|² é o mesmo χ² da verossimilhança, para BAO + CMB + supernovas", () => {
    const p: CosmoParams = { omegaM: 0.32, h0: 66.5, omegaBh2: 0.02238, w0: -0.7, wa: -0.9 };
    expect(sumSquares(residuals(p, "bao+cmb"))).toBeCloseTo(chi2Total(p, "bao+cmb"), 8);
    expect(sumSquares(residuals(p, "bao+cmb+sn"))).toBeCloseTo(chi2Total(p, "bao+cmb+sn"), 8);
  });
});

describe("perfil e melhor ajuste (mesmos números de scripts/validacao_cosmo.py ajuste)", () => {
  it("ΛCDM com BAO sozinho: Ω_m = 0,297 (DESI publica 0,2975 ± 0,0086)", () => {
    const fit = profileAt(-1, 0, "bao");
    expect(fit.params.omegaM).toBeCloseTo(0.297, 3);
    expect(fit.chi2).toBeCloseTo(10.28, 1);
  });

  it("ΛCDM com BAO + CMB e BAO + CMB + supernovas", () => {
    expect(profileAt(-1, 0, "bao+cmb").chi2).toBeCloseTo(15.79, 1);
    expect(profileAt(-1, 0, "bao+cmb+sn").chi2).toBeCloseTo(44.41, 1);
  });
});

describe("grade (a mesma função que o Web Worker executa)", () => {
  const small: GridSpec = { w0: [-1.2, -0.2], wa: [-2.5, 0.5], n0: 9, na: 9 };

  it("Δχ² do ΛCDM e significância: 2,4σ com BAO + CMB e 3,3σ com supernovas", () => {
    const g1 = scanGrid("bao+cmb", small);
    const g2 = scanGrid("bao+cmb+sn", small);
    expect(profileAt(-1, 0, "bao+cmb").chi2 - g1.best.chi2).toBeCloseTo(8.21, 1);
    expect(profileAt(-1, 0, "bao+cmb+sn").chi2 - g2.best.chi2).toBeCloseTo(14.08, 1);
    expect(g1.best.params.w0).toBeCloseTo(-0.43, 1);
    expect(g2.best.params.wa).toBeCloseTo(-1.0, 1);
    // O mínimo global não é pior que nenhum ponto da grade.
    for (const row of g2.chi2) for (const c of row) if (Number.isFinite(c)) expect(c).toBeGreaterThanOrEqual(g2.best.chi2 - 1e-6);
  });

  it("os contornos encolhem quando os dados se somam", () => {
    const count = (combination: "bao" | "bao+cmb" | "bao+cmb+sn") => {
      const g = scanGrid(combination, small);
      return g.chi2.flat().filter((c) => c - g.best.chi2 <= DELTA_CHI2_2SIGMA).length;
    };
    const bao = count("bao");
    const cmb = count("bao+cmb");
    const sn = count("bao+cmb+sn");
    expect(bao).toBeGreaterThan(cmb);
    expect(cmb).toBeGreaterThan(sn);
  });

  it("pontos com w₀ + w_a ≥ 0 ficam fora (prior do DESI)", () => {
    const g = scanGrid("bao", { w0: [-0.5, 0.2], wa: [0, 1], n0: 3, na: 3 });
    expect(g.chi2[2][2]).toBeNaN();
  });

  it("faixa de 1σ de w(z): contém o melhor ajuste e é mais estreita perto de z ≈ 0,3", () => {
    const g = scanGrid("bao+cmb+sn", small);
    const band = wBand(g, [0, 0.3, 2]);
    for (const b of band) expect(b.hi).toBeGreaterThan(b.lo);
    expect(band[1].hi - band[1].lo).toBeLessThan(band[0].hi - band[0].lo);
    expect(band[1].hi - band[1].lo).toBeLessThan(band[2].hi - band[2].lo);
  });

  it("protocolo do worker: envia o progresso e depois o resultado", () => {
    const messages: GridMessage[] = [];
    handleGridRequest({ combination: "bao" }, (m) => messages.push(m));
    const last = messages[messages.length - 1];
    expect(messages.filter((m) => m.type === "progresso").length).toBeGreaterThan(10);
    expect(last.type).toBe("resultado");
    if (last.type === "resultado") {
      expect(last.result.combination).toBe("bao");
      expect(last.result.chi2.length).toBe(last.result.spec.na);
      expect(last.elapsedMs).toBeGreaterThan(0);
    }
  });
});

describe("contornos", () => {
  it("interpolação bilinear e isolinha de um cone", () => {
    const z = [[2, 1, 2], [1, 0, 1], [2, 1, 2]];
    const f = upsample(z, 2);
    expect(f).toHaveLength(5);
    expect(f[2][2]).toBe(0);
    expect(f[1][1]).toBeCloseTo(1, 12);
    expect(f[2][1]).toBeCloseTo(0.5, 12);
    const seg = isoline(z, 0.5);
    expect(seg).toHaveLength(4);
    for (const [x0, y0] of seg) expect(Math.hypot(x0 - 1, y0 - 1)).toBeCloseTo(0.5, 9);
  });
});
