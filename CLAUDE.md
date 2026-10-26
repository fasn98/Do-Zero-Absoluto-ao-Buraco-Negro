# Do Zero Absoluto ao Buraco Negro

App educativo em português do Brasil (React + Vite + TypeScript, roteamento com `wouter`) para adultos curiosos com formação técnica, sem serem físicos. Cada módulo tem simulações interativas baseadas **apenas em física estabelecida e verificável**. Nada inventado, nada sensacionalista.

**Regra principal: separar com rigor fato estabelecido, consenso e hipótese em pesquisa.**

O app fica em `artifacts/zero-absoluto/`. O resto do workspace pnpm (`artifacts/api-server`, `artifacts/mockup-sandbox`, `lib/`, `scripts/`) é o esqueleto do Replit e não é usado pelo app.

## Trilhas e módulos

A página inicial (`/`) apresenta as duas trilhas lado a lado (empilhadas no celular). Cada trilha tem sua própria página. As rotas dos módulos da Trilha 1 são as originais e **nunca podem mudar**.

### Trilha 1 · Do zero absoluto ao buraco negro (`/trilha-1`)
Régua de **temperatura** (1 nK até a temperatura de Planck) e 12 módulos. Contador "01 / 12".

| Nº | Módulo | Rota |
|---|---|---|
| 01 | Perto do zero absoluto | `/perto-do-zero-absoluto` |
| 02 | Entropia e informação | `/entropia-e-informacao` |
| 03 | Por que o Sol brilha | `/por-que-o-sol-brilha` |
| 04 | Fusão a frio e fusão por múons | `/fusao-a-frio-e-por-muons` |
| 05 | A temperatura dos buracos negros | `/a-temperatura-dos-buracos-negros` |
| 06 | O nascimento do Sol | `/o-nascimento-do-sol` |
| 07 | A gravidade guarda informação | `/a-gravidade-guarda-informacao` |
| 08 | Ouvindo o universo se expandir | `/ouvindo-o-universo` |
| 09 | As forças convergem? | `/as-forcas-convergem` |
| 10 | Onde o quântico vira clássico | `/quantico-para-classico` |
| 11 | A pior previsão da física | `/pior-previsao` |
| 12 | A consciência é quântica? | `/a-consciencia-e-quantica` |

### Trilha 2 · Origem e destino do universo (`/trilha-2`)
Régua de **tempo cósmico** (tempo de Planck, ~5,39 × 10⁻⁴⁴ s, até 100 trilhões de anos), sincronizada com o Módulo 2.1. Contador "2.1 / 2.5". Módulos sem rota aparecem como "em breve", sem link.

| Nº | Módulo | Rota |
|---|---|---|
| 2.1 | A linha do tempo cósmica | `/a-linha-do-tempo-cosmica` |
| 2.2 | Os destinos possíveis | `/os-destinos-possiveis` |
| 2.3 | Confronto com dados reais | `/confronto-com-dados-reais` |
| 2.4 | Inflação e perturbações | em breve |
| 2.5 | A fronteira | em breve |

As trilhas e os módulos ficam declarados em `src/modules/tracks.ts` (Trilha 1 reaproveita `MODULES` de `temperatureBands.ts`). Para ativar um módulo "em breve", dê a ele um `path` e registre a rota em `src/App.tsx`.

## Onde as coisas ficam (`artifacts/zero-absoluto/src/`)

