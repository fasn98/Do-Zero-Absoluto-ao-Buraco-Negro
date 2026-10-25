import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, LOG10_LAMBDA, SUPERPOSITION_RECORDS, GRAVITY_TEST_TARGET_KG, decoherence, timeComparison } from "./decoherence";
import { diosiPenroseEnergyJ, diosiPenroseTimeS, sphereRadiusM } from "./diosiPenrose";
import { diamondDensity, gravitationalConstant } from "./constants";

const within2 = (value: number, reference: number) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(0.02);
const env = (id: string) => ENVIRONMENTS.find((e) => e.id === id)!;

describe("decoerência por espalhamento (Módulo 10, Seção 1)", () => {
  it("τ = 1/(Λ Δx²): molécula, fótons a 300 K (Λ = 10⁶), Δx = 10⁻⁶ cm → 10⁶ s", () => {
    const r = decoherence("molecule", "photons300", 1e-6);
    expect(r.regime).toBe("longo");
    if (r.regime === "longo") within2(r.timeS, 1e6);
  });

  it("consistente com a Tabela 1 de Schlosshauer (2019) para o fundo cósmico: poeira 1 s, molécula 10²⁴ s", () => {
    const a = decoherence("dust3", "cmb", 1e-3);
    const b = decoherence("molecule", "cmb", 1e-6);
    if (a.regime === "longo") within2(a.timeS, 1); else throw new Error("regime");
    if (b.regime === "longo") within2(b.timeS, 1e24); else throw new Error("regime");
  });

  it("comprimentos de onda típicos: CMB ~1,06 mm, 300 K ~9,66 µm, Sol ~0,50 µm, ar ~0,19 Å", () => {
    within2(env("cmb").wavelengthCm, 0.1063);
    within2(env("photons300").wavelengthCm, 9.659e-4);
    within2(env("sunlight").wavelengthCm, 5.02e-5);
    within2(env("air").wavelengthCm, 1.87e-9);
  });

  it("acima do comprimento de onda do ambiente, a fórmula deixa de valer (saturação)", () => {
    expect(decoherence("molecule", "air", 1e-6).regime).toBe("saturado");
    expect(decoherence("molecule", "air", 1e-10).regime).toBe("longo");
    expect(decoherence("dust3", "cmb", 1).regime).toBe("saturado");
  });

  it("a tabela tem os 15 valores de Λ", () => {
    expect(Object.values(LOG10_LAMBDA).flatMap((row) => Object.values(row))).toHaveLength(15);
  });

  it("comparações em linguagem simples", () => {
    expect(timeComparison(1e-30)).toBe("mais rápido que a luz atravessar um próton");
    expect(timeComparison(1e24)).toBe("mais longo que a idade do universo");
    expect(timeComparison(2)).toBe("mais longo que um segundo");
  });
});

describe("recordes de superposição (Módulo 10, Seção 2)", () => {
  it("do recorde de 2019 ao alvo de 10⁻¹⁴ kg: ≈ 8,4 ordens de grandeza", () => {
    const record = SUPERPOSITION_RECORDS.at(-1)!.massKg;
    within2(record, 4.15e-23);
    within2(Math.log10(GRAVITY_TEST_TARGET_KG / record), 8.38);
  });

  it("C₆₀ (720 u) ≈ 1,20 × 10⁻²⁴ kg", () => {
    within2(SUPERPOSITION_RECORDS[2].massKg, 1.196e-24);
  });
});

describe("Diósi-Penrose (Módulo 10, Seção 3)", () => {
  it("as duas expressões coincidem em d = 2R: E_G = 0,7 G m²/R", () => {
    const below = diosiPenroseEnergyJ(1, 1, 2 * (1 - 1e-12));
    const at = diosiPenroseEnergyJ(1, 1, 2);
    within2(below, 0.7 * gravitationalConstant);
    within2(at, 0.7 * gravitationalConstant);
  });

  it("diamante de 10⁻¹⁴ kg (R ≈ 879 nm) a 250 µm: E_G ≈ 9,08 × 10⁻³³ J, τ ≈ 11,6 ms", () => {
    const R = sphereRadiusM(1e-14, diamondDensity);
    within2(R, 8.79e-7);
    within2(diosiPenroseEnergyJ(1e-14, R, 250e-6), 9.08e-33);
    within2(diosiPenroseTimeS(1e-14, R, 250e-6), 0.0116);
  });

  it("1 g de diamante (R ≈ 4,08 mm) a 1 cm: τ ≈ 8,1 × 10⁻²¹ s", () => {
    const R = sphereRadiusM(1e-3, diamondDensity);
    within2(R, 4.08e-3);
    within2(diosiPenroseTimeS(1e-3, R, 1e-2), 8.1e-21);
  });

  it("molécula de 4,15 × 10⁻²³ kg (R ≈ 1 nm) a 1 µm: τ ≈ 7,7 × 10¹¹ s", () => {
    within2(diosiPenroseTimeS(4.15e-23, 1e-9, 1e-6), 7.7e11);
  });
});
