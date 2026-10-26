import { describe, expect, it } from "vitest";
import { brainPowerDensityRatio, brainPowerW, powerPerCellW } from "./bodyEnergy";

describe("energia do corpo em repouso", () => {
  it("~80 W divididos por 3,72 × 10¹³ células dão ~2 pW por célula", () => {
    const p = powerPerCellW();
    expect(p).toBeCloseTo(2.15e-12, 13);
    expect(Math.abs(p / 2e-12 - 1)).toBeLessThan(0.1);
  });

  it("o cérebro: ~16 W, dez vezes mais energia por quilograma que a média do corpo", () => {
    expect(brainPowerW()).toBeCloseTo(16, 6);
    expect(brainPowerDensityRatio()).toBeCloseTo(10, 9);
  });
});
