import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Presets, Segmented, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot, niceTicks } from '../Plot';
import {
  REACTIONS,
  coulombBarrierJ,
  gamowCurves,
  gamowEnergyJ,
  gamowPeakEnergyJ,
  gamowWidthJ,
  JOULES_PER_EV,
  kTJ,
  lnClassicalProbability,
  lnFusingFraction,
  lnRelativeRate,
  lnTunnelingProbability,
} from '../../physics/gamow';
import { lnToLog10 } from '../../physics/logmath';
import { solarCoreTemperature } from '../../physics/constants';
import { formatFromLog10, formatNumber, formatSig, formatTemperature } from '../../lib/format';

type ReactionId = 'pp' | 'dt';

const PRESETS = [
  { label: '300 K', value: 300 },
  { label: 'Núcleo do Sol', value: solarCoreTemperature },
  { label: 'Estrela massiva', value: 4e7 },
  { label: 'ITER', value: 1.5e8 },
  { label: 'Supernova', value: 1e9 },
];

/** Escolhe eV, keV ou MeV conforme a ordem de grandeza. */
function energyUnit(maxJ: number) {
  const eV = maxJ / JOULES_PER_EV;
  if (eV < 2e3) return { name: 'eV', factor: JOULES_PER_EV };
  if (eV < 2e6) return { name: 'keV', factor: JOULES_PER_EV * 1e3 };
  return { name: 'MeV', factor: JOULES_PER_EV * 1e6 };
}

/** Energia com 3 algarismos significativos, na unidade em que o valor fica abaixo de 1000. */
export function formatEnergy(energyJ: number) {
  const eV = energyJ / JOULES_PER_EV;
  const unit = eV < 999.5 ? { name: 'eV', factor: 1 } : eV < 999.5e3 ? { name: 'keV', factor: 1e3 } : { name: 'MeV', factor: 1e6 };
  return `${formatSig(eV / unit.factor)} ${unit.name}`;
}

