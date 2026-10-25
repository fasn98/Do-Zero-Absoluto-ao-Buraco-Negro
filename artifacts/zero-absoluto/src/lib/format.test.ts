import { describe, expect, it } from "vitest";
import { formatFromLog10, formatSci } from "./format";

describe("formatação de números extremos", () => {
  it("mantém a mantissa em expoentes grandes", () => {
    expect(formatSci(1.05e77)).toBe("1,05 × 10⁷⁷");
    expect(formatFromLog10(-192.6)).toBe("2,51 × 10⁻¹⁹³");
  });
  it("expoentes gigantes são escritos por extenso", () => {
    expect(formatFromLog10(-10079308.2)).toBe("10 elevado a −10.079.308");
    expect(formatFromLog10(-1.8128e23)).toBe("10 elevado a −1,81 × 10²³");
  });
  it("valores perto de 1 usam 3 algarismos significativos", () => {
    expect(formatFromLog10(Math.log10(0.02585))).toBe("0,0259");
    expect(formatFromLog10(0)).toBe("1,00");
  });
});
