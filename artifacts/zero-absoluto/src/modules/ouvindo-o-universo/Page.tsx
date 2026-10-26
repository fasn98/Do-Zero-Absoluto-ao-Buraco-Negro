import { useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LinearSlider, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot } from '../Plot';
import {
  GW150914,
  chirpMass,
  chirpWaveform,
  cyclesBetween,
  detectorFrameMass,
  frequencyAtTimeToMergerHz,
  iscoFrequencyHz,
  phaseAtTimeToMerger,
  solarMassEnergyJ,
  timeToMergerS,
} from '../../physics/gravitationalWaves';
import { GW170817, H0_MEASUREMENTS, hubbleConstant, tensionSigma } from '../../physics/hubble';
import { protonChargeRadius } from '../../physics/constants';
import { formatNumber, formatSci, formatSig } from '../../lib/format';

const F_LOW = 35;
const MAX_CYCLES = 20;
const LIGO_ARM_M = 4000;

/** Frequência inicial do gráfico: 35 Hz, ou mais alta se houver ciclos demais até f_ISCO para desenhar. */
function plotStartFrequency(chirpMassDet: number, fIsco: number) {
  const low = Math.min(F_LOW, fIsco / 2);
  if (cyclesBetween(low, fIsco, chirpMassDet) <= MAX_CYCLES) return low;
  let lo = low;
  let hi = fIsco;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (cyclesBetween(mid, fIsco, chirpMassDet) > MAX_CYCLES) lo = mid; else hi = mid;
  }
  return hi;
}

/** Trecho esquemático depois de f_ISCO (fusão e ringdown): fora do modelo, só para orientar o olhar. */
function schematicMergerRingdown(tIsco: number, fIsco: number, hIsco: number, phaseIsco: number): [number, number][] {
  const points: [number, number][] = [];
  const fRing = 2.5 * fIsco;
  const span = 6 / fRing;
  for (let i = 0; i <= 160; i += 1) {
    const dt = (span * i) / 160;
    const envelope = dt < span * 0.15 ? 1 + 0.4 * (dt / (span * 0.15)) : 1.4 * Math.exp(-(dt - span * 0.15) / (span * 0.18));
    const f = fIsco + (fRing - fIsco) * Math.min(1, dt / (span * 0.2));
    points.push([tIsco + dt, (hIsco / 1e-21) * envelope * Math.cos(phaseIsco + 2 * Math.PI * f * dt)]);
  }
  return points;
}

