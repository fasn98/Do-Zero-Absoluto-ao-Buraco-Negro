import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LinearSlider, LogSlider, Presets, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot } from '../Plot';
import {
  bekensteinBoundOverK,
  entropyOverKToBits,
  holographicBoundOverK,
  isInsideOwnHorizon,
  planckLengthM,
  planckVolumeBits,
  restEnergyJ,
  sphereAreaM2,
} from '../../physics/holography';
import { schwarzschildRadiusM } from '../../physics/calculations';
import {
  PAGE_TIME_FRACTION,
  blackHoleEntropyFraction,
  hawkingRadiationEntropyFraction,
  pageRadiationEntropyFraction,
} from '../../physics/pageCurve';
import {
  DETECTABLE_PHASE_ESTIMATE_RAD,
  SUPERPOSITION_RECORD_KG,
  diamondSphereRadiusM,
  gravitationalPhaseRad,
  ratioToSuperpositionRecord,
  spheresOverlap,
} from '../../physics/gravityEntanglement';
import { bohrRadiusM } from '../../physics/muonCatalysis';
import { earthRadius, electronMass, observableUniverseRadius, planckTemperature, protonChargeRadius, solarRadius } from '../../physics/constants';
import { formatFromLog10, formatLength, formatNumber, formatSci, formatSig, superscript } from '../../lib/format';

const L_P = planckLengthM();
const R_MIN = 1e-16;
const R_MAX = 1e27;

const RADIUS_PRESETS = [
  { label: 'Próton', value: protonChargeRadius },
  { label: 'Átomo', value: bohrRadiusM(electronMass) },
  { label: '1 metro', value: 1 },
  { label: 'Terra', value: earthRadius },
  { label: 'Sol', value: solarRadius },
  { label: 'Universo observável', value: observableUniverseRadius },
];

/** Raios de 0,1 fm a 10⁹ m com troca de unidade; fora disso, notação científica em metros. */
function formatRadius(m: number) {
  return m >= 1e-16 && m < 1e9 ? formatLength(m) : `${formatSci(m)} m`;
}

/** Curvas log-log de bits pelo raio: limite holográfico (∝ R²) e um bit por volume de Planck (∝ R³). */
const BIT_CURVES = (() => {
  const holo: [number, number][] = [];
  const volume: [number, number][] = [];
  for (let i = 0; i <= 86; i += 1) {
    const log10R = Math.log10(R_MIN) + (i / 86) * Math.log10(R_MAX / R_MIN);
    const R = 10 ** log10R;
    holo.push([log10R, Math.log10(entropyOverKToBits(holographicBoundOverK(R)))]);
    volume.push([log10R, Math.log10(planckVolumeBits(R))]);
  }
  return { holo, volume };
})();

