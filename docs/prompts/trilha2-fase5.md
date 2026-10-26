# Trilha 2, Fase 5: "A fronteira" (Módulo 2.5)

Leia o CLAUDE.md antes de começar e siga todas as convenções dele. Salve esta tarefa em docs/prompts/trilha2-fase5.md.

Este módulo fecha a Trilha 2. Ele reúne o que ainda não sabemos sobre a origem e o destino do universo e mostra, para cada pergunta, o que já foi medido, quais hipóteses existem e o que poderia decidir entre elas. Regra principal: separar com rigor fato, consenso e hipótese, e dizer para cada hipótese se existe hoje um teste possível. O módulo não pode vender nenhuma hipótese como resposta, nem tratar como ciência o que não tem teste. Todo número abaixo é para conferir na fonte antes de usar; se divergir, a fonte vence e você me avisa.

## Seção 1: O fim mais distante (simulação principal)
Uma linha do tempo do futuro em escala logarítmica, de hoje (~1,4 × 10¹⁰ anos) até 10¹⁰⁰ anos e além, supondo Λ constante (aviso fixo na tela, com link para o Módulo 2.2: com outra energia escura, o futuro muda). Marcos, cada um com fonte e selo:

- fim da formação de estrelas e últimas anãs vermelhas (~10¹³ a 10¹⁴ anos; F. C. Adams e G. Laughlin, Rev. Mod. Phys. 69, 337, 1997);
- limite atual do tempo de vida do próton (Super-Kamiokande, canal p → e⁺π⁰, Phys. Rev. D 102, 112011, 2020; confira o valor, ~2,4 × 10³⁴ anos): dizer que o decaimento do próton é hipótese, previsto por teorias de grande unificação (Módulo 09 da Trilha 1) e nunca observado;
- evaporação de buracos negros por radiação de Hawking: t ≈ 5120π G² M³ / (ħ c⁴). Calcule com as constantes do app: massa solar → ~2 × 10⁶⁷ anos; 10¹¹ massas solares → ~2 × 10¹⁰⁰ anos. Explique que a evaporação só começa quando o fundo cósmico fica mais frio que o buraco negro. Ligue ao módulo de Hawking da Trilha 1.

## Seção 2: O universo nunca chega ao zero absoluto (simulação)
Este é o fecho das duas trilhas. Num universo dominado por Λ constante, o horizonte cosmológico tem uma temperatura mínima, a temperatura de Gibbons-Hawking: T_dS = ħ H_Λ / (2π k_B), com H_Λ = H₀ √Ω_Λ.

- Calcule com os parâmetros do Planck 2018 do app. O resultado deve ficar na ordem de 10⁻³⁰ K; confira com o Python (G. W. Gibbons e S. W. Hawking, Phys. Rev. D 15, 2738, 1977).
- Gráfico: a temperatura do fundo cósmico caindo com o tempo (T ∝ 1/a) e a linha horizontal de T_dS. Calcule em que momento as duas se cruzam (deve ficar na ordem de um trilhão de anos; confira o número pelo cálculo, não por esta estimativa).
- Compare com a menor temperatura já produzida em laboratório que o Módulo 1 da Trilha 1 cita.
- Selos: a fórmula → consenso (física teórica bem estabelecida, nunca medida); a aplicação ao nosso futuro → hipótese em pesquisa, porque depende de Λ ser constante.

## Seção 3: Mapa das perguntas em aberto (leitura, com cartões)
Um cartão por pergunta. Cada cartão tem quatro linhas fixas: o que foi medido (fato, com número e fonte), as hipóteses (cada uma com selo), o que poderia decidir (experimento e data prevista, conferidos) e link para o módulo do app que trata do assunto.

