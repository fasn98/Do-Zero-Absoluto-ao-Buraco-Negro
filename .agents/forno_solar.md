# Prompt para o Claude Code: implementar os simuladores

Cole o texto abaixo no Claude Code, aberto na pasta do projeto que o agente do Replit criou. Coloque também o arquivo `forno-solar.html` (protótipo do Módulo 3) na raiz do projeto antes de começar.

---

Este projeto é o app educativo **"Do Zero Absoluto ao Buraco Negro"**, em português do Brasil, já com o esqueleto criado (React + Vite, seis módulos em rotas próprias, `src/physics/constants.js`, testes com Vitest). Primeiro leia a estrutura existente e o README, e mantenha a organização atual. Sua tarefa é implementar as simulações.

Público: adultos curiosos com formação técnica, sem serem físicos. Regra principal: **toda simulação usa apenas física estabelecida e verificável. Nada inventado, nada sensacionalista.** Quando um modelo simplificar a realidade, a seção "O que este modelo deixa de fora" diz explicitamente o quê.

## Regras técnicas
- Funções físicas puras em `src/physics/`, separadas da interface. Cada uma com teste unitário comparando com os valores de referência abaixo (tolerância de 2%).
- Constantes só em `constants.js`, valores CODATA, com unidade e fonte comentadas.
- Números muito pequenos sempre em escala logarítmica (log-sum-exp) para evitar underflow.
- Gráficos em SVG ou Canvas desenhados pelo próprio código, sem bibliotecas pesadas de charts.
- Funciona no celular (360 px de largura) e no desktop, com tema claro e escuro. Sem emojis na interface.
- Cada módulo termina com "O que este modelo deixa de fora" e 2 a 3 referências confiáveis.
- Diferenciar sempre "fato estabelecido", "consenso" e "hipótese em pesquisa".

## Navegação central (tela inicial)
Controle deslizante de temperatura em escala logarítmica, de 1 nK até a temperatura de Planck (1,417 × 10³² K). Conforme o usuário arrasta, indicar qual módulo descreve aquela faixa, com link para abri-lo. Marcos: condensado de Bose-Einstein (~170 nK), radiação cósmica de fundo (2,725 K), hélio líquido (4,2 K), ambiente (300 K), superfície do Sol (5.772 K), núcleo do Sol (15,7 milhões K), plasma do ITER (~150 milhões K), temperatura de Planck.

## Módulo 3: Por que o Sol brilha (comece por este)
Porte o protótipo `forno-solar.html` para um componente React, mantendo a física e o comportamento:
- Energia de Gamow: E_G = 2 m_r c² (π α Z₁ Z₂)². Para p+p, E_G ≈ 493 keV.
- Pico de Gamow: E₀ = (E_G (kT)² / 4)^(1/3). Largura Δ = (4/√3) √(E₀ kT).
- Taxa relativa ∝ ∫ exp(−E/kT − √(E_G/E)) dE, normalizada pelo núcleo do Sol.
- Barreira ≈ 1,44 MeV·fm × Z₁Z₂ / r, com r = 1,2 (A₁^(1/3) + A₂^(1/3)) fm.
- Três curvas: Maxwell-Boltzmann, probabilidade de tunelamento e o produto.
- Previsão clássica exp(−barreira/kT) ao lado da quântica.
- Reações p+p e D+T. Explicar que o modelo ignora o fator nuclear S(E) e que p+p é lenta por depender da força fraca.
- Atalhos: 300 K, núcleo do Sol, estrela massiva (40 milhões K), ITER, supernova (1 bilhão K).
- Testes: 15,7 milhões K → kT ≈ 1,35 keV e E₀ ≈ 6,1 keV; 150 milhões K → E₀ ≈ 27 keV (p+p).

## Módulo 1: Perto do zero absoluto
- Gás de partículas numa caixa 2D com velocidades de Maxwell-Boltzmann para a temperatura escolhida.
- Cada partícula com um halo do tamanho do comprimento de onda térmico: λ = h / √(2π m k T). Ao esfriar, os halos crescem.
- Quando n·λ³ ≈ 2,612, mostrar a transição para condensado de Bose-Einstein.
- Energia de ponto zero: E₀ = ½ħω (a partícula não para nem em T = 0).
- Referência: primeiro BEC em 1995 (Cornell, Wieman, Ketterle), rubídio-87 a ~170 nK.

## Módulo 2: Entropia e informação
- Gás que se espalha ao remover a divisória, com contagem de microestados e S = k ln W ao vivo.
- Demônio de Maxwell interativo, mostrando que o custo de apagar a memória do demônio preserva a segunda lei.
- Princípio de Landauer: k T ln 2 por bit apagado. Teste: 300 K → ≈ 2,87 × 10⁻²¹ J. Referência: Bérut et al., Nature, 2012.

## Módulo 4: Fusão a frio e fusão por múons
- Usar a física do Módulo 3 para mostrar por que a fusão em temperatura ambiente é praticamente impossível.
- Fleischmann e Pons (1989): nunca reproduzido de forma confiável. Berlinguette et al. (Nature, 2019, projeto financiado pelo Google) não encontrou evidência.
- Fusão catalisada por múons (real): múon ~207 vezes mais pesado que o elétron, molécula ~207 vezes menor. Animação comparando as duas moléculas.
- Por que não gera energia: múon vive ~2,2 μs, catalisa da ordem de 100 a 150 fusões antes de grudar num núcleo de hélio, e produzi-lo custa mais energia do que essas fusões liberam.

## Módulo 5: A temperatura dos buracos negros
- Controle de massa de 10¹¹ kg a 10¹⁰ massas solares.
- Temperatura de Hawking T = ħc³ / (8πGMk). Teste: 1 massa solar → ≈ 6,2 × 10⁻⁸ K.
- Entropia de Bekenstein-Hawking S = k c³ A / (4 G ħ), proporcional à área. Destacar que é a única fórmula com G, ħ, c e k juntos.
- Tempo de evaporação ≈ 5120 π G² M³ / (ħ c⁴).
- Fechar com o princípio holográfico, apresentado como hipótese em pesquisa.

## Módulo 6: O nascimento do Sol
Linha do tempo interativa dos primeiros ~100 milhões de anos, com controle de tempo:
- A nuvem molecular: cerca de 98% hidrogênio e hélio em massa, poeira só ~1 a 2%. A poeira formou os planetas, não o Sol.
- Colapso gravitacional e disco protoplanetário.
- Fase de protoestrela e T Tauri: o Sol brilha pela contração gravitacional, antes da fusão. Escala de Kelvin-Helmholtz t_KH = G M² / (R L). Teste: para o Sol atual, ≈ 3 × 10⁷ anos.
- Ignição da fusão quando o núcleo passa de ~10 milhões K. Ligar ao Módulo 3.
- Chegada à sequência principal por volta de 50 milhões de anos.
- Sol jovem fraco: luminosidade inicial ≈ 70% da atual. Usar a aproximação de Gough (1981): L(t) = L☉ / (1 + 0,4 (1 − t / 4,57 bilhões de anos)). Teste: t = 0 → ≈ 0,71 L☉. Mencionar o "paradoxo do Sol jovem fraco" como problema em aberto.

## Ordem de entrega
1. Módulo 3, com testes passando.
2. Tela inicial com a régua de temperatura.
3. Módulos 1, 2, 4, 5 e 6, cada um com testes passando antes do próximo.
4. Atualizar o README com as fórmulas de cada módulo.