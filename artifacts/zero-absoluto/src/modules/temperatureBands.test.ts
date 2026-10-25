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
    expect(numbers(1e20)).not.toContain("07");
    expect(contextForTemperature(2e12)[0].level).toBe("fato");
  });
});
