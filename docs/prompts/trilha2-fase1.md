# Trilha 2, Fase 1: duas trilhas e o Módulo 2.1

Esta tarefa abre uma segunda trilha no app e implementa o primeiro módulo dela. Siga exatamente o padrão dos módulos existentes: física em funções puras em `src/physics/` com testes (tolerância de 2%, salvo onde indicado), constantes fundamentais em `constants.js`, parâmetros cosmológicos nos arquivos de física com a fonte comentada, formatador compartilhado com 3 algarismos significativos, componente `Sym`, `ModulePage` com selos de evidência, "O que este modelo deixa de fora" e referências com DOI conferidas. Regra principal: **separar com rigor fato, consenso e hipótese.**

## Parte A: reorganizar o app em duas trilhas
- **Não quebre nenhuma rota existente.** Os 11 módulos atuais continuam nos mesmos endereços.
- A página inicial passa a apresentar duas trilhas lado a lado (empilhadas no celular):
  - **Trilha 1 · Do zero absoluto ao buraco negro:** 11 módulos, das temperaturas extremas à unificação.
  - **Trilha 2 · Origem e destino do universo:** a história do cosmos, do primeiro instante ao futuro distante.
- O conteúdo atual da página inicial (régua de temperatura e os 11 cards) vai para a página da Trilha 1, num endereço novo como `/trilha-1`. A página inicial mantém uma prévia curta de cada trilha e o link para ela.
- A Trilha 2 ganha sua própria página, `/trilha-2`, com uma **régua de tempo cósmico** no lugar da régua de temperatura (Parte B) e os cards dos módulos da trilha. Por enquanto só o 2.1 existe; mostre os próximos (2.2 a 2.5, conforme o roteiro abaixo) como "em breve", sem link.
- Os módulos da Trilha 2 são numerados "2.1", "2.2" etc., e os contadores passam a ser por trilha ("01 / 11" na Trilha 1, "2.1 / 2.5" na Trilha 2). O menu do topo mostra o nome da trilha e os módulos dela.
- Roteiro da Trilha 2, para os cards "em breve": 2.2 Os destinos possíveis; 2.3 Confronto com dados reais; 2.4 Inflação e perturbações; 2.5 A fronteira.

## Parte B: a régua de tempo cósmico (página da Trilha 2)
Controle em escala logarítmica do tempo desde o Big Bang, do tempo de Planck (~5,39 × 10⁻⁴⁴ s) até 100 trilhões de anos no futuro. Ao arrastar, mostre a temperatura do universo naquele instante, quando ela estiver definida, e o marco mais próximo, com seu selo de evidência. Antes de ~1 segundo, mostre a faixa como "física especulativa ou desconhecida", com selo de hipótese. Depois de hoje, mostre que a linha do tempo é uma projeção do ΛCDM, e não um fato.

## Parte C: Módulo 2.1, "A linha do tempo cósmica"

### Física (resolvedor de Friedmann)
Para um universo plano com radiação, matéria e constante cosmológica:

H(a) = H₀ √(Ω_r a⁻⁴ + Ω_m a⁻³ + Ω_Λ), com Ω_Λ = 1 − Ω_m − Ω_r.

- Tempo cósmico: t(a) = ∫₀ᵃ da′ / (a′ H(a′)), por integração numérica estável perto de a = 0 (mude de variável ou use a solução analítica do regime de radiação no trecho inicial).
- Inverta para obter a(t), z(t) = 1/a − 1 e T(t) = T₀ (1 + z), com T₀ = 2,7255 K (Fixsen, 2009).
- Frações de densidade em função de a: radiação, matéria e energia escura.
- Horizonte de partículas (comóvel): c ∫₀¹ da / (a² H(a)). Horizonte de eventos (comóvel): c ∫₁^∞ da / (a² H(a)).
- Parâmetros padrão (Planck 2018, Aghanim et al., A&A 641, A6, 2020): H₀ = 67,4 km/s/Mpc, Ω_m = 0,315, Ω_r h² = 4,15 × 10⁻⁵ (fótons e três neutrinos sem massa). Confira o valor de Ω_r h² e cite a fonte.

Valores de referência para testes (com os parâmetros acima):
- Idade do universo: 13,79 bilhões de anos. Tolerância de 0,5% em relação ao valor publicado pelo Planck, 13,787 ± 0,020.
- Ω_r ≈ 9,14 × 10⁻⁵; Ω_Λ ≈ 0,685.
- Igualdade matéria-radiação: z ≈ 3.450, t ≈ 50 mil anos, T ≈ 9.400 K. (O Planck dá z_eq ≈ 3.387 com neutrinos massivos; explique a diferença numa nota.)
- Recombinação, z = 1.090: t ≈ 372 mil anos, T ≈ 2.970 K.
- z = 20: t ≈ 178 milhões de anos.
- Reionização, z = 7,7: t ≈ 669 milhões de anos.
- Início da aceleração (q = 0), z = (2Ω_Λ/Ω_m)^(1/3) − 1 ≈ 0,632: t ≈ 7,69 bilhões de anos.
- Igualdade matéria-energia escura, z ≈ 0,296: t ≈ 10,3 bilhões de anos.
- Formação do Sol, 4,57 bilhões de anos atrás: z ≈ 0,417.
- Temperatura de 10⁹ K: t ≈ 178 s (cerca de 3 minutos).
- Horizonte de partículas: ≈ 46,1 bilhões de anos-luz. Horizonte de eventos: ≈ 16,7 bilhões de anos-luz.
- Tempo de Hubble 1/H₀ ≈ 14,5 bilhões de anos; tempo de e-dobra no futuro dominado por Λ, 1/(H₀√Ω_Λ) ≈ 17,5 bilhões de anos.

