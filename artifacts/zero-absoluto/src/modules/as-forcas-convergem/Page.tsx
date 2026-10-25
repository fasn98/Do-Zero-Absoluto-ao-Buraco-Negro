import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Presets, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot } from '../Plot';
import {
  LHC_ENERGY_GEV,
  PROTON_LIFETIME_LIMIT_YEARS,
  Z_MASS_GEV,
  allCrossings,
  convergenceEnergyGeV,
  crossingSpreadDecades,
  gravitationalCoupling,
  inverseCouplings,
  planckEnergyGeV,
  type Crossing,
  type Scenario,
} from '../../physics/unification';
import { formatNumber, formatSci, formatSig, superscript } from '../../lib/format';

const E_PLANCK = planckEnergyGeV();
const LOG_MIN = Math.log10(Z_MASS_GEV);
const LOG_MAX = Math.log10(E_PLANCK);
const LINE_COLORS = ['hsl(var(--chart-5))', 'hsl(var(--accent))', 'hsl(var(--primary))'];
const PAIR_NAMES = ['α₁ = α₂', 'α₁ = α₃', 'α₂ = α₃'];
const SUSY_PRESETS = [
  { label: '500 GeV', value: 500 },
  { label: '1 TeV', value: 1e3 },
  { label: '10 TeV', value: 1e4 },
  { label: '100 TeV', value: 1e5 },
];

function formatEnergy(gev: number) {
  if (gev < 1e3) return `${formatSig(gev)} GeV`;
  if (gev < 1e6) return `${formatSig(gev / 1e3)} TeV`;
  return `${formatSci(gev)} GeV`;
}

/** "0,410 ordem", "1,09 ordem", "3,97 ordens": plural a partir de 2. */
const decades = (n: number) => `${formatSig(n)} ${n < 2 ? 'ordem' : 'ordens'} de grandeza`;

function curves(scenario: Scenario) {
  const lines: [number, number][][] = [[], [], []];
  for (let i = 0; i <= 240; i += 1) {
    const log10E = LOG_MIN + ((LOG_MAX - LOG_MIN) * i) / 240;
    inverseCouplings(10 ** log10E, scenario).forEach((a, k) => lines[k].push([log10E, a]));
  }
  // Ponto extra no limiar, para o "joelho" das retas aparecer no lugar certo.
  if (scenario.susy) {
    const log10S = Math.log10(scenario.susyScaleGeV);
    inverseCouplings(scenario.susyScaleGeV, scenario).forEach((a, k) => lines[k].push([log10S, a]));
    lines.forEach((l) => l.sort((p, q) => p[0] - q[0]));
  }
  return lines;
}

