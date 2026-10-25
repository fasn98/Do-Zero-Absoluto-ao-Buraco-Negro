import {
  boltzmannConstant,
  gravitationalConstant,
  planckTemperature,
  reducedPlanckConstant,
  speedOfLight,
} from "./constants";

export const MIN_TEMPERATURE_K = 1e-9;
export const MAX_TEMPERATURE_K = planckTemperature;

export function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} deve ser um número finito.`);
  }
}

export function assertPositive(value: number, name: string): void {
  assertFiniteNumber(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} deve ser maior que zero.`);
  }
}

/**
 * Converte uma posição normalizada de 0 a 1 para temperatura em kelvin,
 * distribuída uniformemente em escala logarítmica.
 */
export function logPositionToTemperature(
  position: number,
  minTemperatureK = MIN_TEMPERATURE_K,
  maxTemperatureK = MAX_TEMPERATURE_K,
): number {
  assertFiniteNumber(position, "A posição");
  assertPositive(minTemperatureK, "A temperatura mínima");
  assertPositive(maxTemperatureK, "A temperatura máxima");
  if (position < 0 || position > 1) {
    throw new RangeError("A posição deve estar entre 0 e 1.");
  }
  if (maxTemperatureK <= minTemperatureK) {
    throw new RangeError("A temperatura máxima deve superar a mínima.");
  }
  return minTemperatureK * (maxTemperatureK / minTemperatureK) ** position;
}

/** Converte temperatura em kelvin para uma posição de 0 a 1 na escala logarítmica. */
export function temperatureToLogPosition(
  temperatureK: number,
  minTemperatureK = MIN_TEMPERATURE_K,
  maxTemperatureK = MAX_TEMPERATURE_K,
): number {
  assertPositive(temperatureK, "A temperatura");
  assertPositive(minTemperatureK, "A temperatura mínima");
  assertPositive(maxTemperatureK, "A temperatura máxima");
  if (maxTemperatureK <= minTemperatureK) {
    throw new RangeError("A temperatura máxima deve superar a mínima.");
  }
  if (temperatureK < minTemperatureK || temperatureK > maxTemperatureK) {
    throw new RangeError("A temperatura está fora dos limites da escala.");
  }
  return (
    Math.log(temperatureK / minTemperatureK) /
    Math.log(maxTemperatureK / minTemperatureK)
  );
}

/** Energia térmica característica kBT, em joules, para temperatura em kelvin. */
export function thermalEnergyJ(temperatureK: number): number {
  assertFiniteNumber(temperatureK, "A temperatura");
  if (temperatureK < 0) {
    throw new RangeError("A temperatura não pode ser negativa.");
  }
  return boltzmannConstant * temperatureK;
}

/** Raio de Schwarzschild de um corpo esférico não carregado e sem rotação, em metros. */
export function schwarzschildRadiusM(massKg: number): number {
  assertPositive(massKg, "A massa");
  return (2 * gravitationalConstant * massKg) / speedOfLight ** 2;
}

/** Temperatura de Hawking de um buraco negro de Schwarzschild, em kelvin. */
export function hawkingTemperatureK(massKg: number): number {
  assertPositive(massKg, "A massa");
  return (
    (reducedPlanckConstant * speedOfLight ** 3) /
    (8 * Math.PI * gravitationalConstant * massKg * boltzmannConstant)
  );
}
