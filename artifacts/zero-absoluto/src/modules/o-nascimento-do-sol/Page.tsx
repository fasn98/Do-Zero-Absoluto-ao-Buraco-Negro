import { useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, EvidenceTag, LogSlider, Presets, SimCard, Stat, StatGrid, Sym, type EvidenceLevel } from '../shared';
import { LinePlot } from '../Plot';
import { goughLuminosityRatio, kelvinHelmholtzTimeS } from '../../physics/stellar';
import { julianYear, solarAge, solarLuminosity, solarMass, solarRadius } from '../../physics/constants';
import { formatNumber, formatSci } from '../../lib/format';

type Phase = { start: number; end: number; title: string; level: EvidenceLevel; text: string };

// Idades aproximadas, em anos desde o início do colapso. As fronteiras variam de estrela para estrela.
const PHASES: Phase[] = [
  { start: 0, end: 1e5, title: 'Colapso de um núcleo denso', level: 'consenso', text: 'Uma região densa e fria (~10 K) de uma nuvem molecular perde o equilíbrio e desaba sob a própria gravidade em algumas centenas de milhares de anos (tempo de queda livre). O gás é cerca de 98% hidrogênio e hélio em massa; a poeira é só 1% a 2%.' },
  { start: 1e5, end: 1e6, title: 'Protoestrela e disco', level: 'consenso', text: 'Por conservação do momento angular, a matéria que cai forma um disco girando em torno de uma protoestrela ainda escondida no envelope de gás. Jatos bipolares retiram momento angular. É no disco que a poeira começa a se juntar.' },
  { start: 1e6, end: 1e7, title: 'Fase T Tauri', level: 'consenso', text: 'O envelope se dissipa e a estrela jovem fica visível. Ela brilha por contração gravitacional, não por fusão: ao encolher, converte energia gravitacional em calor. O gás do disco se dispersa em ~3 a 10 milhões de anos, prazo em que Júpiter e Saturno precisam se formar.' },
  { start: 1e7, end: 5e7, title: 'Ignição da fusão', level: 'consenso', text: 'A contração aquece o núcleo. Quando ele passa de ~10 milhões K, a cadeia próton-próton começa a gerar energia de forma significativa e, aos poucos, substitui a contração como fonte da luminosidade.' },
  { start: 5e7, end: Infinity, title: 'Sequência principal', level: 'consenso', text: 'Por volta de 50 milhões de anos, a fusão de hidrogênio equilibra sozinha a energia irradiada: o Sol chega à sequência principal, com cerca de 70% da luminosidade atual. Ele ficará nela por ~10 bilhões de anos.' },
];

const PRESETS = [
  { label: '10 mil anos', value: 1e4 },
  { label: '500 mil anos', value: 5e5 },
  { label: '3 milhões', value: 3e6 },
  { label: '20 milhões', value: 2e7 },
  { label: '50 milhões', value: 5e7 },
  { label: '100 milhões', value: 1e8 },
];

function formatYears(t: number) {
  if (t < 1e6) return `${formatNumber(t / 1e3, 0)} mil anos`;
  return `${formatNumber(t / 1e6, t < 1e7 ? 1 : 0)} milhões de anos`;
}

/** Cena ilustrativa, desenhada em SVG a partir do tempo. As formas são esquemáticas. */
function Scene({ t }: { t: number }) {
  const logT = Math.log10(Math.max(t, 1e3));
  const collapse = Math.min(1, Math.max(0, (logT - 3) / 2)); // 10³ → 10⁵ anos
  const envelope = 1 - Math.min(1, Math.max(0, (logT - 5.5) / 1)); // some até ~3 milhões
  const disk = Math.min(1, Math.max(0, (logT - 4.5) / 1)) * (1 - Math.min(1, Math.max(0, (logT - 6.6) / 0.6)));
  const starR = 6 + 10 * collapse;
  const jets = logT > 5 && logT < 7;
  const mainSequence = t >= 5e7;
  const cloudR = 120 - 95 * collapse;
  const dots = Array.from({ length: 70 }, (_, i) => {
    const angle = i * 2.399963;
    const r = Math.sqrt((i + 0.5) / 70) * cloudR;
    return [160 + r * Math.cos(angle), 110 + r * Math.sin(angle) * 0.8] as const;
  });
  return <svg viewBox="0 0 320 220" style={{ width: '100%', display: 'block', maxHeight: 260 }} role="img" aria-label="Ilustração esquemática da fase de formação">
    <rect x="0" y="0" width="320" height="220" rx="10" style={{ fill: 'hsl(var(--background))' }} />
    {envelope > 0.02 && <circle cx="160" cy="110" r={cloudR} style={{ fill: 'hsl(var(--chart-5) / .12)', opacity: envelope }} />}
    {envelope > 0.02 && dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.4} style={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.6 * envelope }} />)}
    {disk > 0.02 && <ellipse cx="160" cy="110" rx={20 + 80 * disk} ry={6 + 10 * disk} style={{ fill: 'hsl(var(--accent) / .22)', stroke: 'hsl(var(--accent) / .6)', opacity: disk }} />}
    {jets && <g style={{ stroke: 'hsl(var(--primary))', opacity: 0.7 }} strokeWidth={2} strokeLinecap="round">
      <line x1="160" y1={110 - starR - 4} x2="160" y2="12" strokeDasharray="3 5" />
      <line x1="160" y1={110 + starR + 4} x2="160" y2="208" strokeDasharray="3 5" />
    </g>}
    <circle cx="160" cy="110" r={starR} style={{ fill: mainSequence ? '#e8a25f' : logT > 6 ? '#d9824f' : 'hsl(var(--accent) / .7)' }} />
    {mainSequence && <circle cx="160" cy="110" r={starR + 7} style={{ fill: 'none', stroke: '#e8a25f', opacity: 0.35 }} strokeWidth={5} />}
  </svg>;
}

