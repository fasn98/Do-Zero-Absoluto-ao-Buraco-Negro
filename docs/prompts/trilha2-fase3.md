# Trilha 2, Fase 3: "Confronto com dados reais"

Leia o CLAUDE.md antes de começar e siga todas as convenções dele. Salve esta tarefa em docs/prompts/trilha2-fase3.md.

Esta é a fase mais importante do roteiro: o app deixa de ilustrar cenários e passa a mostrar quais deles os dados reais ainda permitem. Ela tem duas etapas, e você deve parar e me reportar no fim da Etapa A, antes de escrever qualquer interface. Regra principal: o app reproduz análises publicadas; ele não descobre nada novo. Se algum resultado divergir das publicações, isso é um erro a investigar, não uma descoberta.

## Etapa A: dados e verossimilhança, validados fora do navegador

### A1. Dados (todos de fontes oficiais, com licença e versão registradas)

1. DESI DR2 BAO: as medidas de D_M/r_d, D_H/r_d e D_V/r_d por intervalo de redshift, com a matriz de covariância. Procure a versão oficial usada pela colaboração (por exemplo, o repositório `CobayaSampler/bao_data` no GitHub, pasta do DR2) e confira cada número contra a Tabela IV do artigo (DESI Collaboration, Phys. Rev. D 112, 083515, 2025; arXiv:2503.14738).
2. CMB comprimido: os "distance priors" do Planck 2018, isto é, o parâmetro de deslocamento R, a escala acústica l_A e ω_b, com a matriz de covariância, de Chen, Huang e Wang (JCAP 02, 028, 2019; arXiv:1808.05724). Use a combinação TT,TE,EE+lowE e confira os valores no artigo.
3. Supernovas comprimidas: uma versão binada ou comprimida e oficial, pequena o bastante para o navegador. Primeira opção: a versão comprimida do Union3 (Rubin et al., 2023), com seus nós e a covariância. Se não houver uma versão comprimida oficial e com licença clara, me diga quais alternativas existem antes de escolher. Não binne um catálogo por conta própria.
4. Salve os dados em `artifacts/zero-absoluto/src/data/cosmo/`, cada arquivo com cabeçalho de fonte, DOI, versão, data de download e licença. Registre tudo no CLAUDE.md.

### A2. Modelo e verossimilhança (TypeScript, funções puras, com testes)

- Universo plano com radiação, matéria e energia escura CPL, reaproveitando o resolvedor dos Módulos 2.1 e 2.2.
- Distâncias: D_M(z), D_H(z) = c/H(z), D_V(z), e as grandezas do CMB (R, l_A), com z* e r_d pelas fórmulas de ajuste padrão usadas em Chen, Huang e Wang (Hu e Sugiyama para z*; para r_d, a fórmula de ajuste da literatura que o artigo citar). Confira cada fórmula na fonte.
- χ² de cada conjunto de dados com a covariância completa: χ² = Δᵀ C⁻¹ Δ.
- Parâmetros: Ω_m, H₀ (ou H₀·r_d, no caso de só BAO), ω_b, w₀, w_a. Para supernovas, marginalize analiticamente a magnitude absoluta, como é padrão.

### A3. Validação independente em Python

Escreva `scripts/validacao_cosmo.py` (numpy e scipy) que calcula os mesmos χ² de forma independente do código TypeScript e um teste que compara os dois em pontos fixos do espaço de parâmetros (tolerância de 0,1 em χ²).

### A4. Critérios de passagem (pare e me reporte)

Reproduza, com o código Python, os resultados publicados pela colaboração DESI no artigo DR2 para as combinações DESI + CMB e DESI + CMB + supernovas que você implementou:

- valores médios de w₀ e w_a dentro de ~1σ dos publicados (para a combinação com DES-Y5, o artigo dá w₀ ≈ −0,752 e w_a ≈ −0,86; confira na Tabela V os valores das outras combinações);
- a preferência pelo modelo w₀w_a em relação ao ΛCDM, em σ, próxima da publicada (por exemplo, 3,1σ para DESI + CMB e 2,8σ a 4,2σ com supernovas, conforme o conjunto).

Diferenças pequenas são esperadas, porque usamos o CMB comprimido em vez da verossimilhança completa do Planck. Me mostre uma tabela com o nosso resultado, o publicado e a diferença em σ. Não siga para a Etapa B antes da minha resposta.

## Etapa B: Módulo 2.3, "Confronto com dados reais" (só depois da minha aprovação)

### Simulação

- O plano w₀ × w_a com as regiões de 1σ e 2σ calculadas no navegador, numa grade, dentro de um Web Worker para não travar a página. Use os valores de Ω_m e H₀ que minimizam o χ² em cada ponto (perfil) e diga isso na tela.
- Seletor de conjuntos de dados: só BAO, BAO + CMB, BAO + CMB + supernovas. O leitor vê os contornos encolhendo conforme os dados se somam.
- Marcadores no plano para os cenários do Módulo 2.2: ΛCDM em (−1, 0), w = −1,5 constante em (−1,5, 0) e o melhor ajuste do DESI. Cada marcador mostra seu Δχ² e a distância em σ.
- A linha w₀ + w_a = −1 (a "divisória fantasma") e as regiões de energia escura que fica mais forte ou mais fraca com o tempo, com rótulos.
- Painel "quais destinos sobrevivem": para cada cenário do 2.2, se os dados o permitem a 2σ, com o aviso de que a CPL não decide o destino distante (Módulo 2.2).
- Um gráfico de w(z) com a faixa de 1σ de 0 a z = 2,5, mostrando onde os dados realmente restringem.

### Selos

- Medidas de BAO, CMB e supernovas → fato estabelecido.
- ΛCDM compatível com cada conjunto de dados isolado → consenso.
- Energia escura dinâmica → hipótese em pesquisa, com o número de σ e a lembrança de que 5σ é o padrão para descoberta.

### O que este modelo deixa de fora

- CMB comprimido em vez da verossimilhança completa; neutrinos massivos e curvatura não incluídos.
- Supernovas comprimidas; sistemáticas tratadas só pela covariância publicada.
- Perfil em vez de marginalização completa por MCMC.
- O resultado depende da escolha do conjunto de supernovas, como o próprio DESI mostra.

### Entrega da Etapa B

1. Página do 2.3, card ativo na Trilha 2, link a partir do 2.2.
2. Testes da verossimilhança e do worker.
3. Capturas em 360 px e desktop dos três conjuntos de dados, com uma tabela dos valores exibidos.
4. Tempo de cálculo da grade num celular simulado, que deve ficar abaixo de ~10 s.
5. Commit na main, sem publicar.
