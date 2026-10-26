import {
  PLANCK_2018,
  RECOMBINATION_REDSHIFT,
  REIONIZATION_REDSHIFT,
  accelerationOnsetRedshift,
  ageOfUniverseS,
  deSitterTemperatureK,
  lambdaEfoldTimeS,
  log10TemperatureAtTime,
  matterLambdaEqualityRedshift,
  matterRadiationEqualityRedshift,
  planckTimeS,
  redshiftForLookbackS,
  secondsToGyr,
  timeAtRedshiftS,
  timeAtTemperatureS,
  type Cosmology,
} from '../physics/friedmann';
import { julianYear, solarAge } from '../physics/constants';
import { formatDuration, formatFromLog10, formatRedshift as redshift, formatSig, formatTemperature, superscript } from '../lib/format';
import type { EvidenceLevel } from './shared';

export type CosmicMilestone = {
  id: string;
  name: string;
  /** Rótulo curto dos botões. */
  short: string;
  level: EvidenceLevel;
  /** Quando, em texto (calculado com os parâmetros escolhidos quando vem do modelo). */
  when: string;
  /** Quando, em poucas palavras (botões). */
  whenShort: string;
  /** Intervalo de tempo coberto pelo marco, em segundos (igual para marcos pontuais). */
  range: [number, number];
  /** Instante para onde o controle vai ao selecionar o marco. */
  anchor: number;
  text: string;
  link?: { href: string; label: string };
};

/** Limites da régua de tempo cósmico: tempo de Planck a 100 trilhões de anos. */
export const COSMIC_TIME_MIN_S = planckTimeS();
export const COSMIC_TIME_MAX_S = 1e14 * julianYear;
/** Antes de ~1 s não há observação direta; o registro mais antigo é a nucleossíntese. */
export const SPECULATIVE_BEFORE_S = 1;
/** Fim da inflação (se ela ocorreu): antes disso não faz sentido falar em temperatura do banho térmico. */
export const INFLATION_END_S = 1e-32;

const yr = (years: number) => years * julianYear;
const duration = (seconds: number) => formatDuration(seconds, julianYear);