function Running() {
  const [mode, setMode] = useState<'sm' | 'susy'>('sm');
  const [susyScale, setSusyScale] = useState(1e3);
  const [energy, setEnergy] = useState(1e16);
  const scenario: Scenario = { susy: mode === 'susy', susyScaleGeV: susyScale };
  const model = useMemo(() => {
    const crossings = allCrossings(scenario);
    const valid = crossings.filter((c): c is Crossing => c !== null);
    const convergence = convergenceEnergyGeV(crossings);
    return {
      lines: curves(scenario),
      crossings,
      spread: crossingSpreadDecades(crossings),
      convergence,
      lhcGap: Math.log10(convergence / LHC_ENERGY_GEV),
      atMarker: inverseCouplings(energy, scenario),
      valid,
    };
  }, [mode, susyScale, energy]);

  const xTicks = [2, 5, 8, 11, 14, 17];
  return <SimCard title="As intensidades das forças mudam com a energia">
    <p>A intensidade de cada força é medida por uma constante de acoplamento α. Ela não é fixa: muda com a energia em que se observa a interação. O gráfico mostra o inverso, α⁻¹, das três forças do Modelo Padrão: eletromagnética e fraca (combinadas em α₁ e α₂) e forte (α₃). Se as três retas se encontrassem num ponto, as três forças teriam a mesma intensidade nessa energia.</p>
    <div className="controls">
      <Segmented label="Teoria" value={mode} onChange={setMode} options={[{ value: 'sm', label: 'Modelo Padrão' }, { value: 'susy', label: 'Com supersimetria' }]} />
      {mode === 'susy' && <LogSlider label="Limiar da supersimetria" value={susyScale} min={500} max={1e5} onChange={setSusyScale} display={formatEnergy(susyScale)} testId="input-susy-scale" ends={['500 GeV', '100 TeV']} />}
      {mode === 'susy' && <Presets items={SUSY_PRESETS} onSelect={setSusyScale} isActive={(v) => Math.abs(v / susyScale - 1) < 0.01} />}
      <LogSlider label="Energia" value={energy} min={Z_MASS_GEV} max={E_PLANCK} onChange={setEnergy} display={formatEnergy(energy)} testId="input-unif-energy" ends={['M_Z ≈ 91,2 GeV', 'Planck']} />
    </div>
    <LinePlot
      title="Inverso das constantes de acoplamento em função da energia"
      xMin={LOG_MIN} xMax={LOG_MAX} yMin={0} yMax={65}
      xTicks={xTicks} yTicks={[0, 20, 40, 60]}
      formatX={(x) => `10${superscript(x)}`} formatY={(y) => String(y)}
      xLabel="energia (GeV)" yLabel="α⁻¹"
      band={[LOG_MIN, Math.log10(LHC_ENERGY_GEV)]}
      markers={[
        { x: Math.log10(LHC_ENERGY_GEV), label: 'LHC', color: 'hsl(var(--muted-foreground))' },
        { x: Math.log10(energy), label: formatEnergy(energy) },
      ]}
      series={[
        { label: 'α₁⁻¹ (U(1), hipercarga)', color: LINE_COLORS[0], points: model.lines[0], width: 2.2 },
        { label: 'α₂⁻¹ (SU(2), fraca)', color: LINE_COLORS[1], points: model.lines[1], width: 2.2 },
        { label: 'α₃⁻¹ (SU(3), forte)', color: LINE_COLORS[2], points: model.lines[2], width: 2.2 },
      ]}
      height={280}
    />
    <p className="plot-note">A faixa sombreada, de M_Z até ~14 TeV, é a região já explorada em aceleradores; à direita dela, nenhum experimento chegou. Evolução em um laço, com α₁ normalizado para grande unificação (α₁ = 5/3 α_Y).{mode === 'susy' ? ` Abaixo de ${formatEnergy(susyScale)}, valem os coeficientes do Modelo Padrão; acima, os da supersimetria mínima.` : ''}</p>

    <StatGrid>
      <Stat label={<>Em <Sym>{formatEnergy(energy)}</Sym>: <Sym>α₁⁻¹</Sym></>} value={formatSig(model.atMarker[0])} />
      <Stat label={<Sym>α₂⁻¹</Sym>} value={formatSig(model.atMarker[1])} />
      <Stat label={<Sym>α₃⁻¹</Sym>} value={formatSig(model.atMarker[2])} />
      {model.crossings.map((c, k) => <Stat key={k} label={<>Cruzamento <Sym>{PAIR_NAMES[k]}</Sym></>} value={c ? formatEnergy(c.energyGeV) : '—'} note={c ? `α⁻¹ = ${formatSig(c.inverseCoupling)}` : 'não se cruzam abaixo de 10²⁰ GeV'} testId={`text-crossing-${k}`} />)}
      <Stat label="Dispersão dos cruzamentos" value={decades(model.spread)} note="log₁₀(E_máx / E_mín)" testId="text-crossing-spread" />
      <Stat label={mode === 'sm' ? 'Do LHC aos cruzamentos' : 'Do LHC à convergência'} value={decades(model.lhcGap)} note={`média geométrica dos cruzamentos: ${formatEnergy(model.convergence)}`} testId="text-lhc-gap" />
    </StatGrid>
    <div className={mode === 'sm' ? 'callout' : 'callout warn'} data-testid="text-unif-status">
      {mode === 'sm'
        ? `No Modelo Padrão, as três retas formam um triângulo: os cruzamentos se espalham por ${decades(model.spread)} de energia. Não há um ponto comum.`
        : `Com supersimetria a partir de ${formatEnergy(susyScale)}, os três cruzamentos ficam dentro de ${decades(model.spread)}, perto de ${formatEnergy(model.convergence)}. Esse quase encontro é a motivação da hipótese; ele não é uma medição.`}
    </div>
  </SimCard>;
}

