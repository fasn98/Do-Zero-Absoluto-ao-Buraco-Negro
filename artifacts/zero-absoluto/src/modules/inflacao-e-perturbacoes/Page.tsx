import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LinearSlider, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot } from '../Plot';
import {
  FLATNESS_TIMES,
  OMEGA_K_BOUND_95,
  PLANCK_AS,
  PLANCK_NS,
  PLANCK_NS_SIGMA,
  R_UPPER_LIMIT,
  comovingDistanceMpc,
  curvatureAnalytic,
  curvatureAtTime,
  flatnessReduction,
  horizonAngleDeg,
  inflationEnergyScaleGeV,
  minimumEfolds,
  nsBelowOneSigma,
  particleHorizonAtMpc,
  slowRoll,
} from '../../physics/inflation';
import { ageOfUniverseS } from '../../physics/friedmann';
import { gaussianMap, whiteNoiseModes } from '../../lib/gaussianField';
import { formatFromLog10, formatNumber, formatSci, formatSig, superscript } from '../../lib/format';
import { LIMITATIONS, READINGS, REFERENCES, R_LIMIT_NOTE } from './sources';

/** Parâmetros de URL: ?N= (e-dobras da Seção 1), ?ns= (mapa) e ?Nm= (modelos da Seção 3). */
function urlNumber(key: string, fallback: number, min: number, max: number) {
  if (typeof window === 'undefined') return fallback;
  const v = Number(new URLSearchParams(window.location.search).get(key));
  return Number.isFinite(v) && v >= min && v <= max && new URLSearchParams(window.location.search).has(key) ? v : fallback;
}

const GUT_SCALE_GEV = 2e16; // marcador do Módulo 09 ("As forças convergem?")
const END_ENERGIES = [1e16, 1e12, 1e9];
const gevText = (gev: number) => `${formatFromLog10(Math.log10(gev), 1)} GeV`;
const log10Text = (x: number) => `10${superscript(Math.round(Math.log10(x)))}`;

// --- Seção 1 ---------------------------------------------------------------------------

