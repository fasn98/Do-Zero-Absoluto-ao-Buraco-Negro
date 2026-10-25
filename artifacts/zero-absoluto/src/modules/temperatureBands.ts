import { hawkingTemperatureK, massForHawkingTemperatureKg } from '../physics/blackHole';
import { landauerLimitJ } from '../physics/entropy';
import { REACTIONS, gamowEnergyJ, gamowPeakEnergyJ, kTJ, lnTunnelingProbability } from '../physics/gamow';
import { boltzmannConstant, elementaryCharge, solarMass } from '../physics/constants';
import { lnToLog10 } from '../physics/logmath';
import { formatFromLog10, formatSci } from '../lib/format';
import type { EvidenceLevel } from './shared';

export type ModuleInfo = { title: string; path: string; number: string };

export const MODULES: (ModuleInfo & { description: string; tag: string })[] = [
  { title: 'Perto do zero absoluto', description: 'O que acontece com a matéria quando o movimento térmico quase desaparece?', path: '/perto-do-zero-absoluto', number: '01', tag: 'MATÉRIA & QUANTUM' },
  { title: 'Entropia e informação', description: 'A seta do tempo, o demônio de Maxwell e o custo físico de apagar um bit.', path: '/entropia-e-informacao', number: '02', tag: 'TERMODINÂMICA' },
  { title: 'Por que o Sol brilha', description: 'O pico de Gamow e a chance extraordinária de dois prótons se fundirem.', path: '/por-que-o-sol-brilha', number: '03', tag: 'FÍSICA NUCLEAR' },
  { title: 'Fusão a frio e fusão por múons', description: 'Entre uma promessa que não se confirmou e um mecanismo quântico real.', path: '/fusao-a-frio-e-por-muons', number: '04', tag: 'FUSÃO' },
  { title: 'A temperatura dos buracos negros', description: 'Radiação Hawking, entropia de horizonte e evaporação.', path: '/a-temperatura-dos-buracos-negros', number: '05', tag: 'ASTROFÍSICA' },
  { title: 'O nascimento do Sol', description: 'Da nuvem molecular à estrela: uma história de gravidade e calor.', path: '/o-nascimento-do-sol', number: '06', tag: 'ASTROFÍSICA ESTELAR' },
  { title: 'A gravidade guarda informação', description: 'Limite holográfico, curva de Page e a pergunta em aberto: a gravidade é quântica?', path: '/a-gravidade-guarda-informacao', number: '07', tag: 'GRAVIDADE QUÂNTICA' },
  { title: 'Ouvindo o universo se expandir', description: 'Ondas gravitacionais, a sirene padrão e a tensão de Hubble.', path: '/ouvindo-o-universo', number: '08', tag: 'ONDAS GRAVITACIONAIS' },
  { title: 'As forças convergem?', description: 'As intensidades das forças mudam com a energia. Elas se encontram num ponto?', path: '/as-forcas-convergem', number: '09', tag: 'UNIFICAÇÃO' },
  { title: 'Onde o quântico vira clássico', description: 'Decoerência, recordes de superposição e o problema da medição.', path: '/quantico-para-classico', number: '10', tag: 'FUNDAMENTOS QUÂNTICOS' },
];

/** Temperatura com kT igual a uma energia em GeV (1 GeV ≈ 1,16 × 10¹³ K). */
const gevToKelvin = (gev: number) => (gev * 1e9 * elementaryCharge) / boltzmannConstant;

/** Total de módulos, no formato dos contadores ("07"). */
export const MODULE_TOTAL = String(MODULES.length).padStart(2, '0');

const byNumber = (number: string) => MODULES.find((m) => m.number === number)!;

export const BLACK_HOLE_MASS_RANGE_KG: [number, number] = [1e11, 1e10 * solarMass];

export type BandMatch = { module: ModuleInfo; reason: string };
export type Context = { level: EvidenceLevel; text: string };

