import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot, type Dot } from '../Plot';
import { CosmicTimeSlider, EpochNotice, setCosmicTime, timeFromUrl, useCosmicTime } from '../cosmicTime';
import { cosmicEpoch, cosmicMilestones, nearestMilestone, temperatureReading, type CosmicMilestone } from '../cosmicMilestones';
import {
  PLANCK_2018_AGE_GYR,
  PLANCK_2018_AGE_SIGMA_GYR,
  PLANCK_2018_H0,
  PLANCK_2018_Z_EQ,
  SHOES_H0,
  ageOfUniverseS,
  densityFractions,
  eventHorizonM,
  hubbleTimeS,
  lambdaEfoldTimeS,
  lnExpansionRate,
  lnScaleFactorAtTime,
  makeCosmology,
  matterLambdaEqualityRedshift,
  matterRadiationEqualityRedshift,
  metersToGly,
  particleHorizonM,
  radiationDensityH2,
  secondsToGyr,
  timeAtRedshiftS,
  type Cosmology,
} from '../../physics/friedmann';
import { julianYear } from '../../physics/constants';
import { formatDuration, formatFromLog10, formatNumber, formatRedshift, formatSci, formatSig, superscript } from '../../lib/format';

type Preset = 'planck' | 'shoes';
const COSMOLOGIES: Record<Preset, Cosmology> = { planck: makeCosmology(PLANCK_2018_H0), shoes: makeCosmology(SHOES_H0) };

const duration = (seconds: number) => formatDuration(seconds, julianYear);
const log10Years = (seconds: number) => Math.log10(seconds / julianYear);

/** Fração de densidade em porcentagem, a partir de log₁₀ da fração (sem underflow). */
function formatFraction(log10Fraction: number) {
  const percent = log10Fraction + 2;
  if (percent >= -2) return `${formatSig(10 ** percent)}%`;
  return `${formatFromLog10(percent)}%`;
}

// Eixo dos gráficos: log₁₀ do tempo em anos, de ~0,3 s a 100 bilhões de anos.
const X_RANGE: [number, number] = [-8, 11];
const X_TICKS = [-6, -3, 0, 3, 6, 9];
const SAMPLES = Array.from({ length: 241 }, (_, i) => X_RANGE[0] + (i / 240) * (X_RANGE[1] - X_RANGE[0]));
const formatYearsTick = (x: number) => `10${superscript(x)}`;

/** Marcos que aparecem como pontos numerados no gráfico de a(t). */
const PLOTTED = ['nucleossintese', 'igualdade', 'recombinacao', 'primeiras-estrelas', 'reionizacao', 'hoje', 'futuro'];

function useModel(preset: Preset) {
  return useMemo(() => {
    const c = COSMOLOGIES[preset];
    const t0 = ageOfUniverseS(c);
    const tEq = timeAtRedshiftS(matterRadiationEqualityRedshift(c), c);
    const tL = timeAtRedshiftS(matterLambdaEqualityRedshift(c), c);
    const lnA = SAMPLES.map((x) => lnScaleFactorAtTime(10 ** x * julianYear, c));
    const fractions = lnA.map((l) => densityFractions(l, c));
    const milestones = cosmicMilestones(c);
    return { c, t0, tEq, tL, lnA, fractions, milestones };
  }, [preset]);
}