function Chirp() {
  const [m1, setM1] = useState(GW150914.m1);
  const [m2, setM2] = useState(GW150914.m2);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const model = useMemo(() => {
    const z = GW150914.redshift;
    const mcSource = chirpMass(m1, m2);
    const mcDet = detectorFrameMass(mcSource, z);
    const totalDet = detectorFrameMass(m1 + m2, z);
    const fIsco = iscoFrequencyHz(totalDet);
    const fStart = plotStartFrequency(mcDet, fIsco);
    const wave = chirpWaveform(mcDet, fStart, fIsco, GW150914.peakStrain, 1600);
    const tIsco = -timeToMergerS(fIsco, mcDet);
    const last = wave.at(-1)!;
    const ring = schematicMergerRingdown(tIsco, fIsco, GW150914.peakStrain, phaseAtTimeToMerger(timeToMergerS(fIsco, mcDet), mcDet));
    const iscoBelowLow = fIsco <= F_LOW;
    const duration = iscoBelowLow ? 0 : timeToMergerS(F_LOW, mcDet) - timeToMergerS(fIsco, mcDet);
    return { mcSource, mcDet, totalDet, fIsco, fStart, wave, tIsco, last, ring, duration, iscoBelowLow, cycles: iscoBelowLow ? 0 : cyclesBetween(F_LOW, fIsco, mcDet) };
  }, [m1, m2]);

  // Áudio: o sinal acelerado k vezes (frequências × k, duração ÷ k), com f_ISCO levado a ~400 Hz.
  const speedUp = Math.max(1, Math.round(400 / model.fIsco));
  const maxPlayS = 2.5;
  const audioStartHz = Math.max(10, frequencyAtTimeToMergerHz(Math.min(timeToMergerS(10, model.mcDet), maxPlayS * speedUp), model.mcDet));
  const playDuration = (timeToMergerS(audioStartHz, model.mcDet) - timeToMergerS(model.fIsco, model.mcDet)) / speedUp;

  const play = () => {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = audioRef.current ?? new Ctx();
    audioRef.current = ctx;
    const rate = ctx.sampleRate;
    const tauStart = timeToMergerS(audioStartHz, model.mcDet);
    const tauEnd = timeToMergerS(model.fIsco, model.mcDet);
    const n = Math.floor(((tauStart - tauEnd) / speedUp) * rate);
    const buffer = ctx.createBuffer(1, n, rate);
    const data = buffer.getChannelData(0);
    const fade = Math.floor(0.03 * rate);
    for (let i = 0; i < n; i += 1) {
      const tau = tauStart - (i / rate) * speedUp;
      const f = frequencyAtTimeToMergerHz(tau, model.mcDet);
      const envelope = (f / model.fIsco) ** (2 / 3) * Math.min(1, (n - i) / fade, i / fade);
      // Fase do sinal real, acelerada: Φ(τ) não muda; só o relógio corre k vezes mais rápido.
      data[i] = 0.5 * envelope * Math.cos(phaseAtTimeToMerger(tau, model.mcDet));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setPlaying(false);
    setPlaying(true);
    void ctx.resume();
    source.start();
  };

  const strainDisplacement = GW150914.peakStrain * LIGO_ARM_M;
  const xMin = model.wave[0].t;
  const xMax = model.ring.at(-1)![0];
  const span = xMax - xMin;
  const step = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5].find((s) => span / s <= 6) ?? 10;
  const xTicks: number[] = [];
  for (let x = Math.ceil(xMin / step) * step; x <= xMax + 1e-12; x += step) xTicks.push(Number(x.toFixed(6)));

  return <SimCard title="O primeiro som de dois buracos negros">
    <p>Dois buracos negros em órbita perdem energia em ondas gravitacionais, se aproximam e giram cada vez mais rápido. A frequência e a amplitude da onda sobem juntas: o "chirp". Em 14 de setembro de 2015, os dois detectores LIGO registraram esse sinal pela primeira vez.</p>
    <div className="controls">
      <LinearSlider label="Massa 1 (referencial da fonte)" value={m1} min={5} max={80} step={1} onChange={setM1} display={`${m1} M☉`} testId="input-gw-m1" ends={['5 M☉', '80 M☉']} />
      <LinearSlider label="Massa 2 (referencial da fonte)" value={m2} min={5} max={80} step={1} onChange={setM2} display={`${m2} M☉`} testId="input-gw-m2" ends={['5 M☉', '80 M☉']} />
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => { setM1(GW150914.m1); setM2(GW150914.m2); }} data-testid="button-gw150914">GW150914 (36 + 29)</button>
        <button type="button" className="btn primary" onClick={play} disabled={playing} data-testid="button-gw-audio">{playing ? 'Tocando…' : speedUp > 1 ? `Ouvir o chirp (acelerado ${speedUp}×)` : 'Ouvir o chirp (velocidade real)'}</button>
        <span className="btn-note" data-testid="text-audio-note">Use fone de ouvido: o som real é grave demais para o alto-falante do celular.</span>
      </div>
    </div>

    <LinePlot
      title="Forma de onda do espiralamento até a última órbita estável, seguida de um trecho esquemático de fusão"
      xMin={xMin} xMax={xMax} yMin={-1.6} yMax={1.6}
      xTicks={xTicks} yTicks={[-1, 0, 1]}
      formatX={(x) => formatNumber(x, 2)} formatY={(y) => formatNumber(y, 0)}
      xLabel="tempo até a fusão (s), referencial do detector" yLabel="h (10⁻²¹)"
      markers={[{ x: model.tIsco, label: `f_ISCO = ${formatSig(model.fIsco)} Hz` }]}
      series={[
        { label: 'Espiralamento, aproximação quadrupolar', color: 'hsl(var(--primary))', points: model.wave.map((s) => [s.t, s.h / 1e-21]), width: 1.4 },
        { label: 'Fusão e ringdown (esquemático, fora do modelo)', color: 'hsl(var(--muted-foreground))', points: model.ring, dashed: true, width: 1.2 },
      ]}
      height={250}
    />
    <p className="plot-note">O gráfico começa em {formatSig(model.fStart)} Hz{model.fStart > F_LOW ? ` (e não em ${F_LOW} Hz, para mostrar no máximo ${MAX_CYCLES} ciclos)` : ''}{model.iscoBelowLow ? ' (f_ISCO está abaixo de 35 Hz: com massas tão grandes, quase todo o sinal visível nos detectores vem da fusão, que o modelo não descreve)' : ''} e para em f_ISCO, a última órbita estável, onde a aproximação deixa de valer. A amplitude é normalizada para o pico medido em GW150914, ~10⁻²¹. Em GW150914, o sinal real continuou subindo durante a fusão até ~{GW150914.peakFrequencyHz} Hz no pico. {speedUp > 1 ? `O áudio toca o sinal ${speedUp} vezes mais rápido (frequências × ${speedUp}), de ${formatSig(audioStartHz)} Hz até f_ISCO, em ${formatSig(playDuration)} s.` : `O áudio toca o sinal em velocidade real, de ${formatSig(audioStartHz)} Hz até f_ISCO, em ${formatSig(playDuration)} s.`}</p>

    <StatGrid>
      <Stat label={<>Massa de chirp <Sym>𝓜</Sym>, fonte</>} value={`${formatSig(model.mcSource)} M☉`} note="(m₁m₂)^(3/5) / (m₁+m₂)^(1/5)" testId="text-chirp-mass" />
      <Stat label={<>Massa de chirp <Sym>𝓜</Sym>, detector</>} value={`${formatSig(model.mcDet)} M☉`} note={`× (1 + z), z ≈ ${formatNumber(GW150914.redshift, 2)}`} />
      <Stat label={<>De 35 Hz até <Sym>f_ISCO</Sym></>} value={model.iscoBelowLow ? '—' : `${formatSig(model.duration)} s`} note={model.iscoBelowLow ? 'f_ISCO já está abaixo de 35 Hz' : `${formatSig(model.cycles)} ciclos`} testId="text-chirp-duration" />
      <Stat label={<>Última órbita estável <Sym>f_ISCO</Sym></>} value={`${formatSig(model.fIsco)} Hz`} note="c³ / (6^(3/2) π G M), detector" testId="text-fisco" />
      <Stat label="Energia irradiada em GW150914" value={`~${formatNumber(GW150914.radiatedSolarMasses, 0)} M☉ c²`} note={`${formatSci(solarMassEnergyJ(GW150914.radiatedSolarMasses))} J, medido`} />
      <Stat label="Deformação no pico, GW150914" value={`~${formatSci(GW150914.peakStrain, 1)}`} note={`${formatSci(strainDisplacement)} m num braço de 4 km: cerca de 1/${formatNumber(Math.round((2 * protonChargeRadius) / strainDisplacement / 10) * 10, 0)} do diâmetro de um próton`} />
    </StatGrid>
    <p>As massas que o detector "vê" são maiores que as reais por um fator 1 + z: no caminho até a Terra, a expansão do universo estica a onda, abaixando suas frequências como se as massas fossem maiores. As duas últimas caixas são os valores medidos de GW150914 e não mudam com os controles.</p>
  </SimCard>;
}

