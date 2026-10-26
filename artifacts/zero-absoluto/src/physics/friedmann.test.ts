import { describe, expect, it } from "vitest";
import {
  PLANCK_2018,
  PLANCK_2018_AGE_GYR,
  SHOES_H0,
  accelerationOnsetRedshift,
  ageOfUniverseS,
  deSitterTemperatureK,
  densityFractions,
  eventHorizonM,
  gyrToSeconds,
  hubbleParameter,
  hubbleTimeS,
  lambdaEfoldTimeS,
  lnScaleFactorAtTime,
  log10TemperatureAtTime,
  makeCosmology,
  matterLambdaEqualityRedshift,
  matterRadiationEqualityRedshift,
  metersToGly,
  particleHorizonM,
  planckTimeS,
  radiationDensityH2,
  redshiftAtTime,
  redshiftForLookbackS,
  secondsToGyr,
  temperatureAtTimeK,
  timeAtRedshiftS,
  timeAtLnScaleFactorS,
  timeAtScaleFactorS,
  timeAtTemperatureS,
} from "./friedmann";
import { julianYear } from "./constants";

const within = (value: number, reference: number, tolerance = 0.02) =>
  expect(Math.abs(value / reference - 1)).toBeLessThan(tolerance);
const years = (seconds: number) => seconds / julianYear;

describe("parâmetros (Planck 2018)", () => {
  it("Ω_r h² ≈ 4,16 × 10⁻⁵ (fótons + 3 neutrinos sem massa); Ω_r ≈ 9,14 × 10⁻⁵; Ω_Λ ≈ 0,685", () => {
    within(radiationDensityH2(), 4.15e-5);
    within(radiationDensityH2(), 4.158e-5, 0.001);
    within(PLANCK_2018.omegaR, 9.14e-5);
    within(PLANCK_2018.omegaL, 0.685);
    expect(PLANCK_2018.omegaM + PLANCK_2018.omegaR + PLANCK_2018.omegaL).toBeCloseTo(1, 12);
  });

  it("H(a = 1) = H₀ e frações hoje somam 1", () => {
    within(hubbleParameter(1, PLANCK_2018), 67.4, 1e-9);
    const f = densityFractions(0, PLANCK_2018);
    within(f.matter, 0.315, 1e-9);
    expect(f.radiation + f.matter + f.darkEnergy).toBeCloseTo(1, 12);
  });
});

describe("idade e tempo cósmico", () => {
  it("idade de 13,79 bilhões de anos, a 0,5% do valor do Planck (13,787 ± 0,020)", () => {
    within(secondsToGyr(ageOfUniverseS()), PLANCK_2018_AGE_GYR, 0.005);
    within(secondsToGyr(ageOfUniverseS()), 13.79, 0.005);
  });

  it("solução analítica do regime de radiação no início: t = a²/(2H₀√Ω_r)", () => {
    const h0SI = 1 / hubbleTimeS();
    for (const a of [1e-30, 1e-14, 1e-9]) within(timeAtScaleFactorS(a), a ** 2 / (2 * h0SI * Math.sqrt(PLANCK_2018.omegaR)), 1e-4);
  });

  it("a(t) é o inverso de t(a), do tempo de Planck a 100 trilhões de anos", () => {
    for (const t of [planckTimeS(), 1, 3.7e5 * julianYear, ageOfUniverseS(), 1e14 * julianYear]) {
      within(timeAtLnScaleFactorS(lnScaleFactorAtTime(t)), t, 1e-6);
    }
    expect(lnScaleFactorAtTime(ageOfUniverseS())).toBeCloseTo(0, 8);
    // 100 trilhões de anos: ln a ≈ 5.700, finito (a própria a estoura o ponto flutuante).
    const lnFuture = lnScaleFactorAtTime(1e14 * julianYear);
    expect(lnFuture).toBeGreaterThan(5000);
    expect(Number.isFinite(log10TemperatureAtTime(1e14 * julianYear))).toBe(true);
  });

  it("igualdade matéria-radiação: z ≈ 3.450, t ≈ 50 mil anos, T ≈ 9.400 K", () => {
    const z = matterRadiationEqualityRedshift();
    within(z, 3450);
    within(years(timeAtRedshiftS(z)), 5.0e4);
    within(temperatureAtTimeK(timeAtRedshiftS(z)), 9400);
  });

  it("recombinação (z = 1.090): t ≈ 372 mil anos, T ≈ 2.970 K", () => {
    const t = timeAtRedshiftS(1090);
    within(years(t), 3.72e5);
    within(temperatureAtTimeK(t), 2970);
    within(redshiftAtTime(t), 1090, 1e-6);
  });

  it("z = 20: t ≈ 178 milhões de anos; reionização (z = 7,7): t ≈ 669 milhões de anos", () => {
    within(years(timeAtRedshiftS(20)), 1.78e8);
    within(years(timeAtRedshiftS(7.7)), 6.69e8);
  });

  it("início da aceleração: z = (2Ω_Λ/Ω_m)^(1/3) − 1 ≈ 0,632, t ≈ 7,69 bilhões de anos", () => {
    const z = accelerationOnsetRedshift();
    within(z, 0.632);
    within(z, Math.cbrt((2 * PLANCK_2018.omegaL) / PLANCK_2018.omegaM) - 1, 1e-3);
    within(secondsToGyr(timeAtRedshiftS(z)), 7.69);
  });

  it("igualdade matéria-energia escura: z ≈ 0,296, t ≈ 10,3 bilhões de anos", () => {
    const z = matterLambdaEqualityRedshift();
    within(z, 0.296);
    within(secondsToGyr(timeAtRedshiftS(z)), 10.3);
  });

  it("formação do Sol, 4,57 bilhões de anos atrás: z ≈ 0,417", () => {
    within(redshiftForLookbackS(gyrToSeconds(4.57)), 0.417);
  });

  it("T = 10⁹ K em t ≈ 178 s (cerca de 3 minutos)", () => {
    within(timeAtTemperatureS(1e9), 178);
    within(temperatureAtTimeK(178), 1e9);
  });
});

describe("horizontes e escalas de tempo", () => {
  it("horizonte de partículas ≈ 46,1 bilhões de anos-luz; de eventos ≈ 16,7", () => {
    within(metersToGly(particleHorizonM()), 46.1);
    within(metersToGly(eventHorizonM()), 16.7);
  });

  it("tempo de Hubble ≈ 14,5 bilhões de anos; e-dobra no futuro ≈ 17,5", () => {
    within(secondsToGyr(hubbleTimeS()), 14.5);
    within(secondsToGyr(lambdaEfoldTimeS()), 17.5);
  });

  it("temperatura de Gibbons-Hawking do horizonte de de Sitter ≈ 2,2 × 10⁻³⁰ K", () => {
    within(deSitterTemperatureK(), 2.2e-30);
  });

  it("tempo de Planck ≈ 5,39 × 10⁻⁴⁴ s", () => {
    within(planckTimeS(), 5.39e-44);
  });
});

describe("atalhos de H₀ com Ω_m fixo (ilustração da tensão de Hubble)", () => {
  it("H₀ = 73,04 → 12,73 bilhões de anos; H₀ = 70,39 → 13,21", () => {
    within(secondsToGyr(ageOfUniverseS(makeCosmology(SHOES_H0))), 12.73, 0.005);
    within(secondsToGyr(ageOfUniverseS(makeCosmology(70.39))), 13.21, 0.005);
  });
});
