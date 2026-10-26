import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, LinearSlider, Segmented, SimCard, Stat, StatGrid, Sym, type EvidenceLevel } from '../shared';
import { LinePlot, niceTicks, type Series } from '../Plot';
import {
  CPL_MAX_SCALE_FACTOR,
  DESI_DR2_DESY5,
  DESI_DR2_PANTHEON,
  DESI_DR2_UNION3,
  OLDEST_STARS_GYR,
  caldwellBigRipApproxS,
  constantWCosmology,
  desiCosmology,
  recollapse,
  recollapseScaleFactor,
  ripLeadTimeS,
  ripStructures,
  secondsToGyr,
  gyrToSeconds,
  tooYoung,
} from '../../physics/cosmicFates';
import { PLANCK_2018, ageOfUniverseS, bigRipTimeS, hubbleTimeS, lnScaleFactorAtTime, timeAtScaleFactorS, type Cosmology } from '../../physics/friedmann';
import { julianYear } from '../../physics/constants';
import { formatDuration, formatNumber, formatSig, superscript } from '../../lib/format';

type Family = 'w' | 'lambda-negativo' | 'cpl';
type State = { family: Family; w: number; omegaL: number; w0: number; wa: number };
type Shortcut = 'lcdm' | 'big-rip' | 'recontracao' | 'desi';

const SHORTCUTS: Record<Shortcut, { label: ReactNode; state: State }> = {
  lcdm: { label: 'ΛCDM (Planck)', state: { family: 'w', w: -1, omegaL: -0.1, w0: DESI_DR2_DESY5.w0, wa: DESI_DR2_DESY5.wa } },
  'big-rip': { label: 'Big Rip com w = −1,5', state: { family: 'w', w: -1.5, omegaL: -0.1, w0: DESI_DR2_DESY5.w0, wa: DESI_DR2_DESY5.wa } },
  recontracao: { label: <>Recontração com Ω<sub>Λ</sub> = −0,1</>, state: { family: 'lambda-negativo', w: -1, omegaL: -0.1, w0: DESI_DR2_DESY5.w0, wa: DESI_DR2_DESY5.wa } },
  desi: { label: 'Melhor ajuste do DESI DR2', state: { family: 'cpl', w: -1, omegaL: -0.1, w0: DESI_DR2_DESY5.w0, wa: DESI_DR2_DESY5.wa } },
};

/** w constante medido: DESI DR2 + CMB + Pantheon+, modelo wCDM (Tabela V): −0,995 ± 0,023. */
const W_MEASURED = { value: -0.995, sigma: 0.023 };
/** Limite do gráfico quando não há fim. */
const HORIZON_GYR = 200;

const gyrText = (seconds: number, digits = 4) => `${formatSig(secondsToGyr(seconds), digits)} bilhões de anos`;
const duration = (seconds: number) => formatDuration(seconds, julianYear);
const sameState = (a: State, b: State) => a.family === b.family && (a.family === 'w' ? a.w === b.w : a.family === 'lambda-negativo' ? a.omegaL === b.omegaL : a.w0 === b.w0 && a.wa === b.wa);

type Destiny = 'eterna' | 'big-rip' | 'big-crunch' | 'cpl';

type Model = {
  destiny: Destiny;
  ageS: number;
  /** Instante do fim desde o Big Bang (infinito se não houver). */
  endS: number;
  aMax?: number;
  approxToEndS?: number;
  /** Até onde o gráfico vai, em bilhões de anos. */
  xMaxGyr: number;
  curve: [number, number][];
  cosmology?: Cosmology;
  standard: boolean;
};

