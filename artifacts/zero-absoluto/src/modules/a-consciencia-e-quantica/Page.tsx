import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import { ClockRace, type ClockMark } from './ClockRace';
import { BRAIN_TUBULINS, MASS_MODELS, ORCH_OR_TIME_S, ORCH_OR_TUBULINS, TUBULIN_DIMER_MASS_DA, orchORCollapseTimeS, tubulinsForCollapseTime, type MassModel } from '../../physics/orchOR';
import { BRAIN_ENERGY_FRACTION, BRAIN_MASS_FRACTION, HUMAN_CELL_COUNT, RESTING_POWER_W, brainPowerW, powerPerCellW } from '../../physics/bodyEnergy';
import { formatFromLog10, formatNumber, formatSci, formatSig, superscript } from '../../lib/format';
import { DECOHERENCE_ESTIMATES, MYTHS, NEURAL_BAND, NEURAL_TIMES, READINGS, REFERENCES, type DecoherenceId } from './sources';

/** Tempo em texto: potência de dez, ou intervalo entre duas. */
function timeText([a, b]: [number, number]) {
  const one = (s: number) => {
    const l = Math.log10(s);
    if (Math.abs(l - Math.round(l)) < 1e-9) return `10${superscript(Math.round(l))} s`;
    if (s >= 1e-3 && s < 1) return `${formatSig(s * 1000, 2)} ms`;
    return `${formatFromLog10(l, 1)} s`;
  };
  return a === b ? one(a) : `${one(a)} a ${one(b)}`;
}

/** Ordens de grandeza que faltam de τ até t (0 se já alcança). */
const ordersShort = (tau: number, target: number) => Math.max(0, Math.log10(target / tau));

/** Distância de um intervalo de decoerência até um tempo-alvo, em texto ("16 a 17 ordens de grandeza"). */
function ordersText([lo, hi]: [number, number], target: number) {
  const min = ordersShort(hi, target);
  const max = ordersShort(lo, target);
  // A mesma precisão nos dois extremos: uma casa decimal enquanto a distância for pequena.
  const fmt = (x: number) => formatNumber(x, max < 5 ? 1 : 0);
  if (max < 0.05) return 'alcança';
  if (fmt(min) === fmt(max)) return `${fmt(max)} ordens de grandeza`;
  return `${min < 0.05 ? '0' : fmt(min)} a ${fmt(max)} ordens de grandeza`;
}

function Debate() {
  return <div className="claims">
    <Claim level="hipotese" title="Orch-OR: consciência e colapso nos microtúbulos">
      <p>Nos anos 1990, o físico Roger Penrose e o anestesiologista Stuart Hameroff propuseram que a consciência envolveria superposições quânticas nos <b>microtúbulos</b>, filamentos de proteína (a tubulina) que formam o esqueleto dos neurônios. Cada superposição terminaria pelo colapso gravitacional de Diósi-Penrose, o mesmo do <Link href="/quantico-para-classico" className="inline-link">Módulo 10</Link>, e cada colapso seria um momento de experiência consciente. A hipótese é defendida por pesquisadores sérios e faz previsões testáveis; não há evidência direta de que esteja certa.</p>
    </Claim>
    <Claim level="hipotese" title="A objeção de Tegmark (2000)">
      <p>Max Tegmark calculou quanto tempo uma superposição sobreviveria no cérebro, quente (310 K) e úmido, cheio de íons e moléculas de água que colidem com tudo. Para um neurônio que dispara e não dispara ao mesmo tempo, achou <b>10⁻²⁰ s</b>; para uma excitação que percorre um microtúbulo, <b>10⁻¹³ s</b>. Os processos neurais duram de 10⁻³ a 10⁻¹ s: a decoerência ganharia por mais de dez ordens de grandeza, e o cérebro seria um sistema clássico.</p>
    </Claim>
    <Claim level="hipotese" title="A resposta de Hagan, Hameroff e Tuszynski (2002)">
      <p>Os autores contestam as premissas: Tegmark teria calculado um modelo diferente do Orch-OR (uma onda de carga que se propaga, e não conformações de proteína em superposição), com uma separação, uma carga e uma constante dielétrica que não correspondem ao caso deles. Refeitas as contas, chegam a <b>10⁻⁵ a 10⁻⁴ s</b>. Com a água ordenada em volta dos microtúbulos e o gel de actina protegendo o sistema, propõem <b>10⁻² a 10⁻¹ s</b>, já na escala neural.</p>
    </Claim>
  </div>;
}