function InformationLimit() {
  const [radius, setRadius] = useState(1);
  const [mass, setMass] = useState(1);
  const model = useMemo(() => {
    const holoK = holographicBoundOverK(radius);
    const bekK = bekensteinBoundOverK(radius, restEnergyJ(mass));
    return {
      area: sphereAreaM2(radius),
      holoK,
      holoBits: entropyOverKToBits(holoK),
      volumeBits: planckVolumeBits(radius),
      bekK,
      bekBits: entropyOverKToBits(bekK),
      collapsed: isInsideOwnHorizon(mass, radius),
      rs: schwarzschildRadiusM(mass),
    };
  }, [radius, mass]);

  return <SimCard title="Quantos bits cabem numa região do espaço">
    <p>Escolha o raio de uma esfera. O limite holográfico diz quanta entropia, ou informação, ela pode conter no máximo: a de um buraco negro do mesmo tamanho, proporcional à área da superfície, e não ao volume.</p>
    <div className="controls">
      <LogSlider label="Raio da esfera" value={radius} min={R_MIN} max={R_MAX} onChange={setRadius} display={formatRadius(radius)} testId="input-holo-radius" ends={['0,1 fm', '10²⁷ m']} />
      <Presets items={RADIUS_PRESETS} onSelect={setRadius} isActive={(v) => Math.abs(v / radius - 1) < 0.01} />
    </div>

    <LinePlot
      title="Bits máximos pelo limite holográfico e contagem de um bit por volume de Planck, em função do raio"
      xMin={Math.log10(R_MIN)} xMax={Math.log10(R_MAX)} yMin={30} yMax={200}
      xTicks={[-15, -5, 5, 15, 25]} yTicks={[40, 80, 120, 160, 200]}
      formatX={(x) => `10${superscript(x)}`} formatY={(y) => `10${superscript(y)}`}
      xLabel="raio (m)" yLabel="bits"
      markers={[{ x: Math.log10(radius), label: formatRadius(radius) }]}
      series={[
        { label: 'Um bit por volume de Planck (∝ R³)', color: 'hsl(var(--chart-5))', points: BIT_CURVES.volume, dashed: true },
        { label: 'Limite holográfico, A / (4 l_P² ln 2) (∝ R²)', color: 'hsl(var(--accent))', points: BIT_CURVES.holo, width: 2.5 },
      ]}
      height={260}
    />
    <p className="plot-note">A contagem por volume passa do limite holográfico já a partir de um raio de ~1 comprimento de Planck; em toda a faixa do gráfico ela fica muitas ordens de grandeza acima. A gravidade impede que isso aconteça: guardar informação exige energia, e energia demais num raio forma um buraco negro, cuja entropia é a da área do horizonte.</p>

    <StatGrid>
      <Stat label="Comprimento de Planck" value={`${formatSci(L_P)} m`} note="l_P = √(ħG/c³)" />
      <Stat label={<>Área <Sym>A = 4πR²</Sym></>} value={`${formatSci(model.area)} m²`} />
      <Stat label={<>Limite holográfico <Sym>S_máx/k</Sym></>} value={formatSci(model.holoK)} note="A / (4 l_P²)" testId="text-holo-bound" />
      <Stat label="Em bits" value={formatSci(model.holoBits)} note="S / (k ln 2)" testId="text-holo-bits" />
      <Stat label="Um bit por volume de Planck" value={formatSci(model.volumeBits)} note="(4/3)πR³ / l_P³" />
      <Stat label="Volume ÷ limite" value={`${formatFromLog10(Math.log10(model.volumeBits / model.holoBits))} ×`} note="quanto a contagem por volume excederia" />
    </StatGrid>

    <h3 className="sub-title">Limite de Bekenstein para uma massa nesse raio</h3>
    <LogSlider label="Massa dentro da esfera" value={mass} min={1e-30} max={1e31} onChange={setMass} display={`${formatSci(mass)} kg`} testId="input-bekenstein-mass" ends={['10⁻³⁰ kg', '10³¹ kg']} />
    <StatGrid>
      <Stat label={<>Energia <Sym>E = mc²</Sym></>} value={`${formatSci(restEnergyJ(mass))} J`} />
      <Stat label={<>Bekenstein <Sym>S/k ≤ 2πRE/(ħc)</Sym></>} value={model.collapsed ? '—' : formatSci(model.bekK)} note={model.collapsed ? 'não se aplica: seria um buraco negro' : undefined} testId="text-bekenstein" />
      <Stat label="Em bits" value={model.collapsed ? '—' : formatSci(model.bekBits)} testId="text-bekenstein-bits" />
    </StatGrid>
    {model.collapsed
      ? <div className="callout warn" data-testid="text-bekenstein-status">Com esse raio, essa massa já estaria dentro do próprio horizonte (raio de Schwarzschild {formatRadius(model.rs)}): seria um buraco negro. A entropia máxima passa a ser a do horizonte, A / (4 l_P²).</div>
      : <div className="callout" data-testid="text-bekenstein-status">Para objetos comuns, o limite de Bekenstein é muito mais apertado que o holográfico: aqui, {formatFromLog10(Math.log10(model.holoK / model.bekK))} vezes menor. Os dois coincidem quando o raio encolhe até o raio de Schwarzschild ({formatRadius(model.rs)}).</div>}
  </SimCard>;
}

const PAGE_CURVES = (() => {
  const hawking: [number, number][] = [];
  const page: [number, number][] = [];
  const bh: [number, number][] = [];
  for (let i = 0; i <= 200; i += 1) {
    const t = i / 200;
    hawking.push([t, hawkingRadiationEntropyFraction(t)]);
    page.push([t, pageRadiationEntropyFraction(t)]);
    bh.push([t, blackHoleEntropyFraction(t)]);
  }
  return { hawking, page, bh };
})();

