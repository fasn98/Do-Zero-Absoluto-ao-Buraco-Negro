import { describe, expect, it } from "vitest";
import { formatNumber, formatSig, formatDuration, formatRedshift, formatFromLog10, formatLength, formatSci, formatTemperature } from "./format";
import { evaporationTimeS, hawkingTemperatureK, schwarzschildRadiusM } from "../physics/blackHole";
import { julianYear, solarMass } from "../physics/constants";

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

  it("temperaturas abaixo de 1 nK usam notação científica em kelvin", () => {
    // Sagitário A* (4,3 × 10⁶ M☉): T_H ≈ 1,43 × 10⁻¹⁴ K
    const sgrA = hawkingTemperatureK(4.3e6 * solarMass);
    expect(Math.abs(sgrA / 1.43e-14 - 1)).toBeLessThan(0.02);
    expect(formatTemperature(sgrA)).toBe("1,43 × 10⁻¹⁴ K");
    // M87* (6,5 × 10⁹ M☉): T_H ≈ 9,5 × 10⁻¹⁸ K
    const m87 = hawkingTemperatureK(6.5e9 * solarMass);
    expect(Math.abs(m87 / 9.5e-18 - 1)).toBeLessThan(0.02);
    expect(formatTemperature(m87)).toBe("9,49 × 10⁻¹⁸ K");
  });
  it("faixas de nK, μK e mK mantêm 3 algarismos significativos", () => {
    expect(formatTemperature(1.7e-7)).toBe("170 nK");
    expect(formatTemperature(2.4e-9)).toBe("2,4 nK");
    expect(formatTemperature(1e-9)).toBe("1 nK");
    expect(formatTemperature(6.17e-8)).toBe("61,7 nK");
    expect(formatTemperature(3.5e-4)).toBe("350 μK");
  });

  it("comprimentos com 3 algarismos significativos e troca de unidade", () => {
    expect(formatLength(schwarzschildRadiusM(solarMass))).toBe("2,95 km");
    expect(formatLength(1.87e-7)).toBe("187 nm");
    expect(formatLength(1.48e-16)).toBe("0,148 fm");
    expect(formatLength(2.95e13)).toBe("2,95 × 10¹⁰ km");
  });
  it("tempo de evaporação de 1 massa solar: 2,10 × 10⁶⁷ anos", () => {
    expect(formatDuration(evaporationTimeS(solarMass), julianYear)).toBe("2,10 × 10⁶⁷ anos");
    expect(formatDuration(evaporationTimeS(1e11), julianYear)).toBe("2,67 bilhões de anos");
  });

  it("sinal de menos tipográfico e sem zero negativo", () => {
    expect(formatNumber(-3.14, 1)).toBe("−3,1");
    expect(formatNumber(-0.04, 1)).toBe("0");
    expect(formatSig(-0.0259)).toBe("−0,0259");
  });
  it("durações curtas em ms e µs", () => {
    expect(formatDuration(0.0116, 31557600)).toBe("11,6 ms");
    expect(formatDuration(2.5e-5, 31557600)).toBe("25,0 µs");
    expect(formatDuration(8.1e-21, 31557600)).toBe("8,10 × 10⁻²¹ s");
  });
  it("minutos e trilhões de anos", () => {
    expect(formatDuration(178, 31557600)).toBe("2,97 min");
    expect(formatDuration(1e14 * 31557600, 31557600)).toBe("100 trilhões de anos");
  });
});

describe("temperaturas altas e redshift", () => {
  it("nunca mostra 1.000 milhões K e usa o singular", () => {
    expect(formatTemperature(0.99999e9)).toBe("1 bilhão K");
    expect(formatTemperature(0.99999e9, 3)).toBe("1,00 bilhão K");
    expect(formatTemperature(1.57e7)).toBe("15,7 milhões K");
    expect(formatTemperature(2.5e9, 3)).toBe("2,50 bilhões K");
    expect(formatTemperature(2973.5, 3)).toBe("2.970 K");
    expect(formatTemperature(2.7255, 3)).toBe("2,73 K");
  });
  it("redshift com 3 algarismos", () => {
    expect(formatRedshift(3440.7)).toBe("3.440");
    expect(formatRedshift(1090)).toBe("1.090");
    expect(formatRedshift(0.63172)).toBe("0,632");
    expect(formatRedshift(2.5e8)).toBe("2,50 × 10⁸");
  });
});