const H0_PRESET_MIN = 30;
const H0_PRESET_MAX = 60;

function StandardSiren() {
  const [distance, setDistance] = useState(GW170817.distanceMpc);
  const h0 = hubbleConstant(GW170817.recessionVelocityKmS, distance);
  const dLow = GW170817.distanceMpc - GW170817.distanceMinusMpc;
  const dHigh = GW170817.distanceMpc + GW170817.distancePlusMpc;
  return <SimCard title="A sirene padrão: GW170817">
    <p>Em 17 de agosto de 2017, duas estrelas de nêutrons se fundiram na galáxia NGC 4993, e o evento foi visto em ondas gravitacionais e em luz. A forma da onda dá a distância diretamente, sem a escada de distâncias da astronomia; a galáxia dá a velocidade com que se afasta. Juntas, dão a constante de Hubble: H₀ = v / d.</p>
    <LinearSlider label="Distância a partir das ondas gravitacionais" value={distance} min={H0_PRESET_MIN} max={H0_PRESET_MAX} step={0.1} onChange={setDistance} display={`${formatSig(distance)} Mpc`} testId="input-siren-distance" ends={[`${H0_PRESET_MIN} Mpc`, `${H0_PRESET_MAX} Mpc`]} />
    <StatGrid>
      <Stat label={<>Velocidade de recessão <Sym>v</Sym></>} value={`${formatNumber(GW170817.recessionVelocityKmS, 0)} km/s`} note="NGC 4993" />
      <Stat label={<>Distância <Sym>d</Sym></>} value={`${formatSig(distance)} Mpc`} note={`medida: ${formatSig(GW170817.distanceMpc)} (+${formatNumber(GW170817.distancePlusMpc, 1)}, −${formatNumber(GW170817.distanceMinusMpc, 1)}) Mpc`} />
      <Stat label={<>Constante de Hubble <Sym>H₀ = v/d</Sym></>} value={`${formatSig(h0)} km/s/Mpc`} testId="text-siren-h0" />
    </StatGrid>
    <div className="callout warn" data-testid="text-siren-uncertainty">
      A incerteza é grande. Só a faixa de distância medida, de {formatSig(dLow)} a {formatSig(dHigh)} Mpc, já leva H₀ de {formatSig(hubbleConstant(GW170817.recessionVelocityKmS, dHigh))} a {formatSig(hubbleConstant(GW170817.recessionVelocityKmS, dLow))} km/s/Mpc. O resultado publicado é <b>70 (+12, −8) km/s/Mpc</b>: ele inclui a correção da velocidade própria da galáxia e a incerteza na inclinação da órbita, que se confunde com a distância na amplitude da onda.
    </div>
  </SimCard>;
}