/** log₁₀ a ao longo do tempo, em bilhões de anos, até `untilS` (amostras mais densas perto do fim). */
function sampleCurve(lnA: (t: number) => number, untilS: number, n = 260): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 1; i <= n; i += 1) {
    // Malha que se adensa nas duas pontas: t = T (1 − cos(πi/n))/2.
    const t = (untilS * (1 - Math.cos((Math.PI * i) / n))) / 2;
    const value = lnA(Math.min(t, untilS * (1 - 1e-9))) / Math.LN10;
    if (Number.isFinite(value)) points.push([secondsToGyr(t), value]);
  }
  return points;
}

function buildModel(s: State): Model {
  if (s.family === 'lambda-negativo') {
    if (s.omegaL >= 0) {
      // Ω_Λ = 0: só matéria (Einstein-de Sitter), a = (t/t₀)^(2/3), expansão eterna desacelerada.
      const ageS = (2 / 3) * hubbleTimeS(PLANCK_2018);
      const xMax = gyrToSeconds(HORIZON_GYR);
      return { destiny: 'eterna', ageS, endS: Infinity, xMaxGyr: HORIZON_GYR, curve: sampleCurve((t) => (2 / 3) * Math.log(t / ageS), xMax), standard: false };
    }
    const r = recollapse(s.omegaL);
    const curve = sampleCurve((t) => Math.log(recollapseScaleFactor(t, s.omegaL)), r.crunchS);
    return { destiny: 'big-crunch', ageS: r.ageS, endS: r.crunchS, aMax: r.aMax, xMaxGyr: secondsToGyr(r.crunchS), curve, standard: false };
  }
  if (s.family === 'cpl') {
    const c = desiCosmology({ w0: s.w0, wa: s.wa, omegaM: DESI_DR2_DESY5.omegaM, h0: DESI_DR2_DESY5.h0 });
    const untilS = timeAtScaleFactorS(CPL_MAX_SCALE_FACTOR, c);
    return { destiny: 'cpl', ageS: ageOfUniverseS(c), endS: Infinity, xMaxGyr: Math.max(secondsToGyr(untilS) * 1.6, 40), curve: sampleCurve((t) => lnScaleFactorAtTime(t, c), untilS), cosmology: c, standard: false };
  }
  const c = constantWCosmology(s.w);
  const ageS = ageOfUniverseS(c);
  const rip = bigRipTimeS(c);
  if (Number.isFinite(rip)) {
    return { destiny: 'big-rip', ageS, endS: rip, approxToEndS: caldwellBigRipApproxS(s.w), xMaxGyr: secondsToGyr(rip), curve: sampleCurve((t) => lnScaleFactorAtTime(t, c), rip), cosmology: c, standard: false };
  }
  return { destiny: 'eterna', ageS, endS: Infinity, xMaxGyr: HORIZON_GYR, curve: sampleCurve((t) => lnScaleFactorAtTime(t, c), gyrToSeconds(HORIZON_GYR)), cosmology: c, standard: s.w === -1 };
}

const DESTINY_LABEL: Record<Destiny, string> = {
  eterna: 'Expansão eterna',
  'big-rip': 'Big Rip',
  'big-crunch': 'Big Crunch',
  cpl: 'Não determinado pela CPL',
};

