/**
 * Valores CODATA 2022 para constantes fundamentais, exceto a massa solar,
 * que usa o valor nominal da União Astronômica Internacional (IAU 2015).
 */
export const speedOfLight = 299_792_458; // m·s⁻¹ (exato)
export const planckConstant = 6.626_070_15e-34; // J·s (exato)
export const reducedPlanckConstant = 1.054_571_817e-34; // J·s
export const boltzmannConstant = 1.380_649e-23; // J·K⁻¹ (exato)
export const gravitationalConstant = 6.674_30e-11; // m³·kg⁻¹·s⁻²
export const fineStructureConstant = 7.297_352_564_3e-3; // adimensional
export const protonMass = 1.672_621_925_95e-27; // kg
export const electronMass = 9.109_383_713_9e-31; // kg
export const muonMass = 1.883_531_627e-28; // kg
export const solarMass = 1.988_47e30; // kg (massa solar nominal IAU 2015)

export const physicalConstants = {
  speedOfLight,
  planckConstant,
  reducedPlanckConstant,
  boltzmannConstant,
  gravitationalConstant,
  fineStructureConstant,
  protonMass,
  electronMass,
  muonMass,
  solarMass,
};
