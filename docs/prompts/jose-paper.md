# Submissão ao JOSE: artigo, diretrizes de comunidade e PDF de rascunho

Leia o CLAUDE.md. Salve esta tarefa em docs/prompts/jose-paper.md.

Vamos preparar a submissão ao Journal of Open Source Education (JOSE), na categoria de software educacional. Antes de escrever, leia e siga as instruções oficiais:
- https://openjournals.readthedocs.io/en/jose/submitting.html
- https://openjournals.readthedocs.io/en/jose/review_criteria.html
- a política de IA das Open Journals: https://joss.readthedocs.io/en/latest/policies.html
Se alguma exigência que você encontrar nessas páginas contradisser este prompt, siga a página e me diga o que mudou.

1. paper/paper.md, em inglês, com no máximo ~1.000 palavras de corpo, no formato das Open Journals (front matter YAML com title, tags, authors com name "Fabio Augusto Sales Nogueira" e orcid 0009-0001-9303-8707, affiliations, date e bibliography). Afiliação: deixe "Independent researcher, São Paulo, Brazil" e me pergunte se quero outra. Seções:
   - Summary: o que é o app, as duas trilhas, o link do site e o DOI de conceito 10.5281/zenodo.23674690.
   - Statement of need: o público (estudantes de graduação e ensino médio avançado, professores, falantes de português); a lacuna (simulações de física moderna e de escalas extremas em português, que separem explicitamente fato estabelecido, consenso e hipótese, e digam o que cada modelo deixa de fora); como outros podem adotar o app (uso direto no navegador, módulos independentes, licença MIT e CC BY 4.0). Compare em uma frase com o PhET, sem afirmar que o PhET não cobre um tema antes de conferir no catálogo do PhET.
   - Design and verification: física em funções puras com testes, valores de referência da literatura, cálculo independente em Python, reprodução das análises publicadas do DESI DR2 no Módulo 2.3 (citando os números do docs/achados.md), selos de evidência, referências com DOI conferidas.
   - Experience of use: deixe um bloco marcado "TODO (Fabio): fatos reais de uso" e não escreva nada inventado.
   - Story of the project: curta, factual, baseada nos commits e em docs/prompts/.
   - AI usage disclosure: ferramentas e versões (Claude Code; descubra a versão pelo cc.sh ou pelo pacote instalado, e o modelo usado conforme os registros disponíveis, sem inventar), onde foram usadas (código, textos das páginas, busca e conferência de referências), e a afirmação de que o autor revisou, modificou e validou o conteúdo, com os mecanismos concretos (testes, validação em Python, capturas, conferência de DOIs, correções registradas).
   - Acknowledgements: deixe "TODO (Fabio)".
   - References.
2. paper/paper.bib com as referências-chave em BibTeX: as do DESI DR2, Chen, Huang e Wang, Union3, Planck 2018, as principais da Trilha 1 e o próprio software no Zenodo. Cada DOI conferido.
3. Diretrizes de comunidade exigidas pelos critérios: CONTRIBUTING.md (como contribuir, como rodar os testes, a convenção de selos e de fontes), templates de issue em .github/ISSUE_TEMPLATE/ (erro de física ou de número, erro de interface, sugestão de módulo), e uma seção "Suporte" no README. Inclua um CODE_OF_CONDUCT.md (Contributor Covenant 2.1).
4. Gere o PDF de rascunho com a GitHub Action oficial das Open Journals (openjournals/openjournals-draft-action), num workflow que roda só quando paper/ muda. Confira que o PDF compila e me diga quantas palavras tem o corpo.
5. Rode os testes, commit e push só da main. Não submeta nada ao JOSE e não crie release.

No fim, me mostre o paper.md inteiro e a lista do que ficou como TODO.
