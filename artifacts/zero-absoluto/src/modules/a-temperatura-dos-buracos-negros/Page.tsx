import { useMemo, useState } from 'react';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Presets, SimCard, Stat, StatGrid } from '../shared';
import { LinePlot } from '../Plot';
import {
  bekensteinHawkingEntropyOverK,
  evaporationTimeS,
  hawkingTemperatureK,
  massForHawkingTemperatureKg,
  schwarzschildRadiusM,
} from '../../physics/blackHole';
import { BLACK_HOLE_MASS_RANGE_KG } from '../temperatureBands';
import { cmbTemperature, julianYear, solarMass, universeAge } from '../../physics/constants';
import { formatDuration, formatFromLog10, formatLength, formatSci, formatTemperature, superscript } from '../../lib/format';

const [M_MIN, M_MAX] = BLACK_HOLE_MASS_RANGE_KG;
const CMB_MASS = massForHawkingTemperatureKg(cmbTemperature);

const PRESETS = [
  { label: '10¹¹ kg', value: 1e11 },
  { label: 'T igual à da radiação de fundo', value: CMB_MASS },
  { label: '1 massa solar', value: solarMass },
  { label: 'Sagitário A*', value: 4.3e6 * solarMass },
  { label: 'M87*', value: 6.5e9 * solarMass },
];

function formatMass(kg: number) {
  const solar = kg / solarMass;
  if (solar >= 0.01) return `${formatSci(solar)} M☉`;
  return `${formatSci(kg)} kg`;
}

const curve: [number, number][] = Array.from({ length: 60 }, (_, i) => {
  const log10M = Math.log10(M_MIN) + (i / 59) * Math.log10(M_MAX / M_MIN);
  return [log10M, Math.log10(hawkingTemperatureK(10 ** log10M))];
});

