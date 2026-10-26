/**
 * Campo gaussiano 2D ilustrativo (Módulo 2.4): o mesmo ruído branco, com semente fixa, filtrado por
 * um espectro em que a variância por intervalo logarítmico de k é ∝ (k/k*)^(n_s − 1). Em 2D, isso
 * corresponde a P(k) ∝ k^(n_s − 1)/k², e n_s = 1 dá a mesma variância em todas as escalas
 * (invariância de escala). É uma ilustração do espectro primordial, não um mapa do céu.
 */

/** Gerador pseudoaleatório com semente (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FFT 1D radix-2, no lugar (re, im de comprimento potência de 2); inverse = true para a inversa (sem 1/n). */
function fft1d(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar;
        im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** FFT 2D (linhas e depois colunas) de uma grade n × n armazenada por linhas. */
export function fft2d(re: Float64Array, im: Float64Array, n: number, inverse = false) {
  const rr = new Float64Array(n);
  const ri = new Float64Array(n);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let line = 0; line < n; line += 1) {
      for (let i = 0; i < n; i += 1) {
        const idx = pass === 0 ? line * n + i : i * n + line;
        rr[i] = re[idx];
        ri[i] = im[idx];
      }
      fft1d(rr, ri, inverse);
      for (let i = 0; i < n; i += 1) {
        const idx = pass === 0 ? line * n + i : i * n + line;
        re[idx] = rr[i];
        im[idx] = ri[i];
      }
    }
  }
}

export type FieldBox = { size: number; boxMpc: number; pivotK: number; seed: number };
export const DEFAULT_BOX: FieldBox = { size: 128, boxMpc: 2000, pivotK: 0.05, seed: 20251026 };

/** Número de onda (Mpc⁻¹) de cada modo da grade de Fourier. */
function wavenumbers(box: FieldBox): Float64Array {
  const { size: n, boxMpc } = box;
  const k = new Float64Array(n * n);
  for (let j = 0; j < n; j += 1) {
    const kj = j <= n / 2 ? j : j - n;
    for (let i = 0; i < n; i += 1) {
      const ki = i <= n / 2 ? i : i - n;
      k[j * n + i] = ((2 * Math.PI) / boxMpc) * Math.hypot(ki, kj);
    }
  }
  return k;
}

/** Ruído branco gaussiano, já transformado para o espaço de Fourier (sempre o mesmo para a mesma semente). */
export function whiteNoiseModes(box: FieldBox = DEFAULT_BOX) {
  const rand = seededRandom(box.seed);
  const n = box.size;
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let i = 0; i < n * n; i += 2) {
    // Box-Muller: dois valores gaussianos por par de uniformes.
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    re[i] = r * Math.cos(2 * Math.PI * v);
    re[i + 1] = r * Math.sin(2 * Math.PI * v);
  }
  fft2d(re, im, n);
  return { re, im, k: wavenumbers(box) };
}

export type GaussianMap = {
  values: Float64Array;
  size: number;
  /** Variância nas escalas maiores que 2π/k* (k < k*) relativa ao caso n_s = 1. */
  largeScaleRatio: number;
};

/**
 * Mapa para um n_s: amplitude de cada modo ∝ (k/k*)^((n_s − 1)/2) / k. O resultado é dividido pelo
 * desvio-padrão do mapa com n_s = 1, para que mapas com n_s diferentes usem a mesma escala de cores.
 */
export function gaussianMap(ns: number, noise = whiteNoiseModes(), box: FieldBox = DEFAULT_BOX): GaussianMap {
  const n = box.size;
  const build = (index: number) => {
    const re = new Float64Array(n * n);
    const im = new Float64Array(n * n);
    let large = 0;
    for (let m = 1; m < n * n; m += 1) {
      const k = noise.k[m];
      const amp = (k / box.pivotK) ** ((index - 1) / 2) / k;
      re[m] = noise.re[m] * amp;
      im[m] = noise.im[m] * amp;
      if (k < box.pivotK) large += (noise.re[m] ** 2 + noise.im[m] ** 2) * amp * amp;
    }
    fft2d(re, im, n, true);
    return { re, large };
  };
  const reference = build(1);
  const target = build(ns);
  let sum2 = 0;
  for (let i = 0; i < n * n; i += 1) sum2 += reference.re[i] ** 2;
  const scale = Math.sqrt(sum2 / (n * n));
  const values = new Float64Array(n * n);
  for (let i = 0; i < n * n; i += 1) values[i] = target.re[i] / scale;
  return { values, size: n, largeScaleRatio: target.large / reference.large };
}