function PageCurve() {
  const [t, setT] = useState(0.3);
  return <SimCard title="A curva de Page: para onde vai a informação">
    <p>Um buraco negro evapora pela radiação Hawking. Se a radiação for puramente térmica, a informação sobre o que caiu nele se perderia, o que contraria a mecânica quântica. A entropia da radiação conta essa história.</p>
    <LinearSlider label="Tempo, em fração do tempo de evaporação" value={t} min={0} max={1} step={0.001} onChange={setT} display={<>t = {formatSig(t)} <Sym>t_evap</Sym></>} testId="input-page-time" ends={['0', '1']} />
    <LinePlot
      title="Entropia da radiação ao longo da evaporação: curva de Hawking e curva de Page"
      xMax={1} yMax={1.05}
      xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[0, 0.5, 1]}
      formatX={(x) => formatNumber(x, 2)} formatY={(y) => formatNumber(y, 1)}
      xLabel="t / t_evap" yLabel="entropia / S₀"
      markers={[
        { x: PAGE_TIME_FRACTION, label: `tempo de Page ≈ ${formatSig(PAGE_TIME_FRACTION)}`, color: 'hsl(var(--chart-5))' },
        { x: t, label: `t = ${formatSig(t)}` },
      ]}
      series={[
        { label: 'Hawking (1975): S₀ − S_BH', color: 'hsl(var(--chart-5))', points: PAGE_CURVES.hawking, dashed: true },
        { label: 'Page (1993): mín(S₀ − S_BH, S_BH)', color: 'hsl(var(--accent))', points: PAGE_CURVES.page, width: 3 },
        { label: 'Entropia do buraco, S_BH', color: 'hsl(var(--muted-foreground))', points: PAGE_CURVES.bh, width: 1.2 },
      ]}
      height={260}
    />
    <StatGrid>
      <Stat label={<>Buraco negro <Sym>S_BH/S₀</Sym></>} value={formatSig(blackHoleEntropyFraction(t))} note="(1 − t)^(2/3)" />
      <Stat label="Radiação, curva de Hawking" value={formatSig(hawkingRadiationEntropyFraction(t))} note="só cresce" testId="text-hawking-curve" />
      <Stat label="Radiação, curva de Page" value={formatSig(pageRadiationEntropyFraction(t))} note="sobe e volta a zero" testId="text-page-curve" />
    </StatGrid>
    <p className="plot-note">Antes do tempo de Page, as curvas de Hawking e de Page coincidem; a de Hawking só aparece separada, tracejada, depois dele. Modelo idealizado: M(t) = M₀ (1 − t/t_evap)^(1/3) e S_BH = S₀ (M/M₀)². O tempo de Page é quando o buraco perdeu metade da entropia: t = (1 − 2^(−3/2)) t_evap ≈ {formatSig(PAGE_TIME_FRACTION)} t_evap.</p>
    <p>Em 1975, Hawking mostrou que buracos negros irradiam; em 1976, argumentou que a informação se perde: a entropia da radiação só cresceria. Em 1993, Page mostrou como a curva seria se a informação fosse preservada: depois do tempo de Page ela teria de descer, até zero no fim. Em 2019, cálculos com "ilhas" e buracos de minhoca de réplica (Penington; Almheiri, Engelhardt, Marolf e Maxfield) reproduziram a curva de Page dentro da gravidade semiclássica.</p>
  </SimCard>;
}

const MASS_RANGE: [number, number] = [1e-17, 1e-11];
const DIST_RANGE: [number, number] = [1e-5, 1e-3];
const TIME_RANGE: [number, number] = [0.1, 10];