export default function BlackHole() {
  const [mass, setMass] = useState(solarMass);
  const model = useMemo(() => {
    const T = hawkingTemperatureK(mass);
    const evaporationYears = evaporationTimeS(mass) / julianYear;
    return {
      T,
      rs: schwarzschildRadiusM(mass),
      entropy: bekensteinHawkingEntropyOverK(mass),
      evaporationS: evaporationTimeS(mass),
      evaporationYears,
      colderThanCmb: T < cmbTemperature,
    };
  }, [mass]);

  const log10M = Math.log10(mass);
  const yTicks = [-15, -10, -5, 0, 5, 10];
  const xTicks = [12, 17, 22, 27, 32, 37];

  return <ModulePage
    title="A temperatura dos buracos negros"
    description="Em 1974, Stephen Hawking combinou relatividade geral e mecânica quântica e chegou a uma conclusão inesperada: buracos negros não são completamente negros. Eles emitem radiação térmica, têm temperatura e entropia, e lentamente evaporam. Quanto maior o buraco negro, mais frio ele é."
    number="05"
    tag="ASTROFÍSICA"
    limitations={[
      <>Buraco negro de Schwarzschild: sem rotação e sem carga. Buracos negros astrofísicos giram, o que altera temperatura e entropia.</>,
      <>O tempo de evaporação usa a fórmula só com fótons. Incluir neutrinos, grávitons e, para buracos pequenos e quentes, outras partículas, encurta o tempo; buracos de ~5 × 10¹¹ kg formados no Big Bang estariam terminando de evaporar hoje (Page, 1976).</>,
      <>Não considera a radiação cósmica de fundo absorvida pelo buraco negro, nem a matéria que ele engole. Todo buraco negro astrofísico conhecido está hoje ganhando massa, não perdendo.</>,
      <>Os cálculos são semiclássicos: matéria quântica num espaço-tempo clássico. Perto do fim da evaporação, quando o buraco se aproxima da massa de Planck (~22 μg), é preciso uma teoria de gravidade quântica que ainda não existe.</>,
      <>Buracos negros com menos de algumas massas solares não se formam pelo colapso de estrelas; os de massa pequena seriam primordiais, uma hipótese sem confirmação observacional.</>,
    ]}
    references={[
      { text: 'S. W. Hawking, "Black hole explosions?", Nature 248, 30 (1974); e "Particle creation by black holes", Communications in Mathematical Physics 43, 199 (1975).', url: 'https://doi.org/10.1038/248030a0' },
      { text: 'J. D. Bekenstein, "Black Holes and Entropy", Physical Review D 7, 2333 (1973).', url: 'https://doi.org/10.1103/PhysRevD.7.2333' },
      { text: 'D. N. Page, "Particle emission rates from a black hole", Physical Review D 13, 198 (1976).', url: 'https://doi.org/10.1103/PhysRevD.13.198' },
    ]}
  >
    <SimCard title="Escolha a massa">
      <div className="controls">
        <LogSlider label="Massa" value={mass} min={M_MIN} max={M_MAX} onChange={setMass} display={formatMass(mass)} testId="input-bh-mass" ends={['10¹¹ kg', '10¹⁰ M☉']} />
        <Presets items={PRESETS} onSelect={setMass} isActive={(v) => Math.abs(v / mass - 1) < 0.01} />
      </div>
      <LinePlot
        title="Temperatura de Hawking em função da massa"
        xMin={Math.log10(M_MIN)} xMax={Math.log10(M_MAX)} yMin={-18} yMax={13}
        xTicks={xTicks} yTicks={yTicks}
        formatX={(x) => `10${superscript(x)}`} formatY={(y) => `10${superscript(y)}`}
        xLabel="massa (kg)" yLabel="temperatura (K)"
        markers={[{ x: log10M, label: formatTemperature(model.T) }, { x: Math.log10(CMB_MASS), label: 'T = 2,7 K', color: 'hsl(var(--chart-5))' }]}
        series={[{ label: 'T = ħc³ / (8πGMk)', color: 'hsl(var(--primary))', points: curve, width: 2.5 }]}
        height={260}
      />
      <StatGrid>
        <Stat label="Temperatura de Hawking" value={formatTemperature(model.T)} note="ħc³ / (8πGMk)" testId="text-hawking-temperature" />
        <Stat label="Raio do horizonte" value={formatLength(model.rs)} note="r_s = 2GM/c²" />
        <Stat label="Entropia S/k" value={formatSci(model.entropy)} note="kc³A / (4Għ)" testId="text-bh-entropy" />
        <Stat label="Tempo de evaporação" value={formatDuration(model.evaporationS, julianYear)} note="5120πG²M³ / (ħc⁴)" testId="text-evaporation" />
        <Stat label="Comparado à idade do Universo" value={`${formatFromLog10(Math.log10(model.evaporationYears / universeAge))} ×`} note="13,8 bilhões de anos" />
        <Stat label="Hoje" value={model.colderThanCmb ? 'Absorve mais' : 'Emite mais'} note={model.colderThanCmb ? 'mais frio que o fundo cósmico de 2,7 K' : 'mais quente que o fundo cósmico de 2,7 K'} />
      </StatGrid>
    </SimCard>

    <SimCard title="A fórmula que junta tudo">
      <p style={{ fontFamily: 'var(--app-font-serif)', fontSize: 30, color: 'hsl(var(--foreground))', margin: '4px 0 12px', textAlign: 'center' }}>S = k c³ A / (4 G ħ)</p>
      <p>A entropia de um buraco negro é proporcional à <b>área</b> do horizonte, não ao volume, como acontece com qualquer gás ou sólido. Para 1 massa solar ela vale ~10⁷⁷ k, cerca de 10²⁰ vezes a entropia do próprio Sol. É a única fórmula da física conhecida em que aparecem juntas a constante gravitacional G (relatividade), a constante de Planck ħ (mecânica quântica), a velocidade da luz c e a constante de Boltzmann k (termodinâmica). Ela é uma pista concreta de como gravidade e quântica devem se encaixar.</p>
    </SimCard>

    <div className="claims">
      <Claim level="consenso" title="Buracos negros têm temperatura">
        <p>A radiação Hawking resulta de teoria quântica de campos num espaço-tempo curvo, com hipóteses bem testadas separadamente, e foi rederivada de várias formas independentes. Ela nunca foi observada num buraco negro real: a temperatura de um buraco negro de massa estelar é dezenas de milhões de vezes menor que a do fundo cósmico (2,725 K contra 61,7 nK para 1 massa solar), e muito menor ainda para os supermassivos. Experimentos com sistemas análogos, como ondas sonoras num condensado de Bose-Einstein (Steinhauer, 2016 e 2019), observaram o efeito correspondente.</p>
      </Claim>
      <Claim level="fato" title="Quanto maior, mais frio">
        <p>A temperatura é inversamente proporcional à massa. Um buraco negro com a temperatura do fundo cósmico teria {formatSci(CMB_MASS)} kg, menos que a massa da Lua, e um horizonte de ~0,1 mm. Ao evaporar, ele esquenta e acelera: a perda de massa é descontrolada no final.</p>
      </Claim>
      <Claim level="hipotese" title="O princípio holográfico">
        <p>Se a entropia máxima de uma região é proporcional à área da sua fronteira, talvez toda a informação de um volume possa ser descrita numa superfície, como um holograma ('t Hooft, 1993; Susskind, 1995). A correspondência AdS/CFT (Maldacena, 1997) é uma realização matemática precisa dessa ideia, mas num universo com geometria diferente do nosso. Se o princípio vale para o nosso universo, e como ele resolve o paradoxo da informação dos buracos negros, são questões em aberto.</p>
      </Claim>
    </div>
  </ModulePage>;
}