export default function Gamow() {
  const [reactionId, setReactionId] = useState<ReactionId>('pp');
  const [temperature, setTemperature] = useState(solarCoreTemperature);
  const reaction = REACTIONS[reactionId];

  const model = useMemo(() => {
    const kT = kTJ(temperature);
    const EG = gamowEnergyJ(reaction);
    const E0 = gamowPeakEnergyJ(EG, kT);
    const delta = gamowWidthJ(E0, kT);
    const barrier = coulombBarrierJ(reaction);
    const maxE = E0 + 3.5 * delta;
    const { curve, lnProductAmplification } = gamowCurves(reaction, temperature, maxE, 260);
    return {
      kT, EG, E0, delta, barrier, maxE, curve, lnProductAmplification,
      log10Classical: lnToLog10(lnClassicalProbability(reaction, temperature)),
      log10TunnelAtPeak: lnToLog10(lnTunnelingProbability(E0, EG)),
      log10Fusing: lnToLog10(lnFusingFraction(reaction, temperature)),
      log10Rate: lnToLog10(lnRelativeRate(reaction, temperature)),
    };
  }, [reaction, temperature]);

  const unit = energyUnit(model.maxE);
  const toUnit = (energyJ: number) => energyJ / unit.factor;
  const xMax = toUnit(model.maxE);
  const amplification = lnToLog10(model.lnProductAmplification);

  return <ModulePage
    title="Por que o Sol brilha"
    description="No núcleo do Sol, quase nenhum próton tem energia para vencer a repulsão elétrica de outro próton. Mesmo assim eles se fundem: a mecânica quântica permite atravessar a barreira por tunelamento. A combinação entre a distribuição de energias e a chance de tunelamento cria uma janela estreita, o pico de Gamow, onde quase todas as fusões acontecem."
    number="03"
    tag="FÍSICA NUCLEAR"
    limitations={[
      <>O fator nuclear <i>S(E)</i> é tratado como constante e igual em todas as temperaturas. Por isso a taxa mostrada é <b>relativa à mesma reação no núcleo do Sol</b>; ela não compara p+p com D+T. Na realidade, <i>S(E)</i> de D+T é mais de 10²⁵ vezes maior que o de p+p, porque p+p depende da força fraca (um próton precisa virar nêutron durante a colisão) e D+T tem uma ressonância nuclear perto de 64 keV.</>,
      <>A barreira usa raio nuclear empírico 1,2 A^(1/3) fm e potencial de Coulomb puro até o contato. Não há blindagem eletrônica do plasma, que aumenta a taxa solar em poucos por cento.</>,
      <>Um único valor de temperatura: o núcleo real tem gradientes de temperatura e densidade, e a taxa total depende da densidade ao quadrado e da composição.</>,
      <>Só o primeiro passo da cadeia próton-próton é mostrado. As etapas seguintes (deutério, hélio-3, hélio-4) e o ciclo CNO, dominante em estrelas mais massivas que ~1,3 massa solar, ficam de fora.</>,
      <>O fator de tunelamento exp(−√(E_G/E)) é a aproximação de Gamow, válida para energias bem abaixo da barreira. Perto de 10¹⁰ K, quando kT se aproxima da barreira, ele deixa de ser preciso e as duas frações da comparação também.</>,
      <>O plasma do ITER usa D+T; o atalho mostra a temperatura, não significa que o ITER faça fusão p+p.</>,
    ]}
    references={[
      { text: 'G. Gamow, "Zur Quantentheorie des Atomkernes", Zeitschrift für Physik 51, 204 (1928).' },
      { text: 'D. D. Clayton, Principles of Stellar Evolution and Nucleosynthesis, cap. 4. University of Chicago Press (1968/1983).' },
      { text: 'E. G. Adelberger et al., "Solar fusion cross sections II", Reviews of Modern Physics 83, 195 (2011).', url: 'https://doi.org/10.1103/RevModPhys.83.195' },
    ]}
  >
    <SimCard title="O forno solar">
      <div className="controls">
        <Segmented label="Reação" value={reactionId} onChange={setReactionId} options={[{ value: 'pp', label: 'p + p' }, { value: 'dt', label: 'D + T' }]} />
        <LogSlider label="Temperatura" value={temperature} min={100} max={1e10} onChange={setTemperature} display={formatTemperature(temperature)} testId="input-gamow-temperature" ends={['100 K', '10 bilhões K']} />
        <Presets items={PRESETS} onSelect={setTemperature} isActive={(value) => Math.abs(value / temperature - 1) < 0.01} />
      </div>

      <LinePlot
        title={`Curvas de Maxwell-Boltzmann, tunelamento e produto para ${reaction.label}`}
        xMax={xMax}
        xTicks={niceTicks(xMax, 5)}
        formatX={(x) => formatNumber(x, 2)}
        xLabel={`energia da colisão (${unit.name})`}
        yLabel="relativo ao máximo"
        band={[toUnit(model.E0 - model.delta / 2), toUnit(model.E0 + model.delta / 2)]}
        markers={[{ x: toUnit(model.E0), label: `E₀ = ${formatEnergy(model.E0)}` }]}
        series={[
          { label: 'Maxwell-Boltzmann, exp(−E/kT)', color: 'hsl(var(--chart-5))', points: model.curve.map((p) => [toUnit(p.energyJ), p.boltzmann]) },
          { label: 'Tunelamento, exp(−√(E_G/E))', color: 'hsl(var(--chart-4))', points: model.curve.map((p) => [toUnit(p.energyJ), p.tunneling]), dashed: true },
          { label: 'Produto (pico de Gamow)', color: 'hsl(var(--accent))', points: model.curve.map((p) => [toUnit(p.energyJ), p.product]), width: 3 },
        ]}
      />
      <p className="plot-note">Escalas: cada curva está dividida pelo seu próprio máximo no intervalo mostrado, para que as três caibam no mesmo gráfico. Por isso o produto aparece com altura 1; na escala das outras duas ele seria {formatFromLog10(amplification, 1)} vezes menor. A faixa sombreada mostra a largura Δ do pico. A barreira de Coulomb, em {formatEnergy(model.barrier)}, fica {formatNumber(model.barrier / model.maxE, 0)} vezes à direita da borda do gráfico.</p>

      <StatGrid>
        <Stat label={<Sym>kT</Sym>} value={formatEnergy(model.kT)} note="energia térmica típica" testId="text-kt" />
        <Stat label={<>Energia de Gamow <Sym>E_G</Sym></>} value={formatEnergy(model.EG)} note="2 m_r c² (π α Z₁Z₂)²" />
        <Stat label={<>Pico de Gamow <Sym>E₀</Sym></>} value={formatEnergy(model.E0)} note={`${formatSig(model.E0 / model.kT)} × kT`} testId="text-e0" />
        <Stat label={<>Largura <Sym>Δ</Sym></>} value={formatEnergy(model.delta)} note="(4/√3) √(E₀ kT)" />
        <Stat label="Barreira de Coulomb" value={formatEnergy(model.barrier)} note="1,44 MeV·fm × Z₁Z₂ / r" />
        <Stat label="Taxa relativa ao núcleo do Sol" value={formatFromLog10(model.log10Rate)} note="mesma reação, S(E) constante" testId="text-relative-rate" />
      </StatGrid>

      <div className="versus">
        <div>
          <span className="versus-label">Previsão clássica</span>
          <strong data-testid="text-classical">{formatFromLog10(model.log10Classical)}</strong>
          <span>exp(−barreira/kT) = (1/kT) ∫ exp(−E/kT) dE acima da barreira: fração de colisões com energia para passar <i>por cima</i> dela.</span>
        </div>
        <div>
          <span className="versus-label">Fração que funde (com tunelamento)</span>
          <strong data-testid="text-quantum">{formatFromLog10(model.log10Fusing)}</strong>
          <span>(1/kT) ∫ exp(−E/kT − √(E_G/E)) dE: fração efetiva das colisões que atravessam a barreira, somando todas as energias. Mesma normalização da previsão clássica; quase tudo vem da janela do pico de Gamow.</span>
          <span className="versus-secondary">Probabilidade de tunelamento para uma colisão com energia E₀: exp(−√(E_G/E₀)) = {formatFromLog10(model.log10TunnelAtPeak)}</span>
        </div>
      </div>
    </SimCard>

    <div className="claims">
      <Claim level="fato" title="Tunelamento através da barreira">
        <p>Uma partícula quântica tem probabilidade não nula de atravessar uma barreira de energia maior que a sua. Gamow usou isso em 1928 para explicar o decaimento alfa; Atkinson e Houtermans aplicaram a mesma ideia às estrelas em 1929. Sem tunelamento, o Sol, com núcleo a ~15,7 milhões K, seria frio demais para fundir hidrogênio.</p>
      </Claim>
      <Claim level="fato" title="Por que p + p é tão lenta">
        <p>Dois prótons que tunelam quase sempre se separam de novo: o dipróton não é ligado. A fusão só vinga se, durante o encontro, um dos prótons se transformar em nêutron pela força fraca (p + p → d + e⁺ + ν). Esse passo é tão improvável que um próton típico do núcleo solar espera da ordem de bilhões de anos para fundir. É por isso que o Sol queima devagar e dura ~10 bilhões de anos.</p>
      </Claim>
      <Claim level="consenso" title="Temperatura do núcleo solar">
        <p>O valor de ~15,7 milhões K vem do Modelo Solar Padrão, confirmado pela heliossismologia e pela medição dos neutrinos solares (Borexino, 2014 e 2020). Experimente o atalho <b>Estrela massiva</b>: com 2,5 vezes a temperatura, a taxa p+p fica cerca de 20 vezes maior. Nessas estrelas domina o ciclo CNO, cuja barreira é maior (carbono e nitrogênio têm Z = 6 e 7) e cuja taxa é ainda mais sensível à temperatura. Por isso estrelas massivas queimam seu combustível em poucos milhões de anos. Para ver como o Sol chegou a essa temperatura, veja <Link href="/o-nascimento-do-sol" className="inline-link">O nascimento do Sol</Link>.</p>
      </Claim>
    </div>
  </ModulePage>;
}
