import { describe, expect, it } from "vitest";
import {
  hawkingTemperatureK,
  logPositionToTemperature,
  MIN_TEMPERATURE_K,
  MAX_TEMPERATURE_K,
  schwarzschildRadiusM,
  temperatureToLogPosition,
  thermalEnergyJ,
} from "./calculations";
import {
  boltzmannConstant,
  gravitationalConstant,
  speedOfLight,
} from "./constants";

describe("escala logarítmica de temperatura", () => {
  it("mapeia os extremos da escala para 0 e 1", () => {
    expect(logPositionToTemperature(0)).toBeCloseTo(MIN_TEMPERATURE_K);
    expect(logPositionToTemperature(1)).toBeCloseTo(MAX_TEMPERATURE_K);
  });

  it("mapeia o meio para a média geométrica dos limites", () => {
    expect(logPositionToTemperature(0.5)).toBeCloseTo(
      Math.sqrt(MIN_TEMPERATURE_K * MAX_TEMPERATURE_K),
    );
  });

  it("converte temperaturas para posição e de volta", () => {
    for (const position of [0, 0.1, 0.5, 0.9, 1]) {
      const temperature = logPositionToTemperature(position);
      expect(temperatureToLogPosition(temperature)).toBeCloseTo(position);
    }
  });

  it("rejeita posições e limites inválidos", () => {
    expect(() => logPositionToTemperature(-0.1)).toThrow(RangeError);
    expect(() => logPositionToTemperature(1.1)).toThrow(RangeError);
    expect(() => logPositionToTemperature(0.5, 10, 10)).toThrow(RangeError);
    expect(() => temperatureToLogPosition(0)).toThrow(RangeError);
    expect(() => temperatureToLogPosition(1, 10, 100)).toThrow(RangeError);
  });
});

describe("cálculos físicos básicos", () => {
  it("calcula a energia térmica kBT", () => {
    expect(thermalEnergyJ(300)).toBeCloseTo(boltzmannConstant * 300);
    expect(thermalEnergyJ(0)).toBe(0);
    expect(() => thermalEnergyJ(-1)).toThrow(RangeError);
  });

  it("calcula o raio de Schwarzschild usando a fórmula padrão", () => {
    expect(schwarzschildRadiusM(1)).toBeCloseTo(
      (2 * gravitationalConstant) / speedOfLight ** 2,
    );
    expect(() => schwarzschildRadiusM(0)).toThrow(RangeError);
  });

  it("calcula uma temperatura de Hawking finita e positiva", () => {
    const temperature = hawkingTemperatureK(1e12);
    expect(Number.isFinite(temperature)).toBe(true);
    expect(temperature).toBeGreaterThan(0);
    expect(() => hawkingTemperatureK(-1)).toThrow(RangeError);
  });
});