function Puzzles() {
  const [efolds, setEfolds] = useState(() => urlNumber('N', 0, 0, 70));
  const t0 = ageOfUniverseS();
  const flat1s = curvatureAtTime(FLATNESS_TIMES.nucleossintese);
  const flat1sAnalytic = curvatureAnalytic(FLATNESS_TIMES.nucleossintese);
  const flatPlanck = curvatureAtTime(FLATNESS_TIMES.planck);
  const chi = particleHorizonAtMpc(1090);
  const dm = comovingDistanceMpc(1090);
  const angle = horizonAngleDeg();
  const need = minimumEfolds(1e16);
  const solvedH = efolds >= need.horizon;
  const solvedF = efolds >= need.flatness;
  const curve = useMemo(() => {
    const xs = Array.from({ length: 121 }, (_, i) => -43 + (i / 120) * (Math.log10(t0) + 43));
    return { solver: xs.map((x) => [x, Math.log10(curvatureAtTime(10 ** x))] as [number, number]), analytic: xs.map((x) => [x, Math.log10(curvatureAnalytic(10 ** x))] as [number, number]) };
  }, [t0]);
  return <SimCard title="Dois quebra-cabeças do universo sem inflação">
    <p>Sem inflação, o universo é só radiação, matéria e energia escura, desde o início. Com o mesmo resolvedor de Friedmann dos Módulos 2.1 a 2.3, dá para voltar no tempo e ver dois números que parecem ajustados demais.</p>
    <div className="sub-title">1. Planura</div>
    <p>O desvio da geometria plana, <Sym>|Ω − 1| = |Ω<sub>k</sub>| / (a² E²)</Sym>, cresce com o tempo: <Sym>∝ t</Sym> quando a radiação domina e <Sym>∝ t<sup>2/3</sup></Sym> quando a matéria domina. Hoje o Planck mede <Sym>Ω<sub>K</sub> = 0,0007 ± 0,0019</Sym>, ou seja, <Sym>|Ω − 1| ≲ {formatNumber(OMEGA_K_BOUND_95, 4)}</Sym> a 95%. Para chegar a isso, ele teria de ser absurdamente pequeno no passado:</p>
    <LinePlot
      title="Desvio da planura em função do tempo, voltando de hoje até o tempo de Planck"
      xMin={-43} xMax={Math.log10(t0)} yMin={-63} yMax={0}
      xTicks={[-40, -30, -20, -10, 0, 10]} yTicks={[-60, -45, -30, -15, 0]}
      formatX={(x) => `10${superscript(x)}`} formatY={(y) => `10${superscript(y)}`}
      xLabel="tempo desde o Big Bang (segundos)" yLabel="|Ω − 1|"
      regions={[{ from: -43, to: -32, color: 'hsl(var(--muted-foreground) / .12)', label: 'extrapolação' }]}
      markers={[{ x: 0, label: '1 s' }]}
      series={[
        { label: 'resolvedor de Friedmann', color: 'hsl(var(--primary))', points: curve.solver, width: 2.2 },
        { label: 'estimativa por partes (∝ t, ∝ t^2/3, sem Λ)', color: 'hsl(var(--accent))', points: curve.analytic, dashed: true, width: 1.6 },
      ]}
      height={240}
    />
    <StatGrid>
      <Stat label="Em 1 s (nucleossíntese), pelo resolvedor" value={formatSci(flat1s, 1)} note={`estimativa por partes: ${formatSci(flat1sAnalytic, 1)}`} testId="text-24-flat-1s" />
      <Stat label="No tempo de Planck (extrapolação)" value={formatSci(flatPlanck, 1)} note="física desconhecida nessa escala; só a ordem de grandeza" testId="text-24-flat-planck" />
    </StatGrid>
    <p className="plot-note">A estimativa por partes ignora a energia escura e a passagem gradual da radiação para a matéria; por isso fica a um fator ~{formatNumber(flat1s / flat1sAnalytic, 0)} do resolvedor. As duas contam a mesma história: um ajuste fino de 1 parte em 10¹⁸ no primeiro segundo.</p>
    <div className="sub-title">2. Horizonte</div>
    <p>Na recombinação, a luz só podia ter percorrido o <b>horizonte de partículas</b>, <Sym>χ<sub>p</sub> = c ∫ da / (a² H)</Sym> desde o início. Visto de hoje, esse pedaço ocupa um ângulo pequeno no céu:</p>
    <StatGrid>
      <Stat label="Horizonte na recombinação (comóvel)" value={`${formatSig(chi)} Mpc`} note="z = 1.090" testId="text-24-horizon" />
      <Stat label="Distância até a recombinação" value={`${formatSig(dm)} Mpc`} note="distância comóvel, hoje" testId="text-24-distance" />
      <Stat label="Ângulo no céu" value={`${formatSig(angle)}°`} note={<>raio de uma região causal; diâmetro ~{formatSig(2 * angle, 2)}°</>} testId="text-24-angle" />
    </StatGrid>
    <div className="callout">Pontos do fundo cósmico separados por mais de ~{formatSig(2 * angle, 2)}° nunca estiveram em contato causal no modelo sem inflação. Mesmo assim, o céu inteiro tem a mesma temperatura, 2,7255 K, com variações de só ~10⁻⁵.</div>
    <div className="sub-title">3. E se houve inflação?</div>
    <p>Durante a inflação, o universo cresce por um fator <Sym>e<sup>N</sup></Sym> (N e-dobras) com H quase constante. Um desvio <Sym>|Ω − 1|</Sym> de ordem 1 no início cai por <Sym>e<sup>−2N</sup></Sym>, e uma região pequena, que estava em contato causal, é esticada até conter todo o universo observável.</p>
    <div className="controls"><LinearSlider label="Número de e-dobras N" value={efolds} min={0} max={70} step={1} onChange={setEfolds} display={formatNumber(efolds, 0)} ends={['0', '70']} testId="input-24-efolds" /></div>
    <StatGrid>
      <Stat label="Redução da planura, e^(−2N)" value={efolds === 0 ? '1 (sem inflação)' : formatSci(flatnessReduction(efolds), 1)} note={`|Ω − 1| de ordem 1 vira ${efolds === 0 ? '~1' : formatSci(flatnessReduction(efolds), 1)}`} testId="text-24-reduction" />
      <Stat label="Planura" value={solvedF ? 'Resolvida' : 'Não resolvida'} note={`precisa de N ≥ ${formatNumber(need.flatness, 0)} (fim da inflação a 10¹⁶ GeV)`} testId="text-24-flat-status" />
      <Stat label="Horizonte" value={solvedH ? 'Resolvido' : 'Não resolvido'} note={`precisa de N ≥ ${formatNumber(need.horizon, 0)} (fim da inflação a 10¹⁶ GeV)`} testId="text-24-horizon-status" />
    </StatGrid>
    <table className="data-table" data-testid="text-24-efold-table">
      <thead><tr><th>Fim da inflação</th><th>N mínimo, horizonte</th><th>N mínimo, planura</th><th>Com N = {efolds}</th></tr></thead>
      <tbody>{END_ENERGIES.map((e) => { const n = minimumEfolds(e); const status = efolds >= n.flatness ? 'resolve os dois' : efolds >= n.horizon ? 'só o horizonte' : 'nenhum'; return <tr key={e}><th>{gevText(e)}</th><td>{formatNumber(n.horizon, 0)}</td><td>{formatNumber(n.flatness, 0)}</td><td>{status}</td></tr>; })}</tbody>
    </table>
    <p className="plot-note">O número exato depende da escala de energia em que a inflação termina e de como ela termina (o reaquecimento, que não é modelado: aqui ele é instantâneo). Para a planura, supõe-se |Ω − 1| de ordem 1 no início da inflação. Os valores "50 a 60" citados pelo Planck contam as e-dobras desde que a escala k* = 0,05 Mpc⁻¹ saiu do horizonte; o total necessário para todo o universo observável, calculado aqui, é cerca de 5 e-dobras maior.</p>
  </SimCard>;
}

