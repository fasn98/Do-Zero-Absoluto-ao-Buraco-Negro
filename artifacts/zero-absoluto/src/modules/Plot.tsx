import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Series = { label: string; color: string; points: [number, number][]; dashed?: boolean; width?: number };
export type Marker = { x: number; label: string; color?: string };

type LinePlotProps = {
  series: Series[];
  xMin?: number;
  xMax: number;
  yMin?: number;
  yMax?: number;
  xTicks: number[];
  yTicks?: number[];
  formatX?: (x: number) => string;
  formatY?: (y: number) => string;
  xLabel: string;
  yLabel?: string;
  markers?: Marker[];
  band?: [number, number];
  height?: number;
  title: string;
  children?: ReactNode;
};

const PAD_BASE = { left: 44, right: 14, top: 14, bottom: 42 };
const LABEL_ROW = 16;

/** Gráfico de linhas em SVG puro, com cores das variáveis do tema. */
export function LinePlot({ series, xMin = 0, xMax, yMin = 0, yMax = 1, xTicks, yTicks = [0, 0.5, 1], formatX = String, formatY = String, xLabel, yLabel, markers = [], band, height = 300, title, children }: LinePlotProps) {
  // A largura do viewBox acompanha a largura real, para que os textos fiquem no tamanho em px.
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const visibleMarkers = markers.filter((m) => m.x >= xMin && m.x <= xMax);
  // Rótulos dos marcadores ficam numa faixa própria acima da área das curvas
  // (uma linha por marcador), então nunca se sobrepõem às curvas.
  const PAD = { ...PAD_BASE, top: PAD_BASE.top + LABEL_ROW * visibleMarkers.length };
  const H = (W < 480 ? Math.round(height * 0.85) : height) + LABEL_ROW * visibleMarkers.length;
  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * (W - PAD.left - PAD.right);
  const sy = (y: number) => H - PAD.bottom - ((y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const clampY = (y: number) => Math.min(yMax, Math.max(yMin, y));
  return <figure className="plot" ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      {band && <rect x={sx(band[0])} y={PAD.top} width={Math.max(0, sx(band[1]) - sx(band[0]))} height={H - PAD.top - PAD.bottom} style={{ fill: 'hsl(var(--accent) / .1)' }} />}
      {yTicks.map((y) => <g key={`y${y}`}>
        <line x1={PAD.left} x2={W - PAD.right} y1={sy(y)} y2={sy(y)} style={{ stroke: 'hsl(var(--border))' }} strokeWidth={1} />
        <text x={PAD.left - 7} y={sy(y) + 4} textAnchor="end" className="plot-tick">{formatY(y)}</text>
      </g>)}
      {xTicks.map((x) => <g key={`x${x}`}>
        <line x1={sx(x)} x2={sx(x)} y1={H - PAD.bottom} y2={H - PAD.bottom + 5} style={{ stroke: 'hsl(var(--muted-foreground))' }} />
        <text x={sx(x)} y={H - PAD.bottom + 18} textAnchor="middle" className="plot-tick">{formatX(x)}</text>
      </g>)}
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} style={{ stroke: 'hsl(var(--muted-foreground))' }} />
      <text x={(W + PAD.left) / 2} y={H - 6} textAnchor="middle" className="plot-axis">{xLabel}</text>
      {yLabel && <text x={12} y={(H - PAD.bottom + PAD.top) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(H - PAD.bottom + PAD.top) / 2})`} className="plot-axis">{yLabel}</text>}
      {visibleMarkers.map((m, i) => {
        const x = sx(m.x);
        const labelY = PAD_BASE.top + LABEL_ROW * i;
        const anchor = x > W - PAD.right - 70 ? 'end' : x < PAD.left + 70 ? 'start' : 'middle';
        return <g key={m.label}>
          <line x1={x} x2={x} y1={labelY + 4} y2={H - PAD.bottom} style={{ stroke: m.color ?? 'hsl(var(--accent))' }} strokeDasharray="4 4" />
          <text x={anchor === 'end' ? x + 4 : anchor === 'start' ? x - 4 : x} y={labelY} textAnchor={anchor} className="plot-marker" style={{ fill: m.color ?? 'hsl(var(--accent))' }}>{m.label}</text>
        </g>;
      })}
      {series.map((s) => <polyline key={s.label} fill="none" strokeWidth={s.width ?? 2} strokeLinejoin="round" strokeDasharray={s.dashed ? '6 5' : undefined} style={{ stroke: s.color }}
        points={s.points.map(([x, y]) => `${sx(x).toFixed(1)},${sy(clampY(y)).toFixed(1)}`).join(' ')} />)}
      {children}
    </svg>
    <figcaption className="plot-legend">{series.map((s) => <span key={s.label}><i style={{ background: s.color, opacity: s.dashed ? 0.6 : 1 }} />{s.label}</span>)}</figcaption>
  </figure>;
}

/** Ticks "redondos" para um intervalo [0, max]. */
export function niceTicks(max: number, count = 5): number[] {
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9 * max; t += step) ticks.push(Number(t.toPrecision(12)));
  return ticks;
}
