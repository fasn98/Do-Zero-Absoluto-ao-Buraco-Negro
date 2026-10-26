import type { ReactNode } from 'react';
import type { Reference } from '../ModulePage';
import type { EvidenceLevel } from '../shared';
import { H0_MEASUREMENTS } from '../../physics/hubble';
import { deSitterTemperatureK, planckScales } from '../../physics/frontier';
import { formatNumber, formatSci, formatTemperature } from '../../lib/format';

// Textos e fontes do Módulo 2.5. Números conferidos nas fontes citadas (26/10/2026).

/** Menor temperatura já produzida em laboratório (energia cinética efetiva de um condensado em expansão). */
export const LAB_RECORD = {
  kelvin: 38e-12,
  /** Como publicado (3/2 k_B · 38 pK). */
  label: '38 pK',
  short: '38 pK de energia cinética efetiva, num condensado de rubídio em queda livre (Deppner et al., 2021)',
};

/** Temperatura do condensado de 1995 citada no Módulo 1 (Anderson et al., Science 269, 198). */
export const BEC_1995_K = 170e-9;

type Hypothesis = { name: string; level: EvidenceLevel; text: ReactNode; test?: { possible: boolean; text: ReactNode } };

export type OpenQuestion = {
  id: string;
  short: string;
  title: string;
  measured: ReactNode;
  measuredSource: string;
  hypotheses: Hypothesis[];
  decide: ReactNode;
  links: { href: string; label: string }[];
};

const P = planckScales();
const h0 = (id: string) => H0_MEASUREMENTS.find((m) => m.id === id)!;
const h0Text = (id: string) => {
  const m = h0(id);
  return `${formatNumber(m.value, 2)} ± ${formatNumber(m.plus, 2)}`;
};

