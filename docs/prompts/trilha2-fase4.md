# Trilha 2, Fase 4: "Inflação e perturbações" (Módulo 2.4)

Leia o CLAUDE.md antes de começar e siga todas as convenções dele. Salve esta tarefa em docs/prompts/trilha2-fase4.md.

Este módulo trata do primeiro instante do universo, a parte menos testada da Trilha 2. Regra principal: **separar com rigor o que foi medido (as flutuações do fundo cósmico) da explicação mais aceita para elas (a inflação), que ainda é hipótese.** A inflação é o paradigma dominante, mas não foi confirmada diretamente: a assinatura mais procurada, as ondas gravitacionais primordiais, ainda não foi detectada. O módulo não pode tratar a inflação como fato, nem desprezá-la. Todo número abaixo é para conferir na fonte antes de usar; se divergir, a fonte vence e você me avisa.

## Seção 1: Dois quebra-cabeças (simulação)
Reaproveite o resolvedor de Friedmann dos Módulos 2.1 a 2.3.

1. **Problema da planura.** Num universo com radiação e matéria, o desvio |Ω − 1| cresce com o tempo (∝ t na era da radiação e ∝ t^(2/3) na da matéria). Calcule, com o resolvedor, quanto ele precisaria valer em instantes antigos (nucleossíntese, ~1 s; e a escala de Planck, como extrapolação marcada) para ser compatível hoje com o limite de curvatura do Planck 2018 (|Ω_k| da ordem de 10⁻³; confira o valor e o conjunto de dados exatos). Confira o resultado com a estimativa analítica e mostre os dois.
2. **Problema do horizonte.** Calcule o horizonte de partículas comóvel na recombinação (z ≈ 1.090) e o ângulo que ele ocupa no céu hoje (dividindo pela distância comóvel até a recombinação). O resultado deve ficar na ordem de 1 a 2 graus; confira com o cálculo independente em Python. Mensagem: regiões do fundo cósmico separadas por mais que isso nunca estiveram em contato causal no modelo sem inflação, e mesmo assim têm a mesma temperatura com precisão de ~10⁻⁵.
3. **Controle de inflação:** um controle com o número de e-dobras N (de 0 a 70). Mostre como |Ω − 1| inicial é reduzido por um fator e^(−2N) e a partir de que N os dois problemas deixam de existir (a referência usual é N ≳ 50 a 60; confira e explique que o número exato depende da escala de energia e do reaquecimento).

## Seção 2: As sementes das estruturas (simulação)
- **Espectro primordial:** P(k) = A_s (k/k*)^(n_s − 1), com k* = 0,05 Mpc⁻¹. Valores do Planck 2018 (A&A 641, A10, 2020; confira a combinação): n_s ≈ 0,9649 ± 0,0042 e ln(10¹⁰ A_s) ≈ 3,044 ± 0,014 (A_s ≈ 2,1 × 10⁻⁹).
- **Mapa ilustrativo:** um campo gaussiano 2D gerado a partir desse espectro, com semente fixa (o mesmo mapa sempre que a página abrir), e um controle de n_s entre 0,90 e 1,10. O leitor vê que n_s < 1 dá um pouco mais de amplitude nas escalas grandes. Diga na tela que o mapa é uma ilustração do espectro, e não um mapa real do céu nem uma simulação do fundo cósmico.
- **Fato medido:** n_s < 1 com alta significância (confira quantos σ no Planck 2018 X). É uma das previsões genéricas da inflação de rolamento lento.

## Seção 3: Qual inflação? (simulação principal)
O plano n_s × r (razão tensor-escalar), com:
- **As restrições observacionais**, desenhadas a partir dos números publicados em uma dimensão: a faixa de n_s do Planck 2018 (1σ e 2σ) e o limite superior r < 0,036 a 95% (BICEP/Keck, Phys. Rev. Lett. 127, 151301, 2021; confira se há limite combinado mais recente e publicado, por exemplo com o Planck PR4, e use o mais recente com a fonte). Diga na tela que o contorno real é bidimensional e que o desenho é uma aproximação feita com os limites publicados.
- **Previsões de modelos** em função de N (controle de 50 a 60), pelas fórmulas de rolamento lento, conferidas na fonte:
  - inflação caótica com V ∝ φ²: n_s ≈ 1 − 2/N, r ≈ 8/N;
  - modelo de Starobinsky (R²): n_s ≈ 1 − 2/N, r ≈ 12/N².
- Cada modelo com seu marcador e a mensagem: o φ² já está **descartado** pelo limite de r; o Starobinsky continua **permitido**.
- **Escala de energia da inflação:** V^(1/4) = (3π² A_s r / 2)^(1/4) × M_P, com M_P = 2,435 × 10¹⁸ GeV (massa de Planck reduzida). Mostre o valor para o r escolhido e o limite superior que vem de r < 0,036. Compare com a escala de grande unificação do Módulo 11 da Trilha 1.