- `App.tsx`: página inicial, menu do topo (mostra a trilha atual e seus módulos), rotas.
- `pages/TrackOne.tsx`, `pages/TrackTwo.tsx`, `pages/TrackModules.tsx`: páginas das trilhas e grade de cards.
- `modules/ModulePage.tsx`: estrutura comum de todo módulo (breadcrumb com a trilha, "O que este modelo deixa de fora", referências, contador por trilha).
- `modules/shared.tsx`: `Sym`, `EvidenceTag`, `Claim`, `SimCard`, `Stat`, `StatGrid`, `Segmented` e controles.
- `modules/Plot.tsx`: gráfico de linhas em SVG próprio (séries, marcadores, regiões sombreadas, pontos rotulados). Sem biblioteca de gráficos.
- `physics/friedmann.ts`: resolvedor de Friedmann (Módulo 2.1), com energia escura w(a) = w₀ + w_a(1 − a) opcional; `physics/cosmicFates.ts`: Big Rip, recontração e CPL (Módulo 2.2).
- `physics/cosmoLikelihood.ts`, `physics/linalg.ts`: distâncias (D_M, D_H, D_V, r_s, r_d, R, l_A) e χ² do BAO, do CMB comprimido e das supernovas (Módulo 2.3).
- `physics/cosmoFit.ts`: perfil (Levenberg-Marquardt), grade w₀ × w_a, conversão Δχ² → σ e faixa de w(z); roda num Web Worker (`modules/confronto-com-dados-reais/grid.worker.ts`). `lib/contours.ts`: interpolação e isolinhas.
- `data/cosmo/`: dados reais do Módulo 2.3 (ver "Dados cosmológicos" abaixo).
- `modules/cosmicMilestones.ts`, `modules/cosmicTime.tsx`: marcos da história cósmica com selos e a régua de tempo compartilhada (estado em `sessionStorage`).
- `modules/<modulo>/Page.tsx`: interface de cada módulo.
- `lib/format.ts`: formatador compartilhado.
- `physics/constants.js`: única fonte de constantes fundamentais.
- `physics/*.ts`: física de cada módulo, com `*.test.ts` ao lado.

## Convenções (obrigatórias)

- **Física em funções puras** em `src/physics/`, separada da interface. Cada função tem teste unitário em Vitest comparando com valores de referência publicados, **tolerância de 2%**, salvo quando a tarefa pedir outra (por exemplo, 0,5% para a idade do universo).
- **Constantes fundamentais só em `src/physics/constants.js`** (CODATA 2022, IAU 2015, PDG, AME 2020), cada uma com unidade e fonte comentadas. Não redefina constantes em outro arquivo.
- **Parâmetros de modelo** (cosmológicos etc.) ficam no arquivo de física do módulo, com a fonte comentada (ex.: Planck 2018 em `friedmann.ts`).
- Números muito pequenos ou muito grandes: trabalhe em log (`logmath.ts`, log-sum-exp, `ln a`) para evitar underflow e overflow.
- **Formatador compartilhado** em `lib/format.ts`: **3 algarismos significativos** (`formatSig`), separadores pt-BR (vírgula decimal, ponto de milhar), notação científica com sobrescritos, `formatFromLog10` para valores fora do alcance do ponto flutuante, `formatDuration` e `formatTemperature`. Não formate números à mão nos módulos.
- **Componente `Sym`** para todo símbolo ou fórmula no texto (usa espaços não separáveis; a fórmula nunca quebra no meio).
- **`ModulePage`** em todo módulo, com selos de evidência (`EvidenceTag`/`Claim`): **fato estabelecido**, **consenso** ou **hipótese em pesquisa**. O selo diz o quanto sabemos, não o quanto o número é preciso.
- Todo módulo termina com **"O que este modelo deixa de fora"** (prop `limitations`) e com **referências com DOI conferido** (prop `references`; abra cada DOI e confira autores, revista, volume, página e ano antes de incluir).
- Funciona em **360 px** e no desktop, tema claro e escuro. Sem emojis na interface.
- Textos da interface e comentários do código em português do Brasil.

## Dados cosmológicos (`src/data/cosmo/`)

Cada arquivo tem cabeçalho com fonte, DOI, versão, data de download e licença. Não altere números; para atualizar, baixe de novo da fonte e registre a nova versão.