export const CARDS: OpenQuestion[] = [
  {
    id: 'planck',
    short: 'Era de Planck',
    title: 'O que aconteceu na era de Planck?',
    measured: <>Nada foi medido nessa escala. O que se conhece são as escalas em que a gravidade quântica deve importar, calculadas com G, ħ, c e k: comprimento de Planck {formatSci(P.lengthM, 3)} m, tempo de Planck {formatSci(P.timeS, 3)} s e temperatura de Planck {formatSci(P.temperatureK, 3)} K. A física testada em aceleradores chega a ~10⁻¹² s depois do Big Bang.</>,
    measuredSource: 'Constantes CODATA 2022; cálculo deste app.',
    hypotheses: [
      { name: 'Teoria de cordas', level: 'hipotese', text: 'Partículas como modos de vibração de cordas, em mais dimensões; inclui a gravidade de forma consistente (Green e Schwarz, 1984).', test: { possible: false, text: 'Nenhuma previsão própria ao alcance dos experimentos atuais.' } },
      { name: 'Gravidade quântica em laços', level: 'hipotese', text: 'O próprio espaço quantizado em "átomos" de área e volume; prevê ricochetes no lugar do Big Bang em alguns modelos (Rovelli, 2008).', test: { possible: false, text: 'Efeitos previstos pequenos demais para os instrumentos atuais.' } },
      { name: 'Segurança assintótica', level: 'hipotese', text: 'A gravidade de Einstein, tratada como teoria quântica, teria um ponto fixo em altas energias que a torna bem definida (Reuter, 1998).', test: { possible: false, text: 'Sem teste direto hoje.' } },
      { name: 'A gravidade é quântica?', level: 'hipotese', text: <>Antes de escolher uma teoria, dá para perguntar se a gravidade é quântica: duas massas em superposição que se emaranham só pela gravidade mostrariam que ela não é clássica (Bose et al.; Marletto e Vedral, 2017).</>, test: { possible: true, text: 'Em princípio, com massas de ~10⁻¹⁴ kg em superposição; os experimentos ainda estão longe disso (Módulo 7).' } },
    ],
    decide: <>Nenhuma teoria de gravidade quântica foi confirmada. O que está mais perto é o teste do emaranhamento gravitacional, ainda sem data. Ondas gravitacionais primordiais (o r do Módulo 2.4) diriam a escala de energia da inflação, mas não qual teoria vale no tempo de Planck.</>,
    links: [{ href: '/a-gravidade-guarda-informacao', label: 'Módulo 7, a gravidade guarda informação' }, { href: '/inflacao-e-perturbacoes', label: 'Módulo 2.4' }],
  },
  {
    id: 'materia-escura',
    short: 'Matéria escura',
    title: 'O que é a matéria escura?',
    measured: <>Os efeitos gravitacionais: estrelas que giram rápido demais nas bordas das galáxias (Rubin e Ford, 1970), a massa vista por lentes gravitacionais separada do gás no Aglomerado da Bala (Clowe et al., 2006) e os picos do fundo cósmico, que dão <b>Ω<sub>c</sub>h² = 0,120 ± 0,001</b>, cerca de cinco vezes a densidade de matéria comum (Planck 2018).</>,
    measuredSource: 'Rubin e Ford, ApJ 159, 379 (1970); Clowe et al., ApJ 648, L109 (2006); Planck 2018 VI, A&A 641, A6 (2020).',
    hypotheses: [
      { name: 'Algo além do Modelo Padrão', level: 'consenso', text: 'Nenhuma partícula conhecida tem as propriedades necessárias: que falta algo é consenso.' },
      { name: 'WIMPs', level: 'hipotese', text: 'Partículas pesadas que interagem fracamente.', test: { possible: true, text: 'detecção direta em xenônio líquido (LZ, XENONnT) e busca no LHC. Nenhum sinal até agora.' } },
      { name: 'Áxions', level: 'hipotese', text: 'Partículas muito leves, propostas também para outro problema da física de partículas.', test: { possible: true, text: 'cavidades de micro-ondas em campos magnéticos (ADMX) cobrem parte das massas possíveis.' } },
      { name: 'Buracos negros primordiais', level: 'hipotese', text: 'Buracos negros formados no universo primordial, antes das estrelas (Carr e Kühnel, 2020).', test: { possible: true, text: 'lentes gravitacionais, ondas gravitacionais e o fundo cósmico limitam as massas possíveis.' } },
      { name: 'Gravidade modificada (MOND)', level: 'hipotese', text: 'Em vez de matéria nova, a gravidade mudaria em acelerações muito pequenas (Milgrom, 1983).', test: { possible: true, text: 'aglomerados de galáxias e o fundo cósmico são difíceis de explicar sem matéria escura.' } },
    ],
    decide: <>A detecção direta ainda não viu nada: o LZ limita a interação de WIMPs com núcleos a menos de 2,2 × 10⁻⁴⁸ cm² para 40 GeV/c² (90% de confiança; Aalbers et al., 2025). Em 2026, o LZ viu neutrinos solares espalhando em núcleos de xenônio (4,5σ), o fundo que os próximos detectores terão de enfrentar; um evento isolado a 248 keV, com significância global de 2,6σ, está só em preprint e não é uma detecção. Próxima geração: o XLZD, ainda em projeto e sem local definido; o ADMX continua a busca de áxions.</>,
    links: [{ href: '/a-linha-do-tempo-cosmica', label: 'Módulo 2.1' }],
  },
  {
    id: 'antimateria',
    short: 'Matéria e antimatéria',
    title: 'Por que existe mais matéria que antimatéria?',
    measured: <>Para cada bilhão de fótons do fundo cósmico, sobram cerca de seis bárions: <b>η = (6,12 ± 0,04) × 10⁻¹⁰</b>, pelo fundo cósmico. A nucleossíntese, um método independente, dá (6,04 ± 0,12) × 10⁻¹⁰. Os dois concordam. Esse pequeno excesso de matéria sobre antimatéria é tudo o que restou da aniquilação no universo primordial.</>,
    measuredSource: 'Particle Data Group (2026), revisão "Big-Bang Nucleosynthesis" (Fields, Molaro e Sarkar), eqs. 24.5 e 24.8; Planck 2018 VI (2020).',
    hypotheses: [
      { name: 'Algo além do Modelo Padrão', level: 'consenso', text: <>Sakharov (1967) mostrou que gerar o excesso exige três condições: processos que violem o número bariônico, violação de C e CP, e saída do equilíbrio térmico. O Modelo Padrão tem as três em princípio, mas a violação de CP medida é pequena demais. Que falta física é consenso.</> },
      { name: 'Leptogênese', level: 'hipotese', text: 'Neutrinos pesados no universo primordial teriam criado um excesso de léptons, convertido em excesso de bárions.', test: { possible: true, text: 'Indireto: medir a violação de CP nos neutrinos (DUNE, Hyper-Kamiokande); não prova a leptogênese, mas pode descartá-la em parte.' } },
      { name: 'Bariogênese eletrofraca', level: 'hipotese', text: 'O excesso nasceria na transição eletrofraca, com física nova perto da escala do LHC.', test: { possible: true, text: 'momentos de dipolo elétrico do elétron e medidas do bóson de Higgs restringem esses modelos.' } },
    ],
    decide: 'A violação de CP nos neutrinos, com o Hyper-Kamiokande (início previsto para 2028) e o DUNE (em construção, sem data oficial para o início das medidas); medidas de precisão do momento de dipolo elétrico do elétron. A causa do excesso é desconhecida.',
    links: [{ href: '/as-forcas-convergem', label: 'Módulo 09, as forças convergem?' }],
  },
  {
    id: 'hubble',
    short: 'Tensão de Hubble',
    title: 'A tensão de Hubble',
    measured: <>H₀ em km/s/Mpc: {h0Text('planck')} pelo fundo cósmico com o ΛCDM (Planck), {h0Text('shoes')} com cefeidas e supernovas (SH0ES), {formatNumber(h0('cchp').value, 2)} ± {formatNumber(h0('cchp').plus, 2)} com gigantes vermelhas (CCHP) e {h0Text('h0dn')} pela rede de distâncias locais (H0DN, 2026). Os métodos locais e o fundo cósmico discordam a mais de 5σ; o CCHP fica entre os dois.</>,
    measuredSource: 'Planck 2018 VI (2020); Riess et al., ApJL 934, L7 (2022); Freedman et al., ApJ 985, 203 (2025); Casertano et al., A&A 708, A166 (2026).',
    hypotheses: [
      { name: 'Sistemáticas na escada de distâncias', level: 'hipotese', text: 'Erros ainda não identificados na calibração das cefeidas, das gigantes vermelhas ou das supernovas.', test: { possible: true, text: 'calibrações independentes com o JWST e métodos sem escada.' } },
      { name: 'Energia escura primordial', level: 'hipotese', text: 'Uma energia escura que atua só antes da recombinação encolheria o horizonte sonoro e aumentaria o H₀ inferido do fundo cósmico (Poulin et al., 2019).', test: { possible: true, text: 'o fundo cósmico em escalas pequenas (ACT, SPT, Simons Observatory) já restringe esses modelos.' } },
      { name: 'Outra física nova', level: 'hipotese', text: 'Dezenas de propostas, de neutrinos com interações novas a gravidade modificada; nenhuma resolve a tensão sem criar outras (Di Valentino et al., 2021).', test: { possible: true, text: 'Depende do modelo.' } },
    ],
    decide: <>Medidas independentes da escada de distâncias. As sirenes padrão medem H₀ sem calibração: GW170817 deu 70 (+12, −8); com centenas de eventos, o Einstein Telescope chegaria a ~0,3% em H₀ (Belgacem et al., 2019), o bastante para decidir a tensão.</>,
    links: [{ href: '/ouvindo-o-universo', label: 'Módulo 8, a tensão de Hubble' }, { href: '/confronto-com-dados-reais#sirenes', label: 'Módulo 2.3, sirenes gigantes' }, { href: '/a-linha-do-tempo-cosmica', label: 'Módulo 2.1' }],
  },
  {
    id: 'jwst',
    short: 'Galáxias cedo demais',
    title: 'Galáxias e buracos negros gigantes cedo demais',
    measured: <>O JWST confirmou por espectroscopia galáxias brilhantes em <b>z = 14,44</b> (MoM-z14, 280 milhões de anos depois do Big Bang; Naidu et al., 2026) e <b>z = 14,32</b> (Carniani et al., 2024), mais comuns do que se esperava. Buracos negros em crescimento foram vistos em GN-z11 (z = 10,6; Maiolino et al., 2024) e em UHZ1 (z = 10,07), este por raios X, com ~10⁷ a 10⁸ massas solares (Bogdán et al., 2024).</>,
    measuredSource: 'Naidu et al., Open J. Astrophys. 9 (2026); Carniani et al., Nature 633, 318 (2024); Maiolino et al., Nature 627, 59 (2024); Goulding et al., ApJL 955, L24 (2023); Bogdán et al., Nat. Astron. 8, 126 (2024).',
    hypotheses: [
      { name: 'Ainda candidatos', level: 'fato', text: <>As "galáxias massivas demais" de Labbé et al. (2023), em z ≈ 7 a 9, eram candidatas por fotometria. A espectroscopia mostrou que parte delas tem núcleos ativos que inflam a luz (Wang et al., 2024), e uma estava em z = 5,62, não em z ≈ 8 (Kocevski et al., 2023). As massas ficam incertas, de 10⁹ a 10¹¹ massas solares.</> },
      { name: 'Dentro do ΛCDM', level: 'hipotese', text: 'As galáxias formariam estrelas com mais eficiência no universo jovem, por exemplo em surtos sem retroalimentação (Dekel et al., 2023), ou de forma intermitente, parecendo mais brilhantes.', test: { possible: true, text: 'espectroscopia de mais galáxias e massas medidas por dinâmica.' } },
      { name: 'Fora do ΛCDM', level: 'hipotese', text: 'Se as massas mais altas se confirmarem, ficariam no limite do que o ΛCDM permite (Boylan-Kolchin, 2023); propostas incluem sementes de buracos negros primordiais ou mudanças na cosmologia.', test: { possible: true, text: 'as mesmas medidas, se confirmarem massas acima do limite.' } },
    ],
    decide: 'Espectroscopia de amostras maiores com o JWST e as massas estelares medidas sem contaminação dos núcleos ativos. O Roman, lançado em agosto de 2026, vai mapear áreas muito maiores do céu.',
    links: [{ href: '/a-linha-do-tempo-cosmica?marco=primeiras-estrelas', label: 'Módulo 2.1, as primeiras estrelas' }],
  },
  {
    id: 'comeco',
    short: 'Começo ou ricochete',
    title: 'O universo teve um começo, ou um ricochete?',
    measured: <>O universo foi muito mais quente e denso: o fundo cósmico e a nucleossíntese mostram isso até ~1 segundo depois do Big Bang. Antes disso não há observação direta, e a relatividade geral perde a validade perto da era de Planck.</>,
    measuredSource: 'Planck 2018 VI (2020); Módulo 2.1.',
    hypotheses: [
      { name: 'Inflação e um começo', level: 'hipotese', text: 'A inflação explica o universo plano e as flutuações (Módulo 2.4), mas não diz o que veio antes dela.', test: { possible: true, text: 'os modos B primordiais (r) e o índice nₛ testam modelos de inflação.' } },
      { name: 'Ricochetes', level: 'hipotese', text: 'Uma contração anterior que vira expansão, sem singularidade; exige violar condições de energia ou gravidade quântica (Brandenberger e Peter, 2017).', test: { possible: true, text: 'Em parte: a maioria prevê r muito pequeno; detectar modos B primordiais desfavoreceria vários deles.' } },
      { name: 'Cosmologia cíclica conforme', level: 'hipotese', text: <>Penrose propôs que o futuro diluído de um universo vira o Big Bang do próximo. Os círculos concêntricos alegados no fundo cósmico não resistiram a análises independentes (Wehus e Eriksen; Moss, Scott e Zibin; Hajian, 2011), e os "pontos de Hawking" de An et al. (2020) aparecem com só 87% de confiança, pouco mais de 1σ, quando o tamanho dos anéis é tratado corretamente (Jow e Scott, 2020).</>, test: { possible: true, text: 'Até agora, sem evidência estatisticamente significativa.' } },
    ],
    decide: 'Os modos B primordiais (LiteBIRD, lançamento previsto para o ano fiscal japonês de 2036; Simons Observatory, já em operação) e, a longo prazo, uma teoria de gravidade quântica testada.',
    links: [{ href: '/os-destinos-possiveis', label: 'Módulo 2.2, ciclos e ricochetes' }, { href: '/inflacao-e-perturbacoes', label: 'Módulo 2.4, inflação' }],
  },
  {
    id: 'multiverso',
    short: 'Multiverso',
    title: 'Existe um multiverso?',
    measured: 'Nada. Não há observação de outro universo.',
    measuredSource: '',
    hypotheses: [
      { name: 'Inflação eterna', level: 'hipotese', text: 'Em muitos modelos, a inflação nunca termina em toda parte e produz infinitos "universos-bolha" (Linde, 1986; Guth, 2007). O próprio Guth escreve que esses universos-bolha "são inobserváveis".', test: { possible: false, text: 'A proposta mais concreta é procurar marcas de colisões entre bolhas no fundo cósmico: os dados do WMAP não mostraram nenhuma, limitando a menos de 1,6 colisões detectáveis no céu inteiro (68%; Feeney et al., 2011) e a menos de 4 (95%; Feeney et al., 2013). Não ver colisões não descarta o multiverso.' } },
      { name: 'Paisagem da teoria de cordas', level: 'hipotese', text: 'A teoria de cordas admitiria um número enorme de vácuos, com valores diferentes de Λ (Bousso e Polchinski, 2000); o nosso valor seria um entre muitos.', test: { possible: false, text: 'Nenhum proposto que seja aceito.' } },
    ],
    decide: 'Nenhum experimento planejado decide a questão. Ellis e Silk (2014) argumentam que isentar teorias especulativas do universo de verificação experimental enfraquece a ciência. Este módulo trata o multiverso como hipótese sem teste aceito.',
    links: [{ href: '/inflacao-e-perturbacoes', label: 'Módulo 2.4' }, { href: '/pior-previsao', label: 'Módulo 11, a pior previsão' }],
  },
];

