import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Presets, SimCard, Stat, StatGrid, Sym } from '../shared';
import { LinePlot } from '../Plot';
import {
  EOT_WASH_MIN_SEPARATION_M,
  EOT_WASH_YUKAWA_RANGE_M,
  casimirPressurePa,
  cutoffForEnergyDensityGeV,
  cutoffWavelengthM,
  darkEnergyDensityKgM3,
  darkEnergyEnergyDensityJM3,
  planckEnergyDensityJM3,
  vacuumEnergyDensityJM3,
} from '../../physics/vacuumEnergy';
import { planckEnergyGeV } from '../../physics/unification';
import { elementaryCharge, protonMass, standardAtmosphere, standardGravity } from '../../physics/constants';
import { formatLength, formatNumber, formatSci, formatSig, superscript } from '../../lib/format';

const E_PLANCK = planckEnergyGeV();
const U_LAMBDA = darkEnergyEnergyDensityJM3();
const MATCH_CUTOFF = cutoffForEnergyDensityGeV(U_LAMBDA);
const CUTOFF_PRESETS = [
  { label: 'QCD', value: 0.2 },
  { label: 'Eletrofraca', value: 246 },
  { label: 'LHC', value: 1.4e4 },
  { label: 'Grande unificação', value: 2e16 },
  { label: 'Planck', value: E_PLANCK },
];

function formatEnergyGeV(gev: number) {
  if (gev < 1e-6) return `${formatSig(gev * 1e12)} meV`;
  if (gev < 1e-3) return `${formatSig(gev * 1e9)} eV`;
  if (gev < 1) return `${formatSig(gev * 1e3)} MeV`;
  if (gev < 1e3) return `${formatSig(gev)} GeV`;
  if (gev < 1e6) return `${formatSig(gev / 1e3)} TeV`;
  return `${formatSci(gev)} GeV`;
}

const LOG_E: [number, number] = [-12, Math.log10(E_PLANCK)];
const CURVE: [number, number][] = Array.from({ length: 2 }, (_, i) => {
  const log10E = LOG_E[0] + i * (LOG_E[1] - LOG_E[0]);
  return [log10E, Math.log10(vacuumEnergyDensityJM3(10 ** log10E))];
});

