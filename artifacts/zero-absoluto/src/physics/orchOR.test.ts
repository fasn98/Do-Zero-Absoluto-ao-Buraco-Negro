import { describe, expect, it } from "vitest";
import { BRAIN_TUBULINS, ORCH_OR_TIME_S, ORCH_OR_TUBULINS, orchORCollapseTimeS, tubulinCollapseEnergyJ, tubulinsForCollapseTime } from "./orchOR";
import { diosiPenroseEnergyJ } from "./diosiPenrose";
import { atomicMassConstant, protonChargeRadius, reducedPlanckConstant } from "./constants";

describe("colapso de Diósi-Penrose em tubulinas (Orch-OR)", () => {
  it("usa a função do Módulo 10: núcleons de 0,84 fm, separação completa", () => {
    const one = diosiPenroseEnergyJ(atomicMassConstant, protonChargeRadius, 2 * protonChargeRadius);
    expect(tubulinCollapseEnergyJ("nucleons")).toBeCloseTo(1.1e5 * one, 55);
    expect(orchORCollapseTimeS(1, "nucleons")).toBeCloseTo(reducedPlanckConstant / (1.1e5 * one), 0);
  });

  it("2 × 10¹⁰ tubulinas: ~0,3 s com a massa nos núcleons, da ordem dos 25 ms do Orch-OR", () => {
    const tau = orchORCollapseTimeS(ORCH_OR_TUBULINS, "nucleons");
    expect(tau).toBeGreaterThan(0.025);
    expect(tau).toBeLessThan(1);
  });

  it("para 25 ms: ~10¹¹ (núcleons), ~10¹³ (proteína) e muito mais que o cérebro inteiro com R₀ de Gran Sasso", () => {
    const n = (m: "nucleons" | "proteina" | "nucleons-r0") => Math.log10(tubulinsForCollapseTime(ORCH_OR_TIME_S, m));
    expect(n("nucleons")).toBeCloseTo(11.4, 0);
    expect(n("proteina")).toBeCloseTo(12.9, 0);
    // Derakhshani et al. (2022): ~4 × 10²³; aqui, com núcleons isolados, ~10²⁵. Os dois passam das ~10²⁰ do cérebro.
    expect(n("nucleons-r0")).toBeGreaterThan(Math.log10(BRAIN_TUBULINS) + 3);
    expect(n("nucleons-r0")).toBeLessThan(26);
  });

  it("τ é inversamente proporcional ao número de tubulinas", () => {
    expect(orchORCollapseTimeS(1e10, "proteina") / orchORCollapseTimeS(1e11, "proteina")).toBeCloseTo(10, 9);
  });
});
