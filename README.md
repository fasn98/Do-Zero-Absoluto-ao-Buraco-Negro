# Do zero absoluto ao buraco negro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23674690.svg)](https://doi.org/10.5281/zenodo.23674690)

App educativo de física, em português do Brasil, para adultos curiosos com formação técnica, sem serem físicos. Cada módulo combina leitura com simulações interativas baseadas apenas em física estabelecida e verificável, e separa com rigor o que é **fato estabelecido**, o que é **consenso** e o que ainda é **hipótese em pesquisa**.

**Site:** https://do-zero-absoluto-ao-buraco-negro.replit.app

> **English summary.** *Do zero absoluto ao buraco negro* ("From absolute zero to the black hole") is an open educational physics web app in Brazilian Portuguese. Two tracks cover extreme temperatures and quantum matter (12 modules) and the history and fate of the universe (3 of 5 modules ready, including a confrontation of dark-energy scenarios with real DESI DR2, Planck 2018 and Union3 data). Every claim is tagged as established fact, consensus or open hypothesis. Physics lives in pure TypeScript functions tested against published values (Vitest); the cosmological likelihood is cross-checked by an independent Python script that reproduces the DESI DR2 w₀wₐ results. Code: MIT. Content: CC BY 4.0. The code was written with Claude Code (AI) and verified by tests, independent calculations and human review.

## As trilhas e os módulos

### Trilha 1 · Do zero absoluto ao buraco negro

Uma régua de temperatura, de 1 nK à temperatura de Planck, e 12 módulos:

