import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import ModulePage from '../ModulePage';
import { Claim, LinearSlider, LogSlider, Presets, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import {
  ENVIRONMENTS,
  GRAVITY_TEST_TARGET_KG,
  LOG10_LAMBDA,
  OBJECTS,
  SUPERPOSITION_RECORDS,
  decoherence,
  timeComparison,
  type EnvironmentId,
  type ObjectId,
} from '../../physics/decoherence';
import { DP_R0_LOWER_BOUND_M, diosiPenroseEnergyJ, diosiPenroseTimeS, sphereRadiusM } from '../../physics/diosiPenrose';
import { diamondDensity, julianYear } from '../../physics/constants';
import { formatDuration, formatLength, formatNumber, formatSci, formatSig, superscript } from '../../lib/format';

const cmToM = (cm: number) => cm / 100;

function DecoherenceCalculator() {
  const [objectId, setObjectId] = useState<ObjectId>('dust5');
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>('photons300');
  const [separationCm, setSeparationCm] = useState(1e-6);
  const result = decoherence(objectId, environmentId, separationCm);
  const env = ENVIRONMENTS.find((e) => e.id === environmentId)!;
  return <SimCard title="Decoerência: o ambiente mede o objeto">
    <p>Um objeto em superposição de duas posições espalha fótons e moléculas do ambiente. Cada partícula espalhada carrega um pouco de informação sobre onde o objeto está, e essa informação, espalhada pelo ambiente, destrói a interferência entre as duas posições. O tempo para isso é o tempo de decoerência.</p>
    <div className="controls">
      <Segmented label="Objeto" value={objectId} onChange={setObjectId} options={OBJECTS.map((o) => ({ value: o.id, label: o.label }))} />
      <Segmented label="Ambiente" value={environmentId} onChange={setEnvironmentId} options={ENVIRONMENTS.map((e) => ({ value: e.id, label: e.label }))} />
      <LogSlider label="Separação Δx da superposição" value={separationCm} min={1e-10} max={1} onChange={setSeparationCm} display={formatLength(cmToM(separationCm))} testId="input-decoherence-dx" ends={['1 pm', '1 cm']} />
    </div>
    <StatGrid>
      <Stat label="Tempo de decoerência" value={result.regime === 'longo' ? formatDuration(result.timeS, julianYear) : '—'} note={result.regime === 'longo' ? timeComparison(result.timeS) : 'fórmula fora do regime de validade'} testId="text-decoherence-time" />
      <Stat label={<>Constante de localização <Sym>Λ</Sym></>} value={`10${superscript(LOG10_LAMBDA[environmentId][objectId])} cm⁻² s⁻¹`} note="Joos e Zeh (1985), ordem de grandeza" />
      <Stat label="Comprimento de onda do ambiente" value={formatLength(cmToM(env.wavelengthCm))} note={environmentId === 'air' || environmentId === 'vacuum' ? 'de Broglie térmico, ar a 300 K' : 'pico de Wien'} />
      <Stat label="Medições do ambiente por segundo" value="—" note="a fonte não dá a taxa total de espalhamento" />
    </StatGrid>
    {result.regime === 'longo'
      ? <div className="callout" data-testid="text-decoherence-regime">Regime de comprimento de onda longo: Δx ({formatLength(cmToM(separationCm))}) é menor que o comprimento de onda típico do ambiente ({formatLength(cmToM(env.wavelengthCm))}). Cada partícula espalhada carrega só um pouco de informação, e vale τ_D = 1/(Λ Δx²).</div>
      : <div className="callout warn" data-testid="text-decoherence-regime">Fora do regime da fórmula: Δx ({formatLength(cmToM(separationCm))}) já é maior que o comprimento de onda típico do ambiente ({formatLength(cmToM(env.wavelengthCm))}). Cada partícula espalhada basta para revelar a posição, e a decoerência satura: o tempo passa a ser o inverso da taxa total de espalhamento, que a fonte desta tabela não fornece. Por isso não mostramos um número.</div>}

    <h3 className="sub-title">Todas as combinações nesta separação</h3>
    <div className="table-scroll">
    <table className="data-table compact">
      <thead><tr><th scope="col">Ambiente</th>{OBJECTS.map((o) => <th scope="col" key={o.id}>{o.label}</th>)}</tr></thead>
      <tbody>{ENVIRONMENTS.map((e) => <tr key={e.id}>
        <th scope="row">{e.label}</th>
        {OBJECTS.map((o) => {
          const r = decoherence(o.id, e.id, separationCm);
          return <td key={o.id} data-testid={`cell-${e.id}-${o.id}`}>{r.regime === 'longo' ? formatDuration(r.timeS, julianYear) : 'fora do regime'}</td>;
        })}
      </tr>)}</tbody>
    </table>
    </div>
    <p className="plot-note">Λ de Joos e Zeh (1985), na tabela reproduzida por Joos (1999). "Fora do regime": a separação passa do comprimento de onda das partículas do ambiente. Para o ar e o vácuo, isso acontece já a partir de ~0,2 Å, porque moléculas de gás têm comprimento de onda muito curto.</p>
  </SimCard>;
}

const AXIS_LOG: [number, number] = [-31, -12];
const pctLog = (kg: number) => ((Math.log10(kg) - AXIS_LOG[0]) / (AXIS_LOG[1] - AXIS_LOG[0])) * 100;

function Records() {
  const record = SUPERPOSITION_RECORDS.at(-1)!;
  const gap = Math.log10(GRAVITY_TEST_TARGET_KG / record.massKg);
  const ticks = [-30, -27, -24, -21, -18, -15, -12];
  return <SimCard title="Os recordes de superposição">
    <p>Quanto maior o objeto, mais difícil isolá-lo do ambiente. Estes são os maiores objetos já postos em superposição de posições, em escala logarítmica de massa.</p>
    <div className="mass-chart" role="img" aria-label="Massas dos recordes de superposição em escala logarítmica">
      <div className="mass-track">
        {ticks.map((t) => <span key={t} className="h0-grid" style={{ left: `${pctLog(10 ** t)}%` }} />)}
        <span className="mass-gap" style={{ left: `${pctLog(record.massKg)}%`, width: `${pctLog(GRAVITY_TEST_TARGET_KG) - pctLog(record.massKg)}%` }}><b>{formatSig(gap)} ordens de grandeza</b></span>
        {/* Cada rótulo numa linha própria, alinhado à esquerda do ponto, para nunca se sobreporem. */}
        {SUPERPOSITION_RECORDS.map((r, i) => <span key={r.label} className="mass-point" style={{ left: `${pctLog(r.massKg)}%`, ['--row' as string]: i }}><i /><em>{r.label}</em></span>)}
        <span className="mass-point target" style={{ left: `${pctLog(GRAVITY_TEST_TARGET_KG)}%`, ['--row' as string]: SUPERPOSITION_RECORDS.length }}><i /><em>Alvo do teste gravitacional</em></span>
      </div>
      <div className="h0-axis" style={{ marginLeft: 0 }}>{ticks.map((t) => <span key={t} style={{ left: `${pctLog(10 ** t)}%` }}>10{superscript(t)}</span>)}</div>
      <div className="h0-axis-label" style={{ marginLeft: 0 }}>massa (kg)</div>
    </div>
    <table className="data-table">
      <thead><tr><th scope="col">Objeto</th><th scope="col">Massa</th></tr></thead>
      <tbody>
        {SUPERPOSITION_RECORDS.map((r) => <tr key={r.label}><th scope="row">{r.label}<small>{r.note}</small></th><td>{formatSci(r.massKg)} kg</td></tr>)}
        <tr><th scope="row">Alvo do teste gravitacional<small>proposta, ainda não realizada (<Link href="/a-gravidade-guarda-informacao" className="inline-link">Módulo 7</Link>)</small></th><td>~10⁻¹⁴ kg</td></tr>
      </tbody>
    </table>
    <div className="callout" data-testid="text-nobel-2025">
      <b>Fora desta escala: o Nobel de 2025.</b> Clarke, Devoret e Martinis mostraram tunelamento e níveis de energia quantizados num circuito supercondutor. Ali, quem se comporta quanticamente é uma variável coletiva, a corrente ou a fase de bilhões de pares de Cooper, e não a posição de um objeto. Por isso não é um recorde do mesmo tipo e não aparece na escala de massa.
    </div>
  </SimCard>;
}

const DP_PRESETS = [
  { label: 'Cristal do Módulo 7', mass: 1e-14, density: diamondDensity, separation: 250e-6 },
  { label: '1 g de diamante', mass: 1e-3, density: diamondDensity, separation: 1e-2 },
  // Molécula de ~4,15 × 10⁻²³ kg com raio de ~1 nm: densidade efetiva m / (4/3 π (1 nm)³).
  { label: 'Molécula recordista', mass: 4.15e-23, density: 4.15e-23 / ((4 / 3) * Math.PI * 1e-27), separation: 1e-6 },
];

function DiosiPenrose() {
  const [mass, setMass] = useState(1e-14);
  const [density, setDensity] = useState(diamondDensity);
  const [separation, setSeparation] = useState(250e-6);
  const model = useMemo(() => {
    const radius = sphereRadiusM(mass, density);
    return { radius, energy: diosiPenroseEnergyJ(mass, radius, separation), time: diosiPenroseTimeS(mass, radius, separation) };
  }, [mass, density, separation]);
  const apply = (p: typeof DP_PRESETS[number]) => { setMass(p.mass); setDensity(p.density); setSeparation(p.separation); };
  const active = DP_PRESETS.find((p) => Math.abs(p.mass / mass - 1) < 0.01 && Math.abs(p.separation / separation - 1) < 0.01 && Math.abs(p.density / density - 1) < 0.01);
  return <SimCard title="E se a gravidade causar o colapso?">
    <p>Diósi (1987) e Penrose (1996) propuseram que uma superposição de duas posições de uma massa colapse sozinha, num tempo τ ≈ ħ / E_G, onde E_G mede o quanto as duas distribuições de massa diferem gravitacionalmente. Quanto maior e mais separada a massa, mais rápido o colapso.</p>
    <div className="controls">
      <div className="btn-row">{DP_PRESETS.map((p) => <button key={p.label} type="button" className={active === p ? 'preset active' : 'preset'} onClick={() => apply(p)} data-testid={`button-dp-${p.label.toLowerCase().replace(/\s+/g, '-')}`}>{p.label}</button>)}</div>
      <LogSlider label="Massa" value={mass} min={1e-23} max={1e-2} onChange={setMass} display={`${formatSci(mass)} kg`} testId="input-dp-mass" ends={['10⁻²³ kg', '10⁻² kg']} />
      <LinearSlider label="Densidade" value={Math.round(density)} min={500} max={22000} step={10} onChange={setDensity} display={`${formatNumber(density, 0)} kg/m³`} testId="input-dp-density" ends={['500 kg/m³', '22.000 kg/m³']} />
      <Presets items={[{ label: 'Diamante', value: diamondDensity }]} onSelect={setDensity} isActive={(v) => Math.abs(v / density - 1) < 0.001} />
      <LogSlider label="Separação d" value={separation} min={1e-12} max={0.1} onChange={setSeparation} display={formatLength(separation)} testId="input-dp-separation" ends={['1 pm', '10 cm']} />
    </div>
    <StatGrid>
      <Stat label={<>Raio da esfera <Sym>R</Sym></>} value={formatLength(model.radius)} note={separation >= 2 * model.radius ? 'd ≥ 2R: posições sem sobreposição' : 'd < 2R: posições se sobrepõem'} />
      <Stat label={<>Energia gravitacional <Sym>E_G</Sym></>} value={`${formatSci(model.energy)} J`} testId="text-dp-energy" />
      <Stat label={<>Tempo de colapso <Sym>τ ≈ ħ/E_G</Sym></>} value={formatDuration(model.time, julianYear)} note={timeComparison(model.time)} testId="text-dp-time" />
    </StatGrid>
    <p>Com este modelo de esfera homogênea, o cristal do Módulo 7 (10⁻¹⁴ kg, 250 µm) colapsaria em cerca de 12 ms, muito antes dos ~2,5 s do experimento de emaranhamento proposto. Por isso esses experimentos também testariam a hipótese de Penrose. O número depende do modelo: num cristal real a massa está concentrada nos núcleos, e o resultado muda muito com o parâmetro de corte R₀ da teoria. Já para a molécula recordista o colapso levaria dezenas de milhares de anos, e não atrapalha os experimentos com moléculas.</p>
  </SimCard>;
}

export default function QuantumToClassical() {
  return <ModulePage
    title="Onde o quântico vira clássico"
    description="Se tudo é feito de átomos que obedecem à mecânica quântica, por que uma bola de futebol nunca está em dois lugares ao mesmo tempo? Parte da resposta é bem compreendida: o ambiente, a todo instante, registra onde as coisas estão. Outra parte continua em aberto."
    number="10"
    tag="FUNDAMENTOS QUÂNTICOS"
    limitations={[
      <>Os valores de Λ são ordens de grandeza de modelos simplificados de espalhamento (Joos e Zeh, 1985), não medições para objetos específicos.</>,
      <>A saturação para Δx grande não foi calculada: a tabela de Λ não traz a taxa total de espalhamento de cada caso. O comprimento de onda que define o regime é uma escolha típica (pico de Wien para fótons; de Broglie térmico do ar a 300 K para o gás, também no vácuo de laboratório).</>,
      <>Diósi-Penrose com esfera homogênea ignora a estrutura atômica; o parâmetro de corte R₀ da teoria muda os resultados em muitas ordens de grandeza.</>,
      <>A emissão térmica do próprio objeto, importante para nanopartículas quentes, não foi incluída.</>,
    ]}
    references={[
      { text: 'E. Joos e H. D. Zeh, "The emergence of classical properties through interaction with the environment", Zeitschrift für Physik B 59, 223 (1985); tabela de Λ reproduzida em E. Joos, "Elements of Environmental Decoherence", arXiv:quant-ph/9908008 (1999).', url: 'https://doi.org/10.1007/BF01725541' },
      { text: 'W. H. Zurek, "Decoherence, einselection, and the quantum origins of the classical", Reviews of Modern Physics 75, 715 (2003).', url: 'https://doi.org/10.1103/RevModPhys.75.715' },
      { text: 'M. Schlosshauer, Decoherence and the Quantum-to-Classical Transition, Springer (2007).', url: 'https://doi.org/10.1007/978-3-540-35775-9' },
      { text: 'K. Hornberger et al., "Collisional Decoherence Observed in Matter Wave Interferometry", Physical Review Letters 90, 160401 (2003).', url: 'https://doi.org/10.1103/PhysRevLett.90.160401' },
      { text: 'M. Arndt et al., "Wave–particle duality of C60 molecules", Nature 401, 680 (1999).', url: 'https://doi.org/10.1038/44348' },
      { text: 'Y. Y. Fein et al., "Quantum superposition of molecules beyond 25 kDa", Nature Physics 15, 1242 (2019).', url: 'https://doi.org/10.1038/s41567-019-0663-9' },
      { text: 'L. Diósi, Physics Letters A 120, 377 (1987); R. Penrose, "On Gravity\'s role in Quantum State Reduction", General Relativity and Gravitation 28, 581 (1996).', url: 'https://doi.org/10.1007/BF02105068' },
      { text: 'S. Donadi et al., "Underground test of gravity-related wave function collapse", Nature Physics 17, 74 (2021).', url: 'https://doi.org/10.1038/s41567-020-1008-4' },
    ]}
  >
    <DecoherenceCalculator />
    <div className="claims">
      <Claim level="fato" title="A decoerência é observada em laboratório">
        <p>Em 2003, Hornberger e colegas enviaram moléculas de fulereno por um interferômetro e foram deixando entrar gás aos poucos. O padrão de interferência sumiu exatamente no ritmo previsto pelas colisões com as moléculas do gás. A decoerência já foi medida também com fótons e átomos.</p>
      </Claim>
      <Claim level="consenso" title="Por que não vemos superposições macroscópicas">
        <p>A decoerência explica por que objetos grandes não mostram interferência: eles interagem com o ambiente tão depressa que a informação sobre a posição se espalha antes de qualquer observação. Essa é a visão aceita, desde os trabalhos de Zeh (1970), Joos e Zeh (1985) e Zurek (2003).</p>
      </Claim>
    </div>

    <Records />

    <DiosiPenrose />
    <div className="claims">
      <Claim level="hipotese" title="A gravidade colapsa as superposições">
        <p>Não há evidência de que o colapso de Diósi-Penrose exista. A ideia tenta explicar por que obtemos um único resultado, ligando a mecânica quântica à gravidade, e tem consequências testáveis.</p>
      </Claim>
      <Claim level="fato" title="O teste de Gran Sasso">
        <p>Se o colapso existisse, os prótons de um cristal ganhariam pequenos empurrões e, por terem carga, emitiriam uma radiação fraca. Donadi e colegas (2021) procuraram essa radiação num detector de germânio no laboratório subterrâneo de Gran Sasso, na Itália, e não a encontraram. O resultado exige R₀ maior que {formatSci(DP_R0_LOWER_BOUND_M)} m e exclui a versão mais simples do modelo, sem parâmetros livres, em que R₀ seria ~0,05 × 10⁻¹⁰ m. Versões com R₀ maior continuam possíveis.</p>
      </Claim>
    </div>

    <SimCard title="O que a decoerência não resolve">
      <p>A decoerência explica por que as alternativas deixam de interferir. Mas, no formalismo, todas continuam lá: ela não diz por que observamos um único resultado. Esse é o problema da medição. As principais respostas propostas:</p>
      <ul className="limits-list">
        <li><b>Copenhague:</b> a mecânica quântica descreve o que podemos saber; a medição dá um resultado, e não cabe perguntar o que existe entre medições.</li>
        <li><b>Muitos mundos (Everett, 1957):</b> nada colapsa; cada resultado acontece num ramo diferente, e a decoerência separa os ramos.</li>
        <li><b>Colapso objetivo (GRW, 1986; Diósi-Penrose):</b> a evolução quântica ganha um termo novo, raro para partículas e rápido para objetos grandes, que escolhe um resultado.</li>
        <li><b>Mecânica bohmiana:</b> as partículas têm sempre posições definidas, guiadas pela função de onda.</li>
      </ul>
      <p>A passagem do quântico para o clássico pode ser só decoerência, ou pode envolver algo novo, como a gravidade. Os experimentos dos próximos anos, com massas cada vez maiores em superposição, vão ajudar a decidir: o colapso objetivo prevê que, a partir de certa massa, a interferência some mesmo num isolamento perfeito.</p>
    </SimCard>
    <div className="claims">
      <Claim level="consenso" title="O problema da medição está em aberto">
        <p>Não há acordo entre os físicos sobre qual interpretação é correta, e a maioria das propostas faz as mesmas previsões para os experimentos feitos até hoje.</p>
      </Claim>
      <Claim level="hipotese" title="Cada interpretação">
        <p>Copenhague, muitos mundos, colapso objetivo e mecânica bohmiana são hipóteses em pesquisa. Só os modelos de colapso objetivo fazem previsões diferentes da mecânica quântica padrão, e por isso podem ser testados diretamente.</p>
      </Claim>
    </div>
    <Link href="/a-consciencia-e-quantica" className="continue-card" data-testid="link-continue-12">
      <div><span className="eyebrow">CONTINUE · MÓDULO 12</span><strong>A consciência é quântica?</strong><p>A hipótese Orch-OR liga o colapso de Diósi-Penrose aos microtúbulos dos neurônios. O cérebro, a 310 K, deixaria as superposições sobreviverem tempo suficiente?</p></div>
      <ArrowRight size={18} />
    </Link>
  </ModulePage>;
}
