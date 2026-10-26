import type { ReactNode } from 'react';
import type { Reference } from '../ModulePage';
import type { EvidenceLevel } from '../shared';

// Números e fontes do Módulo 12. Cada valor foi conferido no artigo citado (texto completo ou resumo).

export type DecoherenceId = 'tegmark-neuronio' | 'tegmark-microtubulo' | 'hagan' | 'hagan-agua';

/** Tempos de decoerência estimados, exatamente como nos artigos. */
export const DECOHERENCE_ESTIMATES: { id: DecoherenceId; short: string; button: string; range: [number, number]; source: string }[] = [
  { id: 'tegmark-neuronio', short: 'Tegmark: neurônio dispara/não dispara', button: 'Tegmark: neurônio', range: [1e-20, 1e-19], source: 'Tegmark (2000), Tabela 1: 10⁻²⁰ s (colisões com íons e água) a 10⁻¹⁹ s (íon próximo)' },
  { id: 'tegmark-microtubulo', short: 'Tegmark: excitação em microtúbulo', button: 'Tegmark: microtúbulo', range: [1e-13, 1e-13], source: 'Tegmark (2000), Tabela 1: 10⁻¹³ s (íon distante)' },
  { id: 'hagan', short: 'Hagan et al.: premissas corrigidas', button: 'Hagan et al.', range: [1e-5, 1e-4], source: 'Hagan, Hameroff e Tuszynski (2002): 10⁻⁵ a 10⁻⁴ s, com a separação, o dipolo e a constante dielétrica do Orch-OR' },
  { id: 'hagan-agua', short: 'Hagan et al.: com água ordenada', button: 'Hagan et al., água ordenada', range: [1e-2, 1e-1], source: 'Hagan, Hameroff e Tuszynski (2002): 10⁻² a 10⁻¹ s, com a água ordenada e o gel de actina em volta dos microtúbulos' },
];

/** Tempos medidos da atividade neural (fatos estabelecidos). */
export const NEURAL_TIMES: { id: string; short: string; range: [number, number]; source: string }[] = [
  { id: 'sinapse', short: 'Transmissão sináptica rápida', range: [1.5e-4, 1.5e-4], source: 'Sabatini e Regehr (1996): resposta pós-sináptica 150 µs após o início do potencial de ação, a temperatura fisiológica' },
  { id: 'potencial', short: 'Potencial de ação (meia-largura)', range: [2.3e-4, 1.21e-3], source: 'Carter e Bean (2009), a 37 °C: 0,23 ms (Purkinje) a 1,21 ms (piramidais do córtex)' },
  { id: 'gama', short: 'Ciclo do ritmo gama (30 a 90 Hz)', range: [1 / 90, 1 / 30], source: 'Buzsáki e Wang (2012): banda de 30 a 90 Hz, também chamada de oscilação de 40 Hz (25 ms por ciclo)' },
  { id: 'percepcao', short: 'Acesso consciente a um estímulo', range: [0.27, 0.27], source: 'Sergent, Baillet e Dehaene (2005): a atividade de palavras vistas e não vistas diverge por volta de 270 ms' },
];

/** Faixa sombreada da escala neural: da transmissão sináptica à percepção consciente. */
export const NEURAL_BAND: [number, number] = [1.5e-4, 0.3];

type Reading = { id: string; level: EvidenceLevel; title: string; text: ReactNode; notShown?: ReactNode; source: string };