const AXIS: [number, number] = [60, 85];
const pct = (v: number) => ((v - AXIS[0]) / (AXIS[1] - AXIS[0])) * 100;

function TensionPanel() {
  const [a, setA] = useState('planck');
  const [b, setB] = useState('shoes');
  const ma = H0_MEASUREMENTS.find((m) => m.id === a)!;
  const mb = H0_MEASUREMENTS.find((m) => m.id === b)!;
  const sigma = a === b ? 0 : tensionSigma(ma, mb);
  const planck = H0_MEASUREMENTS.find((m) => m.id === 'planck')!;
  const h0dn = H0_MEASUREMENTS.find((m) => m.id === 'h0dn')!;
  const ticks = [60, 65, 70, 75, 80, 85];
  return <SimCard title="O painel da tensão de Hubble">
    <p>Medições de H₀ com barras de erro de 1σ. O universo primordial, lido no fundo cósmico de micro-ondas com o modelo ΛCDM, dá um valor; o universo local, medido com estrelas e supernovas, dá outro.</p>
    <div className="h0-chart" role="img" aria-label="Medições de H₀ com barras de erro">
      <div className="h0-rows">
        <div className="h0-overlay" aria-hidden="true">
        <span className="h0-band primordial" style={{ left: `${pct(planck.value - planck.minus)}%`, width: `${pct(planck.value + planck.plus) - pct(planck.value - planck.minus)}%` }} />
        <span className="h0-band local" style={{ left: `${pct(h0dn.value - h0dn.minus)}%`, width: `${pct(h0dn.value + h0dn.plus) - pct(h0dn.value - h0dn.minus)}%` }} />
        {ticks.map((t) => <span key={t} className="h0-grid" style={{ left: `${pct(t)}%` }} />)}
        </div>
        {H0_MEASUREMENTS.map((m) => <div className="h0-row" key={m.id}>
          <div className="h0-label"><b>{m.label}</b><span>{m.method}</span></div>
          <div className="h0-track">
            <span className={`h0-bar ${m.group}`} style={{ left: `${pct(m.value - m.minus)}%`, width: `${pct(Math.min(AXIS[1], m.value + m.plus)) - pct(m.value - m.minus)}%` }} />
            <span className={`h0-dot ${m.group}`} style={{ left: `${pct(m.value)}%` }} />
            <span className="h0-value" style={{ left: `${pct(m.value)}%` }}>{formatNumber(m.value, 2)} {m.plus === m.minus ? `± ${formatNumber(m.plus, 2)}` : `+${formatNumber(m.plus, 0)} −${formatNumber(m.minus, 0)}`}</span>
          </div>
        </div>)}
        <div className="h0-row">
          <div className="h0-label"><b>Sirene estocástica</b><span>Fundo de ondas gravitacionais</span></div>
          <div className="h0-track h0-text">Só um limite inferior, largo e dependente de modelos: veja a seção seguinte.</div>
        </div>
      </div>
      <div className="h0-axis">{ticks.map((t) => <span key={t} style={{ left: `${pct(t)}%` }}>{t}</span>)}</div>
      <div className="h0-axis-label">H₀ (km/s/Mpc)</div>
    </div>
    <div className="plot-legend" style={{ marginTop: 10 }}>
      <span><i className="h0-swatch primordial" />Faixa do universo primordial (Planck, 1σ)</span>
      <span><i className="h0-swatch local" />Faixa do universo local (H0DN, 1σ)</span>
      <span><i className="h0-swatch ondas" />Ondas gravitacionais</span>
    </div>
    <p className="plot-note">CCHP: 70,39 ± 1,22 (estat.) ± 1,33 (sist.), combinadas em quadratura (± 1,80); o artigo lista ainda ± 0,70 da amostra de supernovas. A barra de GW170817 vai até 82 e é cortada na borda do gráfico.</p>

    <h3 className="sub-title">Quantos sigmas separam duas medições</h3>
    <div className="sigma-calc">
      <label>Medição A<select value={a} onChange={(e) => setA(e.target.value)} data-testid="select-sigma-a">{H0_MEASUREMENTS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
      <label>Medição B<select value={b} onChange={(e) => setB(e.target.value)} data-testid="select-sigma-b">{H0_MEASUREMENTS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    </div>
    <StatGrid>
      <Stat label="Diferença" value={`${formatSig(Math.abs(ma.value - mb.value))} km/s/Mpc`} />
      <Stat label={<>Discrepância <Sym>|a − b| / √(σa² + σb²)</Sym></>} value={a === b ? '—' : `${formatSig(sigma)} σ`} testId="text-sigma" />
      <Stat label="Leitura" value={a === b ? 'mesma medição' : sigma >= 5 ? 'tensão forte' : sigma >= 3 ? 'tensão' : 'compatíveis'} note="5σ: chance ~1 em 3,5 milhões por acaso" />
    </StatGrid>
    <p className="plot-note">Supõe incertezas gaussianas e independentes; para GW170817, usa o lado da barra voltado para a outra medição. Medições locais compartilham calibrações (por exemplo, a distância de NGC 4258), então a comparação entre elas é aproximada.</p>
  </SimCard>;
}

function StochasticDiagram() {
  const near = [[150, 92], [176, 70], [128, 64], [186, 104], [140, 120], [162, 132]];
  const far = Array.from({ length: 90 }, (_, i) => {
    const angle = i * 2.399963;
    const r = 70 + ((i * 37) % 60);
    return [160 + r * Math.cos(angle), 100 + r * Math.sin(angle) * 0.62] as const;
  });
  return <figure className="plot" style={{ marginTop: 6 }}>
    <svg viewBox="0 0 320 200" style={{ maxHeight: 280 }} role="img" aria-label="Diagrama: fusões próximas detectadas uma a uma e fusões distantes formando um fundo">
      <rect x="0" y="0" width="320" height="200" rx="10" style={{ fill: 'hsl(var(--background))' }} />
      {far.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6} style={{ fill: 'hsl(var(--chart-5))', opacity: 0.45 }} />)}
      <ellipse cx="160" cy="100" rx="64" ry="44" style={{ fill: 'hsl(var(--card))', stroke: 'hsl(var(--primary))' }} strokeDasharray="4 4" />
      {near.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.4} style={{ fill: 'hsl(var(--accent))' }} />)}
      <circle cx="160" cy="100" r="2.5" style={{ fill: 'hsl(var(--foreground))' }} />
    </svg>
    <figcaption className="plot-legend">
      <span><i className="h0-swatch local" />Fusões detectadas uma a uma</span>
      <span><i className="h0-swatch primordial" />Fusões distantes demais: somam-se num fundo</span>
      <span>Centro: a Terra; tracejado: alcance de detecção individual (esquemático)</span>
    </figcaption>
  </figure>;
}