// --- Seção 2 ---------------------------------------------------------------------------

function FluctuationMap({ ns }: { ns: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const noise = useMemo(() => whiteNoiseModes(), []);
  const map = useMemo(() => gaussianMap(ns, noise), [ns, noise]);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const n = map.size;
    canvas.width = n;
    canvas.height = n;
    const image = ctx.createImageData(n, n);
    // Escala divergente fixa: ±2,5 desvios-padrão do mapa com nₛ = 1.
    const hot = getComputedStyle(canvas).getPropertyValue('--accent').trim().split(/\s+/).map((v) => parseFloat(v));
    const cold = getComputedStyle(canvas).getPropertyValue('--primary').trim().split(/\s+/).map((v) => parseFloat(v));
    const hslToRgb = ([h, s, l]: number[], t: number) => {
      const light = 97 - (97 - l) * t;
      const sat = s / 100;
      const L = light / 100;
      const a = sat * Math.min(L, 1 - L);
      const f = (k: number) => L - a * Math.max(-1, Math.min((k + h / 30) % 12 - 3, 9 - ((k + h / 30) % 12), 1));
      return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
    };
    for (let i = 0; i < n * n; i += 1) {
      const v = Math.max(-1, Math.min(1, map.values[i] / 2.5));
      const [r, g, b] = hslToRgb(v >= 0 ? hot : cold, Math.abs(v));
      image.data.set([r, g, b, 255], i * 4);
    }
    ctx.putImageData(image, 0, 0);
  }, [map]);
  return <div>
    <canvas ref={ref} className="field-map" aria-label="Mapa ilustrativo de um campo gaussiano com o espectro escolhido" data-testid="canvas-24-map" />
    <p className="plot-note" data-testid="text-24-large-scales">Variância nas escalas maiores que 2π/k* (~126 Mpc), relativa a n<sub>s</sub> = 1: <b>{formatNumber(map.largeScaleRatio, 3)}</b>.</p>
  </div>;
}

