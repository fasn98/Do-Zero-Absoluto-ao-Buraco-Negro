import { MODULES, MODULE_TOTAL } from './temperatureBands';

export type TrackModule = {
  title: string;
  description: string;
  number: string;
  tag: string;
  /** Sem `path`, o módulo ainda não existe e aparece como "em breve". */
  path?: string;
};

export const TRACK2_MODULES: TrackModule[] = [
  { number: '2.1', title: 'A linha do tempo cósmica', description: 'Do primeiro segundo a 100 trilhões de anos: a equação de Friedmann conta a história do universo.', path: '/a-linha-do-tempo-cosmica', tag: 'COSMOLOGIA' },
  { number: '2.2', title: 'Os destinos possíveis', description: 'Expansão eterna, Big Rip ou Big Crunch: o desfecho depende da natureza da energia escura.', path: '/os-destinos-possiveis', tag: 'ENERGIA ESCURA' },
  { number: '2.3', title: 'Confronto com dados reais', description: 'Supernovas, oscilações acústicas e o fundo cósmico: quais cenários os dados reais ainda permitem.', path: '/confronto-com-dados-reais', tag: 'OBSERVAÇÕES' },
  { number: '2.4', title: 'Inflação e perturbações', description: 'A hipótese da inflação e as pequenas flutuações que viraram galáxias.', path: '/inflacao-e-perturbacoes', tag: 'UNIVERSO PRIMORDIAL' },
  { number: '2.5', title: 'A fronteira', description: 'O futuro mais distante, o piso de temperatura do universo e as perguntas que a física ainda não respondeu.', path: '/a-fronteira', tag: 'PERGUNTAS ABERTAS' },
];

export type Track = {
  id: '1' | '2';
  path: string;
  label: string;
  title: string;
  summary: string;
  modules: TrackModule[];
  /** Contador por trilha: "01 / 12" ou "2.1 / 2.5". */
  counter: (number: string) => string;
};

export const TRACKS: Track[] = [
  {
    id: '1',
    path: '/trilha-1',
    label: 'Trilha 1',
    title: 'Do zero absoluto ao buraco negro',
    summary: `${MODULES.length} módulos, das temperaturas extremas à unificação e à consciência.`,
    modules: MODULES,
    counter: (number) => `${number} / ${MODULE_TOTAL}`,
  },
  {
    id: '2',
    path: '/trilha-2',
    label: 'Trilha 2',
    title: 'Origem e destino do universo',
    summary: 'A história do cosmos, do primeiro instante ao futuro distante.',
    modules: TRACK2_MODULES,
    counter: (number) => `${number} / ${TRACK2_MODULES[TRACK2_MODULES.length - 1].number}`,
  },
];

/** Trilha de um módulo, pelo número ("07" → Trilha 1; "2.1" → Trilha 2). */
export function trackForModule(number: string): Track {
  return TRACKS.find((track) => track.modules.some((m) => m.number === number)) ?? TRACKS[0];
}

/** Trilha da página atual (página da trilha ou de um módulo dela); null na página inicial. */
export function trackForPath(path: string): Track | null {
  return TRACKS.find((track) => track.path === path || track.modules.some((m) => m.path === path)) ?? null;
}