/** Esquema em escala: duas esferas de diamante separadas por d. */
function ScaleSketch({ distance, radius }: { distance: number; radius: number }) {
  const W = 320;
  const span = distance + 4 * radius;
  const px = (m: number) => (m / span) * (W - 20);
  const rPx = px(radius);
  const drawn = Math.max(rPx, 1.5);
  const x1 = 10 + px(radius);
  const x2 = x1 + px(distance + 2 * radius);
  return <figure className="plot" style={{ marginTop: 14 }}>
    <svg viewBox={`0 0 ${W} 54`} role="img" aria-label="Duas esferas separadas pela distância d, em escala">
      <line x1={x1} x2={x2} y1={22} y2={22} style={{ stroke: 'hsl(var(--border))' }} strokeDasharray="3 3" />
      <circle cx={x1} cy={22} r={drawn} style={{ fill: 'hsl(var(--accent))' }} />
      <circle cx={x2} cy={22} r={drawn} style={{ fill: 'hsl(var(--accent))' }} />
      <line x1={x1} x2={x2} y1={40} y2={40} style={{ stroke: 'hsl(var(--muted-foreground))' }} />
      <text x={(x1 + x2) / 2} y={52} textAnchor="middle" className="plot-tick">d = {formatLength(distance)}</text>
    </svg>
    <figcaption className="plot-legend">Em escala: cada cristal tem {formatLength(2 * radius)} de diâmetro{rPx < 1.5 ? ' (desenhado maior que a escala para ficar visível)' : ''}; a distância é {formatSig(distance / (2 * radius))} vezes esse diâmetro.</figcaption>
  </figure>;
}

function GravityTest() {
  const [mass, setMass] = useState(1e-14);
  const [distance, setDistance] = useState(2e-4);
  const [time, setTime] = useState(2.5);
  const phase = gravitationalPhaseRad(mass, distance, time);
  const radius = diamondSphereRadiusM(mass);
  const detectable = phase >= DETECTABLE_PHASE_ESTIMATE_RAD;
  const overlap = spheresOverlap(mass, distance);
  return <SimCard title="Como testar se a gravidade é quântica">
    <p>Duas pequenas massas, cada uma em superposição de duas posições, interagem só pela gravidade durante um tempo τ. Se depois estiverem emaranhadas, a gravidade não pode ser puramente clássica (Bose et al.; Marletto e Vedral, 2017).</p>
    <div className="controls">
      <LogSlider label="Massa de cada partícula" value={mass} min={MASS_RANGE[0]} max={MASS_RANGE[1]} onChange={setMass} display={`${formatSci(mass)} kg`} testId="input-qg-mass" ends={['10⁻¹⁷ kg', '10⁻¹¹ kg']} />
      <LogSlider label="Distância no ponto mais próximo" value={distance} min={DIST_RANGE[0]} max={DIST_RANGE[1]} onChange={setDistance} display={formatLength(distance)} testId="input-qg-distance" ends={['10 µm', '1 mm']} />
      <LogSlider label="Tempo em superposição" value={time} min={TIME_RANGE[0]} max={TIME_RANGE[1]} onChange={setTime} display={`${formatSig(time)} s`} testId="input-qg-time" ends={['0,1 s', '10 s']} />
    </div>
    <StatGrid>
      <Stat label={<>Fase gravitacional <Sym>φ = Gm²τ/(ħd)</Sym></>} value={`${formatSci(phase)} rad`} testId="text-qg-phase" />
      <Stat label="Massa ÷ recorde de superposição" value={`${formatFromLog10(Math.log10(ratioToSuperpositionRecord(mass)))} ×`} note={`recorde: ~${formatSci(SUPERPOSITION_RECORD_KG)} kg (Fein et al., 2019)`} />
      <Stat label="Raio de um cristal de diamante" value={formatLength(radius)} note="com essa massa" />
    </StatGrid>
    {overlap
      ? <div className="callout warn" data-testid="text-qg-status">Configuração impossível: com essa massa, cada cristal de diamante teria {formatLength(2 * radius)} de diâmetro, maior que a distância de {formatLength(distance)} entre os centros. As esferas se sobreporiam; aumente a distância ou diminua a massa.</div>
      : <div className={detectable ? 'callout' : 'callout warn'} data-testid="text-qg-status">
        {detectable
          ? `Fase da ordem de ${formatSci(phase)} rad: como estimativa, acima de ~${formatNumber(DETECTABLE_PHASE_ESTIMATE_RAD, 1)} rad o efeito começaria a ser mensurável, se todo o resto funcionasse.`
          : `Fase da ordem de ${formatSci(phase)} rad: como estimativa, abaixo de ~${formatNumber(DETECTABLE_PHASE_ESTIMATE_RAD, 1)} rad o efeito ficaria pequeno demais para medir.`}
      </div>}
    {!overlap && <ScaleSketch distance={distance} radius={radius} />}
    <p>O experimento ainda não é viável. Ele exige manter um cristal de ~10⁻¹⁴ kg em superposição por segundos, isolado de qualquer outra interação, como a força de Casimir entre as esferas e as colisões com moléculas do ambiente. É cerca de 10⁸ vezes a massa do recorde atual de superposição: moléculas de ~2.000 átomos (Fein et al., 2019).</p>
    <p>O Nobel de Física de 2025 (Clarke, Devoret e Martinis) premiou o tunelamento quântico e a quantização de energia num circuito supercondutor grande o bastante para segurar na mão. É um marco de mecânica quântica em escala macroscópica, mas não testou a gravidade: num circuito, o que conta é a interação eletromagnética.</p>
  </SimCard>;
}

