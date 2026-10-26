import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { EvidenceTag, LinearSlider, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import { DELTA_CHI2_1SIGMA, DELTA_CHI2_2SIGMA } from '../../physics/cosmoFit';
import { TRUTHS, confidenceEllipse, expectedEvents, sirenForecastAt, sirenScenario, truthBetween, wSeparation, type Cov2, type SirenScenarioId, type WPoint } from '../../physics/sirens';
import { formatNumber, formatSig } from '../../lib/format';

// Seção de PREVISÃO do Módulo 2.3. Componente isolado: não recebe nada do painel de dados reais
// e não usa a grade nem o melhor ajuste medidos (teste em physics/sirens.test.ts).

type TruthId = 'lcdm' | 'desi';

const SCENARIO_OPTIONS: { value: SirenScenarioId; label: string }[] = [
  { value: 'lisa-otimista', label: 'LISA otimista' },
  { value: 'lisa-pessimista', label: 'LISA pessimista' },
  { value: 'et-otimista', label: 'Einstein Telescope otimista' },
  { value: 'et-realista', label: 'Einstein Telescope realista' },
];

const TRUTH_OPTIONS: { value: TruthId; label: string }[] = [
  { value: 'lcdm', label: 'ΛCDM' },
  { value: 'desi', label: 'Energia escura variável (DESI)' },
];

const SCENARIO_NOTE: Record<SirenScenarioId, string> = {
  'lisa-otimista': 'Fusões de buracos negros supermassivos com contrapartida em luz, no modelo de população mais favorável de Mangiagli et al. (2025).',
  'lisa-pessimista': 'Fusões de buracos negros supermassivos com contrapartida em luz, no modelo de população menos favorável de Mangiagli et al. (2025).',
  'et-otimista': 'Fusões de estrelas de nêutrons com explosão de raios gama vista pelo THESEUS, supondo redshift para todos os eventos (Belgacem et al., 2019).',
  'et-realista': 'Fusões de estrelas de nêutrons com explosão de raios gama vista pelo THESEUS, supondo redshift para só cerca de 1/3 dos eventos (Belgacem et al., 2019).',
  'speri-popIII-15': '',
};

function initial() {
  const q = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const scenario = SCENARIO_OPTIONS.find((o) => o.value === q.get('sirenes'))?.value ?? 'lisa-otimista';
  const truth: TruthId = q.get('verdade') === 'lcdm' ? 'lcdm' : 'desi';
  const f = Number(q.get('fracao'));
  return { scenario, truth, fraction: Number.isFinite(f) && f > 0 && f <= 1 ? f : 1 };
}

const sigmaLabel = (s: number) => (s > 9 ? 'mais de 9σ' : `${formatNumber(s, 1)}σ`);
const pct = (f: number) => `${formatNumber(f * 100, 0)}%`;

export default function SirenForecast() {
  const start = useMemo(initial, []);
  const [scenario, setScenario] = useState<SirenScenarioId>(start.scenario);
  const [truthId, setTruthId] = useState<TruthId>(start.truth);
  const [fraction, setFraction] = useState(start.fraction);
  const f = truthId === 'lcdm' ? 0 : fraction;
  const truth = useMemo(() => truthBetween(f), [f]);
  const center: WPoint = { w0: truth.w0, wa: truth.wa };
  // Hipótese a separar: o ponto do DESI se a verdade é o ΛCDM; o ΛCDM se a verdade é a energia escura variável.
  const other: WPoint = truthId === 'lcdm' ? { w0: TRUTHS.desi.w0, wa: TRUTHS.desi.wa } : { w0: TRUTHS.lcdm.w0, wa: TRUTHS.lcdm.wa };
  const forecast = useMemo(() => sirenForecastAt(scenario, truth), [scenario, truth]);
  const sep = {
    current: wSeparation(forecast.current, center, other).sigma,
    combined: wSeparation(forecast.combined, center, other).sigma,
    sirens: wSeparation(forecast.sirensOnly!, center, other).sigma,
  };
  const info = sirenScenario(scenario);
  const zs = expectedEvents(scenario).z;
  const zMax = info.bins.filter((b) => b[2] > 0).reduce((m, b) => Math.max(m, b[1]), 0);
  const isLisa = info.detector === 'LISA';
  useScrollToHash('sirenes');
  const sd = (c: Cov2) => ({ w0: Math.sqrt(c[0][0]), wa: Math.sqrt(c[1][1]) });
  const now = sd(forecast.current);
  const next = sd(forecast.combined);

  return <SimCard title="E se tivéssemos sirenes gigantes?" id="sirenes">
    <div className="callout warn forecast-warning" data-testid="text-23-forecast-warning">
      <EvidenceTag level="projecao" /> <b>Dados simulados a partir de previsões publicadas. Nenhum destes eventos foi observado.</b>
    </div>
    <p>Uma <Link href="/ouvindo-o-universo" className="inline-link">sirene padrão</Link> é uma fusão de objetos compactos cuja onda gravitacional dá a distância de luminosidade <Sym>d<sub>L</sub></Sym> diretamente, sem a escada de distâncias. Se a fusão também for vista em luz, a galáxia dá o redshift. Muitas sirenes em grandes distâncias medem <Sym>d<sub>L</sub>(z)</Sym>, a mesma curva que as supernovas medem, com sistemáticas completamente diferentes.</p>
    <p>Esta seção pergunta quanto as sirenes de detectores ainda não construídos reduziriam a incerteza no plano <Sym>w₀ × w<sub>a</sub></Sym>. A previsão usa a matriz de Fisher: a precisão esperada, em média, se o universo for exatamente o escolhido. Os dados atuais entram com a precisão que têm, mas centrados no universo escolhido. Por isso as elipses sólidas abaixo <b>não</b> são os contornos medidos acima: são a mesma precisão, deslocada para o universo escolhido, sem misturar dados reais com simulados.</p>
    <div className="controls">
      <div>
        <div className="log-slider-head"><span>Cenário</span></div>
        <Segmented label="Cenário de sirenes" value={scenario} onChange={setScenario} options={SCENARIO_OPTIONS} />
      </div>
      <div>
        <div className="log-slider-head"><span>Universo verdadeiro</span></div>
        <Segmented label="Universo verdadeiro" value={truthId} onChange={setTruthId} options={TRUTH_OPTIONS} />
      </div>
      {truthId === 'desi' && <LinearSlider
        label="Quão longe do ΛCDM está o universo verdadeiro" value={fraction} min={0.05} max={1} step={0.05} onChange={setFraction}
        display={`${pct(fraction)} do caminho até o ponto do DESI`} testId="input-23-fraction"
        ends={['perto do ΛCDM', 'melhor ajuste do DESI']} />}
    </div>
    <p className="plot-note" data-testid="text-23-scenario-note">{SCENARIO_NOTE[scenario]}</p>
    <ForecastPlane center={center} forecast={forecast} truthId={truthId} fraction={f} />
    <StatGrid>
      <Stat label="Eventos com contrapartida" value={`${formatSig(info.eventos_total, info.eventos_total < 10 ? 2 : 3)} em ${info.anos} anos`} note={`${zs.length > 0 ? `redshift de 0 a ${formatNumber(zMax, 1)}` : ''}`} testId="text-23-forecast-events" />
      <Stat label={<>Separação esperada entre <Sym>ΛCDM</Sym> e energia escura variável</>} value={sigmaLabel(sep.combined)}
        note={<>dados atuais + sirenes. Só dados atuais: {sigmaLabel(sep.current)}; só sirenes: {sigmaLabel(sep.sirens)}. {sep.combined >= 5 ? 'Acima de 5σ, o padrão da física para descartar.' : 'Abaixo de 5σ, o padrão da física para descartar.'}</>}
        testId="text-23-forecast-separation" />
      <Stat label={<>Incerteza de <Sym>w₀</Sym> e <Sym>w<sub>a</sub></Sym></>} value={<>±{formatSig(next.w0, 2)} e ±{formatSig(next.wa, 2)}</>}
        note={<>com as sirenes; hoje, ±{formatSig(now.w0, 2)} e ±{formatSig(now.wa, 2)} (1σ)</>} testId="text-23-forecast-sigmas" />
    </StatGrid>
    <div className="forecast-notes" data-testid="text-23-forecast-caveats">
      <p className="plot-note"><b>Esta separação supõe que o universo verdadeiro é exatamente o escolhido. Se a energia escura variar menos do que o melhor ajuste do DESI sugere, a separação diminui.</b> {truthId === 'lcdm' ? 'Com o ΛCDM verdadeiro, o número diz com que força o ponto do DESI seria descartado.' : `Com o universo verdadeiro a ${pct(f)} do caminho entre o ΛCDM e o ponto do DESI (w₀ = ${formatNumber(truth.w0, 2)}, wₐ = ${formatNumber(truth.wa, 2)}), o número diz com que força o ΛCDM seria descartado. Mova o controle para ver a separação cair.`}</p>
      {!isLisa && <p className="plot-note" data-testid="text-23-forecast-et"><b>Depende de contrapartidas do THESEUS, missão ainda não aprovada, e de um detector que deve começar a observar no início dos anos 2040.</b></p>}
      {isLisa && <p className="plot-note" data-testid="text-23-forecast-lisa"><b>As distribuições de eventos em z foram digitalizadas de figuras publicadas</b> (Mangiagli et al., 2022, Fig. 1); os totais de eventos são os da tabela de Mangiagli et al. (2025).</p>}
    </div>
    <div className="sub-title">O que a previsão responde</div>
    <p><b>As sirenes futuras conseguiriam levar a decisão a 5σ?</b> Com o melhor ajuste do DESI como universo verdadeiro, os dados atuais sozinhos separariam os dois modelos a cerca de 3σ. As fusões do LISA quase não mudam esse número: são poucas, e a maior parte está em redshift alto, onde o erro por lentes gravitacionais é grande e a energia escura pesa pouco. O Einstein Telescope com o THESEUS teria centenas de eventos em <Sym>z &lt; 2</Sym>, onde a energia escura atua: somado aos dados atuais, passaria de 5σ no cenário otimista (cerca de 6,8σ) e ficaria logo abaixo no realista (cerca de 4,7σ). Sozinhas, as sirenes não chegam a 5σ em nenhum cenário.</p>
    <p>As previsões dependem de quantos eventos terão contrapartida em luz e de modelos de população de buracos negros e de estrelas de nêutrons ainda incertos. As datas também podem mudar: o LISA foi adotado pela ESA em 25 de janeiro de 2024, com lançamento previsto para 2035; o Einstein Telescope ainda não tem local (a decisão está prevista para 2027) e deve começar a observar no início dos anos 2040; o THESEUS disputa a seleção como missão M7 da ESA.</p>
    <p className="plot-note" data-testid="text-23-tde">E as estrelas despedaçadas por buracos negros? Um evento de ruptura por maré (TDE) está entre os fenômenos mais brilhantes do universo, mas o brilho dele não é conhecido de antemão, então hoje não serve como vela padrão. A tentativa publicada de padronizá-los, pela relação entre o brilho máximo e a rapidez da queda, tem dispersão grande, e os próprios autores concluem que os TDEs dificilmente serão indicadores de distância competitivos (Hinkle et al., 2020).</p>
    <div className="evidence-legend forecast-tags" data-testid="text-23-forecast-tags">
      <span>Medidas atuais: <EvidenceTag level="fato" /></span>
      <span>Previsões desta seção: <EvidenceTag level="projecao" /></span>
      <span>Energia escura dinâmica: <EvidenceTag level="hipotese" /></span>
    </div>
  </SimCard>;
}

/**
 * Rola até a seção quando a página abre com #sirenes (link do Módulo 8). O painel de dados reais,
 * acima, muda de altura quando a grade termina; a rolagem acompanha por alguns segundos, até o
 * leitor rolar por conta própria.
 */
function useScrollToHash(id: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== `#${id}`) return undefined;
    const go = () => document.getElementById(id)?.scrollIntoView({ block: 'start' });
    go();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(go);
    observer?.observe(document.body);
    const stop = () => { observer?.disconnect(); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop); };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    const timer = window.setTimeout(stop, 6000);
    return () => { window.clearTimeout(timer); stop(); };
  }, [id]);
}

