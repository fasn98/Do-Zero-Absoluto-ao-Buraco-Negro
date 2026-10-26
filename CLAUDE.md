# Do Zero Absoluto ao Buraco Negro

App educativo em português do Brasil (React + Vite + TypeScript, roteamento com `wouter`) para adultos curiosos com formação técnica, sem serem físicos. Cada módulo tem simulações interativas baseadas **apenas em física estabelecida e verificável**. Nada inventado, nada sensacionalista.

**Regra principal: separar com rigor fato estabelecido, consenso e hipótese em pesquisa.**

O app fica em `artifacts/zero-absoluto/`. O resto do workspace pnpm (`artifacts/api-server`, `artifacts/mockup-sandbox`, `lib/`, `scripts/`) é o esqueleto do Replit e não é usado pelo app.

## Trilhas e módulos

A página inicial (`/`) apresenta as duas trilhas lado a lado (empilhadas no celular). Cada trilha tem sua própria página. As rotas dos módulos da Trilha 1 são as originais e **nunca podem mudar**.

### Trilha 1 · Do zero absoluto ao buraco negro (`/trilha-1`)
Régua de **temperatura** (1 nK até a temperatura de Planck) e 11 módulos. Contador "01 / 11".

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

### Trilha 2 · Origem e destino do universo (`/trilha-2`)
Régua de **tempo cósmico** (tempo de Planck, ~5,39 × 10⁻⁴⁴ s, até 100 trilhões de anos), sincronizada com o Módulo 2.1. Contador "2.1 / 2.5". Módulos sem rota aparecem como "em breve", sem link.

| Nº | Módulo | Rota |
|---|---|---|
| 2.1 | A linha do tempo cósmica | `/a-linha-do-tempo-cosmica` |
| 2.2 | Os destinos possíveis | em breve |
| 2.3 | Confronto com dados reais | em breve |
| 2.4 | Inflação e perturbações | em breve |
| 2.5 | A fronteira | em breve |

As trilhas e os módulos ficam declarados em `src/modules/tracks.ts` (Trilha 1 reaproveita `MODULES` de `temperatureBands.ts`). Para ativar um módulo "em breve", dê a ele um `path` e registre a rota em `src/App.tsx`.

## Onde as coisas ficam (`artifacts/zero-absoluto/src/`)

- `App.tsx`: página inicial, menu do topo (mostra a trilha atual e seus módulos), rotas.
- `pages/TrackOne.tsx`, `pages/TrackTwo.tsx`, `pages/TrackModules.tsx`: páginas das trilhas e grade de cards.
- `modules/ModulePage.tsx`: estrutura comum de todo módulo (breadcrumb com a trilha, "O que este modelo deixa de fora", referências, contador por trilha).
- `modules/shared.tsx`: `Sym`, `EvidenceTag`, `Claim`, `SimCard`, `Stat`, `StatGrid`, `Segmented` e controles.
- `modules/Plot.tsx`: gráfico de linhas em SVG próprio (séries, marcadores, regiões sombreadas, pontos rotulados). Sem biblioteca de gráficos.
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

## Comandos

Na pasta `artifacts/zero-absoluto/` (ou com `pnpm --filter @workspace/zero-absoluto run <script>` na raiz):

```bash
pnpm run typecheck
pnpm test
pnpm run dev                                  # porta 19201
PORT=19201 BASE_PATH=/ pnpm run build         # saída em dist/public
```

## Capturas de tela

**Atenção: o script de capturas não está versionado no repositório.** As sessões anteriores usaram o Chromium headless do Replit (`/repl/tools/bin/chromium`, perfis em `.config/chromium-headless/`) apontando para o servidor de desenvolvimento, em 360 px de largura e em desktop. Ao recriar o script, salve-o em `scripts/` e atualize esta seção com o comando exato.

Rotina esperada: capturar cada página alterada em 360 px e desktop, abrir as imagens, corrigir o que aparecer e informar os valores exibidos.

## Fluxo de entrega e publicação

1. Typecheck e testes passando.
2. Capturas em 360 px e desktop, conferidas.
3. Conferir que todas as rotas antigas continuam respondendo.
4. **Commit na `main`**, mensagem no padrão "Módulo N: título" (ex.: "Módulo 2.1: A linha do tempo cósmica").
5. Publicar **só quando o usuário pedir** (o Replit cria o commit "Published your App").
6. Depois de publicar, **conferir o hash do build**: o nome do bundle em `dist/public/index.html` (`assets/index-<hash>.js`) deve ser o mesmo servido pelo site publicado.

## Histórico de tarefas

Os enunciados completos das tarefas ficam em `docs/prompts/`. A tarefa da Trilha 2, Fase 1 está em `docs/prompts/trilha2-fase1.md`.