| Arquivo | Conteúdo | Fonte | Licença |
|---|---|---|---|
| `desi_dr2_bao_mean.txt`, `desi_dr2_bao_cov.txt` | 13 medidas de D_V/r_d, D_M/r_d, D_H/r_d e covariância | DESI DR2, PRD 112, 083515 (2025), DOI 10.1103/tr6y-kpc6; arquivo oficial em `CobayaSampler/bao_data`, commit b7b8a36e9b | repositório sem licença; números publicados no artigo (CC BY 4.0) |
| `planck2018_distance_priors.txt` | R, l_A, ω_b e a inversa da covariância (Planck 2018 TT,TE,EE+lowE, ΛCDM) | Chen, Huang e Wang, JCAP 02, 028 (2019), DOI 10.1088/1475-7516/2019/02/028, apêndice | números do artigo, com atribuição |
| `union3_compressed.txt` | 22 nós de módulo de distância e a inversa da covariância | Rubin et al., arXiv:2311.12098; `rubind/union3_release`, `mu_mat_union3_cosmo=2_mu.fits`, commit a3e75550b4 | MIT |
| `validacao_python.json` | χ² de referência em pontos fixos, gerados por `scripts/validacao_cosmo.py pontos` | — | — |

As médias do BAO coincidem com a Tabela IV do artigo; os desvios e correlações do arquivo oficial diferem dos da tabela em até ~6% (a tabela traz médias e desvios das posteriores marginalizadas). O artigo indica o arquivo do Cobaya como a verossimilhança oficial.

**Achados nas fontes (detalhes e cálculos em `docs/achados.md`):**
- Chen, Huang e Wang (2019), eq. 9: o texto traz g₁ = 0,0738; o código do apêndice e a fórmula de Hu e Sugiyama (ver Komatsu et al., ApJS 180, 330, 2009, eq. 67) usam **0,0783**. Usamos 0,0783. A troca mudaria l_A em 0,24 (2,7σ do prior).
- Chen, Huang e Wang (2019): as médias do prior de l_A foram calculadas com o z* das cadeias do Planck (1.089,95), mas a teoria usa a fórmula de Hu e Sugiyama (1.091,94 para os mesmos parâmetros). No melhor ajuste do Planck, isso põe l_A a 3,6σ do prior; no ajuste, a diferença vira +0,17 km/s/Mpc em H₀. Seguimos o artigo à risca.
- Neutrinos de 0,06 eV como matéria não mudam o ajuste (reparametrização); não foram incluídos.

**Validação independente em Python:** `scripts/validacao_cosmo.py` (numpy e scipy, que o Replit não tem; vêm do Nix):

```bash
nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_cosmo.py pontos"   # regrava validacao_python.json
nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_cosmo.py ajuste"   # melhores ajustes e Δχ²
nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_cosmo.py mcmc"     # médias a posteriori
```

O teste `physics/cosmoLikelihood.test.ts` compara o TypeScript com `validacao_python.json` (tolerância de 0,1 em χ²). Se mudar a física de um lado, regrave o JSON e rode os testes.

## Comandos

Na pasta `artifacts/zero-absoluto/` (ou com `pnpm --filter @workspace/zero-absoluto run <script>` na raiz):

```bash
pnpm run typecheck
pnpm test
pnpm run dev                                  # porta 19201
PORT=19201 BASE_PATH=/ pnpm run build         # saída em dist/public
```

## Capturas de tela

Script versionado: `scripts/capturas.mjs`. Usa o Chromium headless do Replit (`/repl/tools/bin/chromium`) pelo protocolo DevTools, sem dependências. O servidor de desenvolvimento precisa estar rodando (porta 19201). Rode da raiz do workspace:

```bash
node scripts/capturas.mjs                                    # conjunto padrão, 360 px e 1440 px
node scripts/capturas.mjs /trilha-1 /pior-previsao           # rotas escolhidas
node scripts/capturas.mjs --larguras=360 /trilha-2           # só celular
node scripts/capturas.mjs --tema=escuro /                    # tema escuro
node scripts/capturas.mjs --avaliar='document.title' /       # só avalia JS na página, sem imagem
```

