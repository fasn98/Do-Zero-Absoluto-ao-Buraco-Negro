import { useEffect, useRef, useState } from 'react';
import { superscript } from '../../lib/format';

export type ClockMark = {
  id: string;
  label: string;
  /** Intervalo em segundos (igual para valores pontuais). */
  range: [number, number];
  family: 'decoerencia' | 'neural' | 'colapso';
  highlight?: boolean;
};

const X_MIN = -25;
const X_MAX = 0;
const COLORS: Record<ClockMark['family'], string> = {
  decoerencia: 'hsl(var(--accent))',
  neural: 'hsl(var(--primary))',
  colapso: 'hsl(var(--chart-5))',
};

/**
 * Corrida de relógios: cada linha é um tempo (ou intervalo de tempos) num eixo logarítmico de
 * 10⁻²⁵ s a 1 s. A faixa sombreada marca a escala dos processos neurais.
 */
export function ClockRace({ marks, neuralBand }: { marks: ClockMark[]; neuralBand: [number, number] }) {
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const narrow = W < 520;
  // No celular, o rótulo vai numa linha própria, acima da barra.
  const ROW = narrow ? 40 : 30;
  const pad = { left: narrow ? 10 : 250, right: 16, top: 10, bottom: 40 };
  const H = pad.top + ROW * marks.length + pad.bottom;
  const sx = (seconds: number) => pad.left + ((Math.log10(seconds) - X_MIN) / (X_MAX - X_MIN)) * (W - pad.left - pad.right);
  const ticks = narrow ? [-25, -20, -15, -10, -5, 0] : [-25, -20, -15, -10, -5, -3, 0];
  return <figure className="plot" ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tempos de decoerência, de colapso e da atividade neural, em escala logarítmica de 10⁻²⁵ s a 1 s">
      <rect x={sx(neuralBand[0])} y={pad.top - 4} width={sx(neuralBand[1]) - sx(neuralBand[0])} height={ROW * marks.length + 4} style={{ fill: 'hsl(var(--primary) / .1)' }} />
      {ticks.map((t) => <g key={t}>
        <line x1={sx(10 ** t)} x2={sx(10 ** t)} y1={pad.top - 4} y2={H - pad.bottom} style={{ stroke: 'hsl(var(--border))' }} />
        <text x={sx(10 ** t)} y={H - pad.bottom + 16} textAnchor="middle" className="plot-tick">{t === 0 ? '1 s' : `10${superscript(t)}`}</text>
      </g>)}
      <text x={(W + pad.left) / 2} y={H - 6} textAnchor="middle" className="plot-axis">tempo (segundos, escala logarítmica)</text>
      {marks.map((m, i) => {
        const y = pad.top + ROW * i + (narrow ? 26 : ROW / 2);
        // Tempos acima de 1 s ficam presos na borda direita, com uma seta.
        const off = m.range[0] > 10 ** X_MAX;
        const x0 = sx(Math.min(m.range[0], 10 ** X_MAX));
        const x1 = sx(Math.min(m.range[1], 10 ** X_MAX));
        const color = COLORS[m.family];
        return <g key={m.id} data-testid={`mark-12-${m.id}`} opacity={m.highlight === false ? 0.45 : 1}>
          <text x={narrow ? pad.left : pad.left - 10} y={narrow ? y - 11 : y + 4} textAnchor={narrow ? 'start' : 'end'} className="plot-region" style={{ fill: 'hsl(var(--foreground))', fontWeight: m.highlight ? 700 : 400 }}>{m.label}</text>
          {off
            ? <path d={`M ${x0 - 10} ${y - 5} L ${x0} ${y} L ${x0 - 10} ${y + 5} Z`} style={{ fill: color }} />
            : x1 - x0 > 3
              ? <rect x={x0} y={y - 4} width={x1 - x0} height={8} rx={4} style={{ fill: color }} />
              : <circle cx={x0} cy={y} r={5} style={{ fill: color }} />}
        </g>;
      })}
    </svg>
    <figcaption className="plot-legend">
      <span><svg width="14" height="10" aria-hidden="true"><circle cx="7" cy="5" r="4" style={{ fill: COLORS.decoerencia }} /></svg>decoerência estimada</span>
      <span><svg width="14" height="10" aria-hidden="true"><circle cx="7" cy="5" r="4" style={{ fill: COLORS.colapso }} /></svg>colapso de Diósi-Penrose (hipótese)</span>
      <span><svg width="14" height="10" aria-hidden="true"><circle cx="7" cy="5" r="4" style={{ fill: COLORS.neural }} /></svg>atividade neural (medida)</span>
      <span><svg width="22" height="10" aria-hidden="true"><rect x="1" y="1" width="20" height="8" style={{ fill: 'hsl(var(--primary) / .1)' }} /></svg>escala dos processos neurais</span>
    </figcaption>
  </figure>;
}
