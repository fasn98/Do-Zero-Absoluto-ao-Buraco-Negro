# Módulo 2.3, "E se tivéssemos sirenes gigantes?" (previsões com dados futuros)

Leia o CLAUDE.md antes de começar e siga todas as convenções dele. Salve esta tarefa em docs/prompts/trilha2-2-3-previsoes.md.

Vamos acrescentar ao Módulo 2.3 uma seção de **previsão**: quanto os contornos do plano w₀ × w_a encolheriam se tivéssemos sirenes padrão de ondas gravitacionais em grandes distâncias. Regra principal, que não pode ser quebrada: **o app nunca mistura dados reais com dados simulados.** O painel de dados reais, o "quais destinos sobrevivem" e os números de preferência continuam exatamente como estão. A seção nova fica separada, com selo **"projeção"** (crie esse selo se não existir), contornos tracejados e o aviso fixo: "Dados simulados a partir de previsões publicadas. Nenhum destes eventos foi observado." Todos os modelos de erro e de número de eventos vêm de artigos publicados; nada é inventado. Pare e me reporte no fim da Etapa A.

## Parte 0: atualização do DES-Y5 (sem mudar os cálculos)
Na nota do seletor de supernovas, acrescente: em 2025 a colaboração DES recalibrou suas supernovas (calibração "Dovekie"), e a preferência por energia escura que muda com o tempo caiu de 4,2σ para 3,2σ, sem nenhum dado novo (Popovic et al., arXiv:2511.07517; confira se já foi publicado em revista e use a versão publicada). Ligue isso à frase sobre tensões que já desapareceram.

## Etapa A: modelo de previsão, validado fora do navegador

### Cenário 1: fusões de buracos negros supermassivos (LISA)
- O LISA, observatório espacial previsto para a década de 2030, vai detectar fusões de buracos negros de milhões de massas solares. Cada fusão dá a distância de luminosidade d_L pela própria onda. Com uma contrapartida eletromagnética, dá também o redshift: é uma sirene padrão, sem escada de distâncias.
- Use o modelo de erros e as distribuições de eventos de um artigo publicado da colaboração ou do grupo de cosmologia do LISA. Ponto de partida: N. Tamanini et al., "Science with the space-based interferometer eLISA. III: Probing the expansion of the universe using gravitational wave standard sirens", JCAP 04 (2016) 002; e a revisão do LISA Cosmology Working Group, Living Reviews in Relativity 26, 5 (2023). Confira as duas e use a mais recente que traga um modelo de erro aplicável. O erro de d_L deve incluir o termo da onda, o de lentes gravitacionais fracas e o de velocidades peculiares, com as fórmulas exatas do artigo.
- Os números de eventos com contrapartida dependem do modelo de população de buracos negros. Use os cenários publicados (por exemplo, o otimista e o pessimista do artigo) e mostre os dois. Não escolha só o mais favorável.

### Cenário 2: fusões de estrelas de nêutrons com detectores de terceira geração (Einstein Telescope)
- Mesmo princípio, com detectores terrestres futuros, muitos mais eventos e distâncias menores. Use um artigo publicado que traga o modelo de erros e o número de eventos com contrapartida (procure, confira e me diga qual escolheu e por quê).

### Uma nota que vai no texto, sem cenário
"Uma estrela despedaçada por um buraco negro supermassivo" (evento de ruptura por maré, TDE) é um dos fenômenos mais brilhantes do universo, mas não tem brilho conhecido de antemão, então hoje não serve como vela padrão. Confira na literatura se há trabalhos publicados tentando padronizar TDEs e diga em uma frase o estado atual.

### Método
1. Gere catálogos simulados com semente fixa: para cada evento, z tirado da distribuição publicada e d_L = d_L verdadeiro(z) + erro gaussiano com o desvio publicado.
2. Universo "verdadeiro" escolhido pelo leitor, com duas opções: o ΛCDM (Planck 2018) e o melhor ajuste do DESI com Union3 que o app já calcula.
3. Verossimilhança: χ² das sirenes somado ao χ² de BAO + CMB + Union3 atual, perfilando Ω_m e H₀ como já fazemos. Mostre também as sirenes sozinhas.
4. Para não depender de um único sorteio, calcule também a previsão de Fisher ou a média de vários catálogos, e mostre que o resultado não depende da semente.

### Validação (pare e me reporte)
- Implemente em `scripts/validacao_sirenes.py` e em TypeScript, e compare os dois.
- Reproduza com o Python pelo menos um número de previsão publicado no artigo escolhido para o LISA (por exemplo, a incerteza prevista de H₀ ou de w₀ num cenário de população indicado no artigo), dentro de um fator razoável que você justifique. Se não reproduzir, isso é um erro a investigar, não um resultado.
- Me mostre uma tabela: cenário, número de eventos, faixa de z, incerteza de w₀ e de w_a (com e sem os dados atuais), e a separação em σ entre ΛCDM e o ponto do DESI quando o universo verdadeiro é cada um deles. A pergunta que o módulo quer responder: **as sirenes futuras conseguiriam levar a decisão a 5σ?**

**Não escreva interface antes da minha resposta.**

## Etapa B (depois da aprovação)
- Seção nova no fim do 2.3: "E se tivéssemos sirenes gigantes?", com o seletor de cenário (LISA otimista, LISA pessimista, Einstein Telescope), o seletor de universo verdadeiro e o plano w₀ × w_a com os contornos atuais (sólidos) e os projetados (tracejados).
- Caixa com: número de eventos, faixa de z, e "separação esperada entre ΛCDM e energia escura variável: Xσ".
- Texto: as previsões dependem de quantos eventos terão contrapartida e de modelos de população ainda incertos; as datas das missões podem mudar (confira a data prevista do LISA na ESA e a situação do Einstein Telescope).
- Selos: medidas atuais → fato estabelecido; previsões → projeção; energia escura dinâmica → hipótese em pesquisa.
- Na Trilha 1, o Módulo 8 (sirenes padrão) ganha um link para esta seção.

### O que este modelo deixa de fora
- Erros de d_L aproximados pelas fórmulas publicadas, sem simulação completa das formas de onda.
- Contrapartidas eletromagnéticas supostas com redshift exato; sirenes escuras não incluídas.
- Sistemáticas futuras desconhecidas.

### Entrega da Etapa B
1. Testes do modelo de previsão e da separação entre dados reais e simulados (um teste que falhe se o painel de dados reais mudar quando a seção de previsão for usada).
2. Capturas em 360 px e desktop dos três cenários com os dois universos verdadeiros, com tabela dos valores exibidos.
3. Rotas e DOIs conferidos; commit na main, sem publicar.
