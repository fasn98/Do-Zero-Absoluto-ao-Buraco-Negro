import { describe, expect, it } from "vitest";
import { DEFAULT_BOX, fft2d, gaussianMap, seededRandom, whiteNoiseModes } from "./gaussianField";

describe("campo gaussiano ilustrativo", () => {
  it("semente fixa: o mesmo mapa sempre", () => {
    const a = gaussianMap(0.9649);
    const b = gaussianMap(0.9649, whiteNoiseModes());
    expect(a.values).toEqual(b.values);
    expect(seededRandom(1)()).toBe(seededRandom(1)());
  });

  it("FFT direta e inversa devolvem o sinal (com o fator 1/n²)", () => {
    const n = 8;
    const re = Float64Array.from({ length: n * n }, (_, i) => Math.sin(i));
    const im = new Float64Array(n * n);
    const original = re.slice();
    fft2d(re, im, n);
    fft2d(re, im, n, true);
    for (let i = 0; i < n * n; i += 1) expect(re[i] / (n * n)).toBeCloseTo(original[i], 10);
  });

  it("n_s = 1 é a referência: desvio-padrão 1 e razão de grandes escalas 1", () => {
    const m = gaussianMap(1);
    const rms = Math.sqrt(m.values.reduce((s, v) => s + v * v, 0) / m.values.length);
    expect(rms).toBeCloseTo(1, 10);
    expect(m.largeScaleRatio).toBeCloseTo(1, 12);
  });

  it("n_s < 1 dá mais amplitude nas escalas grandes; n_s > 1, menos", () => {
    expect(gaussianMap(0.9649).largeScaleRatio).toBeGreaterThan(1);
    expect(gaussianMap(1.05).largeScaleRatio).toBeLessThan(1);
    expect(gaussianMap(0.9).largeScaleRatio).toBeGreaterThan(gaussianMap(0.9649).largeScaleRatio);
  });

  it("a caixa contém a escala de referência k* = 0,05 Mpc⁻¹", () => {
    const kMin = (2 * Math.PI) / DEFAULT_BOX.boxMpc;
    const kNyquist = (Math.PI * DEFAULT_BOX.size) / DEFAULT_BOX.boxMpc;
    expect(kMin).toBeLessThan(DEFAULT_BOX.pivotK);
    expect(kNyquist).toBeGreaterThan(DEFAULT_BOX.pivotK);
  });
});