export const READINGS: Reading[] = [
  {
    id: 'gran-sasso', level: 'fato', title: 'Gran Sasso exclui a versão mais simples do colapso',
    text: 'Donadi e colegas procuraram, num detector de germânio no subsolo, a radiação fraca que o colapso de Diósi-Penrose produziria. Não a encontraram, o que exige R₀ > 0,54 × 10⁻¹⁰ m (com 95% de confiança) e exclui a versão sem parâmetros livres, em que R₀ seria ~0,05 × 10⁻¹⁰ m. Derakhshani e colegas levaram esse limite ao Orch-OR: com a separação no nível dos núcleos atômicos, seriam necessárias ~4 × 10²³ tubulinas para um evento de 25 ms, mais que as ~10²⁰ do cérebro inteiro. Concluem que o Orch-OR baseado na versão mais simples do colapso gravitacional é "altamente implausível" em todos os casos analisados.',
    notShown: 'Não refuta o Orch-OR em geral. Com a separação no nível da proteína inteira, seriam necessárias ~10¹² tubulinas, o que não está excluído, embora exija manter coerentes ~10⁻¹⁶ kg por 25 ms, muito além de qualquer superposição já feita em laboratório. Modelos de colapso mais elaborados (que conservam energia, ou do tipo CSL e GRW) não foram testados assim.',
    source: 'Donadi et al., Nature Physics 17, 74 (2021); Derakhshani et al., Physics of Life Reviews 42, 8 (2022); McQueen, Physics of Life Reviews 44, 201 (2023).',
  },
  {
    id: 'anestesicos', level: 'hipotese', title: 'Um estabilizador de microtúbulos atrasa a anestesia em ratos',
    text: 'Ratos tratados com epotilona B, uma droga que estabiliza microtúbulos, levaram em média 69 s a mais para perder a consciência sob isoflurano (8 ratos, p = 0,0016). Os autores dizem que o resultado era previsto por modelos em que a consciência depende de um estado quântico nos microtúbulos.',
    notShown: 'Não mostra nenhum efeito quântico. Os próprios autores apresentam uma explicação clássica: anestésicos ligados aos microtúbulos atrapalhariam o transporte dentro do neurônio e, com ele, a transmissão sináptica. Só ratos machos foram usados, e parte do atraso pode vir de tolerância ao anestésico (até ~40 s, na estimativa mais conservadora dos autores).',
    source: 'Khan et al., eNeuro 11, ENEURO.0291-24.2024 (2024).',
  },
  {
    id: 'superradiancia', level: 'hipotese', title: 'Superradiância em redes de triptofano',
    text: 'Em microtúbulos montados em laboratório, a fluorescência ultravioleta do aminoácido triptofano é mais eficiente que na tubulina isolada (rendimento quântico de ~16 a 20%, contra ~11%), como se espera de superradiância: muitas moléculas emitindo de forma coletiva, um efeito quântico.',
    notShown: 'Não diz nada sobre consciência nem sobre cognição: as palavras não aparecem no artigo. A medida foi feita in vitro, com proteína purificada, e não em neurônios vivos. Os autores lembram as dificuldades de manter coerência quântica óptica à temperatura ambiente.',
    source: 'Babcock et al., Journal of Physical Chemistry B 128, 4035 (2024).',
  },
  {
    id: 'cogitate', level: 'consenso', title: 'O grande teste de 2025: nenhuma teoria saiu intacta',
    text: 'O consórcio Cogitate pôs à prova, com regras combinadas de antemão, duas das teorias mais estudadas: a da informação integrada (IIT) e a do espaço de trabalho global (GNWT). Foram 256 participantes, com fMRI, MEG e eletrodos intracranianos, em oito centros. Os resultados confirmaram algumas previsões de cada teoria e contrariaram pontos centrais das duas. A origem da consciência continua uma questão em aberto.',
    notShown: 'Não testou o Orch-OR, e não elegeu uma teoria vencedora. Os autores da GNWT publicaram uma resposta contestando parte das conclusões.',
    source: 'Cogitate Consortium (Ferrante et al.), Nature 642, 133 (2025).',
  },
];

