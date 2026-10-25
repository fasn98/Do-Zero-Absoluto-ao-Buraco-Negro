import { useRef, useState } from 'react';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, SimCard, Stat, StatGrid, Sym, cssColor, useCanvasLoop } from '../shared';
import {
  boltzmannEntropyJK,
  cleanLnW,
  demonLedger,
  landauerLimitJ,
  lnMicrostates,
  log10ProbabilityAllInOneHalf,
  molarFreeExpansionEntropyJK,
  twoChamberEntropyOverK,
} from '../../physics/entropy';
import { sampleVelocity2D } from '../../physics/quantumGas';
import { lnToLog10 } from '../../physics/logmath';
import { avogadroConstant, boltzmannConstant, elementaryCharge } from '../../physics/constants';
import { formatFromLog10, formatNumber, formatSci, formatSig, formatTemperature } from '../../lib/format';

type Particle = { x: number; y: number; vx: number; vy: number };

// Velocidades em unidades de √(kT₀/m): cada componente tem σ = 1 (sorteio com m = 1, kT = 1).
const unitVelocity = () => sampleVelocity2D(1, 1 / boltzmannConstant);
const PX_PER_UNIT = 0.18; // fração da largura da caixa por segundo, por unidade de velocidade

function makeGas(count: number, leftOnly: boolean): Particle[] {
  return Array.from({ length: count }, () => {
    const [vx, vy] = unitVelocity();
    return { x: leftOnly ? 0.03 + Math.random() * 0.44 : 0.03 + Math.random() * 0.94, y: 0.04 + Math.random() * 0.92, vx, vy };
  });
}

function moveInBox(p: Particle, dt: number, aspect: number) {
  p.x += p.vx * PX_PER_UNIT * dt;
  p.y += p.vy * PX_PER_UNIT * dt * aspect;
  if (p.x < 0) { p.x = -p.x; p.vx = Math.abs(p.vx); }
  if (p.x > 1) { p.x = 2 - p.x; p.vx = -Math.abs(p.vx); }
  if (p.y < 0) { p.y = -p.y; p.vy = Math.abs(p.vy); }
  if (p.y > 1) { p.y = 2 - p.y; p.vy = -Math.abs(p.vy); }
}

const EXPANSION_N = 40;

