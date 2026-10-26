import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, LogSlider, SimCard, Stat, StatGrid, Sym, useScrollToHash, type EvidenceLevel } from '../shared';
import { LinePlot } from '../Plot';
import { cmbColderThanS, cmbDeSitterCrossingS, deSitterTemperatureK, evaporationOnsetS, evaporationTimeYears, largestEvaporatingMassKg } from '../../physics/frontier';
import { hawkingTemperatureK } from '../../physics/blackHole';
import { ageOfUniverseS, temperatureAtTimeK } from '../../physics/friedmann';
import { PROTON_LIFETIME_LIMIT_YEARS } from '../../physics/unification';
import { julianYear, solarMass } from '../../physics/constants';
import { formatDuration, formatFromLog10, formatNumber, formatSci, formatTemperature, superscript } from '../../lib/format';
import { BEC_1995_K, CARDS, LAB_RECORD, LIMITATIONS, REFERENCES, TRACK_SUMMARY, type OpenQuestion } from './sources';

const T0_S = ageOfUniverseS();
const T0_YEARS = T0_S / julianYear;
const T_DS = deSitterTemperatureK();
const CROSSING_S = cmbDeSitterCrossingS();
const yearsText = (years: number) => formatDuration(years * julianYear, julianYear);
const decade = (log10: number) => `10${superscript(Math.round(log10))}`;

// --- Seção 1: a linha do tempo do futuro -------------------------------------------------

type FutureMark = { id: string; log10Years: number; label: string; when: string; level: EvidenceLevel; text: ReactNode; source: string; lowerLimit?: boolean };

function futureMarks(): FutureMark[] {
  const sunOnset = evaporationOnsetS(solarMass) / julianYear;
  return [
    { id: 'hoje', log10Years: Math.log10(T0_YEARS), label: 'Hoje', when: yearsText(T0_YEARS), level: 'fato', text: 'A idade do universo medida pelo Planck, dentro do ΛCDM.', source: 'Planck 2018 VI, A&A 641, A6 (2020).' },
    { id: 'estrelas', log10Years: 14, label: 'Fim das estrelas', when: '~10¹³ a 10¹⁴ anos', level: 'consenso', text: 'Uma anã vermelha de 0,1 massa solar vive ~2,5 × 10¹³ anos. O gás para formar estrelas se esgota entre 10¹² e 10¹⁴ anos, e por volta de 10¹⁴ anos a formação normal de estrelas cessa. As galáxias passam a ser feitas de anãs brancas, estrelas de nêutrons e buracos negros.', source: 'F. C. Adams e G. Laughlin, Rev. Mod. Phys. 69, 337 (1997).' },
    { id: 'buraco-negro-esfria', log10Years: Math.log10(sunOnset), label: 'Fundo mais frio que um buraco negro solar', when: yearsText(sunOnset), level: 'consenso', text: <>Um buraco negro de 1 massa solar tem temperatura de Hawking de {formatTemperature(hawkingTemperatureK(solarMass))}. Enquanto o fundo cósmico é mais quente que ele, o buraco negro absorve mais do que emite e cresce. Só quando o fundo fica mais frio, nesta data, a evaporação passa a ganhar.</>, source: 'Cálculo deste app: T ∝ 1/a no ΛCDM do Planck 2018; temperatura de Hawking (Módulo 5).' },
    { id: 'tds', log10Years: Math.log10(CROSSING_S / julianYear), label: 'Fundo cósmico chega à temperatura do horizonte', when: yearsText(CROSSING_S / julianYear), level: 'hipotese', text: <>O fundo cósmico esfria até a temperatura do horizonte cosmológico, {formatTemperature(T_DS)}, e para de esfriar (Seção 2).</>, source: 'G. W. Gibbons e S. W. Hawking, Phys. Rev. D 15, 2738 (1977); cálculo deste app.' },
    { id: 'proton', log10Years: Math.log10(PROTON_LIFETIME_LIMIT_YEARS), label: 'Próton: limite medido', when: `mais de ${formatSci(PROTON_LIFETIME_LIMIT_YEARS, 1)} anos`, level: 'hipotese', lowerLimit: true, text: <>O decaimento do próton é previsto por teorias de grande unificação (<Link href="/as-forcas-convergem" className="inline-link">Módulo 09</Link>) e <span style={{ fontWeight: 600 }}>nunca foi observado</span>. O Super-Kamiokande mostra que, se acontece pelo canal p → e⁺π⁰, a vida média parcial nesse canal passa de {formatSci(PROTON_LIFETIME_LIMIT_YEARS, 1)} anos (90% de confiança). Se o próton for estável, a matéria comum não desaparece.</>, source: 'A. Takenaka et al. (Super-Kamiokande), Phys. Rev. D 102, 112011 (2020).' },
    { id: 'bn-solar', log10Years: Math.log10(evaporationTimeYears(1)), label: 'Evapora um buraco negro solar', when: `${formatSci(evaporationTimeYears(1), 1)} anos`, level: 'consenso', text: 'Pela radiação de Hawking, um buraco negro de 1 massa solar perde toda a massa em ~10⁶⁷ anos. A radiação de Hawking é física teórica bem estabelecida, mas nunca foi observada.', source: 'S. W. Hawking, Nature 248, 30 (1974); Módulo 5.' },
    { id: 'bn-gigante', log10Years: Math.log10(evaporationTimeYears(1e11)), label: 'Evaporam os maiores buracos negros', when: `${formatSci(evaporationTimeYears(1e11), 1)} anos`, level: 'consenso', text: 'Um buraco negro de 10¹¹ massas solares, como os maiores conhecidos, leva ~10¹⁰⁰ anos: o tempo cresce com o cubo da massa.', source: 'Fórmula t ≈ 5120π G² M³/(ħ c⁴), corpo negro, só fótons.' },
    { id: 'depois', log10Years: 101.5, label: 'E depois?', when: 'além de 10¹⁰⁰ anos', level: 'hipotese', text: <>Se Λ for constante, resta um universo quase vazio, à temperatura do horizonte, {formatTemperature(T_DS)}. O que acontece depois (flutuações, decaimento do vácuo, um novo ciclo) é especulação sem teste.</>, source: 'Adams e Laughlin (1997); Gibbons e Hawking (1977).' },
  ];
}

