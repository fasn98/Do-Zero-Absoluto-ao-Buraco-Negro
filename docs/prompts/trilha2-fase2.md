# Trilha 2, Fase 2: "Os destinos possíveis"

Leia o CLAUDE.md antes de começar e siga todas as convenções dele. Salve esta tarefa em docs/prompts/trilha2-fase2.md.

## Parte 0: correção no Módulo 2.1

Antes do fim da inflação (t < ~10⁻³² s), o painel mostra fator de escala, redshift e taxa de expansão calculados com a solução do regime de radiação (por exemplo, a = 3,30 × 10⁻³¹ e H = 5,92 × 10⁶⁰ km/s/Mpc em 2,60 × 10⁻⁴² s). Isso é uma extrapolação sem validade física: durante a inflação, se ela ocorreu, a cresceu de forma exponencial, e na era de Planck nem o tempo está bem definido. Nessa faixa, mostre "—" em a, z e H, com a nota "o modelo de radiação não se aplica antes do fim da inflação", do mesmo jeito que a temperatura já aparece como "indefinida". Adicione um teste.

## Parte 1: Módulo 2.2, "Os destinos possíveis"

O destino do universo depende da energia escura, e este módulo deixa o leitor escolher a hipótese e ver o futuro que cada uma produz. Regra principal: o cenário padrão (Λ constante) é o favorecido pelos dados; todos os outros são hipóteses em pesquisa, e a tela deve dizer isso o tempo todo.

### Física

Reaproveite o resolvedor de Friedmann do Módulo 2.1, generalizado para três famílias de modelos, sempre planos:

1. **w constante** (energia escura com equação de estado fixa): ρ_DE ∝ a^(−3(1+w)). Controle de w entre −2 e −0,5.
   - w = −1: o ΛCDM do Módulo 2.1, expansão eterna.
   - w < −1 ("energia fantasma"): Big Rip num tempo finito. Tempo até o rasgo, a partir de hoje: integral de da/(aH) de a = 1 até ∞, que converge para w < −1. Compare com a aproximação de Caldwell, Kamionkowski e Weinberg (Phys. Rev. Lett. 91, 071301, 2003): t_rip − t₀ ≈ (2/3) |1 + w|⁻¹ H₀⁻¹ (1 − Ω_m)^(−1/2).
   - Mostre também em que momento antes do fim cada estrutura se desfaz (aglomerados, Via Láctea, sistema solar, Terra, átomos), com a regra do artigo: uma estrutura ligada se desfaz quando o tempo restante fica menor que cerca de P √(2|1+3w|) / (6π|1+w|), sendo P o período de órbita típico da estrutura. Confira a fórmula e os exemplos no artigo antes de usar.
2. **Λ negativo** (recontração): com matéria e Λ < 0, a expansão para e o universo recolapsa num Big Crunch. Para matéria e Λ negativo, plano, a solução é analítica: tempo total de vida t_crunch = 2π / (3 H₀ √|Ω_Λ|). Controle de Ω_Λ entre −1 e 0, com Ω_m = 1 − Ω_Λ.
   - Ponto pedagógico obrigatório: com H₀ = 67,4 e Ω_Λ = −0,685, a idade de hoje seria de só ~8,1 bilhões de anos, menor que a idade das estrelas mais velhas (~13 bilhões de anos). Mostre na tela que esse cenário, com esses números, já está descartado pelos dados. É o exemplo de como uma simulação elimina hipóteses.
3. **CPL**, w(a) = w₀ + w_a (1 − a), a parametrização usada pelo DESI. Use como atalho os valores de melhor ajuste do DESI DR2 (combinação com CMB e supernovas), retirados das tabelas do artigo (Phys. Rev. D 112, 083515, 2025; arXiv:2503.14738) e citados. Aviso obrigatório: a CPL é um ajuste para o passado recente (a ≤ 1); estendida para o futuro distante, ela não tem base física, porque w(a) cresce sem limite. Por isso, no modo CPL, a simulação só mostra o futuro até a = 2 e então para, com uma nota explicando por quê.

### Cenários cíclicos e de ricochete

Seção de leitura, sem simulação, com selo de hipótese em pesquisa: o universo cíclico de Steinhardt e Turok (2002), os modelos de ricochete de Ijjas e Steinhardt, e a cosmologia cíclica conforme de Penrose (2010), cujas assinaturas alegadas no fundo cósmico são contestadas. Explique que todo ricochete exige física além da relatividade geral (violação das condições de energia ou gravidade quântica), e que por isso não pode ser simulado com física estabelecida. Ligue ao Módulo 2.5, "A fronteira" (em breve). Confira as referências.

