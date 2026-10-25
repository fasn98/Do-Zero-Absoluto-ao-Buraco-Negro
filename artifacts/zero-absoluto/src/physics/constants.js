/**
 * Constantes físicas usadas em todo o app. Nenhum outro arquivo deve
 * declarar valores numéricos de constantes físicas.
 *
 * Fontes:
 * - CODATA 2022 (NIST, https://physics.nist.gov/cuu/Constants/) para as
 *   constantes fundamentais e massas de partículas.
 * - IAU 2015, Resolução B3, para os valores nominais solares.
 * - PDG (Particle Data Group, Review of Particle Physics 2024) para a vida
 *   média do múon.
 * - AME 2020 (Atomic Mass Evaluation) para massas atômicas de isótopos.
 * - Planck 2018 (A&A 641, A6) para a idade do Universo.
 * - Fixsen 2009 (ApJ 707, 916) para a temperatura da radiação cósmica de fundo.
 * - Modelo Solar Padrão (Bahcall, Serenelli & Basu 2005) para o núcleo solar.
 */

// --- Constantes fundamentais (CODATA 2022) ---
export const speedOfLight = 299_792_458; // m·s⁻¹ (exato, CODATA 2022)
export const planckConstant = 6.626_070_15e-34; // J·s (exato, CODATA 2022)
export const reducedPlanckConstant = 1.054_571_817e-34; // J·s (CODATA 2022)
export const boltzmannConstant = 1.380_649e-23; // J·K⁻¹ (exato, CODATA 2022)
export const gravitationalConstant = 6.674_30e-11; // m³·kg⁻¹·s⁻² (CODATA 2022)
export const fineStructureConstant = 7.297_352_564_3e-3; // adimensional (CODATA 2022)
export const elementaryCharge = 1.602_176_634e-19; // C (exato, CODATA 2022)
export const atomicMassConstant = 1.660_539_068_92e-27; // kg (CODATA 2022)
export const avogadroConstant = 6.022_140_76e23; // mol⁻¹ (exato, CODATA 2022)
export const wienDisplacementConstant = 2.897_771_955e-3; // m·K (exato, CODATA 2022)
export const planckTemperature = 1.416_784e32; // K (CODATA 2022)

// --- Massas de partículas (CODATA 2022) ---
export const protonMass = 1.672_621_925_95e-27; // kg (CODATA 2022)
export const neutronMass = 1.674_927_500_56e-27; // kg (CODATA 2022)
export const electronMass = 9.109_383_713_9e-31; // kg (CODATA 2022)
export const muonMass = 1.883_531_627e-28; // kg (CODATA 2022)
export const deuteronMass = 3.343_583_776_8e-27; // kg (CODATA 2022)
export const tritonMass = 5.007_356_751_2e-27; // kg (CODATA 2022)
export const alphaParticleMass = 6.644_657_345e-27; // kg (CODATA 2022)

// --- Massas atômicas (AME 2020), em unidades de massa atômica u ---
export const rubidium87RelativeMass = 86.909_180_531; // u (AME 2020)
export const helium4RelativeMass = 4.002_603_254_13; // u (AME 2020)

// --- Materiais e experimentos ---
export const diamondDensity = 3510; // kg·m⁻³ (diamante, CRC Handbook of Chemistry and Physics)
export const superpositionRecordRelativeMass = 2.5e4; // u (maior massa em superposição, ~2.000 átomos; Fein et al., Nature Physics 15, 1242 (2019))

// --- Partículas instáveis (PDG 2024) ---
export const muonLifetime = 2.196_981_1e-6; // s (vida média do múon em repouso, PDG 2024)

// --- Matemática ---
export const zeta3Over2 = 2.612_375_348_685_488; // ζ(3/2), adimensional (função zeta de Riemann)

// --- Astronomia ---
export const protonChargeRadius = 8.4075e-16; // m (raio rms de carga do próton, CODATA 2022)
export const earthRadius = 6.371e6; // m (raio médio da Terra, IUGG)
export const observableUniverseRadius = 4.4e26; // m (raio comóvel, ~46,5 bilhões de anos-luz; cosmologia Planck 2018)
export const solarMass = 1.988_47e30; // kg (massa solar nominal derivada de GM☉ IAU 2015)
export const solarRadius = 6.957e8; // m (raio solar nominal IAU 2015)
export const solarLuminosity = 3.828e26; // W (luminosidade solar nominal IAU 2015)
export const solarSurfaceTemperature = 5772; // K (temperatura efetiva nominal IAU 2015)
export const solarCoreTemperature = 1.57e7; // K (Modelo Solar Padrão, Bahcall et al. 2005)
export const solarAge = 4.57e9; // anos (idade do Sistema Solar, datação de meteoritos)
export const cmbTemperature = 2.725_48; // K (Fixsen 2009)
export const universeAge = 1.3787e10; // anos (Planck 2018)
export const julianYear = 31_557_600; // s (ano juliano, 365,25 dias, definição IAU)

export const physicalConstants = {
  speedOfLight,
  planckConstant,
  reducedPlanckConstant,
  boltzmannConstant,
  gravitationalConstant,
  fineStructureConstant,
  elementaryCharge,
  atomicMassConstant,
  avogadroConstant,
  wienDisplacementConstant,
  planckTemperature,
  protonMass,
  neutronMass,
  electronMass,
  muonMass,
  deuteronMass,
  tritonMass,
  alphaParticleMass,
  rubidium87RelativeMass,
  helium4RelativeMass,
  diamondDensity,
  superpositionRecordRelativeMass,
  muonLifetime,
  zeta3Over2,
  protonChargeRadius,
  earthRadius,
  observableUniverseRadius,
  solarMass,
  solarRadius,
  solarLuminosity,
  solarSurfaceTemperature,
  solarCoreTemperature,
  solarAge,
  cmbTemperature,
  universeAge,
  julianYear,
};