function Gravity() {
  const points = useMemo(() => {
    const lines: [number, number][][] = [[], [], [], []];
    for (let i = 0; i <= 200; i += 1) {
      const log10E = LOG_MIN + ((LOG_MAX - LOG_MIN) * i) / 200;
      inverseCouplings(10 ** log10E, { susy: false, susyScaleGeV: 1e3 }).forEach((a, k) => lines[k].push([log10E, -Math.log10(a)]));
      lines[3].push([log10E, Math.log10(gravitationalCoupling(10 ** log10E))]);
    }
    return lines;
  }, []);
  const gut = 2e16;
  const alphaG = gravitationalCoupling(gut);
  const alphaGauge = 1 / 25.8;
  return <SimCard title="E a gravidade?">
    <p>Para comparar a gravidade com as outras forças, usa-se a intensidade adimensional da atração entre duas partículas de energia E: α_G = (E / E_Planck)². Ela cresce com o quadrado da energia, mas parte de um valor ínfimo.</p>
    <LinePlot
      title="Intensidade das quatro forças em escala logarítmica, em função da energia"
      xMin={LOG_MIN} xMax={LOG_MAX} yMin={-36} yMax={0}
      xTicks={[2, 5, 8, 11, 14, 17]} yTicks={[-30, -20, -10, 0]}
      formatX={(x) => `10${superscript(x)}`} formatY={(y) => `10${superscript(y)}`}
      xLabel="energia (GeV)" yLabel="α"
      band={[LOG_MIN, Math.log10(LHC_ENERGY_GEV)]}
      markers={[{ x: Math.log10(gut), label: '2 × 10¹⁶ GeV' }]}
      series={[
        { label: 'α₁', color: LINE_COLORS[0], points: points[0], width: 1.6 },
        { label: 'α₂', color: LINE_COLORS[1], points: points[1], width: 1.6 },
        { label: 'α₃', color: LINE_COLORS[2], points: points[2], width: 1.6 },
        { label: 'Gravidade, α_G = (E/E_Planck)²', color: 'hsl(var(--foreground))', points: points[3], width: 2.4, dashed: true },
      ]}
      height={260}
    />
    <StatGrid>
      <Stat label={<>Energia de Planck <Sym>√(ħc⁵/G)</Sym></>} value={`${formatSci(E_PLANCK)} GeV`} />
      <Stat label={<>Gravidade em <Sym>2 × 10¹⁶ GeV</Sym>, <Sym>α_G</Sym></>} value={formatSci(alphaG)} testId="text-alpha-g" />
      <Stat label="Quanto mais fraca, nessa energia" value={`~${formatSci(alphaGauge / alphaG)} ×`} note="α ≈ 1/25,8 das outras forças ÷ α_G" testId="text-gravity-ratio" />
    </StatGrid>
    <p>Mesmo onde as outras três forças quase se encontram, a gravidade ainda é cerca de dez mil vezes mais fraca. Ela só fica comparável perto da energia de Planck, ~10¹⁹ GeV. Por isso, unir a gravidade às outras forças exige uma teoria de gravidade quântica, o assunto do <Link href="/a-gravidade-guarda-informacao" className="inline-link">Módulo 7</Link>.</p>
  </SimCard>;
}

const TIMELINE: { year: string; title: string; text: string }[] = [
  { year: '1687', title: 'Newton', text: 'A queda de uma maçã e a órbita da Lua são a mesma força: a gravitação universal, nos Principia.' },
  { year: '1865', title: 'Maxwell', text: 'Eletricidade, magnetismo e luz são um só fenômeno: o campo eletromagnético, cujas ondas viajam à velocidade da luz.' },
  { year: '1967–1983', title: 'Força eletrofraca', text: 'Glashow, Weinberg e Salam unificaram as forças eletromagnética e fraca (Nobel de 1979). Os bósons W e Z previstos foram descobertos no CERN em 1983 (Nobel de 1984 para Rubbia e van der Meer).' },
  { year: '2012', title: 'Bóson de Higgs', text: 'O LHC descobriu o bóson de Higgs, a peça que dá massa aos bósons W e Z na teoria eletrofraca. Higgs e Englert receberam o Nobel de 2013.' },
];