export default function SunBirth() {
  const [time, setTime] = useState(1e4);
  const active = PHASES.findIndex((p) => time >= p.start && time < p.end);
  const phase = PHASES[active];
  const tKH = kelvinHelmholtzTimeS(solarMass, solarRadius, solarLuminosity) / julianYear;

  const luminosityCurve: [number, number][] = Array.from({ length: 50 }, (_, i) => {
    const t = (i / 49) * solarAge;
    return [t / 1e9, goughLuminosityRatio(t)];
  });

  return <ModulePage
    title="O nascimento do Sol"
    description="Há cerca de 4,6 bilhões de anos, uma região de uma nuvem de gás frio desabou sob a própria gravidade. Em algumas dezenas de milhões de anos ela virou uma estrela que brilha por fusão nuclear. Antes disso, o Sol já brilhava, mas por outro motivo: estava encolhendo."
    number="06"
    tag="ASTROFÍSICA ESTELAR"
    limitations={[
      <>As fronteiras entre as fases são aproximadas e se sobrepõem; a cena é esquemática, sem escala. O módulo não resolve as equações de estrutura estelar, então não traça a luminosidade antes da sequência principal.</>,
      <>Rotação, campos magnéticos, acreção episódica e o ambiente do aglomerado onde o Sol nasceu (provavelmente com estrelas massivas próximas) ficam de fora.</>,
      <>A fórmula de Gough é um ajuste a modelos solares, válida na sequência principal (t = 0 na chegada a ela); não descreve as fases anteriores nem o futuro distante.</>,
      <>A escala de Kelvin-Helmholtz é uma ordem de grandeza: ela supõe luminosidade e raio constantes, o que não é verdade durante a contração.</>,
    ]}
    references={[
      { text: 'D. O. Gough, "Solar interior structure and luminosity variations", Solar Physics 74, 21 (1981).', url: 'https://doi.org/10.1007/BF00151270' },
      { text: 'F. H. Shu, F. C. Adams e S. Lizano, "Star formation in molecular clouds: observation and theory", Annual Review of Astronomy and Astrophysics 25, 23 (1987).', url: 'https://doi.org/10.1146/annurev.aa.25.090187.000323' },
      { text: 'G. Feulner, "The faint young Sun problem", Reviews of Geophysics 50, RG2006 (2012).', url: 'https://doi.org/10.1029/2011RG000375' },
    ]}
  >
    <SimCard title="Os primeiros 100 milhões de anos">
      <div className="controls">
        <LogSlider label="Tempo desde o início do colapso" value={time} min={1e3} max={1e8} onChange={setTime} display={formatYears(time)} testId="input-sun-time" ends={['mil anos', '100 milhões']} />
        <Presets items={PRESETS} onSelect={setTime} isActive={(v) => Math.abs(v / time - 1) < 0.01} />
      </div>
      <div className="timeline-phases" aria-hidden="true">{PHASES.map((p, i) => <span key={p.title} className={i <= active ? 'on' : ''} />)}</div>
      <div className="two-col" style={{ marginTop: 16, alignItems: 'start' }}>
        <Scene t={time} />
        <div>
          <div className="claim-head"><h3 style={{ font: '400 24px var(--app-font-serif)', margin: 0 }} data-testid="text-sun-phase">{phase.title}</h3><EvidenceTag level={phase.level} /></div>
          <p>{phase.text}</p>
          {active === 3 && <p>A física dessa janela está no <Link href="/por-que-o-sol-brilha" className="inline-link">Módulo 3</Link>: experimente 10 milhões K lá.</p>}
        </div>
      </div>
      <p className="plot-note">Escala de tempo logarítmica: cada fase dura cerca de dez vezes mais que a anterior.</p>
    </SimCard>

    <SimCard title="Do que o Sol é feito">
      <div className="composition" role="img" aria-label="Composição em massa: 71% hidrogênio, 27% hélio, 2% elementos mais pesados">
        <div style={{ width: '71%', background: 'hsl(var(--primary))' }}>H 71%</div>
        <div style={{ width: '27%', background: 'hsl(var(--chart-5))' }}>He 27%</div>
        <div style={{ width: '2%', background: 'hsl(var(--accent))' }} />
      </div>
      <p>Composição protossolar em massa (Asplund et al., 2009): ~71% hidrogênio, ~27% hélio e ~1,4% de todos os outros elementos, parte deles em grãos de poeira. Essa poeira, com gelo além da linha de neve, formou os planetas rochosos e os núcleos dos gigantes, não o Sol. O Sol tem mais de 99,8% da massa do Sistema Solar.</p>
    </SimCard>

    <SimCard title="Brilhar sem fusão">
      <p>Encolhendo, uma estrela libera energia gravitacional. Quanto tempo o Sol brilharia só assim? A escala de Kelvin-Helmholtz responde:</p>
      <StatGrid>
        <Stat label={<Sym>t_KH = G M² / (R L)</Sym>} value={`${formatSci(tKH)} anos`} note="com M, R e L atuais" testId="text-kh-time" />
        <Stat label="Idade do Sol" value={`${formatNumber(solarAge / 1e9, 2)} bilhões de anos`} note="datação de meteoritos" />
        <Stat label="Razão" value={`${formatNumber(solarAge / tKH, 0)} ×`} note="a contração não basta" />
      </StatGrid>
      <p>Dezenas de milhões de anos: é a escala da fase pré-sequência principal, e por isso ela dura isso. No século XIX, Kelvin e Helmholtz usaram esse cálculo para estimar a idade do Sol, e a conta não fechava com a geologia e a evolução. A resposta veio com a fusão nuclear.</p>
    </SimCard>

    <SimCard title="O Sol jovem fraco">
      <LinePlot
        title="Luminosidade do Sol na sequência principal, aproximação de Gough"
        xMax={solarAge / 1e9} yMin={0.6} yMax={1.05}
        xTicks={[0, 1, 2, 3, 4]} yTicks={[0.6, 0.7, 0.8, 0.9, 1]}
        formatX={(x) => `${x}`} formatY={(y) => formatNumber(y, 1)}
        xLabel="bilhões de anos desde a chegada à sequência principal" yLabel="L / L☉ atual"
        markers={[{ x: solarAge / 1e9, label: 'hoje' }]}
        series={[{ label: 'L(t) = L☉ / (1 + 0,4 (1 − t/4,57 bi))', color: 'hsl(var(--accent))', points: luminosityCurve, width: 2.5 }]}
        height={240}
      />
      <StatGrid>
        <Stat label="Luminosidade inicial" value={`${formatNumber(goughLuminosityRatio(0) * 100, 0)}% da atual`} testId="text-gough-initial" />
        <Stat label="Luminosidade atual" value={`${formatSci(solarLuminosity)} W`} note="valor nominal IAU" />
        <Stat label="Por que aumenta" value="Núcleo mais denso" note="hélio acumulado aquece o núcleo" />
      </StatGrid>
    </SimCard>

    <div className="claims">
      <Claim level="fato" title="Idade do Sistema Solar">
        <p>Os sólidos mais antigos dos meteoritos, as inclusões ricas em cálcio e alumínio, têm 4,567 bilhões de anos pela datação urânio-chumbo. Essa é a referência de "tempo zero" do Sistema Solar.</p>
      </Claim>
      <Claim level="consenso" title="O Sol era mais fraco">
        <p>Modelos de evolução estelar concordam que o Sol jovem tinha ~70% da luminosidade atual. À medida que o hidrogênio do núcleo vira hélio, o núcleo se contrai e esquenta, e a fusão acelera.</p>
      </Claim>
      <Claim level="hipotese" title="O paradoxo do Sol jovem fraco">
        <p>Com 30% menos luz, a Terra primitiva deveria ter oceanos congelados, mas rochas de mais de 3,8 bilhões de anos mostram água líquida. Mais gases de efeito estufa (CO₂, metano), menos nuvens ou um Sol inicial um pouco mais massivo estão entre as propostas. Nenhuma é consenso: é um problema em aberto.</p>
      </Claim>
    </div>
  </ModulePage>;
}