function VacuumEnergy() {
  const [cutoff, setCutoff] = useState(E_PLANCK);
  const model = useMemo(() => {
    const uVac = vacuumEnergyDensityJM3(cutoff);
    return { uVac, ratio: Math.log10(uVac / U_LAMBDA) };
  }, [cutoff]);
  const planckRatio = Math.log10(planckEnergyDensityJM3() / U_LAMBDA);
  return <SimCard title="Quanto pesa o vácuo?">
    <p>Na teoria quântica de campos, cada modo de vibração de um campo tem uma energia mínima, ½ħω, mesmo no vácuo (a energia de ponto zero do <Link href="/perto-do-zero-absoluto" className="inline-link">Módulo 1</Link>). Somando todos os modos até uma energia de corte, obtém-se uma densidade de energia do vácuo. A gravidade sente essa energia. A expansão acelerada do universo mede quanto ela vale de fato.</p>
    <div className="controls">
      <LogSlider label="Energia de corte" value={cutoff} min={1e-12} max={E_PLANCK} onChange={setCutoff} display={formatEnergyGeV(cutoff)} testId="input-vacuum-cutoff" ends={['1 meV', 'Planck']} />
      <Presets items={CUTOFF_PRESETS} onSelect={setCutoff} isActive={(v) => Math.abs(v / cutoff - 1) < 0.01} />
    </div>
    <LinePlot
      title="Densidade de energia do vácuo prevista em função da energia de corte, comparada com a observada"
      xMin={LOG_E[0]} xMax={LOG_E[1]} yMin={-20} yMax={120}
      xTicks={[-12, -6, 0, 6, 12, 18]} yTicks={[0, 40, 80, 120]}
      formatX={(x) => `10${superscript(x)}`} formatY={(y) => `10${superscript(y)}`}
      xLabel="energia de corte (GeV)" yLabel="J/m³"
      markers={[
        { x: Math.log10(MATCH_CUTOFF), label: `${formatEnergyGeV(MATCH_CUTOFF)}`, color: 'hsl(var(--chart-5))' },
        { x: Math.log10(cutoff), label: formatEnergyGeV(cutoff) },
      ]}
      series={[
        { label: 'Previsto, ħc k_máx⁴ / (16π²)', color: 'hsl(var(--accent))', points: CURVE, width: 2.5 },
        { label: `Observado, u_Λ ≈ ${formatSci(U_LAMBDA)} J/m³`, color: 'hsl(var(--chart-5))', points: [[LOG_E[0], Math.log10(U_LAMBDA)], [LOG_E[1], Math.log10(U_LAMBDA)]], dashed: true, width: 2 },
      ]}
      height={260}
    />
    <StatGrid>
      <Stat label={<>Previsto <Sym>u_vac</Sym></>} value={`${formatSci(model.uVac)} J/m³`} note="um único campo, corte abrupto" testId="text-u-vac" />
      <Stat label={<>Observado <Sym>u_Λ</Sym></>} value={`${formatSci(U_LAMBDA)} J/m³`} note={`ρ_Λ = ${formatSci(darkEnergyDensityKgM3())} kg/m³: ~${formatNumber(darkEnergyDensityKgM3() / protonMass, 1)} prótons, ou ~${formatNumber(U_LAMBDA / elementaryCharge / 1e9, 1)} GeV, por m³`} />
      <Stat label="Previsto ÷ observado" value={`~10${superscript(Math.round(model.ratio))}`} note={`${formatNumber(model.ratio, 1)} ordens de grandeza`} testId="text-vacuum-ratio" />
      <Stat label="Corte que bateria com a observação" value={formatEnergyGeV(MATCH_CUTOFF)} note={`comprimento de onda ≈ ${formatLength(cutoffWavelengthM(MATCH_CUTOFF))}`} />
      <Stat label={<>Com a densidade de Planck <Sym>c⁷/(ħG²)</Sym></>} value={`${formatNumber(planckRatio, 1)} ordens`} note="outra forma de fazer a mesma conta" />
    </StatGrid>
    <p className="plot-note">O famoso "10¹²⁰" depende de como se faz a conta: com o corte em E_Planck e o fator 1/(16π²) dá ~10¹²¹; com a densidade de Planck, c⁷/(ħG²), dá ~10¹²³. A ordem de grandeza é a mesma, e o problema não depende do detalhe. Observado: H₀ = 67,4 km/s/Mpc e Ω_Λ = 0,685 (Planck 2018).</p>
    <p>A supersimetria ajudaria: as contribuições de bósons e de férmions têm sinais opostos e se cancelariam. Mas, se ela existir, está quebrada acima das energias que o LHC alcançou (<Link href="/as-forcas-convergem" className="inline-link">Módulo 9</Link>), e o desacordo cairia só para cerca de 10⁶⁰, como mostra o atalho "LHC".</p>
    <p>O corte que bateria com a observação corresponde a um comprimento de onda de ~{formatLength(cutoffWavelengthM(MATCH_CUTOFF))}. A gravidade já foi medida em laboratório até separações de {formatNumber(EOT_WASH_MIN_SEPARATION_M * 1e6, 1)} µm, sem desvio da lei de Newton: o experimento Eöt-Wash (Lee et al., 2020) exclui interações de intensidade gravitacional com alcance acima de {formatNumber(EOT_WASH_YUKAWA_RANGE_M * 1e6, 1)} µm.</p>
  </SimCard>;
}

const SEPARATION_PRESETS = [
  { label: '10 nm', value: 10e-9 },
  { label: '100 nm', value: 100e-9 },
  { label: '1 µm', value: 1e-6 },
  { label: '10 µm', value: 10e-6 },
];

