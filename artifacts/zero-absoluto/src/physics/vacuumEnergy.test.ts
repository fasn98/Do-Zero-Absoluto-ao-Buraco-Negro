import { describe, expect, it } from "vitest";
import {
  casimirPressurePa,
  criticalDensityKgM3,
  cutoffForEnergyDensityGeV,
  cutoffWavelengthM,
  darkEnergyDensityKgM3,
  darkEnergyEnergyDensityJM3,
  planckEnergyDensityJM3,
  vacuumEnergyDensityJM3,
} from "./vacuumEnergy";
import { planckEnergyGeV } from "./unification";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);
const ratioLog10 = (cutoffGeV: number) => Math.log10(vacuumEnergyDensityJM3(cutoffGeV) / darkEnergyEnergyDensityJM3());

describe("energia escura observada (Módulo 11, Seção 1)", () => {
  it("ρ_c ≈ 8,53 × 10⁻²⁷ kg/m³; ρ_Λ ≈ 5,85 × 10⁻²⁷ kg/m³; u_Λ ≈ 5,25 × 10⁻¹⁰ J/m³", () => {
    within2(criticalDensityKgM3(), 8.53e-27);
    within2(darkEnergyDensityKgM3(), 5.85e-27);
    within2(darkEnergyEnergyDensityJM3(), 5.25e-10);
  });
});

describe("energia do vácuo prevista (Módulo 11, Seção 1)", () => {
  it("corte de Planck: u_vac ≈ 2,93 × 10¹¹¹ J/m³, razão ≈ 10^120,7", () => {
    within2(vacuumEnergyDensityJM3(planckEnergyGeV()), 2.93e111);
    within2(ratioLog10(planckEnergyGeV()), 120.7);
  });

  it("razões: grande unificação ≈ 10^109,6; LHC ≈ 10^61,0; QCD ≈ 10^41,6", () => {
    within2(ratioLog10(2e16), 109.6);
    within2(ratioLog10(1.4e4), 61.0);
    within2(ratioLog10(0.2), 41.6);
  });

  it("corte que reproduz u_Λ ≈ 7,9 meV, comprimento de onda ≈ 0,16 mm", () => {
    const cut = cutoffForEnergyDensityGeV(darkEnergyEnergyDensityJM3());
    within2(cut, 7.9e-12);
    // 0,156 mm (o "0,16 mm" arredondado a 2 algarismos fica 2,5% acima).
    within2(cutoffWavelengthM(cut), 1.56e-4);
    within2(vacuumEnergyDensityJM3(cut), darkEnergyEnergyDensityJM3());
  });

  it("densidade de energia de Planck c⁷/(ħG²) ≈ 4,63 × 10¹¹³ J/m³, razão ≈ 10^122,9", () => {
    within2(planckEnergyDensityJM3(), 4.63e113);
    within2(Math.log10(planckEnergyDensityJM3() / darkEnergyEnergyDensityJM3()), 122.9);
  });
});

describe("efeito Casimir (Módulo 11, Seção 2)", () => {
  it("1 µm: P ≈ 1,30 × 10⁻³ Pa e F ≈ 1,30 × 10⁻⁷ N em 1 cm²", () => {
    within2(casimirPressurePa(1e-6), 1.3e-3);
    within2(casimirPressurePa(1e-6) * 1e-4, 1.3e-7);
  });

  it("100 nm: P ≈ 13,0 Pa; 10 nm: P ≈ 1,30 × 10⁵ Pa (cerca de uma atmosfera)", () => {
    within2(casimirPressurePa(100e-9), 13.0);
    within2(casimirPressurePa(10e-9), 1.3e5);
  });
});
