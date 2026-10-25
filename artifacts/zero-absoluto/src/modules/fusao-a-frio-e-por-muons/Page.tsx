import { useRef, useState } from 'react';
import { Link } from 'wouter';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Segmented, SimCard, Stat, StatGrid, cssColor, useCanvasLoop } from '../shared';
import {
  REACTIONS,
  gamowEnergyJ,
  gamowPeakEnergyJ,
  jToMeV,
  kTJ,
  lnRelativeRate,
  lnTunnelingProbability,
  reducedMassKg,
} from '../../physics/gamow';
import {
  MAX_FUSIONS_BY_STICKING,
  MUON_COST_ESTIMATE_J,
  MUON_ELECTRON_MASS_RATIO,
  RECORD_FUSIONS_PER_MUON,
  STICKING_FRACTION_RANGE,
  bohrRadiusM,
  breakEvenFusions,
  energyPerMuonJ,
  fusionsBeforeSticking,
  isBeyondStickingLimit,
  muonicSizeRatio,
} from '../../physics/muonCatalysis';
import { lnToLog10 } from '../../physics/logmath';
import { deuteronMass, electronMass, muonLifetime, muonMass, solarCoreTemperature } from '../../physics/constants';
import { formatFromLog10, formatLength, formatNumber, formatSig, formatTemperature } from '../../lib/format';

const dd = REACTIONS.dd;
const EG_DD = gamowEnergyJ(dd);
const COMPARISON = [
  { label: 'Temperatura ambiente', T: 300 },
  { label: 'Núcleo do Sol', T: solarCoreTemperature },
  { label: 'Plasma do ITER', T: 1.5e8 },
];

function RoomTemperature() {
  return <SimCard title="Por que não em temperatura ambiente">
    <p>A mesma física do <Link href="/por-que-o-sol-brilha" className="inline-link">Módulo 3</Link>, aplicada à fusão D+D, que seria a reação em paládio carregado com deutério.</p>
    <table className="data-table">
      <thead><tr><th scope="col">Ambiente</th><th scope="col">Tunelamento no pico</th><th scope="col">Taxa relativa ao Sol</th></tr></thead>
      <tbody>{COMPARISON.map((row) => {
        const log10P = lnToLog10(lnTunnelingProbability(gamowPeakEnergyJ(EG_DD, kTJ(row.T)), EG_DD));
        const log10R = lnToLog10(lnRelativeRate(dd, row.T));
        return <tr key={row.label}>
          <th scope="row">{row.label}<small>{formatTemperature(row.T)}</small></th>
          <td data-testid={`text-dd-tunnel-${row.T}`}>{formatFromLog10(log10P)}</td>
          <td>{formatFromLog10(log10R)}</td>
        </tr>;
      })}</tbody>
    </table>
    <p className="plot-note">Taxa relativa à fusão D+D na temperatura do núcleo do Sol, com fator nuclear S(E) constante.</p>
    <p>A 300 K, mesmo os núcleos mais rápidos chegam com energia de poucos elétron-volts, contra uma barreira de centenas de milhares. Mesmo ligados numa molécula D₂, a 74 pm de distância, a taxa calculada de fusão espontânea é da ordem de 10⁻⁶⁴ por segundo (Koonin e Nauenberg, 1989).</p>
  </SimCard>;
}

const SIZE_RATIO = muonicSizeRatio(deuteronMass);
const BOHR_E = bohrRadiusM(reducedMassKg(electronMass, deuteronMass));
const BOHR_MU = bohrRadiusM(reducedMassKg(muonMass, deuteronMass));

