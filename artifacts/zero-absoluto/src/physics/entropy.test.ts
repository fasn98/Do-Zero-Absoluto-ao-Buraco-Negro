import { describe, expect, it } from "vitest";
import {
  boltzmannEntropyJK,
  erasureEntropyOverK,
  landauerLimitJ,
  lnMicrostates,
  log10ProbabilityAllInOneHalf,
  molarFreeExpansionEntropyJK,
  twoChamberEntropyOverK,
} from "./entropy";
import { avogadroConstant } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

describe("entropia e informação (Módulo 2)", () => {
  it("Landauer a 300 K: kT ln 2 ≈ 2,87 × 10⁻²¹ J", () => {
    within2(landauerLimitJ(300), 2.87e-21);
    expect(() => landauerLimitJ(-1)).toThrow(RangeError);
  });

  it("microestados: todas à esquerda W = 1; metade W = C(100, 50) ≈ 1,009 × 10²⁹", () => {
    expect(lnMicrostates(100, 100)).toBeCloseTo(0, 8);
    within2(lnMicrostates(100, 50), Math.log(1.0089134454556e29));
    expect(boltzmannEntropyJK(0)).toBe(0);
  });

  it("probabilidade de 1 mol voltar sozinho para uma metade ≈ 10^(−1,81 × 10²³)", () => {
    within2(log10ProbabilityAllInOneHalf(avogadroConstant), -1.8128e23);
  });

  it("expansão livre de 1 mol para o dobro do volume: R ln 2 ≈ 5,76 J/K", () => {
    within2(molarFreeExpansionEntropyJK(), 5.763);
  });

  it("apagar n bits produz pelo menos n ln 2 de entropia (em k)", () => {
    within2(erasureEntropyOverK(10), 6.931);
  });

  it("separar quente e frio diminui a entropia do gás", () => {
    const start = twoChamberEntropyOverK({ nLeft: 50, nRight: 50, tLeft: 1, tRight: 1 });
    const sorted = twoChamberEntropyOverK({ nLeft: 50, nRight: 50, tLeft: 1.2, tRight: 0.8 });
    // 50 ln 1,2 + 50 ln 0,8 ≈ −2,04
    within2(sorted - start, -2.04);
  });
});