export const TRACK_SUMMARY: { number: string; href: string; text: ReactNode }[] = [
  { number: '2.1', href: '/a-linha-do-tempo-cosmica', text: 'A equação de Friedmann, com os parâmetros do Planck, dá 13,8 bilhões de anos para a idade do universo, compatível com as estrelas mais velhas, datadas de forma independente. A história térmica testada vai até ~1 segundo; antes disso, é extrapolação.' },
  { number: '2.2', href: '/os-destinos-possiveis', text: 'O destino depende da energia escura. Um Λ negativo puro, que levaria à recontração, está descartado: daria ao universo uma idade menor que a das estrelas mais velhas.' },
  { number: '2.3', href: '/confronto-com-dados-reais', text: 'Com dados reais do DESI, do Planck e do Union3, a energia escura que muda com o tempo é preferida a ~3σ, mas não confirmada. Sirenes do Einstein Telescope poderiam levar a decisão a 5σ; as do LISA, não.' },
  { number: '2.4', href: '/inflacao-e-perturbacoes', text: 'A inflação explica o universo plano e as flutuações, mas não foi confirmada. O modelo mais simples, V ∝ φ², está descartado pelo limite de r < 0,034; o de Starobinsky continua permitido.' },
  { number: '2.5', href: '/a-fronteira', text: <>Com Λ constante, o universo nunca chega ao zero absoluto: o horizonte cosmológico mantém um piso de {formatTemperature(deSitterTemperatureK())}. É uma previsão sem teste possível hoje, e as perguntas em aberto ficam marcadas como tal.</> },
];