const AXIS: [number, number] = [10, 102];

function FutureTimeline({ marks, highlight }: { marks: FutureMark[]; highlight: { onset: number; end: number } }) {
  const frac = (log10: number) => (Math.min(AXIS[1], Math.max(AXIS[0], log10)) - AXIS[0]) / (AXIS[1] - AXIS[0]);
  const pos = (log10: number) => `${frac(log10) * 100}%`;
  // Marcos próximos (menos de 4% da largura) sobem uma linha, para não se sobreporem.
  const rows: number[] = [];
  marks.forEach((m, i) => { rows.push(i > 0 && frac(m.log10Years) - frac(marks[i - 1].log10Years) < 0.04 ? rows[i - 1] + 1 : 0); });
  const height = 34 + Math.max(...rows) * 22;
  const ticks = [10, 20, 40, 60, 80, 100];
  return <div className="future-axis" data-testid="plot-25-timeline">
    <div className="future-track" aria-hidden="true" style={{ height }}>
      {Number.isFinite(highlight.onset) && <span className="future-span" style={{ left: pos(highlight.onset), width: `calc(${pos(highlight.end)} - ${pos(highlight.onset)})` }} />}
      {marks.map((m, i) => <span key={m.id} className={`future-dot level-${m.level}`} style={{ left: pos(m.log10Years), bottom: 6 + rows[i] * 22 }} title={m.label}>{i + 1}</span>)}
    </div>
    <div className="future-ticks" aria-hidden="true">{ticks.map((t) => <span key={t} style={{ left: pos(t) }}>{decade(t)}</span>)}</div>
    <div className="future-ticks-label">anos desde o Big Bang (escala logarítmica)</div>
  </div>;
}