// --- Plano da previsão --------------------------------------------------------------------

const X_RANGE: [number, number] = [-1.4, -0.3];
const Y_RANGE: [number, number] = [-2.1, 0.9];

function ForecastPlane({ center, forecast, truthId, fraction }: { center: WPoint; forecast: { current: Cov2; combined: Cov2 }; truthId: TruthId; fraction: number }) {
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const H = Math.round(Math.min(480, Math.max(300, W * 0.7)));
  const pad = { left: 46, right: 12, top: 12, bottom: 44 };
  const sx = (x: number) => pad.left + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - pad.left - pad.right);
  const sy = (y: number) => H - pad.bottom - ((y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (H - pad.top - pad.bottom);
  const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(' ') + ' Z';
  const ellipses = [
    { cov: forecast.current, level: DELTA_CHI2_2SIGMA, dashed: false, width: 1.2 },
    { cov: forecast.current, level: DELTA_CHI2_1SIGMA, dashed: false, width: 1.8 },
    { cov: forecast.combined, level: DELTA_CHI2_2SIGMA, dashed: true, width: 1.4 },
    { cov: forecast.combined, level: DELTA_CHI2_1SIGMA, dashed: true, width: 2.2 },
  ];
  const xTicks = [-1.25, -1, -0.75, -0.5];
  const yTicks = [-2, -1, 0];
  const marks = [
    { id: 'lcdm', label: 'ΛCDM', w0: TRUTHS.lcdm.w0, wa: TRUTHS.lcdm.wa, shape: 'circle' },
    { id: 'desi', label: 'DESI', w0: TRUTHS.desi.w0, wa: TRUTHS.desi.wa, shape: 'diamond' },
  ];
  const showTruth = truthId === 'desi' && fraction < 0.999;
  return <figure className="plot" ref={ref}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Plano w₀ × w_a da previsão: precisão dos dados atuais (linhas sólidas) e com as sirenes simuladas (tracejadas), em torno do universo escolhido">
      {yTicks.map((y) => <g key={`y${y}`}><line x1={pad.left} x2={W - pad.right} y1={sy(y)} y2={sy(y)} style={{ stroke: 'hsl(var(--border))' }} /><text x={pad.left - 7} y={sy(y) + 4} textAnchor="end" className="plot-tick">{formatNumber(y, 1)}</text></g>)}
      {xTicks.map((x) => <g key={`x${x}`}><line x1={sx(x)} x2={sx(x)} y1={pad.top} y2={H - pad.bottom} style={{ stroke: 'hsl(var(--border))' }} /><text x={sx(x)} y={H - pad.bottom + 18} textAnchor="middle" className="plot-tick">{formatNumber(x, 2)}</text></g>)}
      <text x={(W + pad.left) / 2} y={H - 6} textAnchor="middle" className="plot-axis">w₀ (hoje)</text>
      <text x={11} y={(H - pad.bottom + pad.top) / 2} textAnchor="middle" transform={`rotate(-90 11 ${(H - pad.bottom + pad.top) / 2})`} className="plot-axis">wₐ (variação)</text>
      <line x1={sx(-1)} x2={sx(-1)} y1={pad.top} y2={H - pad.bottom} style={{ stroke: 'hsl(var(--muted-foreground))' }} strokeDasharray="3 4" />
      {ellipses.map((e, k) => <path key={k} d={path(confidenceEllipse(center, e.cov, e.level))} fill={e.dashed ? 'hsl(var(--projection) / .08)' : 'none'}
        style={{ stroke: e.dashed ? 'hsl(var(--projection))' : 'hsl(var(--foreground) / .75)' }} strokeWidth={e.width} strokeDasharray={e.dashed ? '6 4' : undefined} />)}
      {marks.map((m) => {
        const x = sx(m.w0);
        const y = sy(m.wa);
        const style = { fill: 'hsl(var(--card))', stroke: 'hsl(var(--foreground))', strokeWidth: 1.6 };
        return <g key={m.id}>
          {m.shape === 'circle' ? <circle cx={x} cy={y} r={5} style={style} /> : <rect x={x - 4.5} y={y - 4.5} width={9} height={9} transform={`rotate(45 ${x} ${y})`} style={style} />}
          <text x={x + 9} y={y - 8} className="plot-dot plot-halo">{m.label}</text>
        </g>;
      })}
      {showTruth && <g><path d={`M ${sx(center.w0) - 5} ${sy(center.wa) - 5} l 10 10 M ${sx(center.w0) + 5} ${sy(center.wa) - 5} l -10 10`} style={{ stroke: 'hsl(var(--projection))' }} strokeWidth={2.2} />
        <text x={sx(center.w0) + 9} y={sy(center.wa) + 16} className="plot-dot plot-halo">verdadeiro</text></g>}
    </svg>
    <figcaption className="plot-legend">
      <span><svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" strokeWidth={1.8} style={{ stroke: 'hsl(var(--foreground) / .75)' }} /></svg>precisão dos dados atuais (1σ e 2σ)</span>
      <span><svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" strokeWidth={2.2} strokeDasharray="6 4" style={{ stroke: 'hsl(var(--projection))' }} /></svg>projeção: dados atuais + sirenes simuladas</span>
      {showTruth && <span><svg width="22" height="10" aria-hidden="true"><path d="M 6 0 l 10 10 M 16 0 l -10 10" style={{ stroke: 'hsl(var(--projection))' }} strokeWidth={2} /></svg>universo verdadeiro escolhido</span>}
    </figcaption>
  </figure>;
}
