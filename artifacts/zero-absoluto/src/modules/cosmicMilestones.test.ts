import { describe, expect, it } from "vitest";
import { COSMIC_TIME_MAX_S, COSMIC_TIME_MIN_S, cosmicEpoch, cosmicMilestones, nearestMilestone, positionToTime, temperatureReading, timeToPosition } from "./cosmicMilestones";
import { TRACKS, trackForModule, trackForPath } from "./tracks";
import { ageOfUniverseS, makeCosmology } from "../physics/friedmann";
import { julianYear } from "../physics/constants";

const list = cosmicMilestones();
const nearest = (t: number) => nearestMilestone(t, list).id;

describe("régua de tempo cósmico", () => {
  it("vai do tempo de Planck a 100 trilhões de anos, em escala logarítmica", () => {
    expect(COSMIC_TIME_MIN_S).toBeCloseTo(5.39e-44, 46);
    expect(COSMIC_TIME_MAX_S / julianYear).toBeCloseTo(1e14, -8);
    expect(positionToTime(timeToPosition(1))).toBeCloseTo(1, 10);
  });

  it("indica o marco mais próximo", () => {
    expect(nearest(COSMIC_TIME_MIN_S)).toBe("planck");
    expect(nearest(1e-34)).toBe("inflacao");
    expect(nearest(178)).toBe("nucleossintese");
    expect(nearest(3.72e5 * julianYear)).toBe("recombinacao");
    expect(nearest(1.5e8 * julianYear)).toBe("primeiras-estrelas");
    expect(nearest(ageOfUniverseS())).toBe("hoje");
    expect(nearest(1e11 * julianYear)).toBe("futuro");
  });

  it("antes de 1 s é especulativo; depois de hoje é projeção", () => {
    expect(cosmicEpoch(0.5)).toBe("especulativa");
    expect(cosmicEpoch(2)).toBe("modelada");
    expect(cosmicEpoch(ageOfUniverseS())).toBe("modelada");
    expect(cosmicEpoch(1.01 * ageOfUniverseS())).toBe("projecao");
  });

  it("temperatura: indefinida antes da inflação, ordem de grandeza antes de 1 s, 3 algarismos depois", () => {
    expect(temperatureReading(1e-40).value).toBe("indefinida");
    expect(temperatureReading(1e-6).value).toMatch(/^~10/);
    expect(temperatureReading(ageOfUniverseS()).value).toBe("2,73 K");
    expect(temperatureReading(3.72e5 * julianYear).value).toBe("2.970 K");
    // Futuro distante: sem underflow para zero, e abaixo da temperatura do horizonte.
    const far = temperatureReading(1e14 * julianYear);
    expect(far.value).toMatch(/10 elevado a|× 10/);
    expect(far.note).toMatch(/Gibbons-Hawking/);
  });

  it("os tempos do modelo acompanham H₀", () => {
    const shoes = cosmicMilestones(makeCosmology(73.04));
    const today = (l: typeof list) => l.find((m) => m.id === "hoje")!.anchor / julianYear / 1e9;
    expect(today(shoes)).toBeLessThan(today(list));
  });
});

describe("trilhas", () => {
  it("contadores por trilha e rotas antigas na Trilha 1", () => {
    expect(trackForModule("07").counter("07")).toBe("07 / 11");
    expect(trackForModule("2.1").counter("2.1")).toBe("2.1 / 2.5");
    expect(trackForPath("/pior-previsao")?.id).toBe("1");
    expect(trackForPath("/a-linha-do-tempo-cosmica")?.id).toBe("2");
    expect(trackForPath("/")).toBeNull();
    expect(TRACKS[1].modules.filter((m) => !m.path).map((m) => m.number)).toEqual(["2.2", "2.3", "2.4", "2.5"]);
  });
});