function Seeds() {
  const [ns, setNs] = useState(() => urlNumber('ns', PLANCK_NS, 0.9, 1.1));
  const sigma = nsBelowOneSigma();
  const spectrum = (index: number) => Array.from({ length: 61 }, (_, i) => { const lk = -4 + (i / 60) * 4; return [lk, Math.log10(PLANCK_AS) + (index - 1) * (lk - Math.log10(0.05))] as [number, number]; });
  return <SimCard title="As sementes das estruturas">
    <p>As galáxias cresceram a partir de pequenas flutuações de densidade, que o fundo cósmico registra como variações de temperatura de ~10⁻⁵. O espectro dessas flutuações primordiais é descrito por dois números: <Sym>Δ²(k) = A<sub>s</sub> (k/k*)<sup>n<sub>s</sub> − 1</sup></Sym>, com <Sym>k* = 0,05 Mpc⁻¹</Sym>.</p>
    <StatGrid>
      <Stat label={<>Índice espectral <Sym>n<sub>s</sub></Sym></>} value={`${formatNumber(PLANCK_NS, 4)} ± ${formatNumber(PLANCK_NS_SIGMA, 4)}`} note="Planck 2018 TT,TE,EE+lowE+lensing" testId="text-24-ns" />
      <Stat label={<>Amplitude <Sym>A<sub>s</sub></Sym></>} value={formatSci(PLANCK_AS, 2)} note={<>ln(10¹⁰ A<sub>s</sub>) = 3,044 ± 0,014</>} testId="text-24-as" />
      <Stat label={<><Sym>n<sub>s</sub> &lt; 1</Sym></>} value={`a ${formatNumber(sigma, 1)}σ de 1`} note="Planck 2018: invariância de escala exata (nₛ = 1) excluída" testId="text-24-ns-sigma" />
    </StatGrid>
    <div className="controls"><LinearSlider label="Índice espectral nₛ" heading={<>Índice espectral <Sym>n<sub>s</sub></Sym></>} value={ns} min={0.9} max={1.1} step={0.0001} onChange={(v) => setNs(Math.round(v * 10000) / 10000)} display={formatNumber(ns, 4)} ends={['0,90', '1,10']} testId="input-24-ns" /></div>
    <div className="field-layout">
      <FluctuationMap ns={ns} />
      <LinePlot
        title="Espectro primordial em função do número de onda"
        xMin={-4} xMax={0} yMin={-9.0} yMax={-8.4}
        xTicks={[-4, -3, -2, -1, 0]} yTicks={[-9.0, -8.8, -8.6, -8.4]}
        formatX={(x) => `10${superscript(x)}`} formatY={(y) => formatSci(10 ** y, 1)}
        xLabel="k (Mpc⁻¹)" yLabel="Δ²(k)"
        markers={[{ x: Math.log10(0.05), label: 'k*' }]}
        series={[
          { label: 'nₛ escolhido', color: 'hsl(var(--primary))', points: spectrum(ns), width: 2.2 },
          { label: 'nₛ = 1 (invariante de escala)', color: 'hsl(var(--muted-foreground))', points: spectrum(1), dashed: true, width: 1.4 },
        ]}
        height={220}
      />
    </div>
    <div className="callout warn"><strong>Isto é uma ilustração.</strong> O mapa é um campo gaussiano 2D gerado com o espectro escolhido, sempre a partir da mesma semente; não é um mapa real do céu nem uma simulação do fundo cósmico (que inclui as oscilações acústicas e a projeção na esfera). Com <Sym>n<sub>s</sub> &lt; 1</Sym>, as escalas grandes ficam com um pouco mais de amplitude; com <Sym>n<sub>s</sub> &gt; 1</Sym>, as pequenas.</div>
  </SimCard>;
}

// --- Seção 3 ---------------------------------------------------------------------------

