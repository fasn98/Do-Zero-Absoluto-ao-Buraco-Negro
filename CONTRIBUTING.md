# Como contribuir

Obrigado pelo interesse! Este projeto é um app educativo de física em português, e toda contribuição precisa respeitar a regra principal: **separar com rigor fato estabelecido, consenso e hipótese em pesquisa**, sem nada inventado ou sensacionalista.

*English: contributions are welcome in Portuguese or English. Please read the evidence-tag and source rules below; open an issue before large changes.*

## Formas de contribuir

- **Relatar um erro de física ou de número:** use o modelo "Erro de física ou de número" em [Issues](https://github.com/fasn98/Do-Zero-Absoluto-ao-Buraco-Negro/issues/new/choose). Diga o módulo, o valor exibido, o valor que você esperava e a fonte (de preferência com DOI).
- **Relatar um erro de interface:** use o modelo "Erro de interface", com o navegador, a largura da tela e, se possível, uma captura.
- **Sugerir um módulo:** use o modelo "Sugestão de módulo", com o tema, o público, as fontes e o que é fato, consenso ou hipótese no assunto.
- **Enviar código ou texto:** abra antes uma issue para combinar o escopo; depois, um pull request para a branch `main`.

## Como rodar o projeto e os testes

Requisitos: Node.js 24 e pnpm 10.

```bash
pnpm install
cd artifacts/zero-absoluto
PORT=5173 BASE_PATH=/ pnpm run dev    # app em http://localhost:5173
pnpm run typecheck                    # tipos
pnpm test                             # testes (Vitest)
```

A validação independente da verossimilhança cosmológica (Módulo 2.3) roda em Python, a partir da raiz do repositório:

```bash
pip install numpy scipy
python3 scripts/validacao_cosmo.py pontos   # regrava os χ² de referência usados pelos testes
python3 scripts/validacao_cosmo.py ajuste   # melhores ajustes e Δχ²
```

Um pull request só é aceito com o typecheck limpo e todos os testes passando.

## Convenções

As convenções completas estão no [CLAUDE.md](CLAUDE.md). As essenciais:

- **Física em funções puras** em `artifacts/zero-absoluto/src/physics/`, separada da interface, e cada função com teste que compara o resultado com um **valor de referência publicado** (tolerância de 2%, salvo justificativa).
- **Constantes fundamentais** só em `src/physics/constants.js`, com unidade e fonte comentadas.
- **Formatador compartilhado** (`src/lib/format.ts`), com 3 algarismos significativos e separadores do português.
- Interface em português do Brasil, funcionando em 360 px e no desktop, nos temas claro e escuro.

### Selos de evidência

Toda afirmação importante leva um selo, que diz **o quanto sabemos**, e não o quanto o número é preciso:

| Selo | Quando usar |
|---|---|
| **Fato estabelecido** | medido diretamente ou confirmado por evidências independentes |
| **Consenso** | aceito pela comunidade com base num modelo bem testado, mas derivado dele |
| **Hipótese em pesquisa** | proposta séria e testável, ainda sem confirmação |

Na dúvida, use o selo mais fraco e explique por quê.

### Fontes

- Cada número e cada afirmação vêm de uma fonte citável. **Abra o DOI** e confira autores, título, revista, volume, página e ano antes de incluir a referência.
- Se uma fonte primária não estiver acessível, diga isso; não cite um número que você não conferiu.
- Todo módulo termina com "O que este modelo deixa de fora" e com as referências.
- Problemas encontrados nas fontes (erros de digitação, inconsistências) vão para [docs/achados.md](docs/achados.md), com o cálculo.

## Código de conduta

Este projeto segue o [Código de Conduta](CODE_OF_CONDUCT.md) (Contributor Covenant 2.1). Ao participar, você concorda em respeitá-lo.