/** Selo e texto do cenário escolhido: só o ΛCDM é o cenário padrão; o resto é hipótese. */
function ScenarioStatus({ state, model }: { state: State; model: Model }) {
  let level: EvidenceLevel = 'hipotese';
  let title = state.family === 'w' ? (state.w < -1 ? 'Energia fantasma, w < −1' : 'Energia escura com w constante') : state.family === 'lambda-negativo' ? 'Constante cosmológica negativa' : 'Energia escura dinâmica (CPL)';
  let text: ReactNode;
  if (model.standard) {
    level = 'consenso';
    title = 'Cenário padrão, favorecido pelos dados';
    text = 'Energia escura constante (w = −1): expansão eterna, cada vez mais rápida. É o que o ΛCDM prevê, e os dados atuais são compatíveis com ele. Ainda assim é uma projeção, não uma observação do futuro.';
  } else if (state.family === 'w') {
    const sigmas = Math.abs(state.w - W_MEASURED.value) / W_MEASURED.sigma;
    const where = sigmas < 2 ? 'compatível com a medição' : `a ${formatNumber(sigmas, 0)} desvios-padrão da medição`;
    text = `Com w constante, os dados dão w = −0,995 ± 0,023 (DESI DR2 + fundo cósmico + supernovas Pantheon+). Este valor de w está ${where}.${state.w < -1 ? ' Um w só um pouco abaixo de −1 ainda é permitido e também termina em Big Rip, mas muito mais tarde.' : ''}`;
  } else if (state.family === 'lambda-negativo') {
    text = 'Um Λ negativo puro faz o universo parar de expandir e recolapsar. Com os números deste controle, a idade de hoje sai menor que a das estrelas mais velhas: o cenário já está descartado. Modelos de recontração levados a sério combinam Λ negativo com um campo que domina hoje.';
  } else {
    text = <>Combinando o DESI com o fundo cósmico e supernovas, o modelo w₀w<sub>a</sub> é preferido ao ΛCDM com 2,8 a 4,2 desvios-padrão, conforme a amostra de supernovas. Ainda não é uma detecção (o padrão para isso é 5 desvios-padrão), e a CPL não diz nada sobre o futuro distante.</>;
  }
  return <div className="callout" data-testid="text-22-status">
    <div className="claim-head"><strong>{title}</strong><EvidenceTag level={level} /></div>
    <p style={{ margin: '6px 0 0' }}>{text}</p>
  </div>;
}

function Controls({ state, setState }: { state: State; setState: (s: State) => void }) {
  const set = (patch: Partial<State>) => setState({ ...state, ...patch });
  return <div className="controls">
    <div>
      <div className="log-slider-head"><span>Atalhos</span></div>
      <div className="presets" role="group" aria-label="Atalhos">
        {(Object.keys(SHORTCUTS) as Shortcut[]).map((key) => <button type="button" key={key} className={sameState(state, SHORTCUTS[key].state) ? 'preset active' : 'preset'} onClick={() => setState(SHORTCUTS[key].state)} data-testid={`button-22-${key}`}>{SHORTCUTS[key].label}</button>)}
      </div>
    </div>
    <div>
      <div className="log-slider-head"><span>Família de energia escura</span></div>
      <Segmented label="Família de energia escura" value={state.family} onChange={(family) => set({ family })} options={[{ value: 'w', label: 'w constante' }, { value: 'lambda-negativo', label: 'Λ negativo' }, { value: 'cpl', label: 'CPL, w(a)' }]} />
    </div>
    {state.family === 'w' && <LinearSlider label="Equação de estado w" value={state.w} min={-2} max={-0.5} step={0.01} onChange={(w) => set({ w: Math.round(w * 100) / 100 })} display={formatNumber(state.w, 2)} ends={['−2 (fantasma)', '−0,5']} testId="input-22-w" />}
    {state.family === 'lambda-negativo' && <LinearSlider label="Ômega lambda (negativo), com Ômega m = 1 − Ômega lambda" heading={<>Ω<sub>Λ</sub> (negativo), com Ω<sub>m</sub> = 1 − Ω<sub>Λ</sub></>} value={state.omegaL} min={-1} max={0} step={0.005} onChange={(omegaL) => set({ omegaL: Math.round(omegaL * 1000) / 1000 })} display={formatNumber(state.omegaL, 3)} ends={['−1', '0']} testId="input-22-omegal" />}
    {state.family === 'cpl' && <>
      <LinearSlider label="w₀ (hoje)" value={state.w0} min={-1.5} max={-0.5} step={0.001} onChange={(w0) => set({ w0: Math.round(w0 * 1000) / 1000 })} display={formatNumber(state.w0, 3)} ends={['−1,5', '−0,5']} testId="input-22-w0" />
      <LinearSlider label="w a (variação)" heading={<>w<sub>a</sub> (variação)</>} value={state.wa} min={-2} max={0.5} step={0.01} onChange={(wa) => set({ wa: Math.round(wa * 100) / 100 })} display={formatNumber(state.wa, 2)} ends={['−2', '0,5']} testId="input-22-wa" />
      <p className="plot-note">Neste modo, Ω<sub>m</sub> = {formatNumber(DESI_DR2_DESY5.omegaM, 4)} e H₀ = {formatNumber(DESI_DR2_DESY5.h0, 2)} km/s/Mpc, do mesmo ajuste do DESI (DESI DR2 + fundo cósmico + supernovas DESY5).</p>
    </>}
  </div>;
}

