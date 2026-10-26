import type { ReactNode } from 'react';
import type { Reference } from '../ModulePage';
import type { EvidenceLevel } from '../shared';

// Textos e fontes do Módulo 2.4. Números observacionais conferidos nas fontes citadas (26/10/2026).

/** Descrição do limite de r usado no plano nₛ × r. */
export const R_LIMIT_NOTE = 'r < 0,034 a 95% (Planck, SPT, ACT e BICEP/Keck; Balkenhol et al., 2026), com k = 0,05 Mpc⁻¹; o resultado oficial do BICEP/Keck é r < 0,036 (2021)';

type Reading = { id: string; level?: EvidenceLevel; title: string; text: ReactNode; source?: string };

export const READINGS: Reading[] = [
  {
    id: 'ondas', level: 'hipotese', title: 'Ondas gravitacionais primordiais e os modos B',
    text: 'Além das flutuações de densidade, a inflação produziria ondas gravitacionais primordiais, com amplitude dada por r. Elas deixariam no fundo cósmico um padrão de polarização em redemoinho, os "modos B" em escalas grandes, que as flutuações de densidade sozinhas não produzem. Seria a assinatura mais direta da inflação e mediria a sua escala de energia. Até hoje não foram detectadas: o limite mais recente é r < 0,034 a 95%.',
    source: 'BICEP/Keck, PRL 127, 151301 (2021); Balkenhol et al., Open J. Astrophys. 9 (2026).',
  },
  {
    id: 'bicep2', level: 'fato', title: 'O caso BICEP2: um sinal que era poeira',
    text: 'Em março de 2014, a equipe do BICEP2 anunciou ter visto os modos B primordiais. A análise conjunta com os dados do Planck, que medem a emissão de poeira da nossa galáxia em outras frequências, encontrou "forte evidência de poeira e nenhuma evidência estatisticamente significativa de modos tensoriais", com r < 0,12 a 95%. O sinal era real; a interpretação, não. É por isso que este módulo separa a medida da explicação.',
    source: 'BICEP2/Keck e Planck, PRL 114, 101301 (2015).',
  },
  {
    id: 'experimentos', title: 'Os próximos experimentos (planos atuais)',
    text: 'O satélite LiteBIRD (JAXA) tem como meta de projeto medir r com erro total δr < 0,001; o lançamento está previsto para o ano fiscal japonês de 2036, depois de uma revisão concluída em junho de 2026. O Simons Observatory, no Chile, instalou o primeiro telescópio de pequena abertura em 2023 e viu a "primeira luz" do grande telescópio em fevereiro de 2025; a previsão é σ(r) ≈ 0,003 no projeto original e ≈ 0,0012 com o conjunto ampliado de telescópios até 2035. O CMB-S4, que seria o grande projeto terrestre dos Estados Unidos, perdeu o apoio do DOE e da NSF em julho de 2025 e está sendo encerrado. São planos e previsões, não resultados.',
    source: 'LiteBIRD, PTEP 2023, 042F01; JAXA/ISAS (página da missão); SO, JCAP 02 (2019) 056 e JCAP 04 (2026) 051; cmb-s4.org (comunicado de 9/7/2025).',
  },
  {
    id: 'gaussianidade', level: 'fato', title: 'O que já foi testado: gaussianas e adiabáticas',
    text: 'As flutuações primordiais são gaussianas dentro da precisão do Planck (fNL (local) = −0,9 ± 5,1, compatível com zero) e adiabáticas: componentes de isocurvatura contribuem com no máximo 1,3% a 1,7% da variância da temperatura, a 95%. As duas propriedades são previsões das versões mais simples da inflação.',
    source: 'Planck 2018 IX, A&A 641, A9 (2020); Planck 2018 X, A&A 641, A10 (2020).',
  },
  {
    id: 'tensao-ns', level: 'hipotese', title: 'Um detalhe em movimento: o nₛ mais recente',
    text: 'Combinando Planck, SPT, ACT e BICEP/Keck, Balkenhol e colegas (2026) obtêm nₛ = 0,9682 ± 0,0032, um pouco acima do Planck 2018; o modelo de Starobinsky fica a 2,0σ desse valor. Somando os dados do DESI, nₛ sobe para 0,9728 ± 0,0029, o que favorece outros potenciais. Os autores chamam a diferença entre os conjuntos de dados de marginalmente significativa: o Starobinsky continua permitido, mas a pergunta "qual inflação?" segue aberta.',
    source: 'Balkenhol et al., Open J. Astrophys. 9 (2026), arXiv:2512.10613.',
  },
  {
    id: 'criticas', level: 'hipotese', title: 'Críticas e alternativas: um debate científico real',
    text: 'Em fevereiro de 2017, Anna Ijjas, Paul Steinhardt e Abraham Loeb argumentaram na Scientific American que os dados do Planck desfavorecem as versões mais simples da inflação, que as restantes exigem ajuste fino e que um multiverso tornaria a teoria impossível de testar. Trinta e três físicos, entre eles Alan Guth, David Kaiser, Andrei Linde e Yasunori Nomura, responderam que a inflação é testável e já teve previsões confirmadas; os autores replicaram na mesma edição. Alternativas, como os universos com ricochete e o cenário ecpirótico, também são hipóteses em pesquisa e exigem física além da relatividade geral (Módulo 2.2).',
    source: 'Ijjas, Steinhardt e Loeb, Sci. Am. 316(2), 32 (2017); Guth et al., "A Cosmic Controversy", Sci. Am. 317(1), 5 (2017).',
  },
];

