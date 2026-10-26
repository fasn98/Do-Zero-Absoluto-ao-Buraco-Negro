/// <reference lib="webworker" />
// Web Worker do Módulo 2.3: calcula a grade w₀ × w_a fora da linha principal, sem travar a página.
import { handleGridRequest, type GridRequest } from './gridProtocol';

const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.onmessage = (event: MessageEvent<GridRequest>) => handleGridRequest(event.data, (message) => scope.postMessage(message));