function Readout({ state, model }: { state: State; model: Model }) {
  const toEnd = model.endS - model.ageS;
  const young = tooYoung(model.ageS);
  return <>
    <StatGrid>
      <Stat label="Destino" value={DESTINY_LABEL[model.destiny]} note={model.destiny === 'cpl' ? `a simulação para em a = ${CPL_MAX_SCALE_FACTOR}` : model.destiny === 'eterna' ? (state.family === 'lambda-negativo' ? 'só matéria: desacelera para sempre' : 'cresce sem limite') : 'num tempo finito'} testId="text-22-destiny" />
      <Stat label="Tempo até o fim, a partir de hoje" value={Number.isFinite(toEnd) ? gyrText(toEnd) : '—'} note={model.approxToEndS ? `aproximação de Caldwell: ${gyrText(model.approxToEndS)}` : model.destiny === 'cpl' ? 'a CPL não vale no futuro distante' : Number.isFinite(toEnd) ? 'pela solução analítica' : 'não há fim'} testId="text-22-time-to-end" />
      <Stat label="Idade de hoje neste modelo" value={gyrText(model.ageS)} note={`estrelas mais velhas: ~${OLDEST_STARS_GYR} bilhões de anos`} testId="text-22-age" />
      {model.destiny === 'big-crunch' && <Stat label={<>Fator de escala máximo <Sym>a<sub>máx</sub></Sym></>} value={formatSig(model.aMax!)} note={<Sym>(Ω<sub>m</sub>/|Ω<sub>Λ</sub>|)<sup>1/3</sup></Sym>} testId="text-22-amax" />}
      {Number.isFinite(model.endS) && <Stat label="O fim, desde o Big Bang" value={gyrText(model.endS)} note={model.destiny === 'big-crunch' ? <Sym>2π / (3H₀√|Ω<sub>Λ</sub>|)</Sym> : 'integral de da/(aH) até a → ∞'} testId="text-22-end" />}
    </StatGrid>
    {young && <div className="callout warn" data-testid="text-22-too-young"><strong>Incompatível com as estrelas mais velhas.</strong> Neste modelo o universo teria hoje só {gyrText(model.ageS, 3)}, mas os aglomerados globulares mais antigos da Via Láctea têm 13,3 ± 0,5 bilhões de anos, datados sem usar cosmologia. Um universo não pode ser mais novo que as estrelas que contém: os dados descartam este cenário.</div>}
  </>;
}