function Race() {
  // ?decoerencia=<id> e ?massa=<id> abrem a página numa estimativa e num modelo (usados nas capturas).
  const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
  const [estimate, setEstimate] = useState<DecoherenceId>(() => DECOHERENCE_ESTIMATES.find((e) => e.id === params?.get('decoerencia'))?.id ?? 'tegmark-microtubulo');
  const [model, setModel] = useState<MassModel>(() => MASS_MODELS.find((m) => m.id === params?.get('massa'))?.id ?? 'nucleons');
  const chosen = DECOHERENCE_ESTIMATES.find((e) => e.id === estimate)!;
  const collapse = orchORCollapseTimeS(ORCH_OR_TUBULINS, model);
  const nucleonTime = orchORCollapseTimeS(ORCH_OR_TUBULINS, 'nucleons');
  const marks: ClockMark[] = useMemo(() => [
    ...DECOHERENCE_ESTIMATES.map((e) => ({ id: e.id, label: e.short, range: e.range, family: 'decoerencia' as const, highlight: e.id === estimate })),
    { id: 'colapso', label: `Colapso D-P, ${formatSci(ORCH_OR_TUBULINS, 0)} tubulinas`, range: [collapse, collapse] as [number, number], family: 'colapso' as const, highlight: true },
    ...NEURAL_TIMES.map((n) => ({ id: n.id, label: n.short, range: n.range, family: 'neural' as const })),
  ], [estimate, collapse]);
  // Distância até a escala neural (1 ms, potencial de ação; 25 ms, gama), para os dois extremos da estimativa.
  return <SimCard title="A corrida de relógios">
    <p>Para que um efeito quântico importe no cérebro, a superposição precisa durar ao menos o tempo dos processos neurais. O gráfico põe lado a lado os tempos de decoerência estimados em cada artigo, o tempo de colapso que o Orch-OR propõe e os tempos medidos da atividade neural, numa escala de 10⁻²⁵ s a 1 s.</p>
    <div className="controls">
      <div>
        <div className="log-slider-head"><span>Estimativa de decoerência</span></div>
        <Segmented label="Estimativa de decoerência" value={estimate} onChange={setEstimate} options={DECOHERENCE_ESTIMATES.map((e) => ({ value: e.id, label: e.button }))} />
      </div>
    </div>
    <ClockRace marks={marks} neuralBand={NEURAL_BAND} />
    <StatGrid>
      <Stat label="Decoerência escolhida" value={timeText(chosen.range)} note={chosen.source} testId="text-12-decoherence" />
      <Stat label="Até um potencial de ação (~1 ms)" value={ordersText(chosen.range, 1e-3)} note="quantas potências de dez faltam" testId="text-12-orders-spike" />
      <Stat label="Até o ritmo gama (~25 ms)" value={ordersText(chosen.range, 0.025)} note="ciclo de 40 Hz, ligado à percepção" testId="text-12-orders-gamma" />
    </StatGrid>
    <div className="callout" data-testid="text-12-verdict">
      {estimate.startsWith('tegmark')
        ? <>Se a decoerência for tão rápida quanto Tegmark calcula, as superposições se desfazem muito antes de qualquer processo neural: efeitos quânticos não sobreviveriam o bastante para importar.</>
        : <>Se a decoerência for tão lenta quanto Hagan, Hameroff e Tuszynski propõem, a hipótese continua possível.</>} O desacordo não é de aritmética: está nas premissas físicas (qual é o sistema em superposição, quanto ele se separa, como a água e os íons o blindam). É isso que os experimentos tentam decidir.
    </div>
    <div className="sub-title">O colapso de Diósi-Penrose nas tubulinas</div>
    <p>O Orch-OR estima quantas tubulinas precisam estar em superposição para que o colapso aconteça num tempo de interesse, com <Sym>τ = ħ / E<sub>G</sub></Sym>. Para um evento de 25 ms, Hameroff e Penrose estimam ~{formatSci(ORCH_OR_TUBULINS, 0)} tubulinas. Cada dímero de tubulina tem ~{formatNumber(TUBULIN_DIMER_MASS_DA / 1000, 0)} kDa (sequências humanas no UniProt). Aqui, a mesma conta do Módulo 10 para esse número de tubulinas. O resultado muda por muitas ordens de grandeza conforme a forma como a massa está distribuída:</p>
    <Segmented label="Modelo de distribuição de massa" value={model} onChange={setModel} options={MASS_MODELS.map((m) => ({ value: m.id, label: m.label }))} />
    <StatGrid>
      {MASS_MODELS.map((m) => <Stat key={m.id} label={m.label} value={timeText([orchORCollapseTimeS(ORCH_OR_TUBULINS, m.id), orchORCollapseTimeS(ORCH_OR_TUBULINS, m.id)])} note={`${m.detail}; para 25 ms seriam ${formatSci(tubulinsForCollapseTime(ORCH_OR_TIME_S, m.id), 1)} tubulinas`} testId={`text-12-collapse-${m.id}`} />)}
    </StatGrid>
    <div className="callout" data-testid="text-12-collapse-gap">Com a massa concentrada nos núcleons, a conta do app dá <b>{formatSig(nucleonTime * 1000, 2)} ms</b> para {formatSci(ORCH_OR_TUBULINS, 0)} tubulinas; Hameroff e Penrose dizem <b>25 ms</b>. A diferença, de ~{formatNumber(nucleonTime / ORCH_OR_TIME_S, 0)} vezes, não é um erro de um lado ou de outro: vem do modelo de distribuição de massa (como a massa se agrupa em núcleos, que raio cada pedaço tem, quanto ele se desloca). É exatamente o ponto deste módulo: o tempo de colapso depende de escolhas que a hipótese ainda não fixou.</div>
    <p className="plot-note" data-testid="text-12-collapse-note">Com a massa concentrada nos núcleons, E<sub>G</sub> é grande e o colapso é rápido. Espalhada sobre R₀ ≥ 0,54 Å, como exige o teste de Gran Sasso, e com um deslocamento do tamanho de um núcleon, E<sub>G</sub> cai por mais de catorze ordens de grandeza: seriam necessárias mais tubulinas que as ~{formatSci(BRAIN_TUBULINS, 0)} do cérebro inteiro. Derakhshani e colegas (2022), com um modelo mais detalhado, chegam a ~4 × 10²³. Nenhum desses números foi medido: são consequências de uma hipótese, sob hipóteses adicionais sobre a massa.</p>
  </SimCard>;
}