function FarFuture() {
  const marks = useMemo(futureMarks, []);
  const [massSolar, setMassSolar] = useState(1);
  const massKg = massSolar * solarMass;
  const onset = evaporationOnsetS(massKg) / julianYear;
  const life = evaporationTimeYears(massSolar);
  return <SimCard title="O fim mais distante">
    <div className="callout warn" data-testid="text-25-lambda-warning">
      <div className="claim-head"><strong>Supõe Λ constante</strong><EvidenceTag level="hipotese" /></div>
      <p style={{ margin: '6px 0 0' }}>Esta linha do tempo vale se a energia escura for uma constante cosmológica. Com outra energia escura, o futuro muda: compare os cenários no <Link href="/os-destinos-possiveis" className="inline-link">Módulo 2.2</Link>.</p>
    </div>
    <p>De hoje, com 13,8 bilhões de anos, até 10¹⁰⁰ anos: 90 ordens de grandeza de tempo. Na escala logarítmica, toda a história até hoje cabe no primeiro ponto.</p>
    <FutureTimeline marks={marks} highlight={{ onset: Math.log10(onset), end: Math.log10(onset + life) }} />
    <div className="sub-title">Um buraco negro até o fim</div>
    <p>Um buraco negro só evapora quando o fundo cósmico fica mais frio que ele: antes disso, absorve mais radiação do que emite. Escolha a massa e veja quando a evaporação começa e quanto ela dura (a faixa na linha do tempo).</p>
    <div className="controls">
      <LogSlider label="Massa do buraco negro" value={massSolar} min={1} max={1e11} onChange={setMassSolar} display={`${formatSci(massSolar, 1)} ${massSolar < 1.95 ? 'massa solar' : 'massas solares'}`} testId="input-25-mass" ends={['1 massa solar', '10¹¹ massas solares']} />
    </div>
    <StatGrid>
      <Stat label="Temperatura de Hawking" value={formatTemperature(hawkingTemperatureK(massKg))} note={`hoje o fundo cósmico está a 2,7255 K`} testId="text-25-hawking-t" />
      <Stat label="Começa a evaporar" value={Number.isFinite(onset) ? yearsText(onset) : 'nunca'} note="quando o fundo cósmico fica mais frio que o buraco negro" testId="text-25-onset" />
      <Stat label="Tempo de evaporação" value={`${formatSci(life, 1)} anos`} note={<><Sym>t ≈ 5120π G² M³ / (ħ c⁴)</Sym>; corpo negro, só fótons</>} testId="text-25-lifetime" />
    </StatGrid>
    <p className="plot-note">A fórmula e as temperaturas de Hawking são as do <Link href="/a-temperatura-dos-buracos-negros" className="inline-link">Módulo 5, a temperatura dos buracos negros</Link>. Buracos negros acima de ~{formatSci(largestEvaporatingMassKg() / solarMass, 0)} massas solares seriam mais frios que o próprio horizonte cosmológico e nunca evaporariam; nenhum buraco negro conhecido chega perto disso.</p>
    <ol className="timeline-list cosmic-list future-list" data-testid="text-25-marks">{marks.map((m, i) => <li key={m.id} data-testid={`row-25-${m.id}`}>
      <span className="timeline-year"><span className="future-num">{i + 1}</span> {m.when}</span>
      <div>
        <div className="claim-head"><b>{m.label}</b><EvidenceTag level={m.level} /></div>
        <p className="future-text">{m.text}</p>
        <p className="plot-note" style={{ margin: '4px 0 0' }}>Fonte: {m.source}</p>
      </div>
    </li>)}</ol>
  </SimCard>;
}

// --- Seção 2: o universo nunca chega ao zero absoluto -------------------------------------

const X_RANGE: [number, number] = [10, 12.3];