- Saída em `capturas/` (fora do Git): `<rota>_<largura>.png`, página inteira, e `<rota>_<largura>.txt` com o texto de todos os elementos `data-testid="text-*"`, para conferir os valores exibidos.
- Para cada página, o script avisa `ROLAGEM HORIZONTAL` se a página for mais larga que a janela.
- Parâmetros de URL do Módulo 2.1 e da régua da Trilha 2: `?marco=<id>` (planck, inflacao, nucleossintese, igualdade, recombinacao, primeiras-estrelas, reionizacao, sol, aceleracao, energia-escura, hoje, futuro), `?t=<segundos>` (tem prioridade sobre o marco) e `?h0=shoes` (só no Módulo 2.1). Exemplo: `"/a-linha-do-tempo-cosmica?marco=hoje&h0=shoes"`.
- Parâmetro de URL do Módulo 2.2: `?atalho=<id>` (lcdm, big-rip, recontracao, desi). Exemplo: `"/os-destinos-possiveis?atalho=big-rip"`.
- Parâmetros de URL do Módulo 12: `?decoerencia=<id>` (tegmark-neuronio, tegmark-microtubulo, hagan, hagan-agua) e `?massa=<id>` (proteina, nucleons, nucleons-r0).
- Parâmetro de URL do Módulo 2.3: `?dados=<id>` (bao, bao-cmb, bao-cmb-sn). A captura espera o Web Worker terminar (nenhum elemento com `aria-busy="true"`, até 120 s).
- `--cpu=4` limita a CPU (celular simulado). **A limitação do Chrome não alcança Web Workers**: para medir a grade do 2.3 em celular simulado, rode a mesma função na linha principal, por exemplo `node scripts/capturas.mjs --cpu=4 --larguras=360 --avaliar='(async () => { const m = await import("/src/physics/cosmoFit.ts"); const t = performance.now(); m.scanGrid("bao+cmb+sn"); return performance.now() - t; })()' /trilha-2`.
- Imagens altas: corte em pedaços antes de abrir, por exemplo `magick arquivo.png -crop x3000 +repage pedaco_%02d.png`.
- Não use `captureBeyondViewport`: ele distorce os gráficos de `Plot.tsx`, que medem a própria largura. O script aumenta a janela até a altura da página antes de capturar.

Rotina esperada: capturar cada página alterada em 360 px e desktop, abrir as imagens, corrigir o que aparecer e informar os valores exibidos.

## Fluxo de entrega e publicação

1. Typecheck e testes passando.
2. Capturas em 360 px e desktop, conferidas.
3. Conferir que todas as rotas antigas continuam respondendo.
4. **Commit na `main`**, mensagem no padrão "Módulo N: título" (ex.: "Módulo 2.1: A linha do tempo cósmica").
5. Publicar **só quando o usuário pedir** (o Replit cria o commit "Published your App").
6. Depois de publicar, **conferir o hash do build**: o nome do bundle em `dist/public/index.html` (`assets/index-<hash>.js`) deve ser o mesmo servido pelo site publicado.

O `.gitignore` e o `.replitignore` excluem `.claude-persist/` e `.claude-bin/` (login, histórico e memória do Claude Code) e `capturas/`: eles nunca podem ir para o Git nem para a imagem publicada. Confira os dois arquivos antes de publicar.

## Histórico de tarefas

Os enunciados completos das tarefas ficam em `docs/prompts/`. A tarefa da Trilha 2, Fase 1 está em `docs/prompts/trilha2-fase1.md`; a da Fase 2 (Módulo 2.2), em `docs/prompts/trilha2-fase2.md`; a da Fase 3 (Módulo 2.3), em `docs/prompts/trilha2-fase3.md`; a do Módulo 12, em `docs/prompts/modulo-12.md`.
