/**
 * Módulo 8, Seções 2 e 3 — Lei de Hubble e tensão entre medições de H₀.
 * H₀ em km/s/Mpc, velocidades em km/s, distâncias em Mpc.
 */
import { assertPositive } from "./calculations";

/** Lei de Hubble: H₀ = v / d. */
export function hubbleConstant(velocityKmS: number, distanceMpc: number): number {
  assertPositive(velocityKmS, "A velocidade");
  assertPositive(distanceMpc, "A distância");
  return velocityKmS / distanceMpc;
}

/** Soma em quadratura de incertezas independentes. */
export function combineInQuadrature(...sigmas: number[]): number {
  return Math.sqrt(sigmas.reduce((sum, s) => sum + s * s, 0));
}

export type Measurement = {
  id: string;
  label: string;
  method: string;
  group: "primordial" | "local" | "ondas";
  value: number;
  /** Incerteza 1σ para cima e para baixo (iguais quando simétrica). */
  plus: number;
  minus: number;
  reference: string;
};

/**
 * Medições publicadas de H₀ (1σ). Valores conferidos nos resumos publicados:
 * Planck 2018, A&A 641, A6 (2020); Riess et al., ApJL 934, L7 (2022);
 * Freedman et al., ApJ 985, 203 (2025): 70,39 ± 1,22 (estat.) ± 1,33 (sist.),
 * combinadas em quadratura (o artigo lista ainda ±0,70 de σ_SN);
 * H0DN Collaboration (Casertano et al.), A&A 708, A166 (2026);
 * Abbott et al., Nature 551, 85 (2017).
 */
export const H0_MEASUREMENTS: Measurement[] = [
  { id: "planck", label: "Planck 2018", method: "Fundo cósmico de micro-ondas + ΛCDM", group: "primordial", value: 67.4, plus: 0.5, minus: 0.5, reference: "Aghanim et al., A&A 641, A6 (2020)" },
  { id: "shoes", label: "SH0ES", method: "Cefeidas e supernovas", group: "local", value: 73.04, plus: 1.04, minus: 1.04, reference: "Riess et al., ApJL 934, L7 (2022)" },
  { id: "cchp", label: "CCHP", method: "Gigantes vermelhas (TRGB), Hubble e JWST", group: "local", value: 70.39, plus: combineInQuadrature(1.22, 1.33), minus: combineInQuadrature(1.22, 1.33), reference: "Freedman et al., ApJ 985, 203 (2025)" },
  { id: "h0dn", label: "H0DN", method: "Rede de distâncias locais", group: "local", value: 73.5, plus: 0.81, minus: 0.81, reference: "H0DN, Casertano et al., A&A 708, A166 (2026)" },
  { id: "gw170817", label: "GW170817", method: "Sirene padrão (ondas gravitacionais)", group: "ondas", value: 70, plus: 12, minus: 8, reference: "Abbott et al., Nature 551, 85 (2017)" },
];

/** Dados de GW170817 usados na calculadora (Abbott et al., Nature 551, 85, 2017). */
export const GW170817 = {
  recessionVelocityKmS: 3017,
  distanceMpc: 43.8,
  distancePlusMpc: 2.9,
  distanceMinusMpc: 6.9,
};

/**
 * Discrepância em sigmas entre duas medições: |a − b| / √(σa² + σb²).
 * Com incertezas assimétricas, usa o lado de cada medição voltado para a outra.
 */
export function tensionSigma(a: Measurement, b: Measurement): number {
  const [low, high] = a.value <= b.value ? [a, b] : [b, a];
  return (high.value - low.value) / combineInQuadrature(low.plus, high.minus);
}