function ScaleFactorPlot({ model }: { model: Model }) {
  const xMax = model.xMaxGyr;
  const reference = useMemo(() => sampleCurve((t) => lnScaleFactorAtTime(t, PLANCK_2018), gyrToSeconds(Math.max(xMax, 1))), [xMax]);
  const series: Series[] = [
    { label: 'ΛCDM (Planck 2018), referência', color: 'hsl(var(--muted-foreground))', points: reference, dashed: true, width: 1.6 },
    { label: 'modelo escolhido', color: 'hsl(var(--primary))', points: model.curve, width: 2.4 },
  ];
  const markers = [{ x: secondsToGyr(model.ageS), label: 'hoje', color: 'hsl(var(--accent))' }];
  if (Number.isFinite(model.endS)) markers.push({ x: secondsToGyr(model.endS), label: DESTINY_LABEL[model.destiny], color: 'hsl(var(--destructive))' });
  if (model.destiny === 'cpl') {
    const last = model.curve[model.curve.length - 1];
    markers.push({ x: last[0], label: `a = ${CPL_MAX_SCALE_FACTOR}: a simulação para`, color: 'hsl(var(--destructive))' });
  }
  return <>
    <LinePlot
      title="Fator de escala em função do tempo, com o ΛCDM como referência tracejada"
      xMin={0} xMax={xMax} yMin={-1} yMax={3}
      xTicks={niceTicks(xMax, 5)} yTicks={[-1, 0, 1, 2, 3]}
      formatX={(x) => formatNumber(x, 1)} formatY={(y) => (y <= 0 ? formatNumber(10 ** y, 1) : y < 3 ? formatNumber(10 ** y, 0) : `10${superscript(y)}`)}
      xLabel="tempo desde o Big Bang (bilhões de anos)" yLabel="a"
      markers={markers}
      series={series}
      height={300}
    />
    <p className="plot-note">Eixo vertical em escala logarítmica: a = 1 é hoje. {model.destiny === 'big-rip' ? 'No Big Rip, a vai ao infinito num tempo finito.' : model.destiny === 'big-crunch' ? 'Na recontração, a sobe até o máximo e volta a zero.' : model.destiny === 'cpl' ? `A curva para em a = ${CPL_MAX_SCALE_FACTOR}: estendida além disso, a CPL faz w(a) crescer sem limite, sem base física.` : `Sem fim: o gráfico vai até ${HORIZON_GYR} bilhões de anos.`}</p>
  </>;
}

function RipTimeline({ w, model }: { w: number; model: Model }) {
  const toEnd = model.endS - model.ageS;
  return <div data-testid="text-22-rip-timeline">
    <div className="sub-title">A linha do tempo do fim</div>
    <p>Pela regra de Caldwell, Kamionkowski e Weinberg, uma estrutura ligada se desfaz quando o tempo que resta até o Big Rip fica menor que cerca de <Sym>P √(2|1 + 3w|) / (6π|1 + w|)</Sym>, sendo <Sym>P</Sym> o período de uma órbita típica dela. Com w = {formatNumber(w, 2)}, isso é {formatSig(ripLeadTimeS(1, w))} P.</p>
    <ol className="timeline-list cosmic-list">{ripStructures().map((s) => {
      const lead = ripLeadTimeS(s.periodS, w);
      return <li key={s.id} data-testid={`row-22-${s.id}`}>
        <span className="timeline-year">{duration(lead)} antes</span>
        <div>
          <div className="claim-head"><b>{s.name}</b><EvidenceTag level="hipotese" /></div>
          <p className="milestone-when">{lead < toEnd ? `daqui a ${gyrText(toEnd - lead, 4)}` : 'a regra deixa de valer: o tempo antes do fim passa do tempo que resta'}</p>
          <p>P = {duration(s.periodS).replace(/^1,00 anos$/, '1 ano')}: {s.basis}. No artigo, com w = −3/2: {s.paper}.{s.id === 'atomos' ? ' A regra foi deduzida para sistemas ligados pela gravidade; para átomos, ligados pela força elétrica, é só uma extrapolação, e o artigo não detalha a conta que dá ~10⁻¹⁹ s.' : ''}</p>
        </div>
      </li>;
    })}</ol>
    <p className="plot-note">Depois dos átomos, núcleos e prótons se desfazem no instante que resta. Perto da singularidade, é provável que física nova (gravidade quântica, criação de partículas) entre em cena antes.</p>
  </div>;
}

