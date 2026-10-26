import { describe, expect, it } from "vitest";
import { contextForTemperature, modulesForTemperature } from "./temperatureBands";

const numbers = (T: number) => modulesForTemperature(T).map((m) => m.module.number);

describe("régua de temperatura", () => {
  it("indica o módulo certo para cada marco", () => {
    expect(numbers(1.7e-7)).toContain("01");
    expect(numbers(4.2)).toContain("01");
    expect(numbers(300)).toEqual(expect.arrayContaining(["02", "04", "06"]));
    expect(numbers(1.57e7)).toEqual(expect.arrayContaining(["03", "06"]));
    expect(numbers(1.5e8)).toContain("03");
  });

  it("buraco negro com a temperatura de Hawking de 1 massa solar", () => {
    const match = modulesForTemperature(6.17e-8).find((m) => m.module.number === "05");
    expect(match?.reason).toMatch(/massas solares/);
  });

  it("acima de 10¹² K não há módulo, só contexto", () => {
    expect(numbers(1e20)).toEqual([]);
    expect(contextForTemperature(1.4e32)[0].level).toBe("hipotese");
    expect(numbers(1.4e32)).toEqual(["07"]);
    // O Módulo 8 não tem faixa própria na régua
    for (const T of [1e-9, 1, 300, 1e7, 1e12, 1e20, 1.4e32]) expect(numbers(T)).not.toContain("08");
    // Módulo 9: kT entre 10¹⁵ e 10¹⁷ GeV, ou seja, ~1,2 × 10²⁸ a ~1,2 × 10³⁰ K
    expect(numbers(1.2e29)).toEqual(expect.arrayContaining(["07", "09"]));
    expect(numbers(1e27)).not.toContain("09");
    expect(numbers(1.4e32)).not.toContain("09");
    // O Módulo 10 não tem faixa própria na régua
    for (const T of [1e-9, 1, 300, 1e7, 1e12, 1e20, 1.2e29, 1.4e32]) expect(numbers(T)).not.toContain("10");
    for (const T of [1e-9, 1, 300, 1e7, 1e12, 1e20, 1.2e29, 1.4e32]) expect(numbers(T)).not.toContain("11");
    expect(numbers(1e20)).not.toContain("07");
    expect(contextForTemperature(2e12)[0].level).toBe("fato");
  });
});