export default function Gravity() {
  return <ModulePage
    title="A gravidade guarda informação"
    description="Os buracos negros do Módulo 5 têm entropia proporcional à área do horizonte. Essa propriedade sugere que existe um limite para quanta informação cabe numa região do espaço, e é uma das poucas pistas concretas sobre como a gravidade e a mecânica quântica se encaixam. Este módulo separa o que se sabe do que ainda é pergunta."
    number="07"
    tag="GRAVIDADE QUÂNTICA"
    limitations={[
      <>O limite holográfico para uma esfera vale para sistemas com gravidade fraca num espaço assintoticamente plano. Em cosmologia ele falha na forma simples: o atalho "universo observável" é ilustrativo. A formulação geral é o limite covariante de Bousso (2002).</>,
      <>"Um bit por volume de Planck" é uma contagem ilustrativa, não uma teoria: serve para mostrar como cresceria uma capacidade proporcional ao volume.</>,
      <>O limite de Bekenstein usa só a energia de repouso mc² e vale para sistemas com gravidade fraca. Sua formulação precisa, com definições rigorosas de entropia e energia, só foi estabelecida em teoria quântica de campos décadas depois (Casini, 2008).</>,
      <>A curva de Page usa um modelo idealizado: supõe que a entropia da radiação é igual à entropia perdida pelo buraco. Para fótons, a radiação térmica carrega cerca de 1,5 vez mais entropia; o modelo também ignora a variação da emissão com a massa e as espécies de partículas.</>,
      <>A fase φ = Gm²τ/(ħd) é a do par de ramos mais próximos. Os protocolos reais medem diferenças de fase entre ramos e precisam controlar decoerência, forças de Casimir e eletromagnéticas, o que este cálculo não inclui.</>,
    ]}
    references={[
      { text: 'J. D. Bekenstein, "Universal upper bound on the entropy-to-energy ratio for bounded systems", Physical Review D 23, 287 (1981).', url: 'https://doi.org/10.1103/PhysRevD.23.287' },
      { text: 'D. N. Page, "Information in black hole radiation", Physical Review Letters 71, 3743 (1993).', url: 'https://doi.org/10.1103/PhysRevLett.71.3743' },
      { text: 'T. Jacobson, "Thermodynamics of Spacetime: The Einstein Equation of State", Physical Review Letters 75, 1260 (1995).', url: 'https://doi.org/10.1103/PhysRevLett.75.1260' },
      { text: 'S. Bose et al., "Spin Entanglement Witness for Quantum Gravity", Physical Review Letters 119, 240401 (2017).', url: 'https://doi.org/10.1103/PhysRevLett.119.240401' },
      { text: 'H. Geng, A. Karch, C. Perez-Pardavila, S. Raju, L. Randall e M. Riojas, "Seeing Page Curves and Islands with Blinders On", arXiv:2602.06543 (2026).', url: 'https://doi.org/10.48550/arXiv.2602.06543' },
    ]}
  >
    <InformationLimit />
    <div className="claims">
      <Claim level="consenso" title="A entropia de um buraco negro é a da área">
        <p>A entropia de Bekenstein-Hawking, S = k A / (4 l_P²), é aceita como a entropia de um buraco negro: decorre da radiação Hawking e foi reproduzida, para alguns buracos negros, pela contagem de estados na teoria de cordas (Strominger e Vafa, 1996).</p>
      </Claim>
      <Claim level="consenso" title="O limite de Bekenstein">
        <p>Para um sistema de raio R e energia E, a entropia não pode passar de 2πkRE/(ħc). O limite foi proposto em 1981 a partir da segunda lei generalizada, que inclui a entropia dos buracos negros, e ganhou uma demonstração precisa em teoria quântica de campos em 2008.</p>
      </Claim>
      <Claim level="hipotese" title="O princípio holográfico vale para o nosso universo">
        <p>A ideia de que toda a física de uma região pode ser descrita por graus de liberdade na sua fronteira ('t Hooft, 1993; Susskind, 1995) tem uma realização matemática precisa na correspondência AdS/CFT, mas num espaço-tempo com geometria diferente do nosso. Se ela vale para o universo real é uma pergunta em aberto.</p>
      </Claim>
    </div>

    <PageCurve />
    <div className="claims">
      <Claim level="consenso" title="A informação provavelmente não se perde">
        <p>Hoje a maioria dos físicos espera que a evaporação preserve a informação, como qualquer processo quântico, e que a entropia da radiação siga a curva de Page. A correspondência AdS/CFT e os cálculos de 2019 reforçaram essa expectativa.</p>
      </Claim>
      <Claim level="hipotese" title="Como a informação sai">
        <p>O mecanismo ainda é debatido. As ilhas reproduzem a curva de Page, mas o que elas significam fisicamente, e se o cálculo se aplica a buracos negros reais fora de modelos simplificados, segue em discussão.</p>
        <p>Em 2026, Geng, Karch, Perez-Pardavila, Raju, Randall e Riojas argumentaram que, numa teoria de gravidade padrão, a informação já estaria codificada em observáveis medidas longe do buraco negro. Nessa leitura, a curva de Page e as ilhas descreveriam uma redistribuição de informação entre o que é medido e o que não é, e não uma recuperação. O artigo responde a argumentos em sentido contrário publicados em 2025; a questão segue em aberto.</p>
      </Claim>
    </div>

    <SimCard title="A gravidade como termodinâmica">
      <p>A temperatura não existe para uma molécula isolada: ela é uma propriedade de muitas moléculas juntas, que emerge da média de seus movimentos. Algumas pistas sugerem que a gravidade possa funcionar de modo parecido, emergindo de algo mais fundamental. A pergunta em aberto é quais seriam os "átomos" do espaço-tempo.</p>
    </SimCard>
    <div className="claims">
      <Claim level="fato" title="Einstein a partir da termodinâmica">
        <p>Em 1995, Jacobson deduziu as equações de Einstein da relação termodinâmica δQ = T dS, supondo que a entropia é proporcional à área em todo horizonte local. A dedução existe e é matematicamente correta.</p>
      </Claim>
      <Claim level="hipotese" title="A gravidade seria emergente">
        <p>A interpretação de que, por isso, a gravidade seria uma equação de estado, como a lei dos gases, não está demonstrada. A proposta de gravidade entrópica de Verlinde (2010) é controversa e enfrenta problemas observacionais.</p>
      </Claim>
    </div>

    <GravityTest />
    <div className="claims">
      <Claim level="fato" title="Ainda não há evidência direta de gravidade quântica">
        <p>Nenhum experimento até hoje observou um efeito quântico da própria gravidade. Todos os testes da relatividade geral são compatíveis com uma gravidade clássica, e os efeitos quânticos esperados são pequenos demais para os instrumentos atuais.</p>
      </Claim>
      <Claim level="hipotese" title="A gravidade é quântica">
        <p>A maioria dos físicos espera que sim, porque a matéria que gera a gravidade é quântica. Mas é uma expectativa teórica: o experimento de emaranhamento seria a primeira evidência direta, a favor ou contra.</p>
      </Claim>
    </div>

    <SimCard title="De volta à régua">
      <p>A régua da <Link href="/" className="inline-link">tela inicial</Link> termina na temperatura de Planck, {formatSci(planckTemperature, 3)} K. Nessa escala, a relatividade geral e a mecânica quântica precisam funcionar juntas, e ainda não sabemos como. Os buracos negros, com entropia proporcional à área, são a pista mais concreta que temos. Ao longo do app, separamos o que foi medido, o que é consenso teórico e o que é hipótese; na escala de Planck, quase tudo ainda está na última categoria.</p>
    </SimCard>
  </ModulePage>;
}