function Experiments() {
  return <SimCard title="O que os experimentos dizem">
    <div className="claims">{READINGS.map((r) => <Claim key={r.id} level={r.level} title={r.title}>
      <p>{r.text}</p>
      {r.notShown && <p><b>O que não mostra:</b> {r.notShown}</p>}
      <p className="plot-note" style={{ margin: 0 }}>{r.source}</p>
    </Claim>)}</div>
  </SimCard>;
}

function MythsAndFacts() {
  const perCell = powerPerCellW();
  return <SimCard title="Mitos e fatos sobre energia e cérebro">
    <StatGrid>
      <Stat label="Potência do corpo em repouso" value={`~${formatNumber(RESTING_POWER_W, 0)} W`} note="em repouso: 0,863 kcal/kg/h (McMurray et al., 2014) × 80 kg" testId="text-12-body-power" />
      <Stat label="Células no corpo" value={formatSci(HUMAN_CELL_COUNT, 2)} note="Bianconi et al., 2013" testId="text-12-cells" />
      <Stat label="Potência média por célula" value={`${formatSig(perCell * 1e12, 3)} pW`} note={`${formatNumber(RESTING_POWER_W, 0)} W ÷ ${formatSci(HUMAN_CELL_COUNT, 2)} células`} testId="text-12-per-cell" />
      <Stat label="Cérebro" value={`~${formatNumber(brainPowerW(), 0)} W`} note={`~${formatNumber(BRAIN_MASS_FRACTION * 100, 0)}% da massa, ~${formatNumber(BRAIN_ENERGY_FRACTION * 100, 0)}% da energia em repouso`} testId="text-12-brain-power" />
    </StatGrid>
    <ol className="timeline-list cosmic-list myths">{MYTHS.map((m) => <li key={m.title}>
      <span className="timeline-year">{m.kind}</span>
      <div>
        <div className="claim-head"><b>{m.title}</b>{m.level && <EvidenceTag level={m.level} />}</div>
        <p>{m.text}</p>
        <p className="plot-note" style={{ margin: 0 }}>{m.source}</p>
      </div>
    </li>)}</ol>
  </SimCard>;
}


export default function QuantumConsciousness() {
  return <ModulePage
    title="A consciência é quântica?"
    description="Uma hipótese séria propõe que a consciência depende de efeitos quânticos nos neurônios. A física do Módulo 10 permite pôr números na pergunta: quanto tempo uma superposição sobreviveria num cérebro a 310 K? A resposta depende de premissas que ainda estão em disputa."
    number="12"
    tag="BIOFÍSICA"
    limitations={[
      <>Os tempos de decoerência são estimativas de ordem de grandeza, e cada um depende do modelo físico do artigo que o calculou.</>,
      <>Não existe uma definição operacional de consciência aceita por todos; nenhuma medida física diz, sozinha, se um sistema é consciente.</>,
      <>Somar linearmente as energias, E<sub>G</sub>(N) = N · E<sub>G</sub>(1), supõe tubulinas independentes, cada uma em sua própria superposição. Um deslocamento coletivo e coerente de muitas tubulinas juntas mudaria a conta, porque E<sub>G</sub> depende da massa total deslocada e de como ela está distribuída no espaço.</>,
      <>O cálculo de Diósi-Penrose para tubulinas depende da distribuição de massa, do deslocamento e do parâmetro de corte R₀. Aqui as energias das tubulinas se somam e os núcleons são tratados um a um, sem agrupá-los em núcleos: simplificações que mudam o resultado por um fator de ~10, muito menos que a diferença entre os modelos.</>,
      <>O número de tubulinas usado ({formatSci(ORCH_OR_TUBULINS, 0)}) é o proposto pelo Orch-OR para um evento de ~25 ms; outros trabalhos do mesmo grupo usam valores diferentes.</>,
    ]}
    references={REFERENCES}
  >
    <Debate />
    <Race />
    <Experiments />
    <MythsAndFacts />
    <div className="claims">
      <Claim level="consenso" title="A origem da consciência é uma questão em aberto">
        <p>Não há teoria da consciência aceita pela comunidade científica. O Orch-OR é uma entre várias hipóteses; as mais estudadas em neurociência, como a teoria da informação integrada e a do espaço de trabalho global, não dependem de efeitos quânticos.</p>
      </Claim>
    </div>
  </ModulePage>;
}