function Readout({ time, c, t0 }: { time: number; c: Cosmology; t0: number }) {
  const lnA = lnScaleFactorAtTime(time, c);
  const log10A = lnA / Math.LN10;
  const future = time > t0 * (1 + 1e-6);
  const fractions = densityFractions(lnA, c).log10;
  const log10H = Math.log10(c.h0) + lnExpansionRate(lnA, c) / Math.LN10;
  const temperature = temperatureReading(time, c);
  const share = (log10: number) => `${Math.max(0, 10 ** log10 * 100)}%`;
  return <>
    <StatGrid>
      <Stat label="Tempo desde o Big Bang" value={duration(time)} note={future ? `daqui a ${duration(time - t0)}` : `há ${duration(t0 - time)}`} testId="text-21-time" />
      <Stat label={<>Fator de escala <Sym>a</Sym></>} value={formatFromLog10(log10A)} note="tamanho relativo a hoje (a = 1)" testId="text-21-a" />
      <Stat label={<>Redshift <Sym>z</Sym></>} value={future ? '—' : formatRedshift(Math.expm1(-lnA))} note={future ? 'no futuro, z não se aplica; veja o fator a' : 'z = 1/a − 1'} testId="text-21-z" />
      <Stat label={<>Temperatura <Sym>T = T₀(1 + z)</Sym></>} value={temperature.value} note={temperature.note ?? 'radiação de fundo, T₀ = 2,7255 K'} testId="text-21-T" />
      <Stat label={<>Taxa de expansão <Sym>H</Sym></>} value={`${formatFromLog10(log10H)} km/s/Mpc`} note={`H₀ = ${formatNumber(c.h0, 2)} km/s/Mpc hoje`} testId="text-21-H" />
      <Stat label="Domina a expansão" value={fractions.radiation > fractions.matter && fractions.radiation > fractions.darkEnergy ? 'Radiação' : fractions.matter > fractions.darkEnergy ? 'Matéria' : 'Energia escura'} note="maior fração de densidade" testId="text-21-dominant" />
    </StatGrid>
    <div className="sub-title" style={{ marginBottom: 4 }}>Frações de densidade</div>
    <div className="composition" aria-hidden="true">
      <div className="radiation" style={{ width: share(fractions.radiation) }} />
      <div className="matter" style={{ width: share(fractions.matter) }} />
      <div className="dark-energy" style={{ width: share(fractions.darkEnergy) }} />
    </div>
    <StatGrid>
      <Stat label={<>Radiação <Sym>Ω<sub>r</sub>(a)</Sym></>} value={formatFraction(fractions.radiation)} note="fótons e neutrinos" testId="text-21-frac-r" />
      <Stat label={<>Matéria <Sym>Ω<sub>m</sub>(a)</Sym></>} value={formatFraction(fractions.matter)} note="escura e comum" testId="text-21-frac-m" />
      <Stat label={<>Energia escura <Sym>Ω<sub>Λ</sub>(a)</Sym></>} value={formatFraction(fractions.darkEnergy)} note="constante cosmológica" testId="text-21-frac-l" />
    </StatGrid>
  </>;
}

function MilestoneClaim({ milestone }: { milestone: CosmicMilestone }) {
  return <div className="claims" data-testid="text-21-milestone">
    <Claim level={milestone.level} title={`Marco mais próximo: ${milestone.name}`}>
      <p className="milestone-when">{milestone.when}</p>
      <p>{milestone.text}</p>
      {milestone.link && <p><Link href={milestone.link.href} className="inline-link">{milestone.link.label}</Link></p>}
    </Claim>
  </div>;
}

