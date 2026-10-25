/**
 * Utilitários numéricos em escala logarítmica. Probabilidades como
 * exp(−500) ou 2^(−10²³) não cabem em ponto flutuante; trabalhamos sempre
 * com o logaritmo natural e só convertemos para exibição.
 */

/** ln(Σ exp(xᵢ)) sem underflow nem overflow. */
export function logSumExp(values: readonly number[]): number {
  if (values.length === 0) return -Infinity;
  let max = -Infinity;
  for (const value of values) if (value > max) max = value;
  if (!Number.isFinite(max)) return max;
  let sum = 0;
  for (const value of values) sum += Math.exp(value - max);
  return max + Math.log(sum);
}

/**
 * ln ∫ exp(f(x)) dx pela regra do trapézio sobre uma malha logarítmica em x,
 * usando dx = x · d(ln x). Requer 0 < xMin < xMax.
 */
export function logIntegrateLogGrid(
  lnIntegrand: (x: number) => number,
  xMin: number,
  xMax: number,
  points = 4000,
): number {
  const step = Math.log(xMax / xMin) / (points - 1);
  const terms: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const x = xMin * Math.exp(i * step);
    const weight = i === 0 || i === points - 1 ? 0.5 : 1;
    terms.push(lnIntegrand(x) + Math.log(x * step * weight));
  }
  return logSumExp(terms);
}

/** ln Γ(x) para x > 0, aproximação de Lanczos (g = 7, erro relativo < 1e-13). */
export function lnGamma(x: number): number {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  }
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const z = x - 1;
  let a = coefficients[0];
  const t = z + 7.5;
  for (let i = 1; i < 9; i += 1) a += coefficients[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** ln C(n, k): logaritmo do coeficiente binomial. */
export function lnBinomial(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  // C(n, 0) = C(n, n) = 1 exatamente; lnGamma deixaria um resto de arredondamento.
  if (k === 0 || k === n) return 0;
  return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}

/** Converte ln(x) em log₁₀(x). */
export function lnToLog10(lnValue: number): number {
  return lnValue / Math.LN10;
}
