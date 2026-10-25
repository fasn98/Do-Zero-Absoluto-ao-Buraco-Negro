/**
 * Módulo 10, Seções 1 e 2 — Decoerência por espalhamento e recordes de superposição.
 * Λ em cm⁻² s⁻¹ e separações em cm, como na fonte.
 */
import {
  atomicMassConstant,
  boltzmannConstant,
  cmbTemperature,
  electronMass,
  julianYear,
  neutronMass,
  planckConstant,
  protonChargeRadius,
  solarSurfaceTemperature,
  speedOfLight,
  superpositionRecordRelativeMass,
  universeAge,
  wienDisplacementConstant,
} from "./constants";
import { assertPositive } from "./calculations";

export type ObjectId = "dust3" | "dust5" | "molecule";
export type EnvironmentId = "cmb" | "photons300" | "sunlight" | "air" | "vacuum";

export const OBJECTS: { id: ObjectId; label: string; radiusCm: number }[] = [
  { id: "dust3", label: "Grão de poeira (10⁻³ cm)", radiusCm: 1e-3 },
  { id: "dust5", label: "Poeira pequena (10⁻⁵ cm)", radiusCm: 1e-5 },
  { id: "molecule", label: "Molécula grande (10⁻⁶ cm)", radiusCm: 1e-6 },
];

/** Massa média de uma molécula de ar seco: 28,97 u (U.S. Standard Atmosphere, 1976). */
const AIR_MOLECULE_MASS_KG = 28.97 * atomicMassConstant;
const ROOM_TEMPERATURE_K = 300;

/** Pico de Wien λ = b/T, em cm: comprimento de onda típico de fótons térmicos. */
const wienPeakCm = (temperatureK: number) => (wienDisplacementConstant / temperatureK) * 100;
/** Comprimento de onda térmico de de Broglie h/√(2πmkT), em cm. */
const thermalDeBroglieCm = (massKg: number, temperatureK: number) =>
  (planckConstant / Math.sqrt(2 * Math.PI * massKg * boltzmannConstant * temperatureK)) * 100;

/**
 * Ambientes e o comprimento de onda típico das suas partículas (fótons: pico
 * de Wien; gás: comprimento de onda térmico de de Broglie de moléculas de ar
 * a 300 K, também para o vácuo de laboratório, que tem o mesmo gás rarefeito).
 */
export const ENVIRONMENTS: { id: EnvironmentId; label: string; wavelengthCm: number }[] = [
  { id: "cmb", label: "Radiação cósmica de fundo", wavelengthCm: wienPeakCm(cmbTemperature) },
  { id: "photons300", label: "Fótons a 300 K", wavelengthCm: wienPeakCm(ROOM_TEMPERATURE_K) },
  { id: "sunlight", label: "Luz do Sol na Terra", wavelengthCm: wienPeakCm(solarSurfaceTemperature) },
  { id: "air", label: "Ar ao nível do mar", wavelengthCm: thermalDeBroglieCm(AIR_MOLECULE_MASS_KG, ROOM_TEMPERATURE_K) },
  { id: "vacuum", label: "Vácuo de laboratório (10³ partículas/cm³)", wavelengthCm: thermalDeBroglieCm(AIR_MOLECULE_MASS_KG, ROOM_TEMPERATURE_K) },
];

/**
 * Constante de localização Λ (cm⁻² s⁻¹), em log₁₀. Fonte: tabela de Joos e Zeh,
 * Z. Phys. B 59, 223 (1985), reproduzida em E. Joos, "Elements of Environmental
 * Decoherence", arXiv:quant-ph/9908008 (1999), p. 7 ("from [10]" = Joos e Zeh 1985).
 * São estimativas de ordem de grandeza.
 */
export const LOG10_LAMBDA: Record<EnvironmentId, Record<ObjectId, number>> = {
  cmb: { dust3: 6, dust5: -6, molecule: -12 },
  photons300: { dust3: 19, dust5: 12, molecule: 6 },
  sunlight: { dust3: 21, dust5: 17, molecule: 13 },
  air: { dust3: 36, dust5: 32, molecule: 30 },
  vacuum: { dust3: 23, dust5: 19, molecule: 17 },
};

export type DecoherenceResult =
  | { regime: "longo"; timeS: number; wavelengthCm: number }
  | { regime: "saturado"; wavelengthCm: number };

/**
 * τ_D = 1/(Λ Δx²), válido só quando Δx é menor que o comprimento de onda das
 * partículas do ambiente. Acima disso a decoerência satura (τ = 1/Γ_total), e a
 * fonte não dá Γ_total; nesse caso não se calcula um número.
 */
export function decoherence(objectId: ObjectId, environmentId: EnvironmentId, separationCm: number): DecoherenceResult {
  assertPositive(separationCm, "A separação");
  const env = ENVIRONMENTS.find((e) => e.id === environmentId)!;
  if (separationCm >= env.wavelengthCm) return { regime: "saturado", wavelengthCm: env.wavelengthCm };
  const lambda = 10 ** LOG10_LAMBDA[environmentId][objectId];
  return { regime: "longo", timeS: 1 / (lambda * separationCm ** 2), wavelengthCm: env.wavelengthCm };
}

/** Escalas de tempo para comparação em linguagem simples, em segundos. */
const TIME_SCALES: { s: number; text: string }[] = [
  { s: (2 * protonChargeRadius) / speedOfLight, text: "a luz atravessar um próton" },
  { s: 1e-10 / speedOfLight, text: "a luz atravessar um átomo" },
  { s: 1e-9, text: "um nanossegundo" },
  { s: 1e-3, text: "um milissegundo" },
  { s: 1, text: "um segundo" },
  { s: 86400, text: "um dia" },
  { s: julianYear, text: "um ano" },
  { s: universeAge * julianYear, text: "a idade do universo" },
];

/** Comparação em linguagem simples: "mais rápido que…" ou "mais longo que…". */
export function timeComparison(timeS: number): string {
  if (timeS < TIME_SCALES[0].s) return `mais rápido que ${TIME_SCALES[0].text}`;
  const longer = [...TIME_SCALES].reverse().find((t) => timeS >= t.s)!;
  return `mais longo que ${longer.text}`;
}

/** Recordes de interferência de matéria, em kg. */
export const SUPERPOSITION_RECORDS = [
  { label: "Elétron", massKg: electronMass, note: "difração desde 1927 (Davisson e Germer; G. P. Thomson)" },
  { label: "Nêutron", massKg: neutronMass, note: "interferometria de nêutrons desde os anos 1970" },
  { label: "Fulereno C₆₀", massKg: 720 * atomicMassConstant, note: "Arndt et al., Nature 401, 680 (1999)" },
  { label: "Moléculas de ~25.000 u", massKg: superpositionRecordRelativeMass * atomicMassConstant, note: "Fein et al., Nature Physics 15, 1242 (2019)" },
];

/** Alvo do experimento de emaranhamento gravitacional (Módulo 7). */
export const GRAVITY_TEST_TARGET_KG = 1e-14;