function CosmicClock({ preset, setPreset }: { preset: Preset; setPreset: (p: Preset) => void }) {
  const [time, setTime] = useCosmicTime();
  const { c, t0, milestones } = useModel(preset);
  const nearest = nearestMilestone(time, milestones);
  return <SimCard title="O relógio cósmico">
    <p>A equação de Friedmann liga a taxa de expansão <Sym>H</Sym> ao conteúdo do universo. Cada componente se dilui de um jeito: a radiação como <Sym>a⁻⁴</Sym> (o volume cresce e cada fóton perde energia), a matéria como <Sym>a⁻³</Sym>, e a energia escura, no modelo ΛCDM, não se dilui. Integrando <Sym>dt = da / (a H)</Sym> desde <Sym>a = 0</Sym>, sai a idade do universo em cada instante.</p>
    <p className="formula-line"><Sym>H(a) = H₀ √(Ω<sub>r</sub> a⁻⁴ + Ω<sub>m</sub> a⁻³ + Ω<sub>Λ</sub>)</Sym></p>
    <div className="controls">
      <div>
        <div className="log-slider-head"><span>Parâmetros</span></div>
        <Segmented label="Parâmetros cosmológicos" value={preset} onChange={setPreset} options={[{ value: 'planck', label: 'Planck 2018 (H₀ = 67,4)' }, { value: 'shoes', label: 'Universo local, SH0ES (H₀ = 73,04)' }]} />
        <p className="plot-note">Ω<sub>m</sub> = 0,315 nos dois casos; Ω<sub>r</sub> = {formatSci(c.omegaR)}; Ω<sub>Λ</sub> = {formatSig(c.omegaL)}. Idade: <b data-testid="text-21-age">{formatSig(secondsToGyr(t0), 4)} bilhões de anos</b>.</p>
      </div>
      {preset === 'shoes' && <div className="callout warn" data-testid="text-21-shoes-note">Com o H₀ do SH0ES e Ω<sub>m</sub> fixo, a idade cai para {formatSig(secondsToGyr(t0), 3)} bilhões de anos. Numa análise real, Ω<sub>m</sub> também mudaria: o fundo cósmico fixa sobretudo Ω<sub>m</sub> h², e um H₀ maior viria com Ω<sub>m</sub> menor. Este atalho só ilustra a tensão de Hubble do <Link href="/ouvindo-o-universo" className="inline-link">Módulo 8</Link>: as duas medições de H₀ não cabem no mesmo ΛCDM.</div>}
      <div>
        <div className="log-slider-head"><span>Tempo desde o Big Bang</span><output>{duration(time)}</output></div>
        <CosmicTimeSlider value={time} onChange={setTime} todayS={t0} testId="input-21-time" />
      </div>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={() => setTime(t0)} data-testid="button-21-today">Voltar à era de hoje</button>
      </div>
      <div className="presets" role="group" aria-label="Marcos">
        {milestones.map((m) => <button type="button" key={m.id} className={nearest.id === m.id ? 'preset active' : 'preset'} onClick={() => setTime(m.anchor)} data-testid={`button-21-${m.id}`}>{m.short}</button>)}
      </div>
    </div>
    <EpochNotice epoch={cosmicEpoch(time, c)} />
    <Readout time={time} c={c} t0={t0} />
    <MilestoneClaim milestone={nearest} />
  </SimCard>;
}

function ScaleFactorPlot({ preset }: { preset: Preset }) {
  const [time] = useCosmicTime();
  const { tEq, tL, lnA, milestones } = useModel(preset);
  const c = COSMOLOGIES[preset];
  const plotted = PLOTTED.map((id) => milestones.find((m) => m.id === id)!);
  const dots: Dot[] = plotted.map((m, i) => ({ x: log10Years(m.anchor), y: lnScaleFactorAtTime(m.anchor, c) / Math.LN10, label: String(i + 1), below: m.id === 'primeiras-estrelas' || m.id === 'futuro' }));
  return <SimCard title="O fator de escala a(t)">
    <p>Em escala log-log, cada era é quase uma reta: <Sym>a ∝ t<sup>1/2</sup></Sym> quando a radiação domina, <Sym>a ∝ t<sup>2/3</sup></Sym> quando a matéria domina. Com a energia escura, a curva dispara: o crescimento passa a ser exponencial.</p>
    <LinePlot
      title="Fator de escala em função do tempo, em escala log-log, com as três eras"
      xMin={X_RANGE[0]} xMax={X_RANGE[1]} yMin={-10} yMax={3}
      xTicks={X_TICKS} yTicks={[-9, -6, -3, 0, 3]}
      formatX={formatYearsTick} formatY={(y) => `10${superscript(y)}`}
      xLabel="tempo desde o Big Bang (anos)" yLabel="a"
      regions={[
        { from: X_RANGE[0], to: log10Years(tEq), color: 'hsl(var(--accent) / .1)', label: 'radiação' },
        { from: log10Years(tEq), to: log10Years(tL), color: 'hsl(var(--chart-5) / .1)', label: 'matéria' },
        { from: log10Years(tL), to: X_RANGE[1], color: 'hsl(var(--primary) / .12)', label: 'Λ' },
      ]}
      markers={[{ x: log10Years(time), label: 'controle' }]}
      dots={dots}
      series={[{ label: 'a(t), ΛCDM plano', color: 'hsl(var(--foreground))', points: SAMPLES.map((x, i) => [x, lnA[i] / Math.LN10]), width: 2.2 }]}
      height={300}
    />
    <ol className="dot-legend">{plotted.map((m, i) => <li key={m.id}><b>{i + 1}</b><span>{m.name}: {m.whenShort}</span></li>)}</ol>
    <p className="plot-note">O gráfico começa em ~0,3 s; antes disso o modelo é só extrapolação. A formação do Sol (9,2 bilhões de anos) e o início da aceleração (7,7 bilhões de anos) ficam muito perto de "hoje" nesta escala e aparecem na lista de marcos abaixo.</p>
  </SimCard>;
}