/** Marcos da história cósmica, com os tempos do modelo para a cosmologia escolhida. */
export function cosmicMilestones(c: Cosmology = PLANCK_2018): CosmicMilestone[] {
  const t0 = ageOfUniverseS(c);
  const zEq = matterRadiationEqualityRedshift(c);
  const tEq = timeAtRedshiftS(zEq, c);
  const tRec = timeAtRedshiftS(RECOMBINATION_REDSHIFT, c);
  const tStars = timeAtRedshiftS(20, c);
  const tReion = timeAtRedshiftS(REIONIZATION_REDSHIFT, c);
  const tSun = t0 - yr(solarAge);
  const zSun = redshiftForLookbackS(yr(solarAge), c);
  const zAcc = accelerationOnsetRedshift(c);
  const tAcc = timeAtRedshiftS(zAcc, c);
  const zL = matterLambdaEqualityRedshift(c);
  const tL = timeAtRedshiftS(zL, c);
  const tBbn = timeAtTemperatureS(1e9, c);
  const efold = secondsToGyr(lambdaEfoldTimeS(c));
  const point = (t: number): [number, number] => [t, t];
  return [
    {
      id: 'planck', name: 'Era de Planck', short: 'Era de Planck', level: 'hipotese',
      whenShort: 'antes de 10⁻⁴³ s',
      when: 'antes de ~10⁻⁴³ s', range: [0, 1e-43], anchor: COSMIC_TIME_MIN_S,
      text: 'A relatividade geral e a mecânica quântica precisariam valer juntas, e não existe teoria testada para isso. Física desconhecida: nem a noção de tempo está garantida aqui.',
    },
    {
      id: 'inflacao', name: 'Inflação', short: 'Inflação', level: 'hipotese',
      whenShort: '~10⁻³⁶ a 10⁻³² s',
      when: '~10⁻³⁶ a 10⁻³² s', range: [1e-36, INFLATION_END_S], anchor: 1e-34,
      text: 'Uma expansão exponencial muito rápida explicaria por que o universo é tão plano e homogêneo e de onde vieram as sementes das galáxias. As previsões concordam com o fundo cósmico, mas as ondas gravitacionais primordiais que ela produziria ainda não foram detectadas. Será o tema do Módulo 2.4 (em breve).',
    },
    {
      id: 'nucleossintese', name: 'Nucleossíntese primordial', short: 'Nucleossíntese', level: 'fato',
      whenShort: duration(tBbn),
      when: `~1 s a ~20 min; T = 10⁹ K em ${duration(tBbn)}`, range: [1, 1200], anchor: tBbn,
      text: 'Prótons e nêutrons formam deutério, hélio e um pouco de lítio. As abundâncias medidas de hélio-4 (cerca de 25% da massa) e de deutério concordam com a previsão. A exceção é o lítio-7: o observado é cerca de 3 vezes menor que o previsto, um problema em aberto.',
    },
    {
      id: 'igualdade', name: 'Igualdade matéria-radiação', short: 'Igualdade', level: 'consenso',
      whenShort: duration(tEq),
      when: `z ≈ ${redshift(zEq)}, ${duration(tEq)}`, range: point(tEq), anchor: tEq,
      text: 'A densidade da matéria passa a superar a da radiação, e a expansão desacelera de outro jeito: o fator de escala passa a crescer como t elevado a 2/3, e não mais a 1/2. A data é derivada do modelo ΛCDM ajustado aos dados, e não observada diretamente.',
    },
    {
      id: 'recombinacao', name: 'Recombinação e fundo cósmico de micro-ondas', short: 'Recombinação', level: 'fato',
      whenShort: duration(tRec),
      when: `z ≈ ${redshift(RECOMBINATION_REDSHIFT)}, ${duration(tRec)}`, range: point(tRec), anchor: tRec,
      text: `Elétrons e prótons formam átomos de hidrogênio, a cerca de ${formatSig(10 ** log10TemperatureAtTime(tRec, c))} K, e o universo fica transparente. Essa luz chega até hoje, esticada para micro-ondas, como o fundo cósmico medido pelo COBE, WMAP e Planck.`,
    },
    {
      id: 'primeiras-estrelas', name: 'Idade das trevas e primeiras estrelas', short: 'Primeiras estrelas', level: 'hipotese',
      whenShort: '~100 a 200 milhões de anos',
      when: `~100 a 200 milhões de anos (z = 20: ${duration(tStars)})`, range: [yr(1e8), yr(2e8)], anchor: tStars,
      text: 'Depois da recombinação não há fontes de luz: é a idade das trevas. As primeiras estrelas devem ter surgido entre ~100 e 200 milhões de anos, mas nunca foram observadas. O JWST já confirmou galáxias em z ≈ 14, cerca de 290 milhões de anos após o Big Bang (Carniani et al., 2024), e continua encontrando galáxias cada vez mais cedo.',
    },
    {
      id: 'reionizacao', name: 'Reionização', short: 'Reionização', level: 'consenso',
      whenShort: duration(tReion),
      when: `z ≈ ${formatSig(REIONIZATION_REDSHIFT, 2)}, ${duration(tReion)}`, range: point(tReion), anchor: tReion,
      text: 'A luz das primeiras estrelas e galáxias volta a ionizar o hidrogênio. z ≈ 7,7 é o ponto médio estimado pelo Planck a partir do fundo cósmico; espectros de quasares indicam que o processo terminou por volta de z ≈ 6.',
    },
    {
      id: 'sol', name: 'Formação do Sol', short: 'Formação do Sol', level: 'fato',
      whenShort: 'há 4,57 bilhões de anos',
      when: `há 4,57 bilhões de anos (z ≈ ${formatSig(zSun)}), ${duration(tSun)}`, range: point(tSun), anchor: tSun,
      text: 'A idade vem da datação radioativa dos sólidos mais antigos do Sistema Solar, encontrados em meteoritos (Connelly et al., 2012).',
      link: { href: '/o-nascimento-do-sol', label: 'Módulo 6 da Trilha 1: o nascimento do Sol' },
    },
    {
      id: 'aceleracao', name: 'Início da aceleração', short: 'Aceleração', level: 'fato',
      whenShort: duration(tAcc),
      when: `z ≈ ${formatSig(zAcc)}, ${duration(tAcc)}`, range: point(tAcc), anchor: tAcc,
      text: 'Que a expansão acelera hoje é fato, medido com supernovas (Nobel de 2011). O instante exato da virada (z ≈ 0,63) sai do ajuste ΛCDM; a primeira medição direta com supernovas deu z = 0,46 ± 0,13 (Riess et al., 2004).',
    },
    {
      id: 'energia-escura', name: 'Energia escura passa a dominar', short: 'Energia escura domina', level: 'consenso',
      whenShort: duration(tL),
      when: `z ≈ ${formatSig(zL)}, ${duration(tL)}`, range: point(tL), anchor: tL,
      text: 'A densidade da energia escura, constante no ΛCDM, ultrapassa a da matéria, que se dilui com o volume.',
    },
    {
      id: 'hoje', name: 'Hoje', short: 'Hoje', level: 'fato',
      whenShort: duration(t0),
      when: duration(t0), range: point(t0), anchor: t0,
      text: 'A idade publicada pelo Planck é 13,787 ± 0,020 bilhões de anos, calculada dentro do ΛCDM. As estrelas mais velhas da Via Láctea, datadas de forma independente, têm idades compatíveis.',
    },
    {
      id: 'futuro', name: 'Futuro dominado por Λ', short: 'Futuro', level: 'hipotese',
      whenShort: duration(yr(1e11)),
      when: `depois de hoje; e-dobra de ~${formatSig(efold)} bilhões de anos`, range: [1.5 * t0, Infinity], anchor: yr(1e11),
      text: `Se a energia escura for constante, a expansão fica exponencial: as distâncias crescem um fator e (≈ 2,72) a cada ~${formatSig(efold)} bilhões de anos, e as galáxias fora do Grupo Local saem do nosso horizonte. Depende de a energia escura ser constante: os dados do DESI (Módulo 11) sugerem, sem confirmação, que ela pode variar.`,
      link: { href: '/os-destinos-possiveis', label: 'Módulo 2.2: os destinos possíveis' },
    },
  ];
}

