import { describe, expect, it } from "vitest";
import { formatFromLog10, formatSci } from "./format";

describe("formatação de números extremos", () => {
  it("mantém a mantissa em expoentes grandes", () => {
    expect(formatSci(1.05e77)).toBe("1,05 × 10⁷⁷");
    expect(formatFromLog10(-192.6)).toBe("2,51 × 10⁻¹⁹³");
  });
  it("expoentes gigantes viram 10^(…)", () => {
    expect(formatFromLog10(-1.8128e23)).toBe("10^(−1,813 × 10²³)");
  });
});
