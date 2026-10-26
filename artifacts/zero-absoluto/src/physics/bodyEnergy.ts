/**
 * Módulo 12, Seção 4 — Energia do corpo e do cérebro em repouso (ordens de grandeza).
 *
 * Número de células: E. Bianconi et al., "An estimation of the number of cells in the human
 * body", Annals of Human Biology 40, 463 (2013): 3,72 × 10¹³ células.
 * Gasto em repouso: ~80 W (metabolismo basal de um adulto, ~1.650 kcal/dia).
 * Cérebro: ~2% da massa e ~20% do gasto em repouso (Raichle e Gusnard, PNAS 99, 10237, 2002).
 */
import { assertPositive } from "./calculations";

export const HUMAN_CELL_COUNT = 3.72e13;
export const RESTING_POWER_W = 80;
export const BRAIN_MASS_FRACTION = 0.02;
export const BRAIN_ENERGY_FRACTION = 0.2;

/** Potência média por célula, em watts. */
export function powerPerCellW(totalPowerW: number = RESTING_POWER_W, cells: number = HUMAN_CELL_COUNT): number {
  assertPositive(totalPowerW, "A potência");
  assertPositive(cells, "O número de células");
  return totalPowerW / cells;
}

/** Potência do cérebro em repouso, em watts. */
export function brainPowerW(totalPowerW: number = RESTING_POWER_W): number {
  return totalPowerW * BRAIN_ENERGY_FRACTION;
}

/** Quantas vezes o cérebro gasta mais energia por quilograma que a média do corpo. */
export function brainPowerDensityRatio(): number {
  return BRAIN_ENERGY_FRACTION / BRAIN_MASS_FRACTION;
}