### Simulação
- Controle de tempo cósmico em escala logarítmica, sincronizado com a régua da página da trilha.
- Painel com a(t), z, T, H e as frações de radiação, matéria e energia escura no instante escolhido.
- Gráfico log-log de a(t), com as três eras sombreadas (radiação, matéria, energia escura) e os marcos como pontos com rótulo.
- Gráfico das frações de densidade em função do tempo, mostrando as duas trocas de domínio.
- Seletor de parâmetros com dois atalhos: "Planck 2018" (H₀ = 67,4) e "Universo local, SH0ES" (H₀ = 73,04). Com Ω_m fixo, a idade cai para ≈ 12,7 bilhões de anos com 73,04. Explique que, numa análise real, Ω_m também mudaria, e que este atalho só ilustra a tensão de Hubble do Módulo 8. Teste: H₀ = 73,04 → 12,73 bilhões de anos; H₀ = 70,39 → 13,21 bilhões de anos.
- Botão "voltar à era de hoje" que leva o controle para t₀.

### Marcos, com selos
| Marco | Quando | Selo |
|---|---|---|
| Era de Planck | < ~10⁻⁴³ s | Hipótese em pesquisa (física desconhecida) |
| Inflação | ~10⁻³⁶ a 10⁻³² s | Hipótese em pesquisa (ver Módulo 2.4, em breve) |
| Nucleossíntese primordial | ~1 s a ~20 min (T ≈ 10⁹ K por volta de 3 min) | Fato estabelecido (abundâncias de hélio e deutério medidas) |
| Igualdade matéria-radiação | z ≈ 3.400 | Consenso (derivado do ΛCDM) |
| Recombinação e fundo cósmico de micro-ondas | z ≈ 1.090, ~372 mil anos | Fato estabelecido |
| Idade das trevas e primeiras estrelas | ~100 a 200 milhões de anos | Hipótese em pesquisa; o JWST está observando galáxias cada vez mais cedo |
| Reionização | z ≈ 7,7 (Planck) | Consenso |
| Formação do Sol | 4,57 bilhões de anos atrás | Fato estabelecido; link para o Módulo 6 da Trilha 1 |
| Início da aceleração | z ≈ 0,63 | Fato estabelecido (supernovas, Nobel de 2011) |
| Energia escura passa a dominar | z ≈ 0,3 | Consenso |
| Hoje | 13,79 bilhões de anos | Fato estabelecido |
| Futuro dominado por Λ | expansão exponencial, e-dobra de ~17,5 bilhões de anos | Hipótese em pesquisa: depende de a energia escura ser constante (ver Módulo 2.2, em breve, e o DESI no Módulo 11) |

Confira as datas e as referências dos marcos antes de incluir.

### O que este modelo deixa de fora
- Neutrinos tratados como sem massa; a massa real desloca z_eq e, levemente, a idade.
- Universo exatamente plano; a curvatura medida é compatível com zero, mas não é zero por hipótese.
- Energia escura constante (w = −1); o Módulo 2.2 vai abrir essa hipótese.
- Antes da nucleossíntese, a física de partículas em altas energias (transições de fase, matéria escura, bariogênese) não é modelada.

### Referências (conferir cada uma)
- N. Aghanim et al. (Planck), A&A 641, A6 (2020).
- D. J. Fixsen, ApJ 707, 916 (2009), temperatura do fundo cósmico.
- B. D. Fields et al., revisão de nucleossíntese primordial no Review of Particle Physics do PDG (edição mais recente).
- S. Perlmutter et al. (1999) e A. G. Riess et al. (1998), descoberta da aceleração.

## Entrega
1. Física e testes do resolvedor de Friedmann, com todos os valores de referência acima.
2. Reorganização das trilhas, sem quebrar rotas; a régua de tempo cósmico; a página do Módulo 2.1.
3. Rode o script de capturas em 360 px e desktop: página inicial nova, página de cada trilha, e o Módulo 2.1 nos marcos de recombinação, hoje e futuro, e com os dois atalhos de H₀. Abra as imagens, corrija o que aparecer e me mostre uma tabela com os valores exibidos em cada marco.
4. Confirme que todas as rotas antigas continuam respondendo.
5. Commit na main, sem publicar ainda.
