import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export type EvidenceLevel = 'fato' | 'consenso' | 'hipotese';

const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  fato: 'Fato estabelecido',
  consenso: 'Consenso',
  hipotese: 'Hipótese em pesquisa',
};

export function EvidenceTag({ level }: { level: EvidenceLevel }) {
  return <span className={`evidence evidence-${level}`}>{EVIDENCE_LABEL[level]}</span>;
}

/** Bloco de texto com selo de nível de evidência. */
export function Claim({ level, title, children }: { level: EvidenceLevel; title: string; children: ReactNode }) {
  return <article className="claim">
    <div className="claim-head"><h3>{title}</h3><EvidenceTag level={level} /></div>
    <div className="claim-body">{children}</div>
  </article>;
}

export function SimCard({ title, children, label }: { title: string; children: ReactNode; label?: string }) {
  return <section className="sim-card" aria-label={label ?? title}>
    <h2 className="sim-title">{title}</h2>
    {children}
  </section>;
}

/** Símbolo matemático ou letra grega: nunca passa por text-transform (λ não vira Λ, kT não vira KT). */
export function Sym({ children }: { children: ReactNode }) {
  return <span className="sym">{children}</span>;
}

export function Stat({ label, value, note, testId }: { label: ReactNode; value: ReactNode; note?: ReactNode; testId?: string }) {
  return <div className="stat">
    <span className="stat-label">{label}</span>
    <output className="stat-value" data-testid={testId}>{value}</output>
    {note && <span className="stat-note">{note}</span>}
  </div>;
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stat-grid">{children}</div>;
}

type LogSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  display: ReactNode;
  testId?: string;
  ends?: [string, string];
  /** Trecho do controle, a partir de `from`, que não é alcançável hoje: aparece hachurado. */
  hypothetical?: { from: number; label: string };
};

/** Controle deslizante uniforme em log₁₀ do valor. */
export function LogSlider({ value, min, max, onChange, label, display, testId, ends, hypothetical }: LogSliderProps) {
  const span = Math.log10(max / min);
  const position = Math.round((Math.log10(value / min) / span) * 1000);
  const hypoStart = hypothetical ? (Math.log10(hypothetical.from / min) / span) * 100 : null;
  return <div className="log-slider">
    <div className="log-slider-head"><span>{label}</span><output>{display}</output></div>
    <div className="slider-wrap">
    {hypoStart !== null && <span className="slider-hypothetical" style={{ left: `${hypoStart}%` }} aria-hidden="true" />}
    <input
      type="range" min="0" max="1000" step="1" value={Math.min(1000, Math.max(0, position))}
      className="temperature-slider"
      aria-label={label}
      style={{ '--slider-progress': `${position / 10}%` } as CSSProperties}
      onChange={(event) => onChange(min * 10 ** ((Number(event.target.value) / 1000) * span))}
      data-testid={testId}
    />
    </div>
    {ends && <div className="scale-ends"><span>{ends[0]}</span><span>{ends[1]}</span></div>}
    {hypothetical && hypoStart !== null && <div className="hypothetical-legend" style={{ paddingLeft: `min(${hypoStart}%, calc(100% - 210px))` }} data-testid={testId ? `${testId}-hypothetical` : undefined}><i aria-hidden="true" />{hypothetical.label}</div>}
  </div>;
}

export function Presets({ items, onSelect, isActive }: { items: { label: string; value: number }[]; onSelect: (value: number) => void; isActive: (value: number) => boolean }) {
  return <div className="presets" role="group" aria-label="Atalhos">
    {items.map((item) => <button type="button" key={item.label} className={isActive(item.value) ? 'preset active' : 'preset'} onClick={() => onSelect(item.value)} data-testid={`button-preset-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}</button>)}
  </div>;
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: NoInfer<T>; label: string }[]; value: T; onChange: (value: NoInfer<T>) => void; label: string }) {
  return <div className="segmented" role="radiogroup" aria-label={label}>
    {options.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} className={value === option.value ? 'active' : ''} onClick={() => onChange(option.value)} data-testid={`button-option-${option.value}`}>{option.label}</button>)}
  </div>;
}

/** Lê uma cor HSL de variável CSS (ex.: '--primary') já resolvida para o tema atual. */
export function cssColor(element: Element, variable: string, alpha = 1) {
  const raw = getComputedStyle(element).getPropertyValue(variable).trim();
  return `hsl(${raw} / ${alpha})`;
}

/**
 * Laço de animação em Canvas com ajuste para telas de alta densidade.
 * `draw` recebe o contexto, a largura e altura em pixels CSS e o passo de tempo (s).
 */
export function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void, running = true) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawRef.current(ctx, width, height, running ? dt : 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  return canvasRef;
}