1. O que aconteceu na era de Planck? Escalas de Planck calculadas pelas constantes do app (comprimento ~1,6 × 10⁻³⁵ m, tempo ~5,4 × 10⁻⁴⁴ s, temperatura ~1,4 × 10³² K). Hipóteses: cordas, gravidade quântica em laços, segurança assintótica. Testes possíveis hoje: o emaranhamento mediado pela gravidade (Bose et al. e Marletto e Vedral, Phys. Rev. Lett. 119, 2017), que a Trilha 1 apresenta. Diga claramente que nenhuma teoria de gravidade quântica foi confirmada.
2. O que é a matéria escura? Fato: efeitos gravitacionais medidos (curvas de rotação, lentes, fundo cósmico); Ω_c h² do Planck 2018. Hipóteses: WIMPs, áxions, buracos negros primordiais, gravidade modificada. Limites atuais de detecção direta (confira o resultado publicado mais recente do LZ).
3. Por que existe mais matéria que antimatéria? Fato: a razão bárion/fóton η ≈ 6 × 10⁻¹⁰ (confira no Planck 2018 ou na revisão do PDG). As três condições de Sakharov (JETP Lett. 5, 24, 1967). A causa é desconhecida.
4. A tensão de Hubble. Use os valores já citados no Módulo 8 e no 2.1 (Planck, SH0ES, CCHP e o mais recente), com as fontes do app. Hipóteses: sistemáticas nas escadas de distância, energia escura primordial, física nova. O que decide: sirenes padrão (ligue à seção de sirenes do 2.3) e calibrações independentes.
5. Galáxias e buracos negros gigantes cedo demais (JWST). Fato: galáxias brilhantes e buracos negros supermassivos observados em z alto. Diga o que já foi confirmado espectroscopicamente e o que ainda é candidato, e quais explicações dentro do ΛCDM e fora dele estão em discussão. Confira as fontes mais recentes publicadas em revista, sem usar notícias como fonte primária.
6. O universo teve um começo, ou um ricochete? Ligue aos cenários cíclicos e de ricochete do Módulo 2.2 e à inflação do 2.4. A cosmologia cíclica conforme e os "pontos de Hawking" alegados no fundo cósmico, com as refutações publicadas.
7. Existe um multiverso? A inflação eterna e a paisagem de cordas. Selo de hipótese, com a observação, citada de fonte, de que hoje não há teste aceito; mencione as propostas de assinaturas (colisões de bolhas no fundo cósmico) e os limites publicados, se houver.

## Seção 4: O que esta trilha mostrou (leitura curta)
Um resumo de cinco linhas, uma por módulo da Trilha 2, dizendo o que cada simulação permitiu descartar ou testar. Exemplos que já estão no app: o Λ negativo puro, descartado pela idade das estrelas (2.2); o φ², descartado pelo limite de r (2.4); a energia escura dinâmica, preferida a ~3σ mas ainda não confirmada (2.3). Fecho: "Uma simulação não descobre o universo, mas elimina universos impossíveis. É assim que a ciência avança na fronteira."

## Valores de referência para os testes (confira cada um)
- Tempo de evaporação de Hawking: 1 M☉ → ~2,1 × 10⁶⁷ anos; 10¹¹ M☉ → ~2,1 × 10¹⁰⁰ anos (escala como M³).
- T_dS com H₀ = 67,4 e Ω_Λ = 0,685: ~2 × 10⁻³⁰ K.
- Escalas de Planck: l_P ≈ 1,616 × 10⁻³⁵ m; t_P ≈ 5,391 × 10⁻⁴⁴ s; T_P ≈ 1,417 × 10³² K.
- Cruzamento entre a temperatura do fundo cósmico e T_dS: calcule e confira com o Python independente.

## Selos
- Medidas (matéria escura gravitacional, η, H₀ de cada método, galáxias do JWST confirmadas) → fato estabelecido.
- Existência de algo além do Modelo Padrão para explicar matéria escura e assimetria → consenso.
- Todas as explicações específicas, o decaimento do próton, a gravidade quântica, o ricochete e o multiverso → hipótese em pesquisa, com a linha "teste possível hoje: sim/não, qual".

## O que este modelo deixa de fora
- A linha do tempo do futuro supõe Λ constante; com energia escura dinâmica, ela muda ou deixa de valer (Módulo 2.2).
- Tempos de evaporação na aproximação de corpo negro, sem emissões de partículas massivas nem acreção.
- Os cartões resumem debates em aberto; as fontes citadas trazem o detalhe.

## Entrega
1. Física e testes (evaporação, T_dS, cruzamento, escalas de Planck), com validação independente em Python.
2. Página do 2.5, card ativo na Trilha 2, link a partir do 2.4. A régua cósmica, na faixa do futuro distante, aponta para o 2.5. Com isso a Trilha 2 fica completa (2.5 / 2.5).
3. Capturas em 360 px e desktop: a linha do tempo, o gráfico das temperaturas e três cartões. Tabela com os valores exibidos.
4. Confira as rotas e os DOIs, e diga quais referências não conseguiu confirmar.
5. Prepare, sem executar, a v1.1.0: CITATION.cff e .zenodo.json com versão 1.1.0; README e paper/paper.md atualizados para "five of five modules" na Trilha 2, com a seção de sirenes do 2.3 mencionada em uma frase; contagem de palavras do paper.
6. Commit na main, sem publicar, sem push e sem release. Pare e me reporte.