### Simulação

- Seletor de família (w constante, Λ negativo, CPL) e os controles de cada uma.
- Atalhos: "ΛCDM (Planck)", "Big Rip com w = −1,5", "Recontração com Ω_Λ = −0,1", "Melhor ajuste do DESI DR2".
- Gráfico de a(t) de 0 até o fim (ou até 200 bilhões de anos, se não houver fim), com o ΛCDM sempre desenhado como linha de referência tracejada e o instante de hoje marcado.
- Caixas: destino (expansão eterna, Big Rip ou Big Crunch), tempo até o fim a partir de hoje, idade de hoje nesse modelo, fator de escala máximo (na recontração), e um alerta quando a idade de hoje ficar abaixo de 13 bilhões de anos ("incompatível com as estrelas mais velhas").
- Na família Big Rip, uma linha do tempo do fim com os momentos em que cada estrutura se desfaz.

### Valores de referência para testes (H₀ = 67,4, Ω_m = 0,315, Ω_r h² = 4,158 × 10⁻⁵)

- 1/H₀ ≈ 14,51 bilhões de anos.
- Big Rip, tempo a partir de hoje, pela integral exata: w = −1,1 → ≈ 115,9 bilhões de anos; w = −1,5 → ≈ 22,7; w = −2 → ≈ 11,2. Pela aproximação de Caldwell: 116,9; 23,4; 11,7 (a diferença vem da matéria e da radiação; mostre as duas).
- Conferência com o artigo de Caldwell, Kamionkowski e Weinberg: com h = 0,7, Ω_m = 0,3 e w = −1,5, a aproximação dá ≈ 22 bilhões de anos, o valor citado no artigo.
- Λ negativo, só matéria: Ω_Λ = −0,685 → t_crunch ≈ 36,7 bilhões de anos, a_máx ≈ 1,35, idade de hoje ≈ 8,08 bilhões de anos (descartado). Ω_Λ = −0,1 → t_crunch ≈ 96,1 bilhões de anos, a_máx ≈ 2,22, idade de hoje ≈ 9,37 bilhões de anos (também descartado). A integral numérica deve coincidir com a fórmula analítica.
- ΛCDM: idade de 13,79 bilhões de anos, igual ao Módulo 2.1.

### Selos

- Expansão acelerada observada → fato estabelecido.
- Expansão eterna com Λ constante como cenário padrão → consenso.
- Big Rip, recontração, energia escura dinâmica, universos cíclicos → hipótese em pesquisa.
- O destino real ainda não está decidido → consenso ("a pergunta está em aberto").

### O que este modelo deixa de fora

- Só universos planos; a curvatura medida é compatível com zero.
- Energia escura tratada como fluido; modelos de campo escalar (quintessência) com potenciais específicos não foram implementados.
- O Λ negativo puro já é descartado pela idade das estrelas; modelos realistas de recontração combinam Λ negativo com um campo que domina hoje. Mencione isso sem implementar.
- A CPL não vale no futuro distante.

### Referências (conferir cada uma)

- R. R. Caldwell, M. Kamionkowski e N. N. Weinberg, Phys. Rev. Lett. 91, 071301 (2003).
- M. Chevallier e D. Polarski, Int. J. Mod. Phys. D 10, 213 (2001); E. V. Linder, Phys. Rev. Lett. 90, 091301 (2003).
- DESI Collaboration, Phys. Rev. D 112, 083515 (2025).
- P. J. Steinhardt e N. Turok, Science 296, 1436 (2002).
- R. Penrose, Cycles of Time (2010).

## Parte 2: página da Trilha 2

O card do 2.2 deixa de ser "em breve" e ganha link. A régua cósmica, na faixa depois de hoje, passa a mencionar que o futuro depende do cenário e linka o 2.2.

## Entrega

1. Correção da Parte 0, com teste.
2. Física e testes do 2.2, com todos os valores de referência.
3. Página do 2.2 e atualização da Trilha 2.
4. Rode scripts/capturas.mjs em 360 px e desktop com os quatro atalhos, abra as imagens, corrija o que aparecer e me mostre uma tabela com os valores exibidos em cada atalho.
5. Confira as rotas e os DOIs.
6. Commit na main, sem publicar.