export const MYTHS: { kind: string; title: string; level?: EvidenceLevel; text: ReactNode; source: string }[] = [
  { kind: 'Fato', title: 'As células são pequenas baterias', level: 'fato', text: 'Quase toda célula mantém uma diferença de potencial entre o interior e o exterior, com o interior negativo: num neurônio, cerca de −70 a −80 mV em repouso, perto do potencial de equilíbrio do potássio (−90 mV). Células diferenciadas, como neurônios e músculo, são mais negativas; células que se dividem depressa, como as de tumores, são menos.', source: 'Chrysafides, Bordes e Sharma, StatPearls, NBK538338 (2023); Yang e Brackenbury, Frontiers in Physiology 4, 185 (2013).' },
  { kind: 'Fato', title: 'O cérebro é caro', level: 'fato', text: 'Tem ~2% da massa do corpo e consome ~20% do oxigênio e das calorias em repouso: por quilograma, gasta dez vezes mais que a média.', source: 'Raichle e Gusnard, PNAS 99, 10237 (2002).' },
  { kind: 'Mito', title: '"Usamos só 10% do cérebro"', text: 'Falso. Um órgão que gasta um quinto da energia do corpo não fica 90% ocioso, e os exames de imagem mostram atividade em todas as regiões ao longo do dia. A frase é classificada como "neuromito" e é o mais difundido deles: quase metade dos professores pesquisados no Reino Unido e na Holanda acreditava nela.', source: 'Dekker et al., Frontiers in Psychology 3, 429 (2012); Raichle e Gusnard (2002).' },
  { kind: 'Pesquisa real', title: 'Bioeletricidade e formação de tumores', level: 'hipotese', text: 'Em embriões de rã, estruturas parecidas com tumores induzidas por oncogenes aparecem com a membrana despolarizada antes de serem visíveis, e forçar a voltagem de volta ao normal reduziu sua formação. É o programa de pesquisa de Michael Levin (Tufts). Aplicações em pessoas ainda são hipótese.', source: 'Chernet e Levin, Disease Models & Mechanisms 6, 595 (2013).' },
  { kind: 'Fato', title: 'Campos elétricos contra o glioblastoma', level: 'fato', text: 'Campos elétricos alternados de 200 kHz aplicados por eletrodos na cabeça (Tumor Treating Fields) atrapalham a divisão das células do tumor. Aprovados pela FDA em 2011 (recorrência) e 2015 (diagnóstico novo, com temozolomida): num ensaio com 695 pacientes, a sobrevida mediana passou de 16,0 para 20,9 meses. O mecanismo é físico, externo, e não depende da mente.', source: 'Stupp et al., JAMA 318, 2306 (2017); FDA, PMA P100034 e P100034/S013.' },
  { kind: 'Sem evidência', title: 'Controlar com a mente a energia das células para curar doenças', text: 'Não há evidência de que alguém consiga controlar conscientemente a energia ou a voltagem das próprias células para curar uma doença. Uma revisão de centenas de ensaios clínicos concluiu que o placebo não tem efeitos clínicos importantes em geral; ele pode melhorar sintomas relatados pelo paciente, como dor e náusea. Não há evidência de que encolha tumores. Nenhum tratamento deve ser trocado por práticas sem evidência.', source: 'Hróbjartsson e Gøtzsche, Cochrane Database of Systematic Reviews CD003974 (2010).' },
];