function Simulation({ state, setState }: { state: State; setState: (s: State) => void }) {
  const model = useMemo(() => buildModel(state), [state]);
  return <SimCard title="Escolha a energia escura, veja o futuro">
    <p>A equação de Friedmann é a mesma do <Link href="/a-linha-do-tempo-cosmica" className="inline-link">Módulo 2.1</Link>; muda só como a densidade da energia escura evolui. Com equação de estado <Sym>w = p/ρ</Sym>, ela se dilui como <Sym>a<sup>−3(1+w)</sup></Sym>: com <Sym>w = −1</Sym> fica constante (Λ), com <Sym>w &lt; −1</Sym> cresce com a expansão ("energia fantasma").</p>
    <p className="formula-line"><Sym>H(a) = H₀ √(Ω<sub>r</sub> a⁻⁴ + Ω<sub>m</sub> a⁻³ + Ω<sub>DE</sub> ρ<sub>DE</sub>(a)/ρ<sub>DE</sub>(1))</Sym></p>
    <Controls state={state} setState={setState} />
    <ScenarioStatus state={state} model={model} />
    <ScaleFactorPlot model={model} />
    <Readout state={state} model={model} />
    {model.destiny === 'big-rip' && <RipTimeline w={state.w} model={model} />}
    {state.family === 'cpl' && <DesiNote />}
    {state.family === 'cpl' && <div className="callout warn" data-testid="text-22-cpl-note"><strong>Por que a simulação para em a = {CPL_MAX_SCALE_FACTOR}.</strong> A CPL, <Sym>w(a) = w₀ + w<sub>a</sub>(1 − a)</Sym>, é uma forma prática de descrever os dados do passado recente (a ≤ 1). Para o futuro, ela não tem base física: com <Sym>w<sub>a</sub> &lt; 0</Sym>, w(a) cresce sem limite à medida que a cresce. Com estes valores, w(a = {CPL_MAX_SCALE_FACTOR}) = {formatNumber(state.w0 - state.wa, 2)}. O destino de uma energia escura dinâmica depende do modelo físico por trás dela, que ainda não existe.</div>}
  </SimCard>;
}

function DesiNote() {
  const fit = (f: typeof DESI_DR2_DESY5) => <>w₀ = {formatNumber(f.w0, 3)}, w<sub>a</sub> = {formatNumber(f.wa, 2)}</>;
  return <p className="plot-note" data-testid="text-22-desi-note">Atalho do DESI: médias da Tabela V do artigo do DESI DR2 para DESI + fundo cósmico + supernovas DESY5 ({fit(DESI_DR2_DESY5)}; 4,2 desvios-padrão de preferência sobre o ΛCDM). Com as outras amostras de supernovas: Pantheon+, {fit(DESI_DR2_PANTHEON)} (2,8σ); Union3, {fit(DESI_DR2_UNION3)} (3,8σ).</p>;
}

function initialState(): State {
  if (typeof window === 'undefined') return SHORTCUTS.lcdm.state;
  const key = new URLSearchParams(window.location.search).get('atalho') as Shortcut | null;
  return (key && SHORTCUTS[key]?.state) || SHORTCUTS.lcdm.state;
}