function FractionsPlot({ preset }: { preset: Preset }) {
  const [time] = useCosmicTime();
  const { tEq, tL, fractions } = useModel(preset);
  return <SimCard title="Quem domina a expansão">
    <p>As frações de densidade mostram as duas trocas de domínio: a matéria supera a radiação cerca de 50 mil anos após o Big Bang, e a energia escura supera a matéria há cerca de 3,5 bilhões de anos.</p>
    <LinePlot
      title="Frações de densidade de radiação, matéria e energia escura em função do tempo"
      xMin={X_RANGE[0]} xMax={X_RANGE[1]} yMin={0} yMax={1}
      xTicks={X_TICKS} yTicks={[0, 0.5, 1]}
      formatX={formatYearsTick} formatY={(y) => formatNumber(y, 1)}
      xLabel="tempo desde o Big Bang (anos)" yLabel="fração"
      markers={[
        { x: log10Years(tEq), label: `igualdade: ${duration(tEq)}`, color: 'hsl(var(--chart-5))' },
        { x: log10Years(tL), label: `Λ domina: ${duration(tL)}`, color: 'hsl(var(--primary))' },
        { x: log10Years(time), label: 'controle' },
      ]}
      series={[
        { label: 'Radiação', color: 'hsl(var(--accent))', points: SAMPLES.map((x, i) => [x, fractions[i].radiation]), width: 2.2 },
        { label: 'Matéria', color: 'hsl(var(--chart-5))', points: SAMPLES.map((x, i) => [x, fractions[i].matter]), width: 2.2 },
        { label: 'Energia escura', color: 'hsl(var(--primary))', points: SAMPLES.map((x, i) => [x, fractions[i].darkEnergy]), width: 2.2, dashed: true },
      ]}
      height={240}
    />
    <p className="plot-note">Com estes parâmetros, a igualdade matéria-radiação cai em z ≈ {formatRedshift(matterRadiationEqualityRedshift(COSMOLOGIES[preset]))}. O Planck 2018 dá z<sub>eq</sub> = {PLANCK_2018_Z_EQ.toLocaleString('pt-BR')} ± 21. A diferença vem dos neutrinos: aqui eles são três espécies sem massa (N<sub>eff</sub> = 3), enquanto o Planck usa N<sub>eff</sub> = 3,046, um pouco mais de radiação, e inclui no Ω<sub>m</sub> a massa dos neutrinos (0,06 eV no total), que hoje conta como matéria, mas em z<sub>eq</sub> ainda se comportava como radiação. Usando só a matéria fria do Planck, Ω<sub>c</sub> h² + Ω<sub>b</sub> h² ≈ 0,1418, sai z<sub>eq</sub> ≈ 3.387.</p>
  </SimCard>;
}

function MilestoneList({ preset }: { preset: Preset }) {
  const { milestones } = useModel(preset);
  return <SimCard title="Os marcos, com selos">
    <p>Os tempos que vêm do modelo mudam com os parâmetros escolhidos acima. O selo diz o quanto sabemos sobre cada marco, e não o quanto o número é preciso.</p>
    <ol className="timeline-list cosmic-list">{milestones.map((m) => <li key={m.id} data-testid={`row-21-${m.id}`}>
      <span className="timeline-year">{m.whenShort}</span>
      <div>
        <div className="claim-head"><b>{m.name}</b><EvidenceTag level={m.level} /></div>
        <p className="milestone-when">{m.when}</p>
        <p>{m.text}</p>
        {m.link && <p><Link href={m.link.href} className="inline-link">{m.link.label}</Link></p>}
      </div>
    </li>)}</ol>
  </SimCard>;
}