| Nº | Módulo | Tema |
|---|---|---|
| 01 | [Perto do zero absoluto](https://do-zero-absoluto-ao-buraco-negro.replit.app/perto-do-zero-absoluto) | O que acontece com a matéria quando o movimento térmico quase desaparece? |
| 02 | [Entropia e informação](https://do-zero-absoluto-ao-buraco-negro.replit.app/entropia-e-informacao) | A seta do tempo, o demônio de Maxwell e o custo físico de apagar um bit. |
| 03 | [Por que o Sol brilha](https://do-zero-absoluto-ao-buraco-negro.replit.app/por-que-o-sol-brilha) | O pico de Gamow e a chance extraordinária de dois prótons se fundirem. |
| 04 | [Fusão a frio e fusão por múons](https://do-zero-absoluto-ao-buraco-negro.replit.app/fusao-a-frio-e-por-muons) | Entre uma promessa que não se confirmou e um mecanismo quântico real. |
| 05 | [A temperatura dos buracos negros](https://do-zero-absoluto-ao-buraco-negro.replit.app/a-temperatura-dos-buracos-negros) | Radiação Hawking, entropia de horizonte e evaporação. |
| 06 | [O nascimento do Sol](https://do-zero-absoluto-ao-buraco-negro.replit.app/o-nascimento-do-sol) | Da nuvem molecular à estrela: uma história de gravidade e calor. |
| 07 | [A gravidade guarda informação](https://do-zero-absoluto-ao-buraco-negro.replit.app/a-gravidade-guarda-informacao) | Limite holográfico, curva de Page e a pergunta em aberto: a gravidade é quântica? |
| 08 | [Ouvindo o universo se expandir](https://do-zero-absoluto-ao-buraco-negro.replit.app/ouvindo-o-universo) | Ondas gravitacionais, a sirene padrão e a tensão de Hubble. |
| 09 | [As forças convergem?](https://do-zero-absoluto-ao-buraco-negro.replit.app/as-forcas-convergem) | As intensidades das forças mudam com a energia. Elas se encontram num ponto? |
| 10 | [Onde o quântico vira clássico](https://do-zero-absoluto-ao-buraco-negro.replit.app/quantico-para-classico) | Decoerência, recordes de superposição e o problema da medição. |
| 11 | [A pior previsão da física](https://do-zero-absoluto-ao-buraco-negro.replit.app/pior-previsao) | A energia do vácuo prevista erra por mais de cem ordens de grandeza. |
| 12 | [A consciência é quântica?](https://do-zero-absoluto-ao-buraco-negro.replit.app/a-consciencia-e-quantica) | Orch-OR, decoerência no cérebro quente e úmido, e o que os experimentos dizem. |

### Trilha 2 · Origem e destino do universo

Uma régua de tempo cósmico, do tempo de Planck a 100 trilhões de anos, e 5 módulos:

| Nº | Módulo | Tema |
|---|---|---|
| 2.1 | [A linha do tempo cósmica](https://do-zero-absoluto-ao-buraco-negro.replit.app/a-linha-do-tempo-cosmica) | Do primeiro segundo a 100 trilhões de anos: a equação de Friedmann conta a história do universo. |
| 2.2 | [Os destinos possíveis](https://do-zero-absoluto-ao-buraco-negro.replit.app/os-destinos-possiveis) | Expansão eterna, Big Rip ou Big Crunch: o desfecho depende da natureza da energia escura. |
| 2.3 | [Confronto com dados reais](https://do-zero-absoluto-ao-buraco-negro.replit.app/confronto-com-dados-reais) | Supernovas, oscilações acústicas e o fundo cósmico: quais cenários os dados reais ainda permitem. |
| 2.4 | Inflação e perturbações (em breve) | A hipótese da inflação e as pequenas flutuações que viraram galáxias. |
| 2.5 | A fronteira (em breve) | O que ainda não sabemos sobre o primeiro instante, a matéria escura e a energia escura. |

## Selos de evidência

Cada afirmação importante traz um selo, que diz **o quanto sabemos**, e não o quanto o número é preciso:

- **Fato estabelecido:** medido diretamente ou confirmado por evidências independentes (por exemplo, o fundo cósmico de micro-ondas).
- **Consenso:** aceito pela comunidade com base num modelo bem testado, mas derivado dele (por exemplo, a data da igualdade matéria-radiação no ΛCDM).
- **Hipótese em pesquisa:** proposta séria e testável, ainda sem confirmação (por exemplo, a inflação, a energia escura dinâmica ou o Orch-OR).

Todo módulo termina com "O que este modelo deixa de fora" e com referências de DOI conferido.

## Como rodar localmente

Requisitos: Node.js 24 e pnpm 10.

```bash
git clone https://github.com/fasn98/Do-Zero-Absoluto-ao-Buraco-Negro.git
cd Do-Zero-Absoluto-ao-Buraco-Negro
pnpm install

cd artifacts/zero-absoluto
PORT=5173 BASE_PATH=/ pnpm run dev       # abre em http://localhost:5173
PORT=5173 BASE_PATH=/ pnpm run build     # versão de produção em dist/public
```

As variáveis `PORT` e `BASE_PATH` são obrigatórias (o Vite as lê em `vite.config.ts`).

## Testes e validação

```bash
cd artifacts/zero-absoluto
pnpm run typecheck
pnpm test
```

A física fica em funções puras em `src/physics/`, cada uma com testes em Vitest que comparam os resultados com valores de referência publicados (tolerância de 2%, salvo indicação).

A verossimilhança do Módulo 2.3 (BAO do DESI DR2, distance priors do Planck 2018 e supernovas do Union3) tem uma **validação independente em Python**, que não usa o código TypeScript:

```bash
pip install numpy scipy
python3 scripts/validacao_cosmo.py pontos   # χ² em pontos fixos (o teste Vitest compara com o TypeScript)
python3 scripts/validacao_cosmo.py ajuste   # melhores ajustes e Δχ² entre ΛCDM e w₀wₐ
python3 scripts/validacao_cosmo.py mcmc     # médias a posteriori por MCMC (alguns minutos)
```

O script reproduz as médias de w₀ e wₐ publicadas pelo DESI DR2 a menos de 0,2σ. As diferenças conhecidas e os problemas encontrados nas fontes estão em [docs/achados.md](docs/achados.md).

## Uso de IA no desenvolvimento

O código deste projeto foi escrito com o **Claude Code** (Anthropic), sob direção e revisão de Fabio Augusto Sales Nogueira. Nada foi aceito só por ter sido gerado: os resultados foram verificados por

- **testes automatizados**, que comparam cada função de física com valores publicados;
- **cálculos independentes**, como o script em Python que refaz a verossimilhança cosmológica por outro caminho e reproduz os resultados publicados pelo DESI;
- **conferência das fontes**, abrindo cada DOI e cada número citado no artigo original;
- **revisão humana** do conteúdo, das capturas de tela e das decisões de apresentação.

Registros do processo:

- [docs/prompts/](docs/prompts/) é o registro dos enunciados usados para orientar o Claude Code, do primeiro (o dos simuladores, `forno_solar.md`) aos de cada fase e módulo.
- [cc.sh](cc.sh) é o script que mantém o Claude Code no Replit: guarda o programa, o login e o histórico dentro do workspace, que sobrevive às reinicializações do container (essas pastas ficam fora do Git e da versão publicada).
- [CLAUDE.md](CLAUDE.md) reúne as convenções do projeto que o Claude Code segue, e [docs/achados.md](docs/achados.md), os problemas encontrados nas fontes ao reproduzir análises publicadas.

## Como citar

Use o DOI de conceito, que reúne todas as versões e resolve sempre para a mais recente:

**Em português:**

> SALES NOGUEIRA, Fabio Augusto. *Do zero absoluto ao buraco negro*: app educativo de física com simulações interativas. Zenodo, 2026. Software. DOI: 10.5281/zenodo.23674690. Disponível em: https://doi.org/10.5281/zenodo.23674690.

**In English:**

> Sales Nogueira, F. A. (2026). *Do zero absoluto ao buraco negro* [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.23674690

Para citar exatamente a versão 1.0.0, use o DOI dela: [10.5281/zenodo.23674691](https://doi.org/10.5281/zenodo.23674691). Os metadados completos estão em [CITATION.cff](CITATION.cff); o GitHub gera a citação em outros formatos pelo botão "Cite this repository".

Autor: Fabio Augusto Sales Nogueira, ORCID [0009-0001-9303-8707](https://orcid.org/0009-0001-9303-8707).

## Licenças

- **Código:** MIT ([LICENSE](LICENSE)).
- **Textos, figuras e capturas de tela:** CC BY 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- **Dados de terceiros:** condições de cada fonte em [DATA-LICENSES.md](DATA-LICENSES.md).

Para citar o projeto, veja a seção "Como citar" acima.
