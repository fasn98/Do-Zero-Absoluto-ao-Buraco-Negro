import { describe, expect, it } from "vitest";
import reference from "../data/cosmo/validacao_fronteira.json";
import { solarMass } from "./constants";
import { cmbDeSitterCrossingS, cmbColderThanS, deSitterTemperatureK, evaporationOnsetS, evaporationTimeYears, largestEvaporatingMassKg, planckScales } from "./frontier";
import { julianYear } from "./constants";

const within = (value: number, ref: number, tolerance = 0.02) => expect(Math.abs(value / ref - 1)).toBeLessThan(tolerance);

describe("evaporação de Hawking (t = 5120π G² M³ / ħc⁴)", () => {
  it("1 massa solar: ~2,1 × 10⁶⁷ anos; 10¹¹ massas solares: ~2,1 × 10¹⁰⁰ anos", () => {
    within(evaporationTimeYears(1), 2.1e67);
    within(evaporationTimeYears(1e11), 2.1e100);
    within(evaporationTimeYears(1), reference.evaporacao_anos["1"], 1e-9);
    within(evaporationTimeYears(1e11), reference.evaporacao_anos["1e11"], 1e-9);
  });

  it("escala como M³", () => {
    within(evaporationTimeYears(10) / evaporationTimeYears(1), 1000, 1e-12);
  });

  it("um buraco negro solar só começa a evaporar quando o fundo cósmico fica mais frio que ~6 × 10⁻⁸ K", () => {
    const onsetYears = evaporationOnsetS(solarMass) / julianYear;
    within(onsetYears, reference.inicio_evaporacao_1msol_anos, 1e-3);
    expect(onsetYears).toBeGreaterThan(1e11);
    expect(onsetYears).toBeLessThan(1e12);
  });

  it("acima de ~3 × 10²² massas solares, o buraco negro é mais frio que o horizonte e nunca evapora", () => {
    within(largestEvaporatingMassKg() / solarMass, reference.maior_massa_que_evapora_msol, 1e-3);
    expect(evaporationOnsetS(1e23 * solarMass)).toBe(Infinity);
  });
});

describe("temperatura de Gibbons-Hawking e o fundo cósmico", () => {
  it("T_dS = ħ H₀ √Ω_Λ / (2π k) ≈ 2,2 × 10⁻³⁰ K com o Planck 2018 (enunciado: ~2 × 10⁻³⁰ K)", () => {
    within(deSitterTemperatureK(), 2.2e-30, 0.02);
    within(deSitterTemperatureK(), reference.t_ds_K, 1e-6);
  });

  it("o fundo cósmico chega a T_dS em ~1,2 trilhão de anos (Python: integração direta de t(a))", () => {
    const years = cmbDeSitterCrossingS() / julianYear;
    within(years, reference.cruzamento_fundo_tds_anos, 1e-3);
    expect(years).toBeGreaterThan(1e12);
    expect(years).toBeLessThan(1.5e12);
  });

  it("o fundo nunca fica mais frio que T_dS", () => {
    expect(cmbColderThanS(deSitterTemperatureK() * 0.999)).toBe(Infinity);
  });
});

describe("escalas de Planck (CODATA 2022)", () => {
  it("l_P ≈ 1,616 × 10⁻³⁵ m, t_P ≈ 5,391 × 10⁻⁴⁴ s, T_P ≈ 1,417 × 10³² K", () => {
    const p = planckScales();
    within(p.lengthM, 1.616255e-35, 1e-5);
    within(p.timeS, 5.391247e-44, 1e-5);
    within(p.temperatureK, 1.416784e32, 1e-5);
    within(p.lengthM, reference.planck.comprimento_m, 1e-9);
    within(p.temperatureK, reference.planck.temperatura_K, 1e-9);
  });
});