function WhichInflation() {
  const [efolds, setEfolds] = useState(() => urlNumber('Nm', 55, 50, 60));
  const phi2 = slowRoll('phi2', efolds);
  const staro = slowRoll('starobinsky', efolds);
  const track = (model: 'phi2' | 'starobinsky') => Array.from({ length: 11 }, (_, i) => { const p = slowRoll(model, 50 + i); return [p.ns, Math.log10(p.r)] as [number, number]; });
  const limitScale = inflationEnergyScaleGeV(R_UPPER_LIMIT);
  const rows = [
    { id: 'phi2', name: <>Inflação caótica, <Sym>V ∝ φ²</Sym></>, p: phi2, verdict: phi2.r > R_UPPER_LIMIT ? 'Descartado' : 'Permitido', note: `r ≈ 8/N = ${formatSig(phi2.r)}, ${formatNumber(phi2.r / R_UPPER_LIMIT, 0)}× o limite de ${formatNumber(R_UPPER_LIMIT, 3)}; o Planck 2018 já o considerava fortemente desfavorecido` },
    { id: 'starobinsky', name: <>Starobinsky, <Sym>R²</Sym></>, p: staro, verdict: staro.r > R_UPPER_LIMIT ? 'Descartado' : 'Permitido', note: `r ≈ 12/N² = ${formatSig(staro.r, 2)}, abaixo do limite; nₛ a ~2σ dos dados de 2026 (ver abaixo)` },
  ];
  return <SimCard title="Qual inflação?">
    <p>Cada modelo de inflação prevê dois números: o índice espectral <Sym>n<sub>s</sub></Sym> e a razão tensor-escalar <Sym>r</Sym>, que mede quanto de ondas gravitacionais primordiais a inflação produziu. Na primeira ordem de rolamento lento, para N e-dobras entre o momento em que a escala k* saiu do horizonte e o fim da inflação:</p>
    <p className="formula-line"><Sym>φ²: n<sub>s</sub> ≈ 1 − 2/N, r ≈ 8/N</Sym>   ·   <Sym>Starobinsky: n<sub>s</sub> ≈ 1 − 2/N, r ≈ 12/N²</Sym></p>
    <div className="controls"><LinearSlider label="Número de e-dobras N" value={efolds} min={50} max={60} step={1} onChange={setEfolds} display={formatNumber(efolds, 0)} ends={['50', '60']} testId="input-24-model-efolds" /></div>
    <LinePlot
      title="Plano nₛ × r com a faixa do Planck, o limite de r e as previsões de dois modelos"
      xMin={0.94} xMax={0.99} yMin={-3} yMax={0}
      xTicks={[0.94, 0.95, 0.96, 0.97, 0.98, 0.99]} yTicks={[-3, -2, -1, 0]}
      formatX={(x) => formatNumber(x, 2)} formatY={(y) => formatNumber(10 ** y, 3)}
      xLabel="índice espectral nₛ" yLabel="r (escala log)"
      regions={[
        { from: PLANCK_NS - 2 * PLANCK_NS_SIGMA, to: PLANCK_NS + 2 * PLANCK_NS_SIGMA, color: 'hsl(var(--primary) / .12)' },
        { from: PLANCK_NS - PLANCK_NS_SIGMA, to: PLANCK_NS + PLANCK_NS_SIGMA, color: 'hsl(var(--primary) / .18)', label: 'Planck' },
      ]}
      series={[
        { label: `limite r < ${formatNumber(R_UPPER_LIMIT, 3)} (95%)`, color: 'hsl(var(--destructive))', points: [[0.94, Math.log10(R_UPPER_LIMIT)], [0.99, Math.log10(R_UPPER_LIMIT)]], dashed: true, width: 1.8 },
        { label: 'φ², N de 50 a 60', color: 'hsl(var(--accent))', points: track('phi2'), width: 2 },
        { label: 'Starobinsky, N de 50 a 60', color: 'hsl(var(--primary))', points: track('starobinsky'), width: 2 },
      ]}
      dots={[
        { x: phi2.ns, y: Math.log10(phi2.r), label: 'φ²', color: 'hsl(var(--accent))' },
        { x: staro.ns, y: Math.log10(staro.r), label: 'R²', color: 'hsl(var(--primary))', below: true },
      ]}
      height={280}
    />
    <p className="plot-note">Faixas verticais: n<sub>s</sub> do Planck 2018 a 1σ e 2σ. Linha tracejada: {R_LIMIT_NOTE}. O contorno real é bidimensional; este desenho é uma aproximação feita com os limites publicados em uma dimensão.</p>
    <StatGrid>{rows.map((m) => <Stat key={m.id} label={m.name} value={m.verdict} note={`nₛ = ${formatNumber(m.p.ns, 4)}; ${m.note}`} testId={`text-24-model-${m.id}`} />)}</StatGrid>
    <div className="sub-title">A escala de energia da inflação</div>
    <p>Se as ondas gravitacionais primordiais forem medidas, r dá diretamente a energia da inflação: <Sym>V<sup>1/4</sup> = (3π² A<sub>s</sub> r / 2)<sup>1/4</sup> M<sub>P</sub></Sym>, com a massa de Planck reduzida <Sym>M<sub>P</sub> ≈ 2,435 × 10¹⁸ GeV</Sym>.</p>
    <StatGrid>
      <Stat label="Limite superior (r no limite)" value={gevText(limitScale)} note={`de r < ${formatNumber(R_UPPER_LIMIT, 3)}`} testId="text-24-energy-limit" />
      <Stat label={<>Starobinsky, <Sym>N = {efolds}</Sym></>} value={gevText(inflationEnergyScaleGeV(staro.r))} note={`r = ${formatSig(staro.r, 2)}`} testId="text-24-energy-staro" />
      <Stat label="Grande unificação (Módulo 09)" value={gevText(GUT_SCALE_GEV)} note="onde as forças poderiam se unificar; também hipótese" testId="text-24-energy-gut" />
    </StatGrid>
    <p className="plot-note">A inflação, se ocorreu, teria acontecido a no máximo ~{gevText(limitScale)}, perto da escala em que as forças poderiam se unificar (<Link href="/as-forcas-convergem" className="inline-link">Módulo 09</Link>) e cerca de um trilhão de vezes acima da energia do LHC.</p>
  </SimCard>;
}