export const LIMITATIONS: ReactNode[] = [
  'Fórmulas de rolamento lento na primeira ordem. O número de e-dobras depende da escala de energia e do reaquecimento, que não é modelado: aqui o reaquecimento é instantâneo e a relação entre temperatura e fator de escala usa o conteúdo de radiação de hoje (mais partículas em altas energias mudariam N em cerca de 1).',
  'O contorno no plano nₛ × r é aproximado a partir de limites publicados em uma dimensão (nₛ do Planck 2018 e o limite superior de r de 2026); o contorno real é bidimensional e correlacionado, e a faixa de nₛ mais recente fica um pouco acima.',
  'O mapa de flutuações é ilustrativo: um campo gaussiano 2D com o espectro primordial, sem a física das oscilações acústicas, que transforma o espectro primordial no espectro do fundo cósmico, e sem a projeção na esfera celeste.',
  'Na planura, a curvatura entra só no fim (|Ω − 1| = |Ωₖ|/(a²E²)), com a expansão do universo plano do Planck 2018.',
  'A física antes do fim da inflação não é conhecida; a era de Planck continua fora do alcance. Os valores no tempo de Planck são extrapolações.',
];

export const REFERENCES: Reference[] = [
  { text: 'A. H. Guth, "Inflationary universe: A possible solution to the horizon and flatness problems", Physical Review D 23, 347 (1981).', url: 'https://doi.org/10.1103/PhysRevD.23.347' },
  { text: 'A. D. Linde, "A new inflationary universe scenario: A possible solution of the horizon, flatness, homogeneity, isotropy and primordial monopole problems", Physics Letters B 108, 389 (1982).', url: 'https://doi.org/10.1016/0370-2693(82)91219-9' },
  { text: 'A. Albrecht e P. J. Steinhardt, "Cosmology for Grand Unified Theories with Radiatively Induced Symmetry Breaking", Physical Review Letters 48, 1220 (1982).', url: 'https://doi.org/10.1103/PhysRevLett.48.1220' },
  { text: 'A. A. Starobinsky, "A new type of isotropic cosmological models without singularity", Physics Letters B 91, 99 (1980).', url: 'https://doi.org/10.1016/0370-2693(80)90670-X' },
  { text: 'V. F. Mukhanov e G. V. Chibisov, "Quantum Fluctuations and a Nonsingular Universe", JETP Letters 33, 532 (1981) (sem DOI).' },
  { text: 'Planck Collaboration (Y. Akrami et al.), "Planck 2018 results. X. Constraints on inflation", Astronomy & Astrophysics 641, A10 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833887' },
  { text: 'Planck Collaboration (N. Aghanim et al.), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
  { text: 'Planck Collaboration (Y. Akrami et al.), "Planck 2018 results. IX. Constraints on primordial non-Gaussianity", Astronomy & Astrophysics 641, A9 (2020).', url: 'https://doi.org/10.1051/0004-6361/201935891' },
  { text: 'Planck Collaboration (P. A. R. Ade et al.), "Planck 2015 results. XX. Constraints on inflation", Astronomy & Astrophysics 594, A20 (2016) (fórmulas para potenciais φⁿ).', url: 'https://doi.org/10.1051/0004-6361/201525898' },
  { text: 'BICEP/Keck Collaboration (P. A. R. Ade et al.), "Improved Constraints on Primordial Gravitational Waves using Planck, WMAP, and BICEP/Keck Observations through the 2018 Observing Season", Physical Review Letters 127, 151301 (2021).', url: 'https://doi.org/10.1103/PhysRevLett.127.151301' },
  { text: 'M. Tristram et al., "Improved limits on the tensor-to-scalar ratio using BICEP and Planck data", Physical Review D 105, 083524 (2022).', url: 'https://doi.org/10.1103/PhysRevD.105.083524' },
  { text: 'L. Balkenhol et al., "Inflation at the End of 2025: Constraints on r and nₛ Using the Latest CMB and BAO Data", The Open Journal of Astrophysics 9 (2026).', url: 'https://doi.org/10.33232/001c.164435' },
  { text: 'BICEP2/Keck e Planck Collaborations (P. A. R. Ade et al.), "Joint Analysis of BICEP2/Keck Array and Planck Data", Physical Review Letters 114, 101301 (2015).', url: 'https://doi.org/10.1103/PhysRevLett.114.101301' },
  { text: 'G. F. Smoot et al., "Structure in the COBE differential microwave radiometer first-year maps", The Astrophysical Journal 396, L1 (1992).', url: 'https://doi.org/10.1086/186504' },
  { text: 'A. Ijjas, P. J. Steinhardt e A. Loeb, "Pop Goes the Universe", Scientific American 316(2), 32 (2017).', url: 'https://doi.org/10.1038/scientificamerican0217-32' },
  { text: 'A. H. Guth, D. I. Kaiser, A. D. Linde, Y. Nomura et al. (33 signatários), "A Cosmic Controversy", carta em Scientific American 317(1), 5 (2017), com a réplica dos autores.', url: 'https://doi.org/10.1038/scientificamerican0717-5' },
  { text: 'LiteBIRD Collaboration (E. Allys et al.), "Probing cosmic inflation with the LiteBIRD cosmic microwave background polarization survey", Progress of Theoretical and Experimental Physics 2023, 042F01 (2023).', url: 'https://doi.org/10.1093/ptep/ptac150' },
  { text: 'Simons Observatory Collaboration (P. Ade et al.), "The Simons Observatory: science goals and forecasts", Journal of Cosmology and Astroparticle Physics 02, 056 (2019).', url: 'https://doi.org/10.1088/1475-7516/2019/02/056' },
  { text: 'Simons Observatory (Abril-Cabezas et al.), "Forecasted constraints on primordial gravitational waves with the expanded array of Small Aperture Telescopes", Journal of Cosmology and Astroparticle Physics 04, 051 (2026).', url: 'https://doi.org/10.1088/1475-7516/2026/04/051' },
  { text: 'JAXA/ISAS, página da missão LiteBIRD (consultada em 26/10/2026).', url: 'https://www.isas.jaxa.jp/en/missions/spacecraft/future/litebird.html' },
  { text: 'CMB-S4, comunicado sobre o fim do apoio do DOE e da NSF (9/7/2025).', url: 'https://cmb-s4.org/' },
];