function Casimir() {
  const [separation, setSeparation] = useState(1e-6);
  const [areaM2, setAreaM2] = useState(1e-4);
  const pressure = casimirPressurePa(separation);
  const force = pressure * areaM2;
  const massEquivalentKg = force / standardGravity;
  const formatMass = (kg: number) => {
    const units: [number, string][] = [[1, 'kg'], [1e-3, 'g'], [1e-6, 'mg'], [1e-9, 'µg'], [1e-12, 'ng']];
    const unit = units.find(([f]) => kg >= f * 0.9995);
    return unit ? `${formatSig(kg / unit[0])} ${unit[1]}` : `${formatSci(kg)} kg`;
  };
  return <SimCard title="O vácuo tem energia? O efeito Casimir">
    <p>Duas placas metálicas paralelas, neutras e no vácuo, se atraem. Entre elas só cabem certos modos do campo eletromagnético, e o resultado é uma força líquida que puxa as placas uma para a outra.</p>
    <div className="controls">
      <LogSlider label="Separação d" value={separation} min={1e-8} max={1e-5} onChange={setSeparation} display={formatLength(separation)} testId="input-casimir-d" ends={['10 nm', '10 µm']} />
      <Presets items={SEPARATION_PRESETS} onSelect={setSeparation} isActive={(v) => Math.abs(v / separation - 1) < 0.01} />
      <LogSlider label="Área das placas" value={areaM2} min={1e-6} max={1e-2} onChange={setAreaM2} display={`${formatSig(areaM2 * 1e4)} cm²`} testId="input-casimir-area" ends={['1 mm²', '100 cm²']} />
    </div>
    <StatGrid>
      <Stat label={<>Pressão <Sym>P = π²ħc/(240 d⁴)</Sym></>} value={`${formatSci(pressure)} Pa`} note={`${formatSci(pressure / standardAtmosphere)} atmosfera`} testId="text-casimir-pressure" />
      <Stat label="Força" value={`${formatSci(force)} N`} note={`em ${formatSig(areaM2 * 1e4)} cm²`} testId="text-casimir-force" />
      <Stat label="Equivale ao peso de" value={formatMass(massEquivalentKg)} note="massa cujo peso é igual à força" />
    </StatGrid>
    <p className="plot-note">Placas ideais, perfeitamente condutoras, a temperatura zero. A força cai com a quarta potência da distância: dividir d por 10 multiplica a pressão por 10.000.</p>
    <p>Medições: Lamoreaux (1997), com uma esfera e uma placa e um pêndulo de torção, encontrou concordância com a teoria em torno de 5%; Mohideen e Roy (1998), com um microscópio de força atômica, chegaram a ~1% na menor separação; Bressi e colegas (2002) mediram entre placas paralelas, de 0,5 a 3,0 µm, com precisão de 15%.</p>
    <p>O efeito Casimir costuma ser apresentado como prova de que o vácuo tem energia. Mas ele também pode ser calculado como uma força de van der Waals entre os átomos das placas, sem falar em energia do vácuo (Jaffe, 2005). Além disso, ele mede diferenças de energia entre configurações, e não o valor absoluto que a gravidade sentiria. Por isso ele não resolve o problema da seção anterior.</p>
  </SimCard>;
}

