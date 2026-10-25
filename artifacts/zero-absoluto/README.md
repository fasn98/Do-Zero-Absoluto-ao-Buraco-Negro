# Do Zero Absoluto ao Buraco Negro

Aplicação educativa em português do Brasil para explorar conceitos de
termodinâmica e física quântica. Esta primeira versão organiza o conteúdo,
oferece uma escala logarítmica de temperatura e prepara a camada de cálculos;
as simulações ainda não foram implementadas.

## Executar

No workspace pnpm:

```bash
pnpm --filter @workspace/zero-absoluto run dev
```

Verificar os tipos e executar os testes:

```bash
pnpm --filter @workspace/zero-absoluto run typecheck
pnpm --filter @workspace/zero-absoluto run test
```

## Estrutura

- `src/App.tsx`: página inicial, navegação persistente e definição das rotas.
- `src/modules/ModulePage.tsx`: estrutura compartilhada das páginas dos módulos.
- `src/modules/<modulo>/Page.tsx`: conteúdo de cada módulo, em pasta própria.
- `src/physics/constants.js`: constantes físicas com unidades comentadas.
- `src/physics/constants.d.ts`: tipos TypeScript das constantes em JavaScript.
- `src/physics/calculations.ts`: cálculos puros, separados da interface.
- `src/physics/calculations.test.ts`: testes unitários com Vitest.

## Rotas de conteúdo

- `/`: escala de temperatura de 1 nK a 1,4 × 10³² K.
- `/perto-do-zero-absoluto`: Perto do zero absoluto.
- `/entropia-e-informacao`: Entropia e informação.
- `/por-que-o-sol-brilha`: Por que o Sol brilha (pico de Gamow).
- `/fusao-a-frio-e-por-muons`: Fusão a frio e fusão por múons.
- `/a-temperatura-dos-buracos-negros`: A temperatura dos buracos negros.
- `/o-nascimento-do-sol`: O nascimento do Sol.

## Física

As constantes fundamentais estão baseadas no CODATA 2022; a massa solar é o
valor nominal adotado pela IAU em 2015. As funções implementadas calculam a
conversão entre posição e temperatura na escala logarítmica, a energia térmica
característica `kBT`, o raio de Schwarzschild e a temperatura de Hawking para
um buraco negro de Schwarzschild. Esses cálculos não constituem as simulações
dos módulos.