export const LIMITATIONS: ReactNode[] = [
  'A linha do tempo do futuro supõe Λ constante; com energia escura dinâmica, ela muda ou deixa de valer (Módulo 2.2).',
  'Tempos de evaporação na aproximação de corpo negro, só com fótons, sem emissões de partículas massivas nem acreção. A acreção de matéria e de radiação atrasaria o início da evaporação; aqui conta só o fundo cósmico.',
  'A temperatura do fundo cósmico segue T ∝ 1/a, com o resolvedor de Friedmann do Módulo 2.1 (Planck 2018, universo plano). No futuro distante, a expansão é exponencial e a matéria é desprezível.',
  'Os marcos do fim das estrelas são estimativas de ordem de grandeza de Adams e Laughlin (1997).',
  'Os cartões resumem debates em aberto; as fontes citadas trazem o detalhe.',
];

export const REFERENCES: Reference[] = [
  { text: 'F. C. Adams e G. Laughlin, "A dying universe: the long-term fate and evolution of astrophysical objects", Reviews of Modern Physics 69, 337 (1997).', url: 'https://doi.org/10.1103/RevModPhys.69.337' },
  { text: 'A. Takenaka et al. (Super-Kamiokande), "Search for proton decay via p → e⁺π⁰ and p → μ⁺π⁰ with an enlarged fiducial volume in Super-Kamiokande I–IV", Physical Review D 102, 112011 (2020).', url: 'https://doi.org/10.1103/PhysRevD.102.112011' },
  { text: 'S. W. Hawking, "Black hole explosions?", Nature 248, 30 (1974).', url: 'https://doi.org/10.1038/248030a0' },
  { text: 'G. W. Gibbons e S. W. Hawking, "Cosmological event horizons, thermodynamics, and particle creation", Physical Review D 15, 2738 (1977).', url: 'https://doi.org/10.1103/PhysRevD.15.2738' },
  { text: 'C. Deppner et al., "Collective-Mode Enhanced Matter-Wave Optics", Physical Review Letters 127, 100401 (2021).', url: 'https://doi.org/10.1103/PhysRevLett.127.100401' },
  { text: 'M. H. Anderson et al., "Observation of Bose-Einstein Condensation in a Dilute Atomic Vapor", Science 269, 198 (1995).', url: 'https://doi.org/10.1126/science.269.5221.198' },
  { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
  { text: 'S. Bose et al., "Spin Entanglement Witness for Quantum Gravity", Physical Review Letters 119, 240401 (2017).', url: 'https://doi.org/10.1103/PhysRevLett.119.240401' },
  { text: 'C. Marletto e V. Vedral, "Gravitationally Induced Entanglement between Two Massive Particles is Sufficient Evidence of Quantum Effects in Gravity", Physical Review Letters 119, 240402 (2017).', url: 'https://doi.org/10.1103/PhysRevLett.119.240402' },
  { text: 'M. B. Green e J. H. Schwarz, "Anomaly cancellations in supersymmetric D = 10 gauge theory and superstring theory", Physics Letters B 149, 117 (1984).', url: 'https://doi.org/10.1016/0370-2693(84)91565-X' },
  { text: 'C. Rovelli, "Loop Quantum Gravity", Living Reviews in Relativity 11, 5 (2008).', url: 'https://doi.org/10.12942/lrr-2008-5' },
  { text: 'M. Reuter, "Nonperturbative evolution equation for quantum gravity", Physical Review D 57, 971 (1998).', url: 'https://doi.org/10.1103/PhysRevD.57.971' },
  { text: 'V. C. Rubin e W. K. Ford, "Rotation of the Andromeda Nebula from a Spectroscopic Survey of Emission Regions", The Astrophysical Journal 159, 379 (1970).', url: 'https://doi.org/10.1086/150317' },
  { text: 'D. Clowe et al., "A Direct Empirical Proof of the Existence of Dark Matter", The Astrophysical Journal 648, L109 (2006).', url: 'https://doi.org/10.1086/508162' },
  { text: 'M. Milgrom, "A modification of the Newtonian dynamics as a possible alternative to the hidden mass hypothesis", The Astrophysical Journal 270, 365 (1983).', url: 'https://doi.org/10.1086/161130' },
  { text: 'B. Carr e F. Kühnel, "Primordial Black Holes as Dark Matter: Recent Developments", Annual Review of Nuclear and Particle Science 70, 355 (2020).', url: 'https://doi.org/10.1146/annurev-nucl-050520-125911' },
  { text: 'J. Aalbers et al. (LZ), "Dark Matter Search Results from 4.2 Tonne-Years of Exposure of the LUX-ZEPLIN (LZ) Experiment", Physical Review Letters 135, 011802 (2025).', url: 'https://doi.org/10.1103/4dyc-z8zf' },
  { text: 'D. S. Akerib et al. (LZ), "Searches for Light Dark Matter and Evidence of Coherent Elastic Neutrino-Nucleus Scattering of Solar Neutrinos with the LUX-ZEPLIN (LZ) Experiment", Physical Review Letters 137, 091806 (2026).', url: 'https://doi.org/10.1103/jvqf-njpj' },
  { text: 'G. Carosi et al. (ADMX), "Search for Axion Dark Matter from 1.1 to 1.3 GHz with ADMX", Physical Review Letters 135, 191001 (2025).', url: 'https://doi.org/10.1103/d7mg-6sqq' },
  { text: 'Particle Data Group (F. Takahashi et al.), "Review of Particle Physics", International Journal of Modern Physics A 41, 2630011 (2026); revisão "Big-Bang Nucleosynthesis", de B. D. Fields, P. Molaro e S. Sarkar.', url: 'https://doi.org/10.1142/S0217751X26300115' },
  { text: 'A. D. Sakharov, "Violation of CP invariance, C asymmetry, and baryon asymmetry of the universe", JETP Letters 5, 24 (1967); reimpresso em Soviet Physics Uspekhi 34, 392 (1991).', url: 'https://doi.org/10.1070/PU1991v034n05ABEH002497' },
  { text: 'A. G. Riess et al., "A Comprehensive Measurement of the Local Value of the Hubble Constant with 1 km s⁻¹ Mpc⁻¹ Uncertainty from the Hubble Space Telescope and the SH0ES Team", The Astrophysical Journal Letters 934, L7 (2022).', url: 'https://doi.org/10.3847/2041-8213/ac5c5b' },
  { text: 'W. L. Freedman et al., "Status Report on the Chicago-Carnegie Hubble Program (CCHP)", The Astrophysical Journal 985, 203 (2025).', url: 'https://doi.org/10.3847/1538-4357/adce78' },
  { text: 'H0DN Collaboration (S. Casertano et al.), "The Local Distance Network: A community consensus report on the measurement of the Hubble constant at 1% precision", Astronomy & Astrophysics 708, A166 (2026).', url: 'https://doi.org/10.1051/0004-6361/202557993' },
  { text: 'B. P. Abbott et al. (LIGO e Virgo), "A gravitational-wave standard siren measurement of the Hubble constant", Nature 551, 85 (2017).', url: 'https://doi.org/10.1038/nature24471' },
  { text: 'V. Poulin, T. L. Smith, T. Karwal e M. Kamionkowski, "Early Dark Energy Can Resolve the Hubble Tension", Physical Review Letters 122, 221301 (2019).', url: 'https://doi.org/10.1103/PhysRevLett.122.221301' },
  { text: 'E. Di Valentino et al., "In the realm of the Hubble tension—a review of solutions", Classical and Quantum Gravity 38, 153001 (2021).', url: 'https://doi.org/10.1088/1361-6382/ac086d' },
  { text: 'E. Belgacem et al., "Cosmology and dark energy from joint gravitational wave-GRB observations", Journal of Cosmology and Astroparticle Physics 08, 015 (2019).', url: 'https://doi.org/10.1088/1475-7516/2019/08/015' },
  { text: 'R. P. Naidu et al., "A Cosmic Miracle: A Remarkably Luminous Galaxy at z_spec = 14.44 Confirmed with JWST", The Open Journal of Astrophysics 9 (2026).', url: 'https://doi.org/10.33232/001c.156033' },
  { text: 'S. Carniani et al., "Spectroscopic confirmation of two luminous galaxies at a redshift of 14", Nature 633, 318 (2024).', url: 'https://doi.org/10.1038/s41586-024-07860-9' },
  { text: 'I. Labbé et al., "A population of red candidate massive galaxies ~600 Myr after the Big Bang", Nature 616, 266 (2023).', url: 'https://doi.org/10.1038/s41586-023-05786-2' },
  { text: 'B. Wang et al., "RUBIES: Evolved Stellar Populations with Extended Formation Histories at z ∼ 7–8 in Candidate Massive Galaxies Identified with JWST/NIRSpec", The Astrophysical Journal Letters 969, L13 (2024).', url: 'https://doi.org/10.3847/2041-8213/ad55f7' },
  { text: 'D. D. Kocevski et al., "Hidden Little Monsters: Spectroscopic Identification of Low-mass, Broad-line AGNs at z > 5 with CEERS", The Astrophysical Journal Letters 954, L4 (2023).', url: 'https://doi.org/10.3847/2041-8213/ace5a0' },
  { text: 'R. Maiolino et al., "A small and vigorous black hole in the early Universe", Nature 627, 59 (2024).', url: 'https://doi.org/10.1038/s41586-024-07052-5' },
  { text: 'A. D. Goulding et al., "UNCOVER: The Growth of the First Massive Black Holes from JWST/NIRSpec—Spectroscopic Redshift Confirmation of an X-Ray Luminous AGN at z = 10.1", The Astrophysical Journal Letters 955, L24 (2023).', url: 'https://doi.org/10.3847/2041-8213/acf7c5' },
  { text: 'Á. Bogdán et al., "Evidence for heavy-seed origin of early supermassive black holes from a z ≈ 10 X-ray quasar", Nature Astronomy 8, 126 (2024).', url: 'https://doi.org/10.1038/s41550-023-02111-9' },
  { text: 'M. Boylan-Kolchin, "Stress testing ΛCDM with high-redshift galaxy candidates", Nature Astronomy 7, 731 (2023).', url: 'https://doi.org/10.1038/s41550-023-01937-7' },
  { text: 'A. Dekel et al., "Efficient formation of massive galaxies at cosmic dawn by feedback-free starbursts", Monthly Notices of the Royal Astronomical Society 523, 3201 (2023).', url: 'https://doi.org/10.1093/mnras/stad1557' },
  { text: 'R. Brandenberger e P. Peter, "Bouncing Cosmologies: Progress and Problems", Foundations of Physics 47, 797 (2017).', url: 'https://doi.org/10.1007/s10701-016-0057-0' },
  { text: 'D. An, K. A. Meissner, P. Nurowski e R. Penrose, "Apparent evidence for Hawking points in the CMB Sky", Monthly Notices of the Royal Astronomical Society 495, 3403 (2020).', url: 'https://doi.org/10.1093/mnras/staa1343' },
  { text: 'D. L. Jow e D. Scott, "Re-evaluating evidence for Hawking points in the CMB", Journal of Cosmology and Astroparticle Physics 03, 021 (2020).', url: 'https://doi.org/10.1088/1475-7516/2020/03/021' },
  { text: 'V. G. Gurzadyan e R. Penrose, "On CCC-predicted concentric low-variance circles in the CMB sky", The European Physical Journal Plus 128, 22 (2013).', url: 'https://doi.org/10.1140/epjp/i2013-13022-4' },
  { text: 'I. K. Wehus e H. K. Eriksen, "A Search for Concentric Circles in the 7 Year Wilkinson Microwave Anisotropy Probe Temperature Sky Maps", The Astrophysical Journal Letters 733, L29 (2011).', url: 'https://doi.org/10.1088/2041-8205/733/2/L29' },
  { text: 'A. Moss, D. Scott e J. P. Zibin, "No evidence for anomalously low variance circles on the sky", Journal of Cosmology and Astroparticle Physics 04, 033 (2011).', url: 'https://doi.org/10.1088/1475-7516/2011/04/033' },
  { text: 'A. Hajian, "Are There Echoes from the Pre-Big Bang Universe? A Search for Low Variance Circles in the CMB Sky", The Astrophysical Journal 740, 52 (2011).', url: 'https://doi.org/10.1088/0004-637X/740/2/52' },
  { text: 'A. D. Linde, "Eternally existing self-reproducing chaotic inflationary universe", Physics Letters B 175, 395 (1986).', url: 'https://doi.org/10.1016/0370-2693(86)90611-8' },
  { text: 'A. H. Guth, "Eternal inflation and its implications", Journal of Physics A 40, 6811 (2007).', url: 'https://doi.org/10.1088/1751-8113/40/25/S25' },
  { text: 'R. Bousso e J. Polchinski, "Quantization of four-form fluxes and dynamical neutralization of the cosmological constant", Journal of High Energy Physics 06, 006 (2000).', url: 'https://doi.org/10.1088/1126-6708/2000/06/006' },
  { text: 'S. M. Feeney, M. C. Johnson, D. J. Mortlock e H. V. Peiris, "First Observational Tests of Eternal Inflation", Physical Review Letters 107, 071301 (2011).', url: 'https://doi.org/10.1103/PhysRevLett.107.071301' },
  { text: 'S. M. Feeney et al., "Hierarchical Bayesian detection algorithm for early-universe relics in the cosmic microwave background", Physical Review D 88, 043012 (2013).', url: 'https://doi.org/10.1103/PhysRevD.88.043012' },
  { text: 'G. Ellis e J. Silk, "Scientific method: Defend the integrity of physics", Nature 516, 321 (2014).', url: 'https://doi.org/10.1038/516321a' },
  { text: 'Universidade de Tóquio, sobre o início das operações do Hyper-Kamiokande (25/7/2025, consultada em 26/10/2026).', url: 'https://www.u-tokyo.ac.jp/focus/en/articles/z0208_00226.html' },
  { text: 'NASA, lançamento do Nancy Grace Roman Space Telescope (30/8/2026).', url: 'https://science.nasa.gov/blogs/roman/2026/08/30/nasas-roman-space-telescope-launches/' },
];