export default function Forces() {
  return <ModulePage
    title="As forças convergem?"
    description="A física já unificou forças que pareciam diferentes: a gravidade da Terra e a do céu, a eletricidade e o magnetismo, a força eletromagnética e a fraca. A pergunta seguinte é se as forças do Modelo Padrão seriam uma só em energias altíssimas. As intensidades das forças mudam com a energia, e é possível calcular para onde elas caminham."
    number="09"
    tag="UNIFICAÇÃO"
    limitations={[
      <>Só um laço: as correções de dois laços e os limiares de partículas pesadas deslocam os cruzamentos. Com tanta extrapolação, pequenas mudanças nos insumos mudam as energias de forma apreciável.</>,
      <>Os limiares de massa (quark top, Higgs, partículas supersimétricas) foram tratados de forma abrupta: a evolução muda de coeficiente de uma vez.</>,
      <>O espectro supersimétrico real, se existir, não seria um limiar único: cada partícula entraria na sua massa.</>,
      <>A gravidade não tem uma "constante de acoplamento" no mesmo sentido das outras forças; α_G aqui é uma comparação dimensional, para duas partículas com a energia indicada.</>,
      <>Os insumos em M_Z são do esquema MS-barra: α_em⁻¹ = 127,930 (PDG 2024), sen²θ_W = 0,23122 e α_s = 0,1180 (PDG 2026). As incertezas deles não são propagadas.</>,
    ]}
    references={[
      { text: 'Particle Data Group (S. Navas et al.), "Review of Particle Physics", Physical Review D 110, 030001 (2024); edição de 2026 em International Journal of Modern Physics A 41, 2630011 (2026).', url: 'https://doi.org/10.1142/S0217751X26300115' },
      { text: 'H. Georgi e S. L. Glashow, "Unity of All Elementary-Particle Forces", Physical Review Letters 32, 438 (1974).', url: 'https://doi.org/10.1103/PhysRevLett.32.438' },
      { text: 'U. Amaldi, W. de Boer e H. Fürstenau, "Comparison of grand unified theories with electroweak and strong coupling constants measured at LEP", Physics Letters B 260, 447 (1991).', url: 'https://doi.org/10.1016/0370-2693(91)91641-8' },
      { text: 'A. Takenaka et al. (Super-Kamiokande), "Search for proton decay via p → e⁺π⁰ and p → μ⁺π⁰ with an enlarged fiducial volume in Super-Kamiokande I–IV", Physical Review D 102, 112011 (2020).', url: 'https://doi.org/10.1103/PhysRevD.102.112011' },
    ]}
  >
    <Running />
    <div className="claims">
      <Claim level="fato" title="As constantes mudam com a energia">
        <p>A força forte fica mais fraca em energias mais altas: a "liberdade assintótica", prevista por Gross, Wilczek e Politzer (Nobel de 2004) e medida em muitos aceleradores, de poucos GeV até o LHC. A força eletromagnética fica um pouco mais forte: α⁻¹ cai de 137 em baixa energia para ~128 em M_Z.</p>
      </Claim>
      <Claim level="consenso" title="No Modelo Padrão, as retas não se encontram">
        <p>Com as medições de precisão do LEP, no início dos anos 1990, ficou claro que as três intensidades do Modelo Padrão não convergem para um único ponto. Os cruzamentos se espalham por mais de três ordens de grandeza de energia.</p>
      </Claim>
      <Claim level="hipotese" title="Grande unificação e supersimetria">
        <p>Com as partículas extras da supersimetria, as três retas passam muito mais perto de um ponto, por volta de 10¹⁶ GeV (Amaldi, de Boer e Fürstenau, 1991). Esse é um dos argumentos a favor das duas ideias, mas não uma prova. O LHC não encontrou nenhuma partícula supersimétrica até onde já procurou, o que excluiu as versões mais simples da teoria com partículas leves; versões mais pesadas continuam possíveis, e a convergência é pouco sensível a isso, como mostra o controle de M_SUSY.</p>
      </Claim>
    </div>

    <Gravity />
    <div className="claims">
      <Claim level="fato" title="A gravidade é muito mais fraca">
        <p>O cálculo de α_G usa só G, ħ e c: é física estabelecida. Entre duas partículas comuns, como dois prótons, a gravidade é cerca de 10³⁶ vezes mais fraca que a repulsão elétrica.</p>
      </Claim>
      <Claim level="hipotese" title="Uma unificação com a gravidade">
        <p>Teorias de cordas e outras propostas buscam incluir a gravidade numa descrição única. Nenhuma tem confirmação experimental, e as energias envolvidas estão muito além de qualquer acelerador.</p>
      </Claim>
    </div>

    <SimCard title="Unificações que já deram certo">
      <ol className="timeline-list">
        {TIMELINE.map((item) => <li key={item.title}>
          <span className="timeline-year">{item.year}</span>
          <div><b>{item.title}</b><p>{item.text}</p></div>
        </li>)}
      </ol>
    </SimCard>
    <div className="claims">
      <Claim level="fato" title="Essas quatro unificações estão confirmadas">
        <p>Cada uma fez previsões novas que foram medidas: a órbita de cometas e planetas, as ondas de rádio, os bósons W e Z, o bóson de Higgs.</p>
      </Claim>
      <Claim level="hipotese" title="A grande unificação prevê que o próton decai">
        <p>Na grande unificação de Georgi e Glashow (1974), quarks podem virar léptons, e o próton deixaria de ser eterno. O Super-Kamiokande, no Japão, observa 50 mil toneladas de água há décadas e nunca viu o decaimento: no canal p → e⁺π⁰, a vida média do próton passa de {formatSci(PROTON_LIFETIME_LIMIT_YEARS)} anos (90% de confiança), cerca de 10²⁴ vezes a idade do universo. A versão mais simples da teoria previa vidas muito mais curtas e está descartada. O Hyper-Kamiokande, em construção, deve chegar a ~10³⁵ anos.</p>
      </Claim>
    </div>
  </ModulePage>;
}