export default function PossibleFates() {
  // ?atalho=lcdm|big-rip|recontracao|desi abre a página num dos atalhos.
  const [state, setState] = useState<State>(initialState);
  return <ModulePage
    title="Os destinos possíveis"
    description="O futuro do universo depende de uma pergunta em aberto: o que é a energia escura. Se for uma constante, a expansão segue para sempre. Se crescer, pode rasgar tudo num tempo finito; se fosse negativa, o universo voltaria a se contrair. Só o primeiro cenário é o favorecido pelos dados; os outros são hipóteses."
    number="2.2"
    tag="ENERGIA ESCURA"
    limitations={[
      <>Só universos planos. A curvatura medida é compatível com zero.</>,
      <>A energia escura é tratada como um fluido com equação de estado dada. Modelos de campo escalar (quintessência) com potenciais específicos não foram implementados.</>,
      <>O Λ negativo puro já é descartado pela idade das estrelas. Modelos realistas de recontração combinam Λ negativo com um campo que domina hoje e decai depois; eles não estão implementados. Na família de Λ negativo, a radiação é desprezada, um efeito de menos de 0,1% na idade.</>,
      <>A CPL não vale no futuro distante: a simulação para em a = {CPL_MAX_SCALE_FACTOR}. Na família CPL, Ω<sub>m</sub> e H₀ ficam fixos nos valores do ajuste do DESI, mesmo quando w₀ e w<sub>a</sub> mudam.</>,
      <>A regra dos tempos de desagregação no Big Rip é uma estimativa de ordem de grandeza, e os períodos orbitais usados são típicos, não exatos.</>,
      <>Neutrinos sem massa, como no Módulo 2.1.</>,
    ]}
    references={[
      { text: 'R. R. Caldwell, M. Kamionkowski e N. N. Weinberg, "Phantom Energy: Dark Energy with w < −1 Causes a Cosmic Doomsday", Physical Review Letters 91, 071301 (2003).', url: 'https://doi.org/10.1103/PhysRevLett.91.071301' },
      { text: 'M. Chevallier e D. Polarski, "Accelerating Universes with Scaling Dark Matter", International Journal of Modern Physics D 10, 213 (2001).', url: 'https://doi.org/10.1142/S0218271801000822' },
      { text: 'E. V. Linder, "Exploring the Expansion History of the Universe", Physical Review Letters 90, 091301 (2003).', url: 'https://doi.org/10.1103/PhysRevLett.90.091301' },
      { text: 'DESI Collaboration (M. Abdul Karim et al.), "DESI DR2 Results II: Measurements of Baryon Acoustic Oscillations and Cosmological Constraints", Physical Review D 112, 083515 (2025).', url: 'https://doi.org/10.1103/tr6y-kpc6' },
      { text: 'D. Valcin et al., "Inferring the Age of the Universe with Globular Clusters", Journal of Cosmology and Astroparticle Physics 12, 002 (2020).', url: 'https://doi.org/10.1088/1475-7516/2020/12/002' },
      { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
      { text: 'P. J. Steinhardt e N. Turok, "A Cyclic Model of the Universe", Science 296, 1436 (2002).', url: 'https://doi.org/10.1126/science.1070462' },
      { text: 'A. Ijjas e P. J. Steinhardt, "Bouncing Cosmology Made Simple", Classical and Quantum Gravity 35, 135004 (2018).', url: 'https://doi.org/10.1088/1361-6382/aac482' },
      { text: 'R. Penrose, Cycles of Time: An Extraordinary New View of the Universe (Bodley Head, Londres, 2010).' },
      { text: 'I. K. Wehus e H. K. Eriksen, "A Search for Concentric Circles in the 7 Year Wilkinson Microwave Anisotropy Probe Temperature Sky Maps", The Astrophysical Journal Letters 733, L29 (2011).', url: 'https://doi.org/10.1088/2041-8205/733/2/L29' },
      { text: 'D. An, K. A. Meissner, P. Nurowski e R. Penrose, "Apparent evidence for Hawking points in the CMB Sky", Monthly Notices of the Royal Astronomical Society 495, 3403 (2020).', url: 'https://doi.org/10.1093/mnras/staa1343' },
      { text: 'D. L. Jow e D. Scott, "Re-evaluating evidence for Hawking points in the CMB", Journal of Cosmology and Astroparticle Physics 03, 021 (2020).', url: 'https://doi.org/10.1088/1475-7516/2020/03/021' },
      { text: 'J. Bland-Hawthorn e O. Gerhard, "The Galaxy in Context: Structural, Kinematic, and Integrated Properties", Annual Review of Astronomy and Astrophysics 54, 529 (2016).', url: 'https://doi.org/10.1146/annurev-astro-081915-023441' },
    ]}
  >
    <div className="claims">
      <Claim level="fato" title="A expansão está acelerando">
        <p>Supernovas, oscilações acústicas dos bárions e o fundo cósmico mostram, de forma independente, que a expansão acelera desde uns 6 bilhões de anos atrás. Isso é observação, não modelo (Nobel de 2011).</p>
      </Claim>
      <Claim level="consenso" title="Expansão eterna com Λ constante é o cenário padrão">
        <p>No ΛCDM a energia escura é uma constante cosmológica, e a expansão segue para sempre, exponencial. É o cenário que melhor descreve o conjunto dos dados, e a referência tracejada em todos os gráficos abaixo.</p>
      </Claim>
      <Claim level="consenso" title="O destino real ainda não está decidido">
        <p>A pergunta está em aberto. Medimos a energia escura só no passado; o futuro é uma extrapolação, que depende de ela ser constante. O DESI vê sinais, ainda não conclusivos, de que ela pode variar. O <Link href="/confronto-com-dados-reais" className="inline-link" data-testid="link-22-module-23">Módulo 2.3</Link> confronta cada cenário com os dados reais.</p>
      </Claim>
    </div>
    <Simulation state={state} setState={setState} />
    <div className="claims">
      <Claim level="hipotese" title="Big Rip, recontração e energia escura dinâmica">
        <p>Uma energia fantasma (w &lt; −1) violaria a condição de energia dominante e não tem modelo físico estabelecido. Um Λ negativo puro já está descartado; só sobrevive combinado a outros campos. A energia escura dinâmica sugerida pelo DESI é a mais séria das três, mas ainda não chega ao nível de detecção. Todas são hipóteses em pesquisa.</p>
      </Claim>
    </div>
    <SimCard title="Universos cíclicos e ricochetes">
      <div className="callout"><div className="claim-head"><strong>Leitura, sem simulação</strong><EvidenceTag level="hipotese" /></div><p style={{ margin: '6px 0 0' }}>Estes cenários não podem ser simulados com física estabelecida: todo ricochete exige física além da relatividade geral.</p></div>
      <p>E se o Big Bang não tiver sido o começo? Alguns modelos propõem que o universo passa por ciclos, ou que a fase de expansão começou com um ricochete, depois de uma contração anterior.</p>
      <ul className="limits-list" style={{ margin: "12px 0" }}>
        <li><b>Universo cíclico de Steinhardt e Turok (2002).</b> Inspirado na teoria de cordas: dois "branes" colidem periodicamente, e cada colisão faz o papel de um Big Bang. Entre um ciclo e outro, uma fase de energia escura dilui tudo.</li>
        <li><b>Ricochetes de Ijjas e Steinhardt.</b> Uma fase de contração lenta deixa o universo liso e plano e depois ricocheteia em expansão, sem passar por uma singularidade. Propõem que isso substitui a inflação.</li>
        <li><b>Cosmologia cíclica conforme de Penrose (2010).</b> O futuro infinitamente diluído de um universo seria equivalente, por uma mudança de escala, ao Big Bang do seguinte. Penrose e colaboradores apontaram círculos concêntricos e "pontos de Hawking" no fundo cósmico como assinaturas, mas análises independentes (Wehus e Eriksen, 2011; Jow e Scott, 2020) não encontraram excesso em relação ao acaso: as assinaturas alegadas são contestadas.</li>
      </ul>
      <p>Por que não dá para simular? Na relatividade geral, uma contração que vira expansão exige que algo viole as condições de energia (em particular a condição de energia nula, respeitada por toda matéria conhecida) ou que a gravidade quântica, que ainda não existe como teoria testada, entre em cena. Sem essa física, não há equação estabelecida para resolver. O tema volta no Módulo 2.5, "A fronteira" (em breve).</p>
    </SimCard>
  </ModulePage>;
}