export default function Listening() {
  return <ModulePage
    title="Ouvindo o universo se expandir"
    description="Desde 2015, os detectores de ondas gravitacionais registram fusões de buracos negros e de estrelas de nêutrons. Esse sinal é a gravidade em regime forte medida diretamente, e serve também como régua cósmica: dá distâncias sem a escada de distâncias da astronomia. Este módulo mostra o primeiro sinal, a primeira medição de H₀ com ele e onde ela se encaixa na tensão de Hubble."
    number="08"
    tag="ONDAS GRAVITACIONAIS"
    limitations={[
      <>O chirp usa a aproximação quadrupolar de ordem mais baixa: órbitas circulares, sem spin, sem correções pós-newtonianas. Perto da fusão ela perde precisão e não descreve a fusão nem o ringdown, que exigem relatividade numérica; o trecho final do gráfico é só esquemático.</>,
      <>O redshift fica fixo em z ≈ 0,09 (o de GW150914) para qualquer massa escolhida. A energia irradiada e a deformação de pico são os valores medidos de GW150914; o modelo não os calcula.</>,
      <>A calculadora da sirene padrão usa só v / d. A medição publicada inclui a velocidade própria de NGC 4993, a inclinação da órbita e a distribuição completa de probabilidade, que é assimétrica.</>,
      <>O painel compara medições supondo incertezas gaussianas e independentes. Medições locais compartilham calibrações, e a de Planck depende do modelo ΛCDM.</>,
      <>A sirene estocástica é apresentada só qualitativamente: a relação entre H₀ e a amplitude do fundo depende de modelos de população de buracos negros.</>,
    ]}
    references={[
      { text: 'B. P. Abbott et al. (LIGO e Virgo), "Observation of Gravitational Waves from a Binary Black Hole Merger", Physical Review Letters 116, 061102 (2016).', url: 'https://doi.org/10.1103/PhysRevLett.116.061102' },
      { text: 'B. P. Abbott et al. (LIGO e Virgo), "A gravitational-wave standard siren measurement of the Hubble constant", Nature 551, 85 (2017).', url: 'https://doi.org/10.1038/nature24471' },
      { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
      { text: 'A. G. Riess et al., "A Comprehensive Measurement of the Local Value of the Hubble Constant with 1 km/s/Mpc Uncertainty from the Hubble Space Telescope and the SH0ES Team", The Astrophysical Journal Letters 934, L7 (2022).', url: 'https://doi.org/10.3847/2041-8213/ac5c5b' },
      { text: 'W. L. Freedman et al., "Status Report on the Chicago-Carnegie Hubble Program (CCHP)", The Astrophysical Journal 985, 203 (2025).', url: 'https://doi.org/10.3847/1538-4357/adce78' },
      { text: 'H0DN Collaboration (S. Casertano et al.), "The Local Distance Network: A community consensus report on the measurement of the Hubble constant at 1% precision", Astronomy & Astrophysics 708, A166 (2026).', url: 'https://doi.org/10.1051/0004-6361/202557993' },
      { text: 'B. Cousins et al., "Stochastic Siren: Astrophysical Gravitational-Wave Background Measurements of the Hubble Constant", Physical Review Letters 136, 101003 (2026).', url: 'https://doi.org/10.1103/4lzh-bm7y' },
    ]}
  >
    <Chirp />
    <div className="claims">
      <Claim level="fato" title="GW150914, 14 de setembro de 2015">
        <p>Os dois detectores LIGO, em Hanford e Livingston, registraram o mesmo sinal com 7 ms de diferença. Era a fusão de dois buracos negros de ~36 e ~29 massas solares a ~1,3 bilhão de anos-luz, que converteu ~3 massas solares em ondas gravitacionais. Foi a primeira detecção direta de ondas gravitacionais e a primeira observação de um sistema binário de buracos negros.</p>
      </Claim>
      <Claim level="fato" title="Nobel de Física de 2017">
        <p>Rainer Weiss, Barry Barish e Kip Thorne receberam o Nobel "por contribuições decisivas ao detector LIGO e à observação de ondas gravitacionais". Desde então, os detectores LIGO, Virgo e KAGRA registraram centenas de candidatos a fusões.</p>
      </Claim>
    </div>

    <StandardSiren />
    <div className="claims">
      <Claim level="fato" title="A primeira sirene padrão">
        <p>GW170817 foi a primeira medição de H₀ com ondas gravitacionais. Ela é independente da escada de distâncias, mas sua incerteza, de cerca de 15%, ainda é grande demais para decidir a tensão de Hubble. Uma sirene isolada não basta: a precisão melhora com o número de eventos com contraparte de luz.</p>
      </Claim>
    </div>
    <p className="plot-note" data-testid="link-8-sirens-forecast">E com centenas de sirenes, muito mais longe? A previsão para os detectores do futuro, o LISA e o Einstein Telescope, e o que elas diriam sobre a energia escura, está no <Link href="/confronto-com-dados-reais#sirenes" className="inline-link">Módulo 2.3, "E se tivéssemos sirenes gigantes?"</Link>.</p>

    <TensionPanel />
    <div className="claims">
      <Claim level="consenso" title="As medições divergem">
        <p>A diferença entre Planck e SH0ES passa de 5σ, e a rede de distâncias locais H0DN, combinando muitos métodos, chega a 7σ em relação ao universo primordial. O CCHP, com gigantes vermelhas, encontra um valor intermediário, compatível com os dois lados dentro de 2σ. Que as medições diretas discordam é consenso; o motivo, não.</p>
      </Claim>
      <Claim level="hipotese" title="Por que divergem">
        <p>As hipóteses dividem-se em dois grupos: erros sistemáticos ainda não identificados na escada de distâncias, ou física além do modelo ΛCDM, como uma energia escura primordial. Nenhuma explicação é aceita pela comunidade, e as ondas gravitacionais ainda não têm precisão para resolver a questão.</p>
      </Claim>
    </div>

    <SimCard title="O silêncio como medida: a sirene estocástica">
      <StochasticDiagram />
      <p>Fusões distantes demais para serem vistas uma a uma não somem: somadas, formam um fundo de ondas gravitacionais, como o burburinho de uma multidão. Esse fundo ainda não foi detectado.</p>
      <p>O raciocínio de Cousins et al. (2026): fixada a taxa de fusões por volume, que se mede com as fusões próximas, um H₀ menor corresponde a volumes comóveis maiores, com mais fusões, e portanto a um fundo mais forte. Como o fundo não aparece, os valores mais baixos de H₀ ficam desfavorecidos.</p>
      <p>É um <b>limite inferior</b>, não uma medição de H₀. Os autores usaram um único conjunto de modelos de população de buracos negros (distribuição de massas e taxa de fusões ao longo do tempo), e o resultado depende dessas escolhas. Segundo suas projeções, com a sensibilidade do Advanced LIGO a detecção do fundo levaria séculos; com o upgrade A#, cerca de 10 vezes mais sensível e ainda não construído, viria em 1 a 2 anos de dados.</p>
    </SimCard>
    <div className="claims">
      <Claim level="hipotese" title="O fundo de ondas gravitacionais como régua">
        <p>A sirene estocástica é um método novo, com um primeiro resultado que só restringe valores baixos de H₀. Se ela vai contribuir para a tensão de Hubble depende da detecção do fundo e de modelos de população mais bem testados.</p>
      </Claim>
    </div>

    <SimCard title="Ouvir a gravidade">
      <p>No <Link href="/a-gravidade-guarda-informacao" className="inline-link">Módulo 7</Link>, a pergunta era como a gravidade se comporta onde a relatividade geral e a mecânica quântica se encontram. As ondas gravitacionais são o único modo de observar diretamente a gravidade em regime forte, nos últimos milissegundos antes de dois buracos negros se fundirem. Até agora, todos os sinais concordam com a relatividade geral. Com detectores mais sensíveis, essa é uma das janelas mais promissoras para encontrar, ou descartar, desvios perto dos horizontes.</p>
    </SimCard>
  </ModulePage>;
}
