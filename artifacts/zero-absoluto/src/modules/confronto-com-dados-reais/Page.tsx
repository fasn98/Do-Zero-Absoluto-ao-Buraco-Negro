import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, Segmented, SimCard, Stat, StatGrid, Sym, cssColor } from '../shared';
import { LinePlot } from '../Plot';
import { DELTA_CHI2_1SIGMA, DELTA_CHI2_2SIGMA, profileAt, sigmaFromDeltaChi2, wBand, type GridResult } from '../../physics/cosmoFit';
import type { DataCombination } from '../../physics/cosmoLikelihood';
import { DESI_DR2_DESY5 } from '../../physics/cosmicFates';
import { isoline, upsample } from '../../lib/contours';
import { formatNumber, formatSig } from '../../lib/format';
import type { GridMessage } from './gridProtocol';

const COMBINATIONS: { value: DataCombination; label: string; url: string }[] = [
  { value: 'bao', label: 'Só BAO', url: 'bao' },
  { value: 'bao+cmb', label: 'BAO + CMB, sem supernovas', url: 'bao-cmb' },
  { value: 'bao+cmb+sn', label: 'BAO + CMB + Union3', url: 'bao-cmb-sn' },
];

/** Resultados publicados pelo DESI DR2 (Tabela VI) para comparação. */
const PUBLISHED: Record<DataCombination, { text: ReactNode; sigma: string }[]> = {
  bao: [{ text: 'só DESI', sigma: '1,7σ (Δχ² = −4,7)' }],
  'bao+cmb': [
    { text: 'DESI + CMB completo, com lenteamento', sigma: '3,1σ (Δχ² = −12,5)' },
    { text: <>DESI + CMB comprimido em (θ*, ω<sub>b</sub>, ω<sub>bc</sub>), sem lenteamento</>, sigma: '2,4σ (Δχ² = −8,0)' },
  ],
  'bao+cmb+sn': [
    { text: 'DESI + CMB completo + Union3', sigma: '3,8σ (Δχ² = −17,4)' },
    { text: 'DESI + CMB completo + Pantheon+ / + DES-Y5 (outros conjuntos de supernovas)', sigma: '2,8σ / 4,2σ' },
  ],
};

/** Cenários do Módulo 2.2 que cabem no plano w₀ × w_a. */
const SCENARIOS = [
  { id: 'lcdm', label: 'ΛCDM', w0: -1, wa: 0, shape: 'circle' as const },
  { id: 'big-rip', label: 'w = −1,5', w0: -1.5, wa: 0, shape: 'square' as const },
  { id: 'desi', label: 'DESI DR2 (DESY5)', w0: DESI_DR2_DESY5.w0, wa: DESI_DR2_DESY5.wa, shape: 'diamond' as const },
];

/** Três faixas: dentro de 2σ; entre 2σ e 5σ (tensão, não descarte); acima de 5σ (excluído). */
function verdict(deltaChi2: number) {
  const s = sigmaFromDeltaChi2(deltaChi2);
  if (deltaChi2 <= DELTA_CHI2_2SIGMA) return { short: 'Permitido a 2σ', long: 'permitido a 2σ', allowed: true };
  if (s < 5) return { short: 'Em tensão com este conjunto de dados', long: 'fora da região de 2σ, mas abaixo de 5σ: em tensão com este conjunto de dados, não descartado', allowed: false };
  return { short: 'Excluído', long: 'excluído (mais de 5σ)', allowed: false };
}

const fixed2 = (x: number) => x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/^-/, '−');

const sigmaText = (deltaChi2: number) => {
  const s = sigmaFromDeltaChi2(deltaChi2);
  return !Number.isFinite(s) || s > 9 ? 'mais de 9σ' : `${s.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}σ`;
};

type GridState = { result?: GridResult; elapsedMs?: number; progress: number };

