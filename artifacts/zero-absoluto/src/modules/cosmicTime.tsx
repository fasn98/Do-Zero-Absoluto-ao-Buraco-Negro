import { useSyncExternalStore, type CSSProperties } from 'react';
import { Link } from 'wouter';
import { ageOfUniverseS } from '../physics/friedmann';
import {
  COSMIC_TIME_MAX_S,
  COSMIC_TIME_MIN_S,
  SPECULATIVE_BEFORE_S,
  positionToTime,
  timeToPosition,
  type CosmicEpoch,
} from './cosmicMilestones';
import { EvidenceTag } from './shared';

// Instante cósmico compartilhado entre a régua da Trilha 2 e o Módulo 2.1.
// Fica na sessão do navegador, quando disponível, para sobreviver a recarregar a página.
const STORAGE_KEY = 'cosmic-time-s';
const listeners = new Set<() => void>();

function initialTime(): number {
  try {
    const stored = Number(window.sessionStorage.getItem(STORAGE_KEY));
    if (stored >= COSMIC_TIME_MIN_S && stored <= COSMIC_TIME_MAX_S) return stored;
  } catch { /* armazenamento indisponível */ }
  return ageOfUniverseS();
}

let current = typeof window === 'undefined' ? ageOfUniverseS() : initialTime();

export function setCosmicTime(timeS: number) {
  current = Math.min(COSMIC_TIME_MAX_S, Math.max(COSMIC_TIME_MIN_S, timeS));
  try { window.sessionStorage.setItem(STORAGE_KEY, String(current)); } catch { /* sem persistência */ }
  listeners.forEach((listener) => listener());
}

/**
 * Parâmetros de URL para abrir a linha do tempo num ponto exato (usados pelo
 * script de capturas e úteis para links): `?marco=<id>` vai até o marco e
 * `?t=<segundos>` até um instante. `t` tem prioridade.
 */
export function timeFromUrl(milestones: { id: string; anchor: number }[]): number | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const t = Number(params.get('t'));
  if (params.has('t') && t > 0) return t;
  const id = params.get('marco');
  return milestones.find((m) => m.id === id)?.anchor ?? null;
}

export function useCosmicTime(): [number, (timeS: number) => void] {
  const value = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => current,
  );
  return [value, setCosmicTime];
}

const STEPS = 2000;

/**
 * Controle de tempo cósmico, uniforme em log₁₀ t, do tempo de Planck a 100
 * trilhões de anos. O trecho antes de 1 s e o trecho depois de hoje ficam hachurados.
 */
export function CosmicTimeSlider({ value, onChange, todayS, testId }: { value: number; onChange: (timeS: number) => void; todayS: number; testId?: string }) {
  const position = Math.round(timeToPosition(value) * STEPS);
  const speculative = timeToPosition(SPECULATIVE_BEFORE_S) * 100;
  const today = timeToPosition(todayS) * 100;
  return <div className="cosmic-slider">
    <div className="slider-wrap">
      <span className="cosmic-zone speculative" style={{ left: 0, width: `${speculative}%` }} aria-hidden="true" />
      <span className="cosmic-zone projection" style={{ left: `${today}%`, right: 0 }} aria-hidden="true" />
      <span className="cosmic-today" style={{ left: `${today}%` }} aria-hidden="true" />
      <input
        type="range" min="0" max={STEPS} step="1" value={Math.min(STEPS, Math.max(0, position))}
        className="temperature-slider"
        aria-label="Tempo desde o Big Bang, em escala logarítmica"
        style={{ '--slider-progress': `${(position / STEPS) * 100}%` } as CSSProperties}
        onChange={(event) => onChange(positionToTime(Number(event.target.value) / STEPS))}
        data-testid={testId}
      />
    </div>
    <div className="cosmic-scale" aria-hidden="true">
      <span style={{ left: `${speculative}%` }}>1 s</span>
      <span className="today" style={{ left: `${today}%` }}>hoje</span>
    </div>
    <div className="scale-ends"><span>Planck · 5,39 × 10⁻⁴⁴ s</span><span>10¹⁴ anos</span></div>
    <div className="cosmic-legend">
      <span><i className="speculative" aria-hidden="true" />antes de 1 s: física especulativa ou desconhecida</span>
      <span><i className="projection" aria-hidden="true" />depois de hoje: projeção do ΛCDM</span>
    </div>
  </div>;
}

/** Aviso sobre a natureza do trecho da linha do tempo em que o controle está. */
export function EpochNotice({ epoch }: { epoch: CosmicEpoch }) {
  if (epoch === 'especulativa') {
    return <div className="band-item band-empty epoch-notice" data-testid="text-epoch-notice">
      <div><EvidenceTag level="hipotese" /><strong>Física especulativa ou desconhecida</strong><p>Antes de ~1 segundo não há observação direta do universo: o registro mais antigo é a nucleossíntese. A física de partículas medida em aceleradores vale até ~10⁻¹² s (escala eletrofraca); antes disso, tudo é extrapolação ou hipótese.</p></div>
    </div>;
  }
  if (epoch === 'projecao') {
    return <div className="band-item band-empty epoch-notice" data-testid="text-epoch-notice">
      <div><EvidenceTag level="hipotese" /><strong>Projeção do ΛCDM, não um fato</strong><p>Depois de hoje, a linha do tempo é o que o modelo prevê se a energia escura for uma constante cosmológica. O futuro depende do cenário: se ela variar, como os dados do DESI sugerem sem confirmação, ou crescer, o desfecho muda. <Link href="/os-destinos-possiveis" className="inline-link" data-testid="link-epoch-module-22">Compare os cenários no Módulo 2.2</Link>. O futuro mais distante, até 10¹⁰⁰ anos, e o piso de temperatura do universo estão no <Link href="/a-fronteira" className="inline-link" data-testid="link-epoch-module-25">Módulo 2.5, a fronteira</Link>.</p></div>
    </div>;
  }
  return null;
}
