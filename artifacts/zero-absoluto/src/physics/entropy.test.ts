import { describe, expect, it } from "vitest";
import {
  boltzmannEntropyJK,
  cleanLnW,
  demonLedger,
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

  it("balanço do demônio conta bits na memória e já apagados", () => {
    // 21 bits observados, todos apagados, gás com ΔS = −3,1 k: custo 21 ln 2 ≈ 14,6 k
    const apagados = demonLedger(-3.1, 0, 21);
    within2(apagados.erasureCostOverK, 14.56);
    within2(apagados.balanceOverK, 11.46);
    // apagar não muda o custo total: mover bits da memória para "apagados"
    expect(demonLedger(-3.1, 21, 0).balanceOverK).toBeCloseTo(apagados.balanceOverK, 12);
    expect(demonLedger(-3.1, 5, 16).balanceOverK).toBeCloseTo(apagados.balanceOverK, 12);
  });

  it("gás todo de um lado: W = 1, ln W = 0 e S = 0 exatos", () => {
    expect(lnMicrostates(40, 40)).toBe(0);
    expect(lnMicrostates(40, 0)).toBe(0);
    expect(boltzmannEntropyJK(lnMicrostates(40, 40))).toBe(0);
    // resto de arredondamento vira zero na exibição; valores reais não são afetados
    expect(cleanLnW(2.8e-15)).toBe(0);
    expect(cleanLnW(-3e-12)).toBe(0);
    expect(cleanLnW(Math.log(40))).toBeCloseTo(Math.log(40), 12);
  });
});