/** Marco mais próximo do instante t, em escala logarítmica; um intervalo que contém t tem prioridade. */
export function nearestMilestone(timeS: number, list: CosmicMilestone[]): CosmicMilestone {
  const lt = Math.log10(timeS);
  const distance = (m: CosmicMilestone) => {
    const [from, to] = m.range;
    if (timeS >= from && timeS <= to) return 0;
    const edge = timeS < from ? from : to;
    return Math.abs(lt - Math.log10(edge));
  };
  return list.reduce((best, m) => (distance(m) < distance(best) ? m : best));
}

export type CosmicEpoch = 'especulativa' | 'modelada' | 'projecao';

/** Antes de ~1 s: física especulativa ou desconhecida; depois de hoje: projeção do ΛCDM. */
export function cosmicEpoch(timeS: number, c: Cosmology = PLANCK_2018): CosmicEpoch {
  if (timeS < SPECULATIVE_BEFORE_S) return 'especulativa';
  if (timeS > ageOfUniverseS(c) * (1 + 1e-6)) return 'projecao';
  return 'modelada';
}

export type TemperatureReading = { value: string; note?: string };

/**
 * Antes do fim da inflação, a solução do regime de radiação não descreve a
 * expansão: se houve inflação, a cresceu de forma exponencial, e na era de
 * Planck nem o tempo está bem definido. Nessa faixa, a, z, H e as frações de
 * densidade não são mostrados.
 */
export function radiationModelApplies(timeS: number): boolean {
  return timeS >= INFLATION_END_S;
}

export const BEFORE_INFLATION_END_NOTE = 'o modelo de radiação não se aplica antes do fim da inflação';

/** Temperatura da radiação no instante t, quando ela está definida. */
export function temperatureReading(timeS: number, c: Cosmology = PLANCK_2018): TemperatureReading {
  if (timeS < INFLATION_END_S) {
    return { value: 'indefinida', note: 'Antes do fim da inflação (se ela ocorreu) não há banho térmico; na era de Planck, a física é desconhecida.' };
  }
  const log10T = log10TemperatureAtTime(timeS, c);
  if (timeS < SPECULATIVE_BEFORE_S) {
    return { value: `~10${superscript(Math.round(log10T))} K`, note: 'Só a ordem de grandeza: extrapolação do modelo, que ignora as partículas que existiam a essas energias.' };
  }
  if (log10T < -9) {
    const tdS = deSitterTemperatureK(c);
    const note = 10 ** log10T < tdS
      ? `Abaixo da temperatura de Gibbons-Hawking do horizonte, ~${formatFromLog10(Math.log10(tdS), 1)} K, uma previsão teórica que nunca foi testada.`
      : undefined;
    return { value: `${formatFromLog10(log10T)} K`, note };
  }
  // 3 algarismos significativos: 2,73 K; 2.970 K; 1,00 bilhão K.
  return { value: formatTemperature(10 ** log10T, 3) };
}

/** Instante na escala da régua: posição de 0 a 1, uniforme em log₁₀ t. */
export const timeToPosition = (timeS: number) => Math.log10(timeS / COSMIC_TIME_MIN_S) / Math.log10(COSMIC_TIME_MAX_S / COSMIC_TIME_MIN_S);
export const positionToTime = (position: number) => COSMIC_TIME_MIN_S * (COSMIC_TIME_MAX_S / COSMIC_TIME_MIN_S) ** position;