function Frontier() {
  return <SimCard title="O que falta medir">
    <div className="claims">{READINGS.map((r) => {
      const body = <>
        <p>{r.text}</p>
        {r.source && <p className="plot-note" style={{ margin: 0 }}>{r.source}</p>}
      </>;
      // Itens sem selo (planos de experimentos) são informação, não afirmação sobre a natureza.
      return r.level
        ? <Claim key={r.id} level={r.level} title={r.title}>{body}</Claim>
        : <article key={r.id} className="claim" data-testid={`text-24-${r.id}`}><div className="claim-head"><h3>{r.title}</h3></div><div className="claim-body">{body}</div></article>;
    })}</div>
  </SimCard>;
}

export default function InflationAndPerturbations() {
  return <ModulePage
    title="Inflação e perturbações"
    description="O fundo cósmico mostra um universo quase perfeitamente plano e uniforme, com flutuações minúsculas que viraram galáxias. A inflação é a explicação mais aceita para isso, mas ainda não foi confirmada diretamente. Aqui, o que foi medido fica separado da explicação."
    number="2.4"
    tag="UNIVERSO PRIMORDIAL"
    limitations={LIMITATIONS}
    references={REFERENCES}
  >
    <div className="claims">
      <Claim level="fato" title="As flutuações do fundo cósmico">
        <p>As anisotropias de temperatura do fundo cósmico, de ~10⁻⁵ (30 μK sobre 2,7 K, já no COBE), foram medidas por COBE, WMAP e Planck. O espectro é quase invariante de escala, com <Sym>n<sub>s</sub> &lt; 1</Sym> a 8,4σ, e as flutuações são gaussianas e adiabáticas dentro da precisão atual.</p>
      </Claim>
      <Claim level="consenso" title="Os problemas da planura e do horizonte">
        <p>No modelo sem inflação, o universo precisaria começar com uma planura ajustada a 1 parte em ~10⁶¹ no tempo de Planck (10¹⁸ no primeiro segundo) e com regiões que nunca se comunicaram à mesma temperatura. Que isso pede uma explicação é consenso.</p>
      </Claim>
      <Claim level="hipotese" title="A inflação como explicação">
        <p>A inflação é o paradigma mais aceito: resolve os dois problemas e previu corretamente <Sym>n<sub>s</sub> &lt; 1</Sym>, flutuações gaussianas e adiabáticas e correlações em escalas maiores que o horizonte. Mas ainda falta a confirmação mais direta, as ondas gravitacionais primordiais. Continua hipótese em pesquisa.</p>
      </Claim>
    </div>
    <Puzzles />
    <Seeds />
    <WhichInflation />
    <Frontier />
    <p className="plot-note">Antes: <Link href="/confronto-com-dados-reais" className="inline-link">Módulo 2.3, confronto com dados reais</Link>. Para os cenários de ricochete, veja o <Link href="/os-destinos-possiveis" className="inline-link">Módulo 2.2</Link>. Depois: o que ainda não sabemos sobre a era de Planck, a matéria escura e o futuro mais distante, no <Link href="/a-fronteira" className="inline-link" data-testid="link-24-next">Módulo 2.5, a fronteira</Link>.</p>
  </ModulePage>;
}