function Horizons({ preset }: { preset: Preset }) {
  const { c, t0 } = useModel(preset);
  return <SimCard title="Até onde podemos ver, e até onde poderemos chegar">
    <p>O horizonte de partículas é a distância atual, comóvel, dos objetos mais distantes cuja luz já pode ter chegado até nós. Ele é maior que 13,8 bilhões de anos-luz porque o espaço continuou se expandindo enquanto a luz viajava. O horizonte de eventos é o oposto: uma luz emitida hoje além dele nunca nos alcançará, se a energia escura for constante.</p>
    <StatGrid>
      <Stat label={<>Idade <Sym>t₀</Sym></>} value={`${formatSig(secondsToGyr(t0), 4)} bilhões de anos`} note={`Planck 2018: ${formatSig(PLANCK_2018_AGE_GYR, 5)} ± ${formatSig(PLANCK_2018_AGE_SIGMA_GYR, 1)}`} testId="text-21-age-stat" />
      <Stat label="Horizonte de partículas" value={`${formatSig(metersToGly(particleHorizonM(c)))} bilhões de anos-luz`} note={<Sym>c ∫₀¹ da / (a² H)</Sym>} testId="text-21-particle-horizon" />
      <Stat label="Horizonte de eventos" value={`${formatSig(metersToGly(eventHorizonM(c)))} bilhões de anos-luz`} note={<Sym>c ∫₁^∞ da / (a² H)</Sym>} testId="text-21-event-horizon" />
      <Stat label={<>Tempo de Hubble <Sym>1/H₀</Sym></>} value={`${formatSig(secondsToGyr(hubbleTimeS(c)))} bilhões de anos`} note="coincide quase com a idade, por acaso da época atual" testId="text-21-hubble-time" />
      <Stat label={<>E-dobra no futuro <Sym>1/(H₀√Ω<sub>Λ</sub>)</Sym></>} value={`${formatSig(secondsToGyr(lambdaEfoldTimeS(c)))} bilhões de anos`} note="se Λ for constante (hipótese)" testId="text-21-efold" />
      <Stat label={<>Radiação hoje <Sym>Ω<sub>r</sub> h²</Sym></>} value={formatSci(radiationDensityH2())} note="fótons a 2,7255 K e 3 neutrinos sem massa" />
    </StatGrid>
    <p className="plot-note">Distâncias comóveis, medidas hoje. O valor de Ω<sub>r</sub> h² sai de T₀ e das constantes fundamentais: os fótons dão 2,47 × 10⁻⁵ e os três neutrinos somam 68%. O valor citado com frequência, 4,15 × 10⁻⁵, é o mesmo arredondado para baixo; com N<sub>eff</sub> = 3,044 seria 4,18 × 10⁻⁵.</p>
  </SimCard>;
}