export const REFERENCES: Reference[] = [
  { text: 'M. Tegmark, "Importance of quantum decoherence in brain processes", Physical Review E 61, 4194 (2000).', url: 'https://doi.org/10.1103/PhysRevE.61.4194' },
  { text: 'S. Hagan, S. R. Hameroff e J. A. Tuszyński, "Quantum computation in brain microtubules: Decoherence and biological feasibility", Physical Review E 65, 061901 (2002).', url: 'https://doi.org/10.1103/PhysRevE.65.061901' },
  { text: 'S. Hameroff e R. Penrose, "Consciousness in the universe: A review of the \'Orch OR\' theory", Physics of Life Reviews 11, 39 (2014).', url: 'https://doi.org/10.1016/j.plrev.2013.08.002' },
  { text: 'S. Donadi et al., "Underground test of gravity-related wave function collapse", Nature Physics 17, 74 (2021).', url: 'https://doi.org/10.1038/s41567-020-1008-4' },
  { text: 'M. Derakhshani, L. Diósi, M. Laubenstein, K. Piscicchia e C. Curceanu, "At the crossroad of the search for spontaneous radiation and the Orch OR consciousness theory", Physics of Life Reviews 42, 8 (2022).', url: 'https://doi.org/10.1016/j.plrev.2022.05.004' },
  { text: 'K. J. McQueen, comentário sobre Derakhshani et al., Physics of Life Reviews 44, 201 (2023).', url: 'https://doi.org/10.1016/j.plrev.2023.01.021' },
  { text: 'S. Khan et al., "Microtubule-Stabilizer Epothilone B Delays Anesthetic-Induced Unconsciousness in Rats", eNeuro 11, ENEURO.0291-24.2024 (2024).', url: 'https://doi.org/10.1523/ENEURO.0291-24.2024' },
  { text: 'N. S. Babcock et al., "Ultraviolet Superradiance from Mega-Networks of Tryptophan in Biological Architectures", Journal of Physical Chemistry B 128, 4035 (2024).', url: 'https://doi.org/10.1021/acs.jpcb.3c07936' },
  { text: 'Cogitate Consortium (O. Ferrante et al.), "Adversarial testing of global neuronal workspace and integrated information theories of consciousness", Nature 642, 133 (2025).', url: 'https://doi.org/10.1038/s41586-025-08888-1' },
  { text: 'B. L. Sabatini e W. G. Regehr, "Timing of neurotransmission at fast synapses in the mammalian brain", Nature 384, 170 (1996).', url: 'https://doi.org/10.1038/384170a0' },
  { text: 'B. C. Carter e B. P. Bean, "Sodium Entry during Action Potentials of Mammalian Neurons", Neuron 64, 898 (2009).', url: 'https://doi.org/10.1016/j.neuron.2009.12.011' },
  { text: 'G. Buzsáki e X.-J. Wang, "Mechanisms of Gamma Oscillations", Annual Review of Neuroscience 35, 203 (2012).', url: 'https://doi.org/10.1146/annurev-neuro-062111-150444' },
  { text: 'C. Sergent, S. Baillet e S. Dehaene, "Timing of the brain events underlying access to consciousness during the attentional blink", Nature Neuroscience 8, 1391 (2005).', url: 'https://doi.org/10.1038/nn1549' },
  { text: 'UniProt Consortium, UniProtKB Q71U36 (TUBA1A, tubulina α-1A humana, 50.136 Da).', url: 'https://www.uniprot.org/uniprotkb/Q71U36/entry' },
  { text: 'UniProt Consortium, UniProtKB P07437 (TUBB, tubulina β humana, 49.671 Da).', url: 'https://www.uniprot.org/uniprotkb/P07437/entry' },
  { text: 'H. Fischer, I. Polikarpov e A. F. Craievich, "Average protein density is a molecular-weight-dependent function", Protein Science 13, 2825 (2004).', url: 'https://doi.org/10.1110/ps.04688204' },
  { text: 'E. Bianconi et al., "An estimation of the number of cells in the human body", Annals of Human Biology 40, 463 (2013).', url: 'https://doi.org/10.3109/03014460.2013.807878' },
  { text: 'R. G. McMurray et al., "Examining Variations of Resting Metabolic Rate of Adults", Medicine & Science in Sports & Exercise 46, 1352 (2014).', url: 'https://doi.org/10.1249/MSS.0000000000000232' },
  { text: 'M. E. Raichle e D. A. Gusnard, "Appraising the brain\'s energy budget", PNAS 99, 10237 (2002).', url: 'https://doi.org/10.1073/pnas.172399499' },
  { text: 'S. M. Chrysafides, S. J. Bordes e S. Sharma, "Physiology, Resting Potential", StatPearls (NCBI Bookshelf NBK538338), atualizado em 10/04/2023.', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538338/' },
  { text: 'M. Yang e W. J. Brackenbury, "Membrane potential and cancer progression", Frontiers in Physiology 4, 185 (2013).', url: 'https://doi.org/10.3389/fphys.2013.00185' },
  { text: 'S. Dekker, N. C. Lee, P. Howard-Jones e J. Jolles, "Neuromyths in Education: Prevalence and Predictors of Misconceptions among Teachers", Frontiers in Psychology 3, 429 (2012).', url: 'https://doi.org/10.3389/fpsyg.2012.00429' },
  { text: 'B. T. Chernet e M. Levin, "Transmembrane voltage potential is an essential cellular parameter for the detection and control of tumor development in a Xenopus model", Disease Models & Mechanisms 6, 595 (2013).', url: 'https://doi.org/10.1242/dmm.010835' },
  { text: 'A. Hróbjartsson e P. C. Gøtzsche, "Placebo interventions for all clinical conditions", Cochrane Database of Systematic Reviews, CD003974 (2010).', url: 'https://doi.org/10.1002/14651858.CD003974.pub3' },
  { text: 'R. Stupp et al., "Effect of Tumor-Treating Fields Plus Maintenance Temozolomide vs Maintenance Temozolomide Alone on Survival in Patients With Glioblastoma", JAMA 318, 2306 (2017).', url: 'https://doi.org/10.1001/jama.2017.18718' },
];
