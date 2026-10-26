import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type Series = { label: string; color: string; points: [number, number][]; dashed?: boolean; width?: number };
export type Marker = { x: number; label: string; color?: string };
/** Faixa vertical sombreada entre x = from e x = to, com rótulo opcional no topo. */
export type Region = { from: number; to: number; color: string; label?: string };
/** Ponto com rótulo curto (ex.: número de um marco). */
export type Dot = { x: number; y: number; label: string; color?: string; below?: boolean };
/** Faixa preenchida entre duas curvas (x, y de baixo, y de cima). */
export type Area = { label: string; color: string; points: [number, number, number][] };

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
  regions?: Region[];
  dots?: Dot[];
  areas?: Area[];
  height?: number;
  title: string;
  children?: ReactNode;
};

const PAD_BASE = { left: 44, right: 14, top: 14, bottom: 42 };
const LABEL_ROW = 16;

/** Gráfico de linhas em SVG puro, com cores das variáveis do tema. */
export function LinePlot({ series, xMin = 0, xMax, yMin = 0, yMax = 1, xTicks, yTicks = [0, 0.5, 1], formatX = String, formatY = String, xLabel, yLabel, markers = [], band, regions = [], dots = [], areas = [], height = 300, title, children }: LinePlotProps) {
  // A largura do viewBox acompanha a largura real, para que os textos fiquem no tamanho em px.
  const ref = useRef<HTMLElement>(null);
  const clipId = `plot-clip-${useId().replace(/:/g, '')}`;
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
  // Margem esquerda = título do eixo + rótulo de escala mais largo (~6,2 px por caractere a 10 px).
  const tickWidth = Math.max(...yTicks.map((y) => formatY(y).length)) * 6.2;
  const TITLE_SPACE = yLabel ? 22 : 0;
  const PAD = { ...PAD_BASE, left: Math.max(PAD_BASE.left, TITLE_SPACE + tickWidth + 12), top: PAD_BASE.top + LABEL_ROW * visibleMarkers.length };
  const H = (W < 480 ? Math.round(height * 0.85) : height) + LABEL_ROW * visibleMarkers.length;
  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * (W - PAD.left - PAD.right);
  const sy = (y: number) => H - PAD.bottom - ((y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const clampY = (y: number) => Math.min(yMax, Math.max(yMin, y));
  return <figure className="plot" ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <defs><clipPath id={clipId}><rect x={PAD.left} y={PAD.top - 2} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom + 4} /></clipPath></defs>
      {regions.map((r) => {
        const x0 = sx(Math.max(xMin, r.from));
        const x1 = sx(Math.min(xMax, r.to));
        if (x1 <= x0) return null;
        return <g key={`${r.from}-${r.label ?? ''}`}>
          <rect x={x0} y={PAD.top} width={x1 - x0} height={H - PAD.top - PAD.bottom} style={{ fill: r.color }} />
          {r.label && x1 - x0 > 34 && <text x={(x0 + x1) / 2} y={PAD.top + 13} textAnchor="middle" className="plot-region">{r.label}</text>}
        </g>;
      })}
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
      {yLabel && <text x={11} y={(H - PAD.bottom + PAD.top) / 2} textAnchor="middle" transform={`rotate(-90 11 ${(H - PAD.bottom + PAD.top) / 2})`} className="plot-axis">{yLabel}</text>}
      {visibleMarkers.map((m, i) => {
        const x = sx(m.x);
        const labelY = PAD_BASE.top + LABEL_ROW * i;
        const anchor = x > W - PAD.right - 70 ? 'end' : x < PAD.left + 70 ? 'start' : 'middle';
        return <g key={m.label}>
          <line x1={x} x2={x} y1={labelY + 4} y2={H - PAD.bottom} style={{ stroke: m.color ?? 'hsl(var(--accent))' }} strokeDasharray="4 4" />
          <text x={anchor === 'end' ? x + 4 : anchor === 'start' ? x - 4 : x} y={labelY} textAnchor={anchor} className="plot-marker" style={{ fill: m.color ?? 'hsl(var(--accent))' }}>{m.label}</text>
        </g>;
      })}
      <g clipPath={`url(#${clipId})`}>{areas.map((area) => <polygon key={area.label} style={{ fill: area.color }}
        points={[...area.points.map(([x, lo]) => `${sx(x).toFixed(1)},${sy(clampY(lo)).toFixed(1)}`), ...[...area.points].reverse().map(([x, , hi]) => `${sx(x).toFixed(1)},${sy(clampY(hi)).toFixed(1)}`)].join(' ')} />)}</g>
      <g clipPath={`url(#${clipId})`}>{series.map((s, index) => <polyline key={index} fill="none" strokeWidth={s.width ?? 2} strokeLinejoin="round" strokeDasharray={s.dashed ? '6 5' : undefined} style={{ stroke: s.color }}
        points={s.points.map(([x, y]) => `${sx(x).toFixed(1)},${sy(clampY(y)).toFixed(1)}`).join(' ')} />)}</g>
      {dots.filter((d) => d.x >= xMin && d.x <= xMax && d.y >= yMin && d.y <= yMax).map((d) => <g key={d.label}>
        <circle cx={sx(d.x)} cy={sy(d.y)} r={4} style={{ fill: d.color ?? 'hsl(var(--foreground))', stroke: 'hsl(var(--card))' }} strokeWidth={1.5} />
        <text x={sx(d.x)} y={sy(d.y) + (d.below ? 16 : -8)} textAnchor="middle" className="plot-dot">{d.label}</text>
      </g>)}
      {children}
    </svg>
    <figcaption className="plot-legend">{areas.map((area) => <span key={area.label}><svg width="22" height="10" aria-hidden="true"><rect x="1" y="1" width="20" height="8" style={{ fill: area.color }} /></svg>{area.label}</span>)}{series.map((s) => <span key={s.label}>
      {/* Amostra com o mesmo traço do gráfico: cor, espessura e tracejado. */}
      <svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" strokeWidth={s.width ?? 2} strokeDasharray={s.dashed ? '6 5' : undefined} style={{ stroke: s.color }} /></svg>
      {s.label}
    </span>)}</figcaption>
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