export default function CosmicTimeline() {
  // ?h0=shoes abre com o atalho do SH0ES; ?marco=<id> ou ?t=<segundos> posicionam o controle.
  const [preset, setPreset] = useState<Preset>(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('h0') === 'shoes' ? 'shoes' : 'planck'));
  useEffect(() => {
    const t = timeFromUrl(cosmicMilestones(COSMOLOGIES[preset]));
    if (t !== null) setCosmicTime(t);
    // Só na abertura da página.
  }, []);
  return <ModulePage
    title="A linha do tempo cósmica"
    description="Com a equação de Friedmann e três ingredientes (radiação, matéria e energia escura), dá para reconstruir a história da expansão do universo: quando ele ficou transparente, quando a energia escura assumiu o controle e o que o modelo prevê para o futuro. Nem tudo nessa história tem o mesmo grau de certeza."
    number="2.1"
    tag="COSMOLOGIA"
    limitations={[
      <>Neutrinos tratados como três espécies sem massa (N<sub>eff</sub> = 3). A massa real, de pelo menos ~0,06 eV no total, desloca z<sub>eq</sub> e, levemente, a idade.</>,
      <>Universo exatamente plano. A curvatura medida é compatível com zero (Planck com BAO: Ω<sub>K</sub> = 0,0007 ± 0,0019), mas isso é uma medição, não uma hipótese do modelo.</>,
      <>Energia escura constante (w = −1). O Módulo 2.2 vai abrir essa hipótese.</>,
      <>Antes da nucleossíntese, a física de partículas em altas energias (transições de fase, matéria escura, bariogênese) não é modelada. A relação T = T₀(1 + z) supõe o conteúdo de radiação de hoje: antes de ~10 s, quando elétrons e pósitrons ainda existiam, temperatura e tempo reais diferem em dezenas de por cento, e antes de 1 s só a ordem de grandeza é indicada.</>,
      <>Recombinação e reionização são processos graduais; aqui aparecem num único redshift (z = 1.090 e z = 7,7).</>,
      <>O atalho do SH0ES mantém Ω<sub>m</sub> fixo; uma análise real ajustaria todos os parâmetros juntos.</>,
    ]}
    references={[
      { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
      { text: 'D. J. Fixsen, "The Temperature of the Cosmic Microwave Background", The Astrophysical Journal 707, 916 (2009).', url: 'https://doi.org/10.1088/0004-637X/707/2/916' },
      { text: 'B. D. Fields, P. Molaro e S. Sarkar, "Big Bang Nucleosynthesis" (cap. 24, revisado em agosto de 2025), em Particle Data Group (F. Takahashi et al.), Review of Particle Physics, International Journal of Modern Physics A 41, 2630011 (2026).', url: 'https://doi.org/10.1142/S0217751X26300115' },
      { text: 'S. Perlmutter et al., "Measurements of Ω and Λ from 42 High-Redshift Supernovae", The Astrophysical Journal 517, 565 (1999).', url: 'https://doi.org/10.1086/307221' },
      { text: 'A. G. Riess et al., "Observational Evidence from Supernovae for an Accelerating Universe and a Cosmological Constant", The Astronomical Journal 116, 1009 (1998).', url: 'https://doi.org/10.1086/300499' },
      { text: 'A. G. Riess et al., "Type Ia Supernova Discoveries at z > 1 from the Hubble Space Telescope: Evidence for Past Deceleration and Constraints on Dark Energy Evolution", The Astrophysical Journal 607, 665 (2004).', url: 'https://doi.org/10.1086/383612' },
      { text: 'J. N. Connelly et al., "The Absolute Chronology and Thermal Processing of Solids in the Solar Protoplanetary Disk", Science 338, 651 (2012).', url: 'https://doi.org/10.1126/science.1226919' },
      { text: 'S. Carniani et al., "Spectroscopic confirmation of two luminous galaxies at a redshift of 14", Nature 633, 318 (2024).', url: 'https://doi.org/10.1038/s41586-024-07860-9' },
      { text: 'A. G. Riess et al. (SH0ES), The Astrophysical Journal Letters 934, L7 (2022).', url: 'https://doi.org/10.3847/2041-8213/ac5c5b' },
      { text: 'G. W. Gibbons e S. W. Hawking, "Cosmological event horizons, thermodynamics, and particle creation", Physical Review D 15, 2738 (1977).', url: 'https://doi.org/10.1103/PhysRevD.15.2738' },
    ]}
  >
    <CosmicClock preset={preset} setPreset={setPreset} />
    <ScaleFactorPlot preset={preset} />
    <FractionsPlot preset={preset} />
    <div className="claims">
      <Claim level="fato" title="O universo se expande e já foi quente e denso">
        <p>A expansão (lei de Hubble), o fundo cósmico de micro-ondas com espectro de corpo negro quase perfeito, a 2,7255 K, e as abundâncias de hélio e deutério formam um conjunto de evidências independentes. Que o universo passou por uma fase quente e densa há cerca de 13,8 bilhões de anos é fato estabelecido.</p>
      </Claim>
      <Claim level="consenso" title="O ΛCDM descreve os dados com seis parâmetros">
        <p>Com matéria escura fria e uma constante cosmológica, o modelo reproduz o fundo cósmico, a distribuição das galáxias e as supernovas. As datas das trocas de domínio são derivadas dele. Há tensões, como a de H₀, que podem indicar física nova ou erros sistemáticos.</p>
      </Claim>
      <Claim level="hipotese" title="O primeiro instante e o futuro distante">
        <p>Antes de ~1 segundo não há observação direta, e a era de Planck exigiria uma teoria quântica da gravidade que não existe. O futuro exponencial depende de a energia escura ser constante. As duas pontas da linha do tempo são hipóteses em pesquisa.</p>
      </Claim>
    </div>
    <MilestoneList preset={preset} />
    <Horizons preset={preset} />
  </ModulePage>;
}