function NeverZero() {
  const [timeYears, setTimeYears] = useState(1e11);
  const tCmb = temperatureAtTimeK(timeYears * julianYear);
  const crossingYears = CROSSING_S / julianYear;
  const points = useMemo(() => Array.from({ length: 241 }, (_, i) => {
    const lx = X_RANGE[0] + (i / 240) * (X_RANGE[1] - X_RANGE[0]);
    const t = 10 ** lx * julianYear;
    return [lx, Math.log10(temperatureAtTimeK(t))] as [number, number];
  }), []);
  const recordYears = cmbColderThanS(LAB_RECORD.kelvin) / julianYear;
  const becYears = cmbColderThanS(BEC_1995_K) / julianYear;
  return <SimCard title="O universo nunca chega ao zero absoluto">
    <p>A Trilha 1 começou perto do zero absoluto, em laboratório. Ela termina aqui: o universo inteiro também esfria, mas não até zero. Num universo dominado por uma constante cosmológica, o horizonte cosmológico, a distância além da qual nenhum sinal jamais chegará até nós, tem uma temperatura, como o horizonte de um buraco negro. É a temperatura de Gibbons-Hawking:</p>
    <p className="formula-line"><Sym>T<sub>dS</sub> = ħ H<sub>Λ</sub> / (2π k<sub>B</sub>)</Sym>, com <Sym>H<sub>Λ</sub> = H₀ √Ω<sub>Λ</sub></Sym></p>
    <StatGrid>
      <Stat label="Temperatura do horizonte" value={formatTemperature(T_DS)} note={<>Planck 2018: <Sym>H₀ = 67,4</Sym> km/s/Mpc, <Sym>Ω<sub>Λ</sub> = 0,685</Sym></>} testId="text-25-tds" />
      <Stat label="Quando o fundo cósmico chega a ela" value={yearsText(crossingYears)} note="depois disso, a temperatura não cai mais" testId="text-25-crossing" />
      <Stat label="Recorde de laboratório" value={LAB_RECORD.label} note={<>{LAB_RECORD.short}; o fundo cósmico fica mais frio que isso daqui a {yearsText(recordYears - T0_YEARS)}</>} testId="text-25-lab" />
    </StatGrid>
    <LinePlot
      title="Temperatura do fundo cósmico ao longo do tempo e o piso de Gibbons-Hawking"
      xMin={X_RANGE[0]} xMax={X_RANGE[1]} yMin={-45} yMax={1}
      xTicks={[10, 11, 12]} yTicks={[-40, -30, -20, -10, 0]}
      formatX={(x) => decade(x)} formatY={(y) => decade(y)}
      xLabel="anos desde o Big Bang" yLabel="temperatura (K)"
      series={[
        { label: 'fundo cósmico, T ∝ 1/a', color: 'hsl(var(--primary))', points, width: 2.2 },
        { label: 'temperatura do horizonte', color: 'hsl(var(--accent))', points: [[X_RANGE[0], Math.log10(T_DS)], [X_RANGE[1], Math.log10(T_DS)]], dashed: true, width: 1.6 },
        { label: `recorde de laboratório (${LAB_RECORD.label})`, color: 'hsl(var(--muted-foreground))', points: [[X_RANGE[0], Math.log10(LAB_RECORD.kelvin)], [X_RANGE[1], Math.log10(LAB_RECORD.kelvin)]], dashed: true, width: 1.2 },
      ]}
      dots={[
        { x: Math.log10(crossingYears), y: Math.log10(T_DS), label: 'chega ao piso', below: false },
        { x: Math.log10(T0_YEARS), y: Math.log10(2.72548), label: 'hoje' },
        { x: Math.log10(timeYears), y: Math.log10(tCmb), label: 'escolhido', color: 'hsl(var(--accent))', below: true },
      ]}
      height={300}
    />
    <div className="controls">
      <LogSlider label="Instante" value={timeYears} min={T0_YEARS} max={2e12} onChange={setTimeYears} display={yearsText(timeYears)} testId="input-25-time" ends={['hoje', '2 trilhões de anos']} />
    </div>
    <p className="plot-note" data-testid="text-25-at-time">Em {yearsText(timeYears)}, o fundo cósmico estaria a <b>{formatTemperature(tCmb)}</b>{timeYears >= crossingYears ? `, abaixo da temperatura do horizonte (${formatTemperature(T_DS)}): o banho de radiação que domina passa a ser o do próprio horizonte, e a temperatura do universo não cai mais.` : `, ${formatFromLog10(Math.log10(tCmb / T_DS), 1)} vezes a temperatura do horizonte.`}</p>
    <p>O recorde de laboratório, {LAB_RECORD.label}, é cerca de {formatFromLog10(Math.log10(LAB_RECORD.kelvin / T_DS), 0)} vezes mais quente que esse piso. O condensado de Bose-Einstein de 1995 do <Link href="/perto-do-zero-absoluto" className="inline-link">Módulo 1</Link>, a ~170 nK, o fundo cósmico só alcança daqui a {yearsText(becYears - T0_YEARS)}. A Terceira Lei da Termodinâmica diz que nenhum processo chega ao zero absoluto em laboratório; num universo com Λ constante, nem o universo chega.</p>
    <p className="plot-note">Na figura, o fundo cósmico original continua esfriando depois do cruzamento, mas passa a ser mais frio que a radiação emitida pelo próprio horizonte. A partir de ~{yearsText(crossingYears)}, o banho térmico que resta é o do horizonte, a {formatTemperature(T_DS)}: o mais perto do zero absoluto que esse universo pode chegar.</p>
    <div className="claims">
      <Claim level="consenso" title="A temperatura do horizonte">
        <p>A fórmula de Gibbons e Hawking (1977) é física teórica bem estabelecida: a mesma lógica que dá a temperatura de um buraco negro dá a de um horizonte cosmológico. Nunca foi medida, e não há como medir algo a ~10⁻³⁰ K.</p>
      </Claim>
      <Claim level="hipotese" title="O nosso futuro nesse piso">
        <p>Aplicar a fórmula ao nosso futuro depende de a energia escura ser uma constante. Se ela variar, como os dados do DESI sugerem sem confirmação (<Link href="/confronto-com-dados-reais" className="inline-link">Módulo 2.3</Link>), o horizonte e sua temperatura mudam. Teste possível hoje: só indireto, medindo se w = −1.</p>
      </Claim>
    </div>
  </SimCard>;
}

// --- Seção 3: mapa das perguntas em aberto -------------------------------------------------