## Seção 4: O que falta medir (leitura)
- **Ondas gravitacionais primordiais** e os "modos B" da polarização do fundo cósmico: por que seriam a assinatura mais direta da inflação. O caso BICEP2 de 2014: o sinal anunciado era poeira da nossa galáxia (BICEP2/Keck e Planck, Phys. Rev. Lett. 114, 101301, 2015). É o exemplo de por que a tela separa medida de interpretação.
- **Próximos experimentos:** LiteBIRD e o Simons Observatory, com as sensibilidades projetadas a r e as datas atuais, conferidas nas fontes oficiais. Confira também a situação atual do CMB-S4 antes de mencioná-lo.
- **Críticas e alternativas,** com selo de **hipótese em pesquisa:** a crítica de Ijjas, Steinhardt e Loeb (2017) e a resposta assinada por Guth, Kaiser, Linde, Nomura e outros; os cenários de ricochete (ligue ao Módulo 2.2). Mostre que o debate é real e é científico.

## Valores de referência para os testes (confira cada um)
- n_s = 1 − 2/N: N = 50 → 0,960; N = 60 → 0,9667.
- Starobinsky, r = 12/N²: N = 50 → 0,0048; N = 60 → 0,0033.
- φ², r = 8/N: N = 50 → 0,16; N = 60 → 0,133 (os dois acima de 0,036).
- V^(1/4) com A_s = 2,1 × 10⁻⁹: r = 0,01 → ≈ 1,0 × 10¹⁶ GeV; r = 0,036 → ≈ 1,4 × 10¹⁶ GeV.
- Fator de redução da planura: e^(−2N); N = 60 → ≈ 10⁻⁵².
- Ângulo do horizonte na recombinação: calcule com o resolvedor e confira com o Python independente; não aceite um número sem o cálculo.

## Selos
- Anisotropias do fundo cósmico, espectro quase invariante de escala, n_s < 1, flutuações gaussianas e adiabáticas → **fato estabelecido**.
- Problemas da planura e do horizonte no modelo sem inflação → **consenso**.
- A inflação como explicação → **hipótese em pesquisa**, com a nota de que é o paradigma mais aceito, faz previsões confirmadas (n_s < 1, flutuações gaussianas e adiabáticas, correlações além do horizonte) e ainda não tem a confirmação direta das ondas gravitacionais primordiais.
- Modelos específicos (φ², Starobinsky) → **hipótese em pesquisa**, com o φ² marcado como descartado.
- Alternativas (ricochete, ecpirótico) → **hipótese em pesquisa**.

## O que este modelo deixa de fora
- Fórmulas de rolamento lento na primeira ordem; o número de e-dobras depende do reaquecimento, que não é modelado.
- Contornos no plano n_s × r aproximados a partir de limites publicados em uma dimensão.
- O mapa de flutuações é ilustrativo: não inclui a física das oscilações acústicas, que transforma o espectro primordial no espectro do fundo cósmico.
- A física antes do fim da inflação não é conhecida; a era de Planck continua fora do alcance.

## Referências (conferir cada uma)
- A. H. Guth, Phys. Rev. D 23, 347 (1981).
- A. D. Linde, Phys. Lett. B 108, 389 (1982); A. Albrecht e P. J. Steinhardt, Phys. Rev. Lett. 48, 1220 (1982).
- A. A. Starobinsky, Phys. Lett. B 91, 99 (1980).
- V. F. Mukhanov e G. V. Chibisov, JETP Lett. 33, 532 (1981).
- Planck Collaboration, "Planck 2018 results. X. Constraints on inflation", A&A 641, A10 (2020).
- BICEP/Keck Collaboration, Phys. Rev. Lett. 127, 151301 (2021).
- BICEP2/Keck e Planck Collaborations, Phys. Rev. Lett. 114, 101301 (2015).
- A. Ijjas, P. J. Steinhardt e A. Loeb, Scientific American (fevereiro de 2017), e a resposta de Guth et al. (maio de 2017).

## Entrega
1. Física e testes, com todos os valores de referência e o cálculo independente em Python do horizonte e da planura.
2. Página do 2.4, card ativo na Trilha 2, link a partir do 2.3. O marco "Inflação" da régua cósmica e do Módulo 2.1 passa a apontar para o 2.4.
3. Capturas em 360 px e desktop: os dois quebra-cabeças com N = 0 e N = 60, o mapa com n_s = 0,9649 e 1,05, e o plano n_s × r com os dois modelos em N = 55. Tabela com os valores exibidos.
4. Confira as rotas e os DOIs, e diga quais referências você não conseguiu confirmar.
5. Commit na main, sem publicar.
