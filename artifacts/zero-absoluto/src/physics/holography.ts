/**
 * Módulo 7, Seção 1 — Quanta informação cabe numa região do espaço.
 * Referências: Bekenstein, Phys. Rev. D 23, 287 (1981); Susskind,
 * J. Math. Phys. 36, 6377 (1995); Bousso, Rev. Mod. Phys. 74, 825 (2002).
 */
import { gravitationalConstant, reducedPlanckConstant, speedOfLight } from "./constants";
import { assertPositive, schwarzschildRadiusM } from "./calculations";

/** Comprimento de Planck l_P = √(ħG/c³), em metros. */
export function planckLengthM(): number {
  return Math.sqrt((reducedPlanckConstant * gravitationalConstant) / speedOfLight ** 3);
}

/** Área de uma esfera de raio R, em m². */
export function sphereAreaM2(radiusM: number): number {
  assertPositive(radiusM, "O raio");
  return 4 * Math.PI * radiusM ** 2;
}

/**
 * Limite holográfico para uma esfera: S_máx/k = A / (4 l_P²). É a entropia de
 * um buraco negro cujo horizonte tem essa área.
 */
export function holographicBoundOverK(radiusM: number): number {
  return sphereAreaM2(radiusM) / (4 * planckLengthM() ** 2);
}

/** Converte entropia em unidades de k para bits: S / (k ln 2). */
export function entropyOverKToBits(entropyOverK: number): number {
  return entropyOverK / Math.LN2;
}

/**
 * Contagem que cresce com o volume: um bit por volume de Planck,
 * N = (4/3)πR³ / l_P³. Ultrapassa o limite holográfico a partir de R ≈ 1,08 l_P.
 */
export function planckVolumeBits(radiusM: number): number {
  assertPositive(radiusM, "O raio");
  return ((4 / 3) * Math.PI * radiusM ** 3) / planckLengthM() ** 3;
}

/** Limite de Bekenstein: S/k ≤ 2π R E / (ħ c), com E em joules. */
export function bekensteinBoundOverK(radiusM: number, energyJ: number): number {
  assertPositive(radiusM, "O raio");
  assertPositive(energyJ, "A energia");
  return (2 * Math.PI * radiusM * energyJ) / (reducedPlanckConstant * speedOfLight);
}

/** Energia de repouso E = m c², em joules. */
export function restEnergyJ(massKg: number): number {
  assertPositive(massKg, "A massa");
  return massKg * speedOfLight ** 2;
}

/** Verdadeiro se a massa, contida nesse raio, já estaria dentro do próprio horizonte (R ≤ 2GM/c²). */
export function isInsideOwnHorizon(massKg: number, radiusM: number): boolean {
  return radiusM <= schwarzschildRadiusM(massKg);
}