function QuestionCard({ q }: { q: OpenQuestion }) {
  return <article className="question-card" id={q.id} data-testid={`card-25-${q.id}`}>
    <h3>{q.title}</h3>
    <dl>
      <div className="question-row"><dt>O que foi medido <EvidenceTag level="fato" /></dt><dd>{q.measured}{q.measuredSource && <span className="question-source">{q.measuredSource}</span>}</dd></div>
      <div className="question-row"><dt>Hipóteses</dt><dd><ul className="question-hypotheses">{q.hypotheses.map((h) => <li key={h.name}>
        <div className="claim-head"><b>{h.name}</b><EvidenceTag level={h.level} /></div>
        <p>{h.text}</p>
        {h.test && <p className="question-test"><b>Teste possível hoje: {h.test.possible ? 'sim' : 'não'}.</b> {typeof h.test.text === 'string' ? h.test.text.charAt(0).toUpperCase() + h.test.text.slice(1) : h.test.text}</p>}
      </li>)}</ul></dd></div>
      <div className="question-row"><dt>O que poderia decidir</dt><dd>{q.decide}</dd></div>
      <div className="question-row"><dt>No app</dt><dd>{q.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<Link href={l.href} className="inline-link">{l.label}</Link></span>)}</dd></div>
    </dl>
  </article>;
}

function OpenQuestions() {
  // Links com #pergunta (por exemplo, do Módulo 2.2) abrem a página no cartão.
  useScrollToHash((id) => CARDS.some((q) => q.id === id));
  return <SimCard title="Mapa das perguntas em aberto">
    <p>Sete perguntas que a física ainda não respondeu. Cada cartão separa o que foi medido das hipóteses e diz, para cada hipótese, se existe hoje um teste possível. Nenhuma hipótese aqui é a resposta.</p>
    <nav className="question-index" aria-label="Perguntas">{CARDS.map((q, i) => <a key={q.id} href={`#${q.id}`} className="preset">{i + 1}. {q.short}</a>)}</nav>
    <div className="question-grid">{CARDS.map((q) => <QuestionCard key={q.id} q={q} />)}</div>
  </SimCard>;
}

// --- Seção 4: o que esta trilha mostrou ---------------------------------------------------

function TrackSummary() {
  return <SimCard title="O que esta trilha mostrou">
    <ol className="timeline-list cosmic-list" data-testid="text-25-summary">{TRACK_SUMMARY.map((s) => <li key={s.number}>
      <span className="timeline-year"><Link href={s.href} className="inline-link">{s.number}</Link></span>
      <div><p style={{ margin: 0 }}>{s.text}</p></div>
    </li>)}</ol>
    <p className="closing-line" data-testid="text-25-closing">Uma simulação não descobre o universo, mas elimina universos impossíveis. É assim que a ciência avança na fronteira.</p>
  </SimCard>;
}

export default function Frontier() {
  return <ModulePage
    title="A fronteira"
    description="O que ainda não sabemos sobre a origem e o destino do universo. Para cada pergunta, o que já foi medido, quais hipóteses existem e o que poderia decidir entre elas. Nenhuma hipótese é vendida como resposta."
    number="2.5"
    tag="PERGUNTAS ABERTAS"
    limitations={LIMITATIONS}
    references={REFERENCES}
  >
    <div className="claims">
      <Claim level="fato" title="O que foi medido">
        <p>A expansão acelerada, a idade de 13,8 bilhões de anos, a temperatura de 2,7255 K do fundo cósmico, os efeitos gravitacionais da matéria escura e o excesso de matéria sobre antimatéria são medidas, repetidas por instrumentos diferentes.</p>
      </Claim>
      <Claim level="consenso" title="Falta física">
        <p>O Modelo Padrão da física de partículas não explica a matéria escura nem o excesso de matéria, e a relatividade geral não descreve a era de Planck. Que falta algo é consenso; o que falta, não.</p>
      </Claim>
      <Claim level="hipotese" title="As respostas">
        <p>Todas as explicações específicas deste módulo são hipóteses em pesquisa. Algumas já podem ser testadas; outras, hoje, não. Uma hipótese sem teste possível ainda não é uma resposta científica.</p>
      </Claim>
    </div>
    <FarFuture />
    <NeverZero />
    <OpenQuestions />
    <TrackSummary />
    <p className="plot-note">Antes: <Link href="/inflacao-e-perturbacoes" className="inline-link">Módulo 2.4, inflação e perturbações</Link>. Este é o último módulo da Trilha 2.</p>
  </ModulePage>;
}