/** Escolhe o maior tamanho de fonte (até `size`) em que o texto cabe em `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, style: string) {
  for (let px = size; px >= 8; px -= 0.5) {
    ctx.font = style.replace('{px}', String(px));
    if (ctx.measureText(text).width <= maxWidth) return;
  }
}

function Molecules() {
  const [scale, setScale] = useState<'zoom' | 'real'>('zoom');
  const phase = useRef(0);
  const canvasRef = useCanvasLoop((ctx, width, height, dt) => {
    phase.current += dt;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    const panelW = width / 2;
    const drawMolecule = (cx: number, cy: number, separation: number, label: string, sub: string, orbiter: string) => {
      const a = separation / 2;
      // Nuvem do elétron/múon envolvendo os dois núcleos.
      if (separation > 1) {
        ctx.fillStyle = cssColor(canvas, orbiter, 0.12);
        ctx.beginPath(); ctx.ellipse(cx, cy, a * 1.9, a * 1.25, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = cssColor(canvas, '--foreground', 0.9);
      for (const sign of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sign * a, cy, separation > 1 ? 5 : 1, 0, Math.PI * 2); ctx.fill(); }
      // Trajetória em oito ao redor dos núcleos, apenas ilustrativa.
      const s = phase.current * 2.2;
      const ox = cx + a * 1.6 * Math.sin(s);
      const oy = cy + a * 0.9 * Math.sin(2 * s) / 1.4;
      if (separation > 1) { ctx.fillStyle = cssColor(canvas, orbiter, 0.95); ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, Math.PI * 2); ctx.fill(); }
      const maxText = panelW - 16;
      ctx.fillStyle = cssColor(canvas, '--foreground', 0.9);
      ctx.textAlign = 'center';
      fitFont(ctx, label, maxText, 12, '500 {px}px "Noto Sans", "DM Sans", sans-serif');
      ctx.fillText(label, cx, height - 30);
      ctx.fillStyle = cssColor(canvas, '--muted-foreground', 1);
      fitFont(ctx, sub, maxText, 11, '{px}px "Noto Sans Mono", "DM Mono", monospace');
      ctx.fillText(sub, cx, height - 14);
    };
    const base = Math.min(panelW * 0.32, 90);
    // Em telas estreitas, rótulos curtos; fitFont garante que cabem no painel.
    const narrow = panelW < 260;
    drawMolecule(panelW / 2, height * 0.42, base, narrow ? 'Íon D₂⁺ (elétron)' : 'Íon molecular D₂⁺ (2 núcleos, 1 elétron)', `núcleos a ~${formatLength(2 * BOHR_E)}`, '--chart-5');
    const muSep = scale === 'zoom' ? base : base / SIZE_RATIO;
    drawMolecule(panelW * 1.5, height * 0.42, muSep, scale === 'zoom' ? `${narrow ? 'dtμ' : 'Molécula múonica dtμ'}, ampliada ${formatNumber(SIZE_RATIO, 0)}×` : `${narrow ? 'dtμ' : 'Molécula múonica dtμ'}, escala real`, `núcleos a ~${formatLength(2 * BOHR_MU)}`, '--accent');
    if (scale === 'real') {
      ctx.strokeStyle = cssColor(canvas, '--accent', 0.8);
      ctx.beginPath(); ctx.arc(panelW * 1.5, height * 0.42, 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = cssColor(canvas, '--border', 1);
    ctx.beginPath(); ctx.moveTo(panelW, 16); ctx.lineTo(panelW, height - 50); ctx.stroke();
  });

  return <SimCard title="Fusão catalisada por múons: um mecanismo real">
    <p>O múon é um primo pesado do elétron: mesma carga, {formatNumber(MUON_ELECTRON_MASS_RATIO, 0)} vezes a massa. Se ele toma o lugar do elétron num sistema de dois núcleos, deutério e trítio, forma a molécula múonica dtμ, que é menor na mesma proporção, porque o raio de Bohr é inversamente proporcional à massa. Com os núcleos tão próximos, o tunelamento fica rápido e a fusão acontece em cerca de um trilionésimo de segundo, mesmo num alvo de hidrogênio frio.</p>
    <div style={{ margin: '12px 0' }}><Segmented label="Escala" value={scale} onChange={setScale} options={[{ value: 'zoom', label: 'Ampliar a molécula múonica' }, { value: 'real', label: 'Mesma escala' }]} /></div>
    <canvas ref={canvasRef} className="sim-canvas" style={{ height: 230 }} aria-label="Comparação entre molécula comum e molécula múonica" />
    <p className="plot-note">O análogo eletrônico da dtμ (dois núcleos e um múon) é o íon molecular D₂⁺ ou H₂⁺ (dois núcleos e um elétron), com núcleos a ~{formatLength(2 * BOHR_E)}, dois raios de Bohr. Não é a molécula neutra D₂ ou H₂, que tem dois elétrons e núcleos a 74 pm. As duas distâncias são aproximadas pelo dobro do raio de Bohr de cada caso. Na mesma escala, a molécula múonica fica menor que um pixel (marcada pelo círculo). Com massa reduzida, a razão para o deutério é {formatNumber(SIZE_RATIO, 0)}; a razão de massas pura é {formatNumber(MUON_ELECTRON_MASS_RATIO, 0)}.</p>
  </SimCard>;
}

function EnergyBalance() {
  const [fusions, setFusions] = useState(RECORD_FUSIONS_PER_MUON);
  const released = energyPerMuonJ(fusions);
  const gev = (j: number) => jToMeV(j) / 1e3;
  const maxGeV = Math.max(gev(MUON_COST_ESTIMATE_J), gev(released)) * 1.1;
  const breakEven = breakEvenFusions();
  const [lowStick, highStick] = STICKING_FRACTION_RANGE;
  const hypothetical = isBeyondStickingLimit(fusions);
  const pays = released >= MUON_COST_ESTIMATE_J;
  const stickingRange = `~${formatNumber(fusionsBeforeSticking(highStick), 0)} a ${formatNumber(MAX_FUSIONS_BY_STICKING, 0)}`;
  let message: string;
  if (hypothetical) {
    message = `Valor hipotético: chegar a ${formatNumber(fusions, 0)} fusões por múon não é possível hoje. A cada fusão, o múon tem chance de ${formatNumber(lowStick * 100, 1)}% a ${formatNumber(highStick * 100, 1)}% de grudar no núcleo de hélio produzido e sair do ciclo, o que limita a média a ${stickingRange} fusões; o recorde medido fica perto de ${RECORD_FUSIONS_PER_MUON}, e o múon ainda decai em ~2,2 μs. `
      + (pays
        ? 'Só nesse cenário o múon pagaria a própria produção, e converter calor em eletricidade, com perdas, exigiria ainda mais.'
        : `Mesmo assim, a energia liberada seria ${formatNumber((released / MUON_COST_ESTIMATE_J) * 100, 0)}% do custo do múon.`);
  } else {
    message = `Com ${formatNumber(fusions, 0)} fusões, a energia liberada é ${formatNumber((released / MUON_COST_ESTIMATE_J) * 100, 0)}% do custo do múon. Seriam precisas ~${formatNumber(breakEven, 0)} fusões só para empatar, acima do limite imposto pela aderência.`;
  }
  return <SimCard title="Por que não gera energia">
    <LogSlider label="Fusões catalisadas por múon" value={fusions} min={10} max={2000} onChange={(v) => setFusions(Math.round(v))} display={formatNumber(fusions, 0)} testId="input-muon-fusions" ends={['10', '2.000']} hypothetical={{ from: MAX_FUSIONS_BY_STICKING, label: `acima de ~${formatNumber(MAX_FUSIONS_BY_STICKING, 0)}: hipotético (aderência ao hélio)` }} />
    <div className="energy-bars" role="img" aria-label="Energia liberada comparada ao custo do múon">
      <div><span>Liberada: {formatSig(gev(released))} GeV{hypothetical ? ' (hipotético)' : ''}</span><i className={hypothetical ? 'hypothetical' : undefined} style={{ width: `${(gev(released) / maxGeV) * 100}%`, background: 'hsl(var(--primary))' }} /></div>
      <div><span>Custo de produzir o múon: ~{formatNumber(gev(MUON_COST_ESTIMATE_J), 0)} GeV</span><i style={{ width: `${(gev(MUON_COST_ESTIMATE_J) / maxGeV) * 100}%`, background: 'hsl(var(--accent))' }} /></div>
    </div>
    <div className={pays && !hypothetical ? 'callout' : 'callout warn'} data-testid="text-muon-balance">{message}</div>
    <StatGrid>
      <Stat label="Energia por fusão D+T" value={`${formatSig(jToMeV(energyPerMuonJ(1)))} MeV`} note="das massas CODATA" />
      <Stat label="Vida média do múon" value={`${formatSig(muonLifetime * 1e6)} μs`} note="depois ele decai" />
      <Stat label="Limite pela aderência" value={stickingRange} note={`1/ω_s, ω_s ≈ ${formatNumber(lowStick * 100, 1)}% a ${formatNumber(highStick * 100, 1)}%`} />
    </StatGrid>
    <p>Dois limites independentes: em cada fusão há uma chance ω_s de o múon ficar grudado no núcleo de hélio produzido, saindo do jogo; e ele só vive ~2,2 μs. Na prática, o recorde é da ordem de 100 a 150 fusões por múon.</p>
  </SimCard>;
}

export default function Muon() {
  return <ModulePage
    title="Fusão a frio e fusão por múons"
    description="Duas histórias de fusão sem calor extremo. Uma é a fusão a frio, anunciada em 1989 e nunca confirmada. A outra é a fusão catalisada por múons, real, medida e compreendida, mas que consome mais energia do que produz."
    number="04"
    tag="FUSÃO"
    limitations={[
      <>A tabela de temperatura ambiente usa o mesmo modelo simplificado do Módulo 3: núcleos nus num gás, fator S(E) constante, sem efeitos do metal. Blindagem eletrônica em metais aumenta a taxa em laboratório em energias de keV, mas nem de longe o bastante para compensar 10⁻²⁰⁰.</>,
      <>O tamanho das moléculas é estimado pelo raio de Bohr. A molécula real dtμ tem estrutura mais complexa, e sua formação ressonante, que torna o ciclo rápido, não é simulada.</>,
      <>O custo de ~5 GeV por múon é uma estimativa da literatura para aceleradores; a aderência ω_s depende da densidade e da temperatura do alvo. O balanço ignora a eficiência de converter calor em eletricidade, o que torna o quadro ainda pior.</>,
    ]}
    references={[
      { text: 'C. P. Berlinguette et al., "Revisiting the cold case of cold fusion", Nature 570, 45 (2019).', url: 'https://doi.org/10.1038/s41586-019-1256-6' },
      { text: 'S. E. Jones, "Muon-catalysed fusion revisited", Nature 321, 127 (1986).', url: 'https://doi.org/10.1038/321127a0' },
      { text: 'S. E. Koonin e M. Nauenberg, "Calculated fusion rates in isotopic hydrogen molecules", Nature 339, 690 (1989).', url: 'https://doi.org/10.1038/339690a0' },
    ]}
  >
    <RoomTemperature />
    <div className="claims">
      <Claim level="consenso" title="Fusão a frio: não confirmada">
        <p>Em março de 1989, Martin Fleischmann e Stanley Pons anunciaram calor em excesso numa célula eletrolítica com eletrodo de paládio e água pesada, que atribuíram à fusão nuclear. Dezenas de laboratórios tentaram reproduzir; os resultados positivos não se repetiram de forma confiável, e faltavam os nêutrons e o trítio que a fusão D+D necessariamente produz. Revisões do Departamento de Energia dos EUA, em 1989 e 2004, não encontraram evidência convincente.</p>
        <p>Entre 2015 e 2019, uma equipe financiada pelo Google, liderada por Curtis Berlinguette, refez os experimentos com instrumentação moderna e não encontrou evidência de fusão. O mesmo artigo defendeu que materiais carregados de hidrogênio continuam valendo estudo por outros motivos.</p>
      </Claim>
    </div>
    <Molecules />
    <EnergyBalance />
    <div className="claims">
      <Claim level="fato" title="Fusão por múons existe">
        <p>Prevista por Frank e Sakharov nos anos 1940 e observada por Luis Alvarez em 1956 numa câmara de bolhas de hidrogênio, ela foi medida em detalhe nos anos 1980 em Los Alamos (LAMPF), no PSI (Suíça) e em Dubna. É física nuclear e atômica padrão.</p>
      </Claim>
      <Claim level="consenso" title="Por que não é uma fonte de energia">
        <p>Para ser útil, cada múon teria de catalisar várias centenas de fusões, e o recorde fica perto de 150. A aderência ao hélio é o principal gargalo; reduzir o custo de produção dos múons é a outra via estudada. Não há demonstração de ganho líquido de energia.</p>
      </Claim>
    </div>
  </ModulePage>;
}