/** Módulos cuja física descreve uma dada temperatura, com o motivo. */
export function modulesForTemperature(temperatureK: number): BandMatch[] {
  const matches: BandMatch[] = [];
  const T = temperatureK;
  if (T <= 10) {
    matches.push({ module: byNumber('01'), reason: 'Gases ultrafrios, condensado de Bose-Einstein e hélio líquido: o comportamento quântico domina.' });
  }
  if (T <= 1e4) {
    matches.push({ module: byNumber('02'), reason: `Apagar 1 bit de memória nesta temperatura custa no mínimo kT ln 2 = ${formatSci(landauerLimitJ(T))} J.` });
  }
  if (T >= 1 && T <= 1e3) {
    const dd = REACTIONS.dd;
    const EG = gamowEnergyJ(dd);
    const log10P = lnToLog10(lnTunnelingProbability(gamowPeakEnergyJ(EG, kTJ(T)), EG));
    matches.push({ module: byNumber('04'), reason: `Fusão D+D aqui? A chance de tunelamento no pico de Gamow é ${formatFromLog10(log10P)}.` });
  }
  if (T >= 10 && T <= 2e7) {
    matches.push({ module: byNumber('06'), reason: 'Da nuvem molecular (~10 K) ao núcleo da protoestrela, que acende a fusão acima de ~10 milhões K.' });
  }
  if (T >= 1e6 && T <= 1e10) {
    matches.push({ module: byNumber('03'), reason: 'Fusão termonuclear: o pico de Gamow decide quantas colisões atravessam a barreira de Coulomb.' });
  }
  if (T <= hawkingTemperatureK(BLACK_HOLE_MASS_RANGE_KG[0])) {
    const mass = massForHawkingTemperatureKg(T);
    const inSolar = mass / solarMass;
    const massText = inSolar >= 1e-3 ? `${formatSci(inSolar)} massas solares` : `${formatSci(mass)} kg`;
    matches.push({ module: byNumber('05'), reason: `Um buraco negro de ${massText} tem exatamente esta temperatura de Hawking.` });
  }
  if (T >= gevToKelvin(1e15) && T <= gevToKelvin(1e17)) {
    matches.push({ module: byNumber('09'), reason: 'Escala de grande unificação (kT ~ 10¹⁶ GeV, ~10²⁹ K), onde as forças do Modelo Padrão poderiam ter a mesma intensidade. Hipótese em pesquisa.' });
  }
  if (T >= 1e28) {
    matches.push({ module: byNumber('07'), reason: 'Perto da temperatura de Planck, relatividade geral e mecânica quântica precisam funcionar juntas, e ainda não sabemos como.' });
  }
  return matches.sort((a, b) => a.module.number.localeCompare(b.module.number));
}

/** Contexto físico para faixas não cobertas pelos módulos. */
export function contextForTemperature(temperatureK: number): Context[] {
  const out: Context[] = [];
  if (temperatureK > 1e10 && temperatureK < 1.5e12) {
    out.push({ level: 'fato', text: 'Acima de ~10 bilhões K, núcleos atômicos se desfazem em prótons e nêutrons livres, como no primeiro segundo após o Big Bang.' });
  }
  if (temperatureK >= 1.5e12 && temperatureK < 1e15) {
    out.push({ level: 'fato', text: 'Por volta de 2 × 10¹² K, prótons e nêutrons se dissolvem em plasma de quarks e glúons, recriado em colisões de íons pesados no RHIC e no LHC.' });
  }
  if (temperatureK >= 1e15 && temperatureK < 1e28) {
    out.push({ level: 'consenso', text: 'Por volta de 10¹⁵ K ocorre a transição eletrofraca do Modelo Padrão. Acima disso não há experimentos; as descrições extrapolam teorias testadas em energias muito menores.' });
  }
  if (temperatureK >= 1e28) {
    out.push({ level: 'hipotese', text: 'Perto da temperatura de Planck, efeitos quânticos da gravidade deveriam ser importantes. Não existe teoria testada nessa escala: tudo aqui é hipótese em pesquisa.' });
  }
  return out;
}