export default function WorstPrediction() {
  return <ModulePage
    title="A pior previsão da física"
    description="A mecânica quântica diz que o vácuo não é vazio: ele tem uma energia mínima. A gravidade deveria sentir essa energia. A observação do universo mede quanto ela vale, e a estimativa teórica mais simples erra por mais de cem ordens de grandeza. É o maior desacordo conhecido entre as duas teorias."
    number="11"
    tag="ENERGIA DO VÁCUO"
    limitations={[
      <>A estimativa da energia do vácuo usa um único campo e um corte abrupto. Uma teoria realista soma todos os campos, com sinais diferentes para bósons e férmions, e um corte abrupto quebra a simetria de Lorentz.</>,
      <>A pressão de Casimir é a de placas ideais, perfeitamente condutoras, a temperatura zero; materiais reais, rugosidade e temperatura mudam o resultado em alguns por cento ou mais.</>,
      <>Ω_Λ e H₀ são os do Planck 2018. Com o H₀ local (<Link href="/ouvindo-o-universo" className="inline-link">Módulo 8</Link>), ρ_Λ aumenta cerca de 17% (com Ω_Λ fixo), mas a razão continua com mais de 100 ordens de grandeza no corte de Planck.</>,
      <>A comparação com a força de Casimir usa a massa equivalente ao peso, com a gravidade padrão.</>,
    ]}
    references={[
      { text: 'S. Weinberg, "The cosmological constant problem", Reviews of Modern Physics 61, 1 (1989).', url: 'https://doi.org/10.1103/RevModPhys.61.1' },
      { text: 'N. Aghanim et al. (Planck), "Planck 2018 results. VI. Cosmological parameters", Astronomy & Astrophysics 641, A6 (2020).', url: 'https://doi.org/10.1051/0004-6361/201833910' },
      { text: 'H. B. G. Casimir, "On the attraction between two perfectly conducting plates", Proceedings of the Koninklijke Nederlandse Akademie van Wetenschappen 51, 793 (1948).' },
      { text: 'S. K. Lamoreaux, "Demonstration of the Casimir Force in the 0.6 to 6 μm Range", Physical Review Letters 78, 5 (1997).', url: 'https://doi.org/10.1103/PhysRevLett.78.5' },
      { text: 'U. Mohideen e A. Roy, Physical Review Letters 81, 4549 (1998); G. Bressi et al., Physical Review Letters 88, 041804 (2002).', url: 'https://doi.org/10.1103/PhysRevLett.88.041804' },
      { text: 'R. L. Jaffe, "Casimir effect and the quantum vacuum", Physical Review D 72, 021301 (2005).', url: 'https://doi.org/10.1103/PhysRevD.72.021301' },
      { text: 'DESI Collaboration, "DESI DR2 Results II: Measurements of Baryon Acoustic Oscillations and Cosmological Constraints", Physical Review D 112, 083515 (2025).', url: 'https://doi.org/10.1103/tr6y-kpc6' },
      { text: 'J. G. Lee et al., "New Test of the Gravitational 1/r² Law at Separations down to 52 μm", Physical Review Letters 124, 101101 (2020).', url: 'https://doi.org/10.1103/PhysRevLett.124.101101' },
    ]}
  >
    <VacuumEnergy />
    <div className="claims">
      <Claim level="fato" title="O universo está acelerando">
        <p>Em 1998, duas equipes, medindo supernovas distantes, descobriram que a expansão do universo está acelerando. Perlmutter, Schmidt e Riess receberam o Nobel de 2011. O fundo cósmico de micro-ondas e a distribuição das galáxias confirmam: cerca de 68% da energia do universo está numa forma que se comporta como uma constante cosmológica.</p>
      </Claim>
      <Claim level="consenso" title="A estimativa ingênua erra por mais de cem ordens de grandeza">
        <p>Somar as energias de ponto zero dá um valor absurdamente maior que o observado. É o problema da constante cosmológica, descrito por Weinberg em 1989 e ainda sem solução aceita.</p>
      </Claim>
      <Claim level="hipotese" title="Soluções propostas">
        <p>Cancelamentos que ainda não entendemos, novas simetrias, o princípio antrópico num multiverso, modificações da gravidade: todas são hipóteses. Também é hipótese ler o comprimento de ~0,16 mm como sinal de física nova em escalas pequenas; até agora, os testes da gravidade nessa escala só confirmaram Newton.</p>
      </Claim>
      <Claim level="fato" title="A gravidade em escalas de dezenas de micrômetros">
        <p>O pêndulo de torção do grupo Eöt-Wash (Universidade de Washington) mediu a gravidade entre corpos separados por até 52 µm e encontrou exatamente a lei de Newton.</p>
      </Claim>
    </div>

    <Casimir />
    <div className="claims">
      <Claim level="fato" title="A força de Casimir existe">
        <p>Prevista por Casimir em 1948 e medida com precisão crescente desde 1997, ela é importante na engenharia de dispositivos micromecânicos, em que superfícies ficam a menos de um micrômetro uma da outra.</p>
      </Claim>
      <Claim level="hipotese" title="O efeito Casimir prova a energia do vácuo?">
        <p>Há um debate de interpretação. O mesmo resultado sai de um cálculo com as flutuações do vácuo ou de um cálculo com as forças entre os átomos das placas, e nenhum dos dois dá o valor absoluto da energia do vácuo que entraria na gravidade.</p>
      </Claim>
    </div>

    <SimCard title="E se a energia escura não for constante?">
      <p>O DESI (Dark Energy Spectroscopic Instrument) mapeou mais de 14 milhões de galáxias e quasares. Combinados com o fundo cósmico de micro-ondas, os seus dados de 2025 preferem uma energia escura que muda com o tempo, enfraquecendo nos últimos bilhões de anos, em vez de uma constante cosmológica: a preferência é de 3,1σ; somando supernovas, fica entre 2,8σ e 4,2σ, conforme a amostra usada.</p>
      <p>Na física de partículas e na cosmologia, 5σ é o padrão para declarar uma descoberta, e nenhuma combinação chegou lá. Os próximos dados do DESI e do telescópio espacial Euclid devem decidir. Se a energia escura variar, ela não pode ser uma constante cosmológica pura, e a pergunta muda de "por que o vácuo pesa tão pouco" para "que campo é esse". Uma das motivações teóricas para esperar isso vem do programa "swampland" da teoria das cordas, que sugere que uma constante cosmológica estável e positiva seria difícil de obter nessa teoria.</p>
    </SimCard>
    <div className="claims">
      <Claim level="hipotese" title="Energia escura dinâmica">
        <p>É uma indicação, não uma descoberta. Os próprios autores ressaltam que ela pode vir de um erro sistemático ainda desconhecido em algum dos conjuntos de dados.</p>
      </Claim>
    </div>

    <SimCard title="O fim da trilha">
      <p>Os últimos cinco módulos reuniram as pistas mais concretas que a física tem sobre como unir a mecânica quântica e a gravidade: a entropia proporcional à área dos buracos negros (<Link href="/a-gravidade-guarda-informacao" className="inline-link">Módulo 7</Link>), a gravidade em regime forte ouvida pelas ondas gravitacionais (<Link href="/ouvindo-o-universo" className="inline-link">Módulo 8</Link>), as forças que quase convergem em altas energias (<Link href="/as-forcas-convergem" className="inline-link">Módulo 9</Link>), a fronteira entre o quântico e o clássico (<Link href="/quantico-para-classico" className="inline-link">Módulo 10</Link>) e a energia do vácuo, que a gravidade deveria sentir e que erra por mais de cem ordens de grandeza. Cada uma restringe as teorias possíveis. Nenhuma delas é ainda a resposta.</p>
    </SimCard>
  </ModulePage>;
}
