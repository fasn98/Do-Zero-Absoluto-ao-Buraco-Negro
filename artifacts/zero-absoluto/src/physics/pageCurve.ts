/**
 * Módulo 7, Seção 2 — Curva de Page, num modelo idealizado de evaporação.
 * Tempo em fração do tempo de evaporação (0 a 1); entropias em fração da
 * entropia inicial do buraco negro S₀. Referência: Page, PRL 71, 3743 (1993).
 *
 * Simplificação: supõe que a entropia da radiação é igual à entropia perdida
 * pelo buraco. Para fótons, a radiação térmica carrega cerca de 1,5 vez mais.
 */

function assertFraction(t: number) {
  if (!(t >= 0 && t <= 1)) throw new RangeError("O tempo deve estar entre 0 e 1 (fração de t_evap).");
}

/** M(t)/M₀ = (1 − t)^(1/3), pois dM/dt ∝ −1/M² dá M³ linear no tempo. */
export function massFraction(t: number): number {
  assertFraction(t);
  return Math.cbrt(1 - t);
}

/** S_BH(t)/S₀ = (M/M₀)². */
export function blackHoleEntropyFraction(t: number): number {
  return massFraction(t) ** 2;
}

/** Curva de Hawking (1975): S_rad = S₀ − S_BH, que só cresce. */
export function hawkingRadiationEntropyFraction(t: number): number {
  return 1 - blackHoleEntropyFraction(t);
}

/** Curva de Page (1993): S_rad = min(S₀ − S_BH, S_BH), que sobe e volta a zero. */
export function pageRadiationEntropyFraction(t: number): number {
  return Math.min(hawkingRadiationEntropyFraction(t), blackHoleEntropyFraction(t));
}

/** Tempo de Page, quando S_BH = S₀/2: t = 1 − 2^(−3/2) ≈ 0,646. */
export const PAGE_TIME_FRACTION = 1 - 2 ** -1.5;
