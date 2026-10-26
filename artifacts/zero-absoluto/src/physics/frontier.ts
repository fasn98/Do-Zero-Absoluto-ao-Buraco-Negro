/**
 * Módulo 2.5 — A fronteira: o futuro distante num universo com Λ constante.
 *
 * Reúne funções já validadas de outros módulos (evaporação de Hawking, Módulo 5; temperatura de
 * Gibbons-Hawking e t(a), Módulo 2.1) e acrescenta o que é novo aqui: quando o fundo cósmico fica
 * mais frio que um buraco negro (início da evaporação líquida), quando ele chega à temperatura do
 * horizonte de de Sitter, e as escalas de Planck. Validação independente em
 * scripts/validacao_fronteira.py.
 */
import { boltzmannConstant, cmbTemperature, gravitationalConstant, julianYear, reducedPlanckConstant, solarMass, speedOfLight } from "./constants";
import { evaporationTimeS, hawkingTemperatureK, massForHawkingTemperatureKg } from "./blackHole";
import { PLANCK_2018, ageOfUniverseS, deSitterTemperatureK, planckTimeS, timeAtTemperatureS, type Cosmology } from "./friedmann";
import { planckLengthM } from "./holography";

export { deSitterTemperatureK } from "./friedmann";

/** Escalas de Planck: l_P = √(ħG/c³), t_P = √(ħG/c⁵), T_P = √(ħc⁵/G)/k. */
export function planckScales() {
  return {
    lengthM: planckLengthM(),
    timeS: planckTimeS(),
    temperatureK: Math.sqrt((reducedPlanckConstant * speedOfLight ** 5) / gravitationalConstant) / boltzmannConstant,
  };
}

/** Tempo de evaporação de Hawking (só fótons, corpo negro), em anos, para uma massa em massas solares. */
export function evaporationTimeYears(massSolar: number): number {
  return evaporationTimeS(massSolar * solarMass) / julianYear;
}

/** Instante (s desde o Big Bang) em que o fundo cósmico fica mais frio que a temperatura T. Infinito se T ≤ T_dS. */
export function cmbColderThanS(temperatureK: number, c: Cosmology = PLANCK_2018): number {
  if (temperatureK <= deSitterTemperatureK(c)) return Infinity;
  return temperatureK >= cmbTemperature ? ageOfUniverseS(c) : timeAtTemperatureS(temperatureK, c);
}

/**
 * Início da evaporação líquida de um buraco negro: enquanto o fundo cósmico for mais quente que ele,
 * o buraco negro absorve mais radiação do que emite e cresce. Devolve o instante, em segundos desde o
 * Big Bang, em que o fundo fica mais frio que a temperatura de Hawking. Infinito para massas acima de
 * `largestEvaporatingMassKg`: esses buracos negros nunca ficam mais quentes que o horizonte cosmológico.
 */
export function evaporationOnsetS(massKg: number, c: Cosmology = PLANCK_2018): number {
  return cmbColderThanS(hawkingTemperatureK(massKg), c);
}

/** Massa cuja temperatura de Hawking é igual à do horizonte de de Sitter, em kg. */
export function largestEvaporatingMassKg(c: Cosmology = PLANCK_2018): number {
  return massForHawkingTemperatureKg(deSitterTemperatureK(c));
}

/** Instante em que a temperatura do fundo cósmico (T ∝ 1/a) iguala a temperatura de Gibbons-Hawking. */
export function cmbDeSitterCrossingS(c: Cosmology = PLANCK_2018): number {
  return timeAtTemperatureS(deSitterTemperatureK(c), c);
}