function FreeExpansion() {
  const gas = useRef<Particle[]>(makeGas(EXPANSION_N, true));
  const history = useRef<number[]>([0]);
  const [divider, setDivider] = useState(true);
  const [nLeft, setNLeft] = useState(EXPANSION_N);
  const lastSample = useRef(0);

  const canvasRef = useCanvasLoop((ctx, width, height, dt) => {
    const aspect = width / height;
    let left = 0;
    for (const p of gas.current) {
      const wasLeft = p.x < 0.5;
      moveInBox(p, dt, aspect);
      if (divider && wasLeft && p.x >= 0.5) { p.x = 1 - p.x; p.vx = -Math.abs(p.vx); }
      if (p.x < 0.5) left += 1;
    }
    lastSample.current += dt;
    if (lastSample.current > 0.15) {
      lastSample.current = 0;
      setNLeft(left);
      if (!divider) {
        history.current.push(lnMicrostates(EXPANSION_N, left));
        if (history.current.length > 160) history.current.shift();
      }
    }
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = cssColor(canvas, divider ? '--foreground' : '--border', divider ? 0.8 : 1);
    ctx.setLineDash(divider ? [] : [4, 6]);
    ctx.lineWidth = divider ? 3 : 1;
    ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cssColor(canvas, '--primary', 0.9);
    for (const p of gas.current) { ctx.beginPath(); ctx.arc(p.x * width, p.y * height, 3.2, 0, Math.PI * 2); ctx.fill(); }
  });

  const reset = () => { gas.current = makeGas(EXPANSION_N, true); history.current = [0]; setNLeft(EXPANSION_N); setDivider(true); };
  const lnW = cleanLnW(lnMicrostates(EXPANSION_N, nLeft));
  const lnWMax = lnMicrostates(EXPANSION_N, EXPANSION_N / 2);
  const points = history.current.map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 100},${40 - (v / lnWMax) * 36}`).join(' ');

  return <SimCard title="O gás que se espalha">
    <div className="btn-row" style={{ marginBottom: 14 }}>
      <button type="button" className="btn primary" onClick={() => setDivider(false)} disabled={!divider} data-testid="button-remove-divider">Remover divisória</button>
      <button type="button" className="btn" onClick={reset} data-testid="button-reset-expansion">Recomeçar</button>
    </div>
    <canvas ref={canvasRef} className="sim-canvas" style={{ height: 220 }} aria-label="Gás de 40 partículas numa caixa com divisória" />
    <StatGrid>
      <Stat label="À esquerda / à direita" value={`${nLeft} / ${EXPANSION_N - nLeft}`} />
      <Stat label="Microestados W" value={lnW < Math.log(1e6) ? Math.round(Math.exp(lnW)).toLocaleString('pt-BR') : formatFromLog10(lnToLog10(lnW))} note={`C(${EXPANSION_N}, ${nLeft}): de quantas formas escolher quem está à esquerda`} testId="text-microstates" />
      <Stat label={<>Entropia <Sym>S = k ln W</Sym></>} value={`${formatNumber(lnW, 1)} k`} note={`${formatSci(boltzmannEntropyJK(lnW))} J/K`} testId="text-entropy" />
    </StatGrid>
    <svg viewBox="0 0 100 42" preserveAspectRatio="none" style={{ width: '100%', height: 70, marginTop: 14, display: 'block' }} role="img" aria-label="Entropia ao longo do tempo">
      <line x1="0" x2="100" y1="4" y2="4" style={{ stroke: 'hsl(var(--accent))', strokeDasharray: '2 2' }} strokeWidth={0.4} />
      <polyline points={points} fill="none" style={{ stroke: 'hsl(var(--primary))' }} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
    </svg>
    <p className="plot-note">Linha tracejada: máximo k ln C(40, 20) = {formatNumber(lnWMax, 1)} k. A entropia sobe e depois só flutua perto do máximo. Com 40 partículas, a chance de todas voltarem sozinhas para a esquerda é 2⁻⁴⁰ ≈ {formatFromLog10(log10ProbabilityAllInOneHalf(EXPANSION_N))}. Para 1 mol de gás é {formatFromLog10(log10ProbabilityAllInOneHalf(avogadroConstant))}, e a entropia sobe R ln 2 = {formatNumber(molarFreeExpansionEntropyJK())} J/K.</p>
  </SimCard>;
}

const DEMON_N = 60;
const GATE: [number, number] = [0.38, 0.62];
const ROOM_T = 300;

type DemonState = { nLeft: number; nRight: number; tLeft: number; tRight: number };

function measure(gas: Particle[]): DemonState {
  let nLeft = 0, nRight = 0, eLeft = 0, eRight = 0;
  for (const p of gas) {
    // Em 2D, ⟨½ m v²⟩ = kT; com m = 1 e v em unidades de √(kT₀/m), T/T₀ = ⟨v²⟩/2.
    const e = (p.vx * p.vx + p.vy * p.vy) / 2;
    if (p.x < 0.5) { nLeft += 1; eLeft += e; } else { nRight += 1; eRight += e; }
  }
  return { nLeft, nRight, tLeft: nLeft ? eLeft / nLeft : 1, tRight: nRight ? eRight / nRight : 1 };
}

function MaxwellDemon() {
  const gas = useRef<Particle[]>(makeGas(DEMON_N, false));
  const start = useRef(twoChamberEntropyOverK(measure(gas.current)));
  const [demonOn, setDemonOn] = useState(true);
  const [bits, setBits] = useState(0);
  const [erased, setErased] = useState(0);
  const [state, setState] = useState<DemonState>(() => measure(gas.current));
  const bitsRef = useRef(0);
  const timer = useRef(0);

  const canvasRef = useCanvasLoop((ctx, width, height, dt) => {
    const aspect = width / height;
    for (const p of gas.current) {
      const wasLeft = p.x < 0.5;
      moveInBox(p, dt, aspect);
      const isLeft = p.x < 0.5;
      if (wasLeft === isLeft) continue;
      const atGate = p.y > GATE[0] && p.y < GATE[1];
      let pass = false;
      if (atGate && demonOn) {
        // O demônio observa a partícula (1 bit: rápida ou lenta) e decide.
        bitsRef.current += 1;
        const fast = p.vx * p.vx + p.vy * p.vy > 2;
        pass = (wasLeft && fast) || (!wasLeft && !fast);
      } else if (atGate) {
        pass = true;
      }
      if (!pass) { p.x = 1 - p.x; p.vx = -p.vx; }
    }
    timer.current += dt;
    if (timer.current > 0.2) { timer.current = 0; setBits(bitsRef.current); setState(measure(gas.current)); }

    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = cssColor(canvas, '--foreground', 0.8);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, GATE[0] * height);
    ctx.moveTo(width / 2, GATE[1] * height); ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.strokeStyle = cssColor(canvas, '--accent', 0.9);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(width / 2, GATE[0] * height); ctx.lineTo(width / 2, GATE[1] * height); ctx.stroke();
    ctx.setLineDash([]);
    for (const p of gas.current) {
      const fast = p.vx * p.vx + p.vy * p.vy > 2;
      ctx.fillStyle = cssColor(canvas, fast ? '--accent' : '--chart-5', 0.95);
      ctx.beginPath(); ctx.arc(p.x * width, p.y * height, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  });

  const reset = () => {
    gas.current = makeGas(DEMON_N, false);
    start.current = twoChamberEntropyOverK(measure(gas.current));
    bitsRef.current = 0; setBits(0); setErased(0); setState(measure(gas.current));
  };
  const erase = () => {
    // Lê o contador antes de zerá-lo: o atualizador do setState pode rodar depois.
    const count = bitsRef.current;
    bitsRef.current = 0;
    setBits(0);
    setErased((e) => e + count);
  };

  const deltaGas = twoChamberEntropyOverK(state) - start.current;
  const { erasureCostOverK: erasureCost, balanceOverK: balance } = demonLedger(deltaGas, bits, erased);

  return <SimCard title="O demônio de Maxwell">
    <p>Um ser imaginário controla uma portinhola entre duas câmaras. Ele deixa passar para a direita só as partículas rápidas (laranja) e para a esquerda só as lentas (azul). A direita esquenta, a esquerda esfria, e a entropia do gás cai, sem gastar trabalho. Para isso, porém, o demônio precisa observar cada partícula e guardar o resultado: um bit por observação.</p>
    <div className="btn-row" style={{ margin: '14px 0' }}>
      <button type="button" className={demonOn ? 'btn primary' : 'btn'} onClick={() => setDemonOn((v) => !v)} data-testid="button-toggle-demon">{demonOn ? 'Demônio trabalhando' : 'Portinhola sempre aberta'}</button>
      <button type="button" className="btn" onClick={erase} disabled={bits === 0} data-testid="button-erase-memory">Apagar memória</button>
      <button type="button" className="btn" onClick={reset} data-testid="button-reset-demon">Recomeçar</button>
    </div>
    <canvas ref={canvasRef} className="sim-canvas" style={{ height: 220 }} aria-label="Duas câmaras com uma portinhola controlada pelo demônio" />
    <StatGrid>
      <Stat label="Esquerda" value={`${formatSig(state.tLeft)} T₀`} note={`${state.nLeft} partículas`} />
      <Stat label="Direita" value={`${formatSig(state.tRight)} T₀`} note={`${state.nRight} partículas`} />
      <Stat label="Bits na memória" value={bits} note={`${erased} já apagados`} testId="text-demon-bits" />
    </StatGrid>
    <div className="ledger" aria-label="Balanço de entropia, em unidades de k">
      <span>Variação de entropia do gás, ΔS_gás</span><span>{formatNumber(deltaGas, 1)} k</span>
      <span>Entropia mínima para apagar todos os bits observados, n k ln 2</span><span>+{formatNumber(erasureCost, 1)} k</span>
      <span className="total">Saldo (a segunda lei exige ≥ 0, em média)</span><span className="total" data-testid="text-demon-balance">{formatNumber(balance, 1)} k</span>
    </div>
    <p className="plot-note">Energia mínima já dissipada ao apagar {erased} bits a {ROOM_T} K: {formatSci(erased * landauerLimitJ(ROOM_T))} J. Em 2D, T/T₀ = ⟨v²⟩/2 em cada câmara; ΔS_gás = Σ N ln(T/T₀) + variação de ln C(N, N_esq). A memória do demônio é finita: para continuar trabalhando, cedo ou tarde ele precisa apagá-la. Com só 60 partículas, o saldo pode ficar levemente negativo por flutuação, da ordem de k, mesmo sem demônio; a segunda lei vale em média e se torna exata para números de partículas da ordem de 10²³.</p>
  </SimCard>;
}

function Landauer() {
  const [temperature, setTemperature] = useState(300);
  return <SimCard title="O preço de apagar um bit">
    <LogSlider label="Temperatura do ambiente" value={temperature} min={1e-3} max={1e4} onChange={setTemperature} display={formatTemperature(temperature)} testId="input-landauer-temperature" ends={['1 mK', '10.000 K']} />
    <StatGrid>
      <Stat label={<>Mínimo por bit, <Sym>kT ln 2</Sym></>} value={`${formatSci(landauerLimitJ(temperature))} J`} testId="text-landauer" />
      <Stat label="Em elétron-volts" value={`${formatSci(landauerLimitJ(temperature) / elementaryCharge)} eV`} />
      <Stat label="Apagar 1 gigabyte" value={`${formatSci(landauerLimitJ(temperature) * 8e9)} J`} note="8 × 10⁹ bits" />
    </StatGrid>
    <p>Apagar é uma operação irreversível: duas memórias diferentes (0 ou 1) terminam no mesmo estado. A informação perdida precisa sair como entropia para o ambiente, no mínimo k ln 2 por bit, o que exige dissipar no mínimo kT ln 2 de calor. Copiar ou medir pode, em princípio, ser feito sem custo mínimo; apagar não.</p>
  </SimCard>;
}

export default function Entropy() {
  return <ModulePage
    title="Entropia e informação"
    description="Entropia é uma contagem: quantos arranjos microscópicos produzem o mesmo estado que vemos. Um gás se espalha porque há muito mais maneiras de estar espalhado do que concentrado. E informação também é física: apagar um bit tem um custo mínimo de energia."
    number="02"
    tag="TERMODINÂMICA"
    limitations={[
      <>Os microestados contam só em que metade da caixa está cada partícula. A entropia termodinâmica completa inclui também posições e velocidades contínuas; a contagem por metades captura a parte que muda na expansão livre.</>,
      <>As partículas não colidem entre si, só com as paredes. Um gás real redistribuiria energia entre as partículas, mas isso não muda o balanço de entropia do demônio.</>,
      <>Com 40 ou 60 partículas, as flutuações são grandes. A segunda lei é uma afirmação estatística que fica esmagadoramente precisa para números de ordem 10²³.</>,
      <>O demônio é idealizado: observa sem perturbar e decide sem dissipar. O custo de Landauer é o mínimo teórico, atingido só em processos infinitamente lentos; computadores reais dissipam muitas ordens de grandeza acima disso por operação.</>,
    ]}
    references={[
      { text: 'R. Landauer, "Irreversibility and Heat Generation in the Computing Process", IBM Journal of Research and Development 5, 183 (1961).', url: 'https://doi.org/10.1147/rd.53.0183' },
      { text: 'C. H. Bennett, "The thermodynamics of computation — a review", International Journal of Theoretical Physics 21, 905 (1982).', url: 'https://doi.org/10.1007/BF02084158' },
      { text: 'A. Bérut et al., "Experimental verification of Landauer\'s principle linking information and thermodynamics", Nature 483, 187 (2012).', url: 'https://doi.org/10.1038/nature10872' },
    ]}
  >
    <FreeExpansion />
    <MaxwellDemon />
    <Landauer />
    <div className="claims">
      <Claim level="fato" title="S = k ln W">
        <p>A fórmula de Boltzmann (1877, escrita nessa forma por Planck) liga a entropia à contagem de microestados W. A segunda lei, a entropia de um sistema isolado não diminui, é uma consequência estatística: os estados de alta entropia são simplesmente muito mais numerosos.</p>
      </Claim>
      <Claim level="consenso" title="Quem exorciza o demônio">
        <p>Szilard (1929) mostrou que cada medição do demônio vale no máximo k ln 2 de entropia. Bennett (1982), apoiado em Landauer, mostrou que o passo inevitavelmente custoso é apagar a memória, não medir. Essa é a resolução aceita pela maioria dos físicos; ainda há debates sobre fundamentos, mas nenhum demônio funcional foi construído.</p>
      </Claim>
      <Claim level="fato" title="Landauer medido em laboratório">
        <p>Em 2012, Bérut e colegas prenderam uma esfera de sílica de 2 μm num poço duplo de laser (um bit físico) e mediram o calor dissipado ao apagá-la. Para apagamentos lentos, o calor se aproximou do limite kT ln 2. Desde então o resultado foi confirmado em sistemas magnéticos e eletrônicos.</p>
      </Claim>
    </div>
  </ModulePage>;
}
