import { describe, expect, it } from "vitest";
import {
  allCrossings,
  crossingSpreadDecades,
  gravitationalCoupling,
  inverseCouplings,
  inverseCouplingsAtMZ,
  planckEnergyGeV,
  Z_MASS_GEV,
} from "./unification";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);

const SM = { susy: false, susyScaleGeV: 1e3 };
const MSSM_1TEV = { susy: true, susyScaleGeV: 1e3 };

describe("evolução dos acoplamentos (Módulo 9, Seção 1)", () => {
  it("insumos em M_Z: α₁⁻¹ ≈ 59,0, α₂⁻¹ ≈ 29,6, α₃⁻¹ ≈ 8,47", () => {
    const [a1, a2, a3] = inverseCouplingsAtMZ();
    within2(a1, 59.0);
    within2(a2, 29.6);
    within2(a3, 8.47);
  });

  it("em M_Z, a evolução devolve os insumos", () => {
    const start = inverseCouplingsAtMZ();
    inverseCouplings(Z_MASS_GEV, SM).forEach((a, i) => expect(a).toBeCloseTo(start[i], 10));
  });

  it("α₃ cai com a energia (α₃⁻¹ cresce): liberdade assintótica", () => {
    expect(inverseCouplings(1e4, SM)[2]).toBeGreaterThan(inverseCouplings(100, SM)[2]);
  });

  it("Modelo Padrão: três cruzamentos distintos, formando um triângulo", () => {
    const [c12, c13, c23] = allCrossings(SM);
    // 1,03 × 10¹³ (o "1,0 × 10¹³" arredondado a 2 algarismos fica 3% abaixo, fora da tolerância).
    within2(c12!.energyGeV, 1.03e13);
    within2(c12!.inverseCoupling, 42.4);
    within2(c13!.energyGeV, 2.4e14);
    within2(c13!.inverseCoupling, 40.4);
    within2(c23!.energyGeV, 9.7e16);
    within2(c23!.inverseCoupling, 47.0);
    expect(crossingSpreadDecades([c12, c13, c23])).toBeGreaterThan(3);
  });

  it("MSSM com M_SUSY = 1 TeV: cruzamentos entre ~1,0 e 2,5 × 10¹⁶ GeV, α⁻¹ entre 25,6 e 26,0", () => {
    // Em um laço, com limiar abrupto, a previsão vale só como ordem de grandeza:
    // tolerância de um fator 2 nas energias e de 5% em α⁻¹.
    const crossings = allCrossings(MSSM_1TEV);
    for (const c of crossings) {
      expect(c!.energyGeV).toBeGreaterThan(1.0e16 / 2);
      expect(c!.energyGeV).toBeLessThan(2.5e16 * 2);
      expect(c!.inverseCoupling).toBeGreaterThan(25.6 * 0.95);
      expect(c!.inverseCoupling).toBeLessThan(26.0 * 1.05);
    }
    expect(crossingSpreadDecades(crossings)).toBeLessThan(0.5);
  });
});

describe("gravidade (Módulo 9, Seção 2)", () => {
  it("energia de Planck ≈ 1,22 × 10¹⁹ GeV", () => {
    within2(planckEnergyGeV(), 1.22e19);
  });

  it("α_G(2 × 10¹⁶ GeV) ≈ 2,7 × 10⁻⁶; α_G(E_Planck) = 1", () => {
    within2(gravitationalCoupling(2e16), 2.7e-6);
    within2(gravitationalCoupling(planckEnergyGeV()), 1);
  });
});