/** Calcula as grades num Web Worker, uma vez por combinação, e guarda os resultados. */
function useGrids(combination: DataCombination) {
  const workerRef = useRef<Worker | null>(null);
  const [grids, setGrids] = useState<Partial<Record<DataCombination, GridState>>>({});
  useEffect(() => () => workerRef.current?.terminate(), []);
  useEffect(() => {
    if (grids[combination]?.result || grids[combination]?.progress !== undefined) return;
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./grid.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (event: MessageEvent<GridMessage>) => {
        const m = event.data;
        setGrids((g) => ({ ...g, [m.combination]: m.type === 'progresso' ? { progress: m.fraction } : { result: m.result, elapsedMs: m.elapsedMs, progress: 1 } }));
      };
    }
    setGrids((g) => ({ ...g, [combination]: { progress: 0 } }));
    workerRef.current.postMessage({ combination });
  }, [combination, grids]);
  return grids[combination] ?? { progress: 0 };
}

// --- Plano w₀ × w_a ---------------------------------------------------------------------

const X_RANGE: [number, number] = [-1.6, 0.2];
const Y_RANGE: [number, number] = [-3, 1.4];
const FINE = 4;

function ContourPlane({ grid, marks }: { grid?: GridResult; marks: { id: string; label: string; w0: number; wa: number; shape: 'circle' | 'square' | 'diamond' }[] }) {
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  const [image, setImage] = useState<string>();
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const H = Math.round(Math.min(560, Math.max(320, W * 0.78)));
  const pad = { left: 46, right: 12, top: 12, bottom: 44 };
  const sx = (x: number) => pad.left + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - pad.left - pad.right);
  const sy = (y: number) => H - pad.bottom - ((y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (H - pad.top - pad.bottom);
  const fine = useMemo(() => (grid ? upsample(grid.chi2.map((row) => row.map((c) => c - grid.best.chi2)), FINE) : null), [grid]);
  const lines = useMemo(() => (fine ? [DELTA_CHI2_1SIGMA, DELTA_CHI2_2SIGMA].map((level) => isoline(fine, level)) : []), [fine]);
  // Preenchimento das regiões de 1σ e 2σ: uma imagem pequena, esticada sob os eixos.
  const dark = typeof document !== 'undefined' && !!document.querySelector('.shell.dark');
  useEffect(() => {
    if (!fine || !ref.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = fine[0].length;
    canvas.height = fine.length;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const one = cssColor(ref.current, '--primary', 0.55);
    const two = cssColor(ref.current, '--primary', 0.22);
    fine.forEach((row, j) => row.forEach((v, i) => {
      const y = fine.length - 1 - j;
      if (!Number.isFinite(v)) return;
      if (v <= DELTA_CHI2_1SIGMA) ctx.fillStyle = one;
      else if (v <= DELTA_CHI2_2SIGMA) ctx.fillStyle = two;
      else return;
      ctx.fillRect(i, y, 1, 1);
    }));
    setImage(canvas.toDataURL());
  }, [fine, dark]);
  const toX = (i: number) => sx(X_RANGE[0] + (i / (fine ? fine[0].length - 1 : 1)) * (X_RANGE[1] - X_RANGE[0]));
  const toY = (j: number) => sy(Y_RANGE[0] + (j / (fine ? fine.length - 1 : 1)) * (Y_RANGE[1] - Y_RANGE[0]));
  const xTicks = [-1.5, -1, -0.5, 0];
  const yTicks = [-3, -2, -1, 0, 1];
  const line = (x0: number, y0: number, x1: number, y1: number) => ({ x1: sx(x0), y1: sy(y0), x2: sx(x1), y2: sy(y1) });
  const label = (x: number, y: number, text: string, anchor: 'start' | 'end' | 'middle' = 'start') => <text x={sx(x)} y={sy(y)} textAnchor={anchor} className="plot-region plot-halo">{text}</text>;
  const narrow = W < 480;
  return <figure className="plot" ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Plano w₀ × w_a com as regiões de 1σ e 2σ permitidas pelos dados">
      {image && <image href={image} x={sx(X_RANGE[0])} y={sy(Y_RANGE[1])} width={sx(X_RANGE[1]) - sx(X_RANGE[0])} height={sy(Y_RANGE[0]) - sy(Y_RANGE[1])} preserveAspectRatio="none" />}
      {/* Prior do DESI: w₀ + w_a < 0. A região excluída é o triângulo acima da reta w_a = −w₀. */}
      <polygon points={`${sx(-Y_RANGE[1])},${sy(Y_RANGE[1])} ${sx(X_RANGE[1])},${sy(Y_RANGE[1])} ${sx(X_RANGE[1])},${sy(-X_RANGE[1])}`} style={{ fill: 'hsl(var(--muted-foreground) / .16)' }} />
      {yTicks.map((y) => <g key={`y${y}`}><line x1={pad.left} x2={W - pad.right} y1={sy(y)} y2={sy(y)} style={{ stroke: 'hsl(var(--border))' }} /><text x={pad.left - 7} y={sy(y) + 4} textAnchor="end" className="plot-tick">{formatNumber(y, 1)}</text></g>)}
      {xTicks.map((x) => <g key={`x${x}`}><line x1={sx(x)} x2={sx(x)} y1={pad.top} y2={H - pad.bottom} style={{ stroke: 'hsl(var(--border))' }} /><text x={sx(x)} y={H - pad.bottom + 18} textAnchor="middle" className="plot-tick">{formatNumber(x, 1)}</text></g>)}
      <text x={(W + pad.left) / 2} y={H - 6} textAnchor="middle" className="plot-axis">w₀ (hoje)</text>
      <text x={11} y={(H - pad.bottom + pad.top) / 2} textAnchor="middle" transform={`rotate(-90 11 ${(H - pad.bottom + pad.top) / 2})`} className="plot-axis">wₐ (variação)</text>
      {/* w₀ = −1 e a divisória fantasma w₀ + w_a = −1. */}
      <line {...line(-1, Y_RANGE[0], -1, Y_RANGE[1])} style={{ stroke: 'hsl(var(--muted-foreground))' }} strokeDasharray="3 4" />
      <line {...line(X_RANGE[0], -1 - X_RANGE[0], 0.2, -1.2)} style={{ stroke: 'hsl(var(--accent))' }} strokeDasharray="7 5" strokeWidth={1.4} />
      {!narrow && label(-1.55, 0.75, 'divisória fantasma: w₀ + wₐ = −1')}
      {!narrow && <>
        {label(-0.98, -2.85, 'hoje enfraquece; no passado era fantasma')}
        {label(-1.55, -2.75, 'sempre fantasma: fica cada vez mais forte')}
        {label(-1.55, 1.25, 'hoje fica mais forte; no passado enfraquecia')}
        {label(-0.62, -0.3, 'sempre enfraquece')}
      </>}
      {label(0.15, 0.25, 'excluído pelo prior', 'end')}
      {lines.map((segments, k) => <g key={k}>{segments.map((s, n) => <line key={n} x1={toX(s[0])} y1={toY(s[1])} x2={toX(s[2])} y2={toY(s[3])} style={{ stroke: 'hsl(var(--primary))' }} strokeWidth={k === 0 ? 1.8 : 1.2} />)}</g>)}
      {marks.map((m) => {
        const x = sx(m.w0);
        const y = sy(m.wa);
        const style = { fill: 'hsl(var(--card))', stroke: 'hsl(var(--foreground))', strokeWidth: 1.6 };
        return <g key={m.id}>
          {m.shape === 'circle' && <circle cx={x} cy={y} r={5} style={style} />}
          {m.shape === 'square' && <rect x={x - 4.5} y={y - 4.5} width={9} height={9} style={style} />}
          {m.shape === 'diamond' && <rect x={x - 4.5} y={y - 4.5} width={9} height={9} transform={`rotate(45 ${x} ${y})`} style={style} />}
          <text x={m.id === 'big-rip' ? x - 4 : x - 8} y={m.id === 'big-rip' ? y + 20 : y - 9} textAnchor={m.id === 'big-rip' ? 'start' : 'end'} className="plot-dot plot-halo">{m.label}</text>
        </g>;
      })}
      {grid && <g><path d={`M ${sx(grid.best.params.w0) - 5} ${sy(grid.best.params.wa)} h 10 M ${sx(grid.best.params.w0)} ${sy(grid.best.params.wa) - 5} v 10`} style={{ stroke: 'hsl(var(--destructive))' }} strokeWidth={2} /></g>}
    </svg>
    <figcaption className="plot-legend">
      <span><svg width="22" height="10" aria-hidden="true"><rect x="1" y="1" width="20" height="8" style={{ fill: 'hsl(var(--primary) / .55)' }} /></svg>1σ (68%)</span>
      <span><svg width="22" height="10" aria-hidden="true"><rect x="1" y="1" width="20" height="8" style={{ fill: 'hsl(var(--primary) / .22)' }} /></svg>2σ (95%)</span>
      <span><svg width="22" height="10" aria-hidden="true"><path d="M 6 5 h 10 M 11 0 v 10" style={{ stroke: 'hsl(var(--destructive))' }} strokeWidth={2} /></svg>melhor ajuste</span>
      <span><svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" style={{ stroke: 'hsl(var(--accent))' }} strokeDasharray="7 5" /></svg>divisória fantasma</span>
    </figcaption>
  </figure>;
}

// --- Simulação ---------------------------------------------------------------------------

function initialCombination(): DataCombination {
  if (typeof window === 'undefined') return 'bao+cmb+sn';
  const key = new URLSearchParams(window.location.search).get('dados');
  return COMBINATIONS.find((c) => c.url === key)?.value ?? 'bao+cmb+sn';
}

function Confrontation() {
  const [combination, setCombination] = useState<DataCombination>(initialCombination);
  const state = useGrids(combination);
  const grid = state.result;
  // Δχ² de cada cenário no ponto exato (perfil), relativo ao melhor ajuste global.
  const marks = useMemo(() => {
    if (!grid) return [];
    return SCENARIOS.map((s) => {
      const fit = profileAt(s.w0, s.wa, combination, grid.best.params);
      const delta = Math.max(0, fit.chi2 - grid.best.chi2);
      return { ...s, delta, verdict: verdict(delta) };
    });
  }, [grid, combination]);
  const lcdm = marks.find((m) => m.id === 'lcdm');
  const band = useMemo(() => (grid ? wBand(grid, Array.from({ length: 51 }, (_, i) => (2.5 * i) / 50)) : []), [grid]);
  const best = grid?.best.params;
  return <SimCard title="O plano w₀ × wₐ">
    <p>Cada ponto do plano é um modelo de energia escura <Sym>w(a) = w₀ + w<sub>a</sub>(1 − a)</Sym>. Para cada ponto, o navegador calcula o χ² dos dados reais com os valores de <Sym>Ω<sub>m</sub></Sym> e <Sym>H₀</Sym> (e <Sym>ω<sub>b</sub></Sym>, com o CMB) que melhor se ajustam a ele: é o chamado <b>perfil</b> da verossimilhança. As regiões mostram onde a diferença para o melhor ajuste fica abaixo de 2,30 (1σ) e de 6,18 (2σ).</p>
    <div className="controls">
      <div>
        <div className="log-slider-head"><span>Dados</span></div>
        <Segmented label="Conjuntos de dados" value={combination} onChange={setCombination} options={COMBINATIONS} />
      </div>
    </div>
    <div aria-busy={!grid} data-testid="text-23-status" className="plot-note">
      {grid ? <>Grade de {grid.spec.n0} × {grid.spec.na} modelos, calculada em <b data-testid="text-23-elapsed">{formatNumber((state.elapsedMs ?? 0) / 1000, 1)} s</b> ({grid.evaluations.toLocaleString('pt-BR')} avaliações de χ², num Web Worker).</>
        : <>Calculando a grade… {Math.round(state.progress * 100)}%<span className="progress"><i style={{ width: `${state.progress * 100}%` }} /></span></>}
    </div>
    <ContourPlane grid={grid} marks={SCENARIOS} />
    {grid && best && <>
      <StatGrid>
        <Stat label="Melhor ajuste" value={<>w₀ = {fixed2(best.w0)}, w<sub>a</sub> = {fixed2(best.wa)}</>} note={combination === 'bao' ? <>Ω<sub>m</sub> = {formatNumber(best.omegaM, 3)} (H₀ r<sub>d</sub> livre)</> : <>Ω<sub>m</sub> = {formatNumber(best.omegaM, 3)}, H₀ = {formatNumber(best.h0, 1)} km/s/Mpc</>} testId="text-23-best" />
        <Stat label={<>Preferência por <Sym>w₀w<sub>a</sub></Sym> sobre o <Sym>ΛCDM</Sym>, neste app</>} value={lcdm ? sigmaText(lcdm.delta) : '—'} note={lcdm ? `Δχ² = ${formatNumber(-lcdm.delta, 1)} (2 parâmetros a mais)` : undefined} testId="text-23-preference" />
      </StatGrid>
      <div data-testid="text-23-published">
        <div className="sub-title">O mesmo número no artigo do DESI DR2</div>
        <ol className="timeline-list cosmic-list">{PUBLISHED[combination].map((p, i) => <li key={i}>
          <span className="timeline-year">{p.sigma}</span>
          <div><p style={{ margin: 0 }}>{p.text}</p></div>
        </li>)}</ol>
        {combination !== 'bao' && <div className="callout">
          <strong>Por que o nosso número é menor.</strong> Aqui o CMB entra comprimido em três números (R, l<sub>A</sub> e ω<sub>b</sub>), que guardam a geometria do fundo cósmico, mas não o <b>lenteamento</b>: o desvio da luz do CMB pela matéria no caminho, que o Planck e o ACT também medem e que ajuda a fixar a densidade de matéria. O próprio DESI mostra o efeito: com o CMB reduzido à sua parte geométrica, a preferência cai de 3,1σ para 2,4σ, o mesmo valor que obtemos com BAO + CMB. Com o Union3, a diferença (3,3σ aqui, 3,8σ no artigo) vai na mesma direção.
        </div>}
      </div>
      <div className="sub-title">Os cenários do Módulo 2.2 no plano</div>
      <ol className="timeline-list cosmic-list">{marks.map((m) => <li key={m.id} data-testid={`row-23-${m.id}`}>
        <span className="timeline-year">Δχ² = {m.delta < 1e4 ? formatSig(m.delta, 3) : formatNumber(m.delta, 0)}</span>
        <div>
          <div className="claim-head"><b>{m.label} (w₀ = {formatNumber(m.w0, 3)}, w<sub>a</sub> = {formatNumber(m.wa, 2)})</b><EvidenceTag level={m.id === 'lcdm' ? 'consenso' : 'hipotese'} /></div>
          <p className="milestone-when">{m.delta < 0.01 ? 'no melhor ajuste' : `a ${sigmaText(m.delta)} do melhor ajuste`}: {m.verdict.long}</p>
        </div>
      </li>)}</ol>
      <p className="plot-note" data-testid="text-23-sn-note">Supernovas: só o Union3 tem versão comprimida oficial, pequena o bastante para o navegador. Com o DES-Y5 ou o Pantheon+ os números seriam outros, como o próprio DESI mostra: 2,8σ (Pantheon+), 3,8σ (Union3) e 4,2σ (DES-Y5). O ponto "DESI DR2 (DESY5)" no plano é o ajuste com o DES-Y5, que não está entre os dados daqui.</p>
    </>}
    {grid && <Survivors marks={marks} />}
    {grid && <WPlot band={band} best={best!} />}
  </SimCard>;
}

function Survivors({ marks }: { marks: { id: string; delta: number; verdict: ReturnType<typeof verdict> }[] }) {
  const get = (id: string) => marks.find((m) => m.id === id)!;
  const rows: { id: string; name: ReactNode; value: string; note: string }[] = [
    { id: 'lcdm', name: <>Expansão eterna com <Sym>Λ</Sym> constante (<Sym>ΛCDM</Sym>)</>, value: get('lcdm').verdict.short, note: `a ${sigmaText(get('lcdm').delta)} do melhor ajuste (Δχ² = ${formatSig(get('lcdm').delta, 3)})` },
    { id: 'big-rip', name: <>Big Rip com <Sym>w = −1,5</Sym></>, value: get('big-rip').verdict.short, note: `a ${sigmaText(get('big-rip').delta)} do melhor ajuste` },
    { id: 'recontracao', name: <>Recontração com <Sym>Ω<sub>Λ</sub> = −0,1</Sym></>, value: 'Descartado', note: 'pela idade das estrelas mais velhas (Módulo 2.2), qualquer que seja o conjunto de dados; não é um ponto deste plano' },
    { id: 'desi', name: 'Energia escura dinâmica do DESI', value: get('desi').verdict.short, note: `a ${sigmaText(get('desi').delta)} do melhor ajuste; a CPL não decide o destino distante` },
  ];
  return <div data-testid="text-23-survivors">
    <div className="sub-title">Quais destinos sobrevivem</div>
    <StatGrid>{rows.map((r) => <Stat key={r.id} label={r.name} value={r.value} note={r.note} testId={`text-23-fate-${r.id}`} />)}</StatGrid>
    <p className="plot-note">"Permitido a 2σ" quer dizer só que os dados não o excluem com 95% de confiança. Entre 2σ e 5σ, os dados preferem outro modelo, mas não o descartam. Tensões desse tamanho já desapareceram antes, com mais dados ou sistemáticas corrigidas. A posição em σ também depende das supernovas usadas: com o mesmo BAO e o mesmo CMB, o DESI encontra de 2,8σ a 4,2σ. Acima de 5σ, o padrão da física para descartar, o cenário fica excluído. O Λ negativo puro continua descartado pela idade das estrelas, independentemente desta análise. A CPL descreve o passado recente (a ≤ 1); como mostra o <Link href="/os-destinos-possiveis" className="inline-link">Módulo 2.2</Link>, ela não diz se o futuro distante termina em expansão eterna, Big Rip ou outra coisa.</p>
  </div>;
}

function WPlot({ band, best }: { band: { z: number; lo: number; hi: number }[]; best: { w0: number; wa: number } }) {
  const wOf = (z: number) => best.w0 + (best.wa * z) / (1 + z);
  const narrowest = band.reduce((m, b) => (b.hi - b.lo < m.hi - m.lo ? b : m), band[0]);
  return <div data-testid="text-23-wz">
    <div className="sub-title">Onde os dados realmente medem w</div>
    <p>A equação de estado no redshift <Sym>z</Sym> é <Sym>w(z) = w₀ + w<sub>a</sub> z/(1 + z)</Sym>. A faixa reúne os w(z) de todos os modelos dentro da região de 1σ: ela é estreita onde os dados têm mais peso e se abre onde quase não há medidas.</p>
    <LinePlot
      title="Equação de estado w em função do redshift, com a faixa de 1σ"
      xMin={0} xMax={2.5} yMin={-2.5} yMax={0.5}
      xTicks={[0, 0.5, 1, 1.5, 2, 2.5]} yTicks={[-2, -1.5, -1, -0.5, 0]}
      formatX={(x) => formatNumber(x, 1)} formatY={(y) => formatNumber(y, 1)}
      xLabel="redshift z" yLabel="w(z)"
      areas={[{ label: 'faixa de 1σ', color: 'hsl(var(--primary) / .22)', points: band.map((b) => [b.z, b.lo, b.hi]) }]}
      series={[
        { label: 'melhor ajuste', color: 'hsl(var(--primary))', points: band.map((b) => [b.z, wOf(b.z)]), width: 2.2 },
        { label: 'Λ (w = −1)', color: 'hsl(var(--muted-foreground))', points: [[0, -1], [2.5, -1]], dashed: true, width: 1.4 },
      ]}
      height={240}
    />
    <p className="plot-note">A faixa é mais estreita em z ≈ {formatNumber(narrowest.z, 2)}, onde w = {formatNumber(narrowest.lo, 2)} a {formatNumber(narrowest.hi, 2)}. Fora da região dos dados (z ≳ 2,3) a faixa vem só da forma imposta pela CPL.</p>
  </div>;
}

export default function DataConfrontation() {
  return <ModulePage
    title="Confronto com dados reais"
    description="Até aqui, os módulos ilustraram cenários. Este confronta cada um com os dados: as oscilações acústicas medidas pelo DESI, o fundo cósmico do Planck e as supernovas do Union3. O app reproduz análises publicadas; não descobre nada novo."
    number="2.3"
    tag="OBSERVAÇÕES"
    limitations={[
      <>CMB comprimido (R, l<sub>A</sub>, ω<sub>b</sub>, de Chen, Huang e Wang) em vez da verossimilhança completa do Planck. Ele não carrega o lenteamento do CMB, por isso a preferência por w₀w<sub>a</sub> sai menor que a publicada com o CMB completo.</>,
      <>Neutrinos sem massa e curvatura nula; o DESI usa 0,06 eV para a soma das massas. As distâncias usam as fórmulas de ajuste de Hu e Sugiyama (z*) e Eisenstein e Hu (z<sub>d</sub>), não o código de recombinação completo.</>,
      <>Supernovas comprimidas do Union3 (22 nós); as sistemáticas entram só pela covariância publicada. Só há versão comprimida oficial do Union3; o DES-Y5 e o Pantheon+ não foram usados.</>,
      <>Perfil da verossimilhança, e não marginalização completa por MCMC. As médias publicadas pelo DESI vêm de cadeias; a validação em Python deste módulo reproduz essas médias a menos de 0,4σ.</>,
      <>O resultado depende do conjunto de supernovas, como o próprio DESI mostra (2,8σ a 4,2σ).</>,
    ]}
    references={[
      { text: 'DESI Collaboration (M. Abdul Karim et al.), "DESI DR2 Results II: Measurements of Baryon Acoustic Oscillations and Cosmological Constraints", Physical Review D 112, 083515 (2025).', url: 'https://doi.org/10.1103/tr6y-kpc6' },
      { text: 'L. Chen, Q.-G. Huang e K. Wang, "Distance Priors from Planck Final Release", Journal of Cosmology and Astroparticle Physics 02, 028 (2019).', url: 'https://doi.org/10.1088/1475-7516/2019/02/028' },
      { text: 'D. Rubin et al., "Union Through UNITY: Cosmology with 2,000 SNe Using a Unified Bayesian Framework", arXiv:2311.12098 (2023).', url: 'https://arxiv.org/abs/2311.12098' },
      { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
      { text: 'W. Hu e N. Sugiyama, "Small-Scale Cosmological Perturbations: an Analytic Approach", The Astrophysical Journal 471, 542 (1996).', url: 'https://doi.org/10.1086/177989' },
      { text: 'D. J. Eisenstein e W. Hu, "Baryonic Features in the Matter Transfer Function", The Astrophysical Journal 496, 605 (1998).', url: 'https://doi.org/10.1086/305424' },
      { text: 'M. Chevallier e D. Polarski, "Accelerating Universes with Scaling Dark Matter", International Journal of Modern Physics D 10, 213 (2001).', url: 'https://doi.org/10.1142/S0218271801000822' },
      { text: 'E. V. Linder, "Exploring the Expansion History of the Universe", Physical Review Letters 90, 091301 (2003).', url: 'https://doi.org/10.1103/PhysRevLett.90.091301' },
    ]}
  >
    <div className="claims">
      <Claim level="fato" title="As medidas">
        <p>As distâncias medidas com as oscilações acústicas dos bárions (BAO), o fundo cósmico de micro-ondas (CMB) e as supernovas do tipo Ia são observações, repetidas por equipes e instrumentos diferentes. Os números usados aqui são os arquivos oficiais das colaborações, com a covariância publicada.</p>
      </Claim>
      <Claim level="consenso" title="Cada conjunto sozinho é compatível com o ΛCDM">
        <p>Com só o BAO do DESI, o ΛCDM fica a 1,7σ do melhor modelo w₀w<sub>a</sub>, dentro do esperado por acaso. O CMB sozinho é ajustado pelo ΛCDM. A tensão aparece quando os conjuntos são combinados.</p>
      </Claim>
      <Claim level="hipotese" title="Energia escura dinâmica">
        <p>Combinados, os dados preferem uma energia escura que muda com o tempo, com 2,8σ a 4,2σ conforme o conjunto de supernovas (DESI DR2). O padrão da física para anunciar uma descoberta é 5σ. Ainda é hipótese em pesquisa.</p>
      </Claim>
    </div>
    <Confrontation />
  </ModulePage>;
}
