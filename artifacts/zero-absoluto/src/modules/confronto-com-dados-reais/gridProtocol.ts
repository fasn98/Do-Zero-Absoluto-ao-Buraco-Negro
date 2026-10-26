import { DEFAULT_GRID, scanGrid, type GridResult } from '../../physics/cosmoFit';
import type { DataCombination } from '../../physics/cosmoLikelihood';

/** Mensagens entre a página do Módulo 2.3 e o Web Worker que calcula a grade. */
export type GridRequest = { combination: DataCombination };
export type GridMessage =
  | { type: 'progresso'; combination: DataCombination; fraction: number }
  | { type: 'resultado'; combination: DataCombination; result: GridResult; elapsedMs: number };

/** Atende um pedido: calcula a grade e envia o progresso e o resultado por `post`. */
export function handleGridRequest(request: GridRequest, post: (message: GridMessage) => void) {
  const t0 = performance.now();
  const result = scanGrid(request.combination, DEFAULT_GRID, (fraction) => post({ type: 'progresso', combination: request.combination, fraction }));
  post({ type: 'resultado', combination: request.combination, result, elapsedMs: performance.now() - t0 });
}
