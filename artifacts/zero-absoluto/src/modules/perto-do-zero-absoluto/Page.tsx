import { useMemo, useRef, useState } from 'react';
import ModulePage from '../ModulePage';
import { Claim, LogSlider, Presets, SimCard, Stat, StatGrid, cssColor, useCanvasLoop } from '../shared';
import {
  CRITICAL_PHASE_SPACE_DENSITY,
  RUBIDIUM_87_MASS_KG,
  condensateFraction,
  criticalDensityM3,
  criticalTemperatureK,
  phaseSpaceDensity,
  sampleVelocity2D,
  thermalWavelengthM,
  velocityComponentSigma,
  zeroPointEnergyJ,
} from '../../physics/quantumGas';
import { boltzmannConstant } from '../../physics/constants';
import { formatLength, formatNumber, formatSci, formatTemperature } from '../../lib/format';

const N = 56;
// Densidade escolhida para que T_c do gás uniforme seja 170 nK, a temperatura do experimento de 1995.
const DENSITY = criticalDensityM3(RUBIDIUM_87_MASS_KG, 1.7e-7);
const TC = criticalTemperatureK(DENSITY, RUBIDIUM_87_MASS_KG);
const SPACING_M = DENSITY ** (-1 / 3);
const TRAP_OMEGA = 2 * Math.PI * 100;

const PRESETS = [
  { label: '300 K', value: 300 },
  { label: '4,2 K', value: 4.2 },
  { label: '1 μK', value: 1e-6 },
  { label: '170 nK', value: 1.7e-7 },
  { label: '50 nK', value: 5e-8 },
];

type Particle = { x: number; y: number; ux: number; uy: number; rank: number };

/** Velocidade na tela: comprimida (cresce com log T), porque a real varia por um fator de ~10⁵. */
const displaySpeed = (T: number) => 18 + 22 * Math.max(0, Math.log10(T / 1e-8));

export default function NearZero() {
  const [temperature, setTemperature] = useState(1e-6);
  const particles = useRef<Particle[] | null>(null);
  if (!particles.current) {
    particles.current = Array.from({ length: N }, (_, i) => {
      // Direção e módulo relativos sorteados de Maxwell-Boltzmann com σ = 1 (m = 1, kT = 1).
      const [ux, uy] = sampleVelocity2D(1, 1 / boltzmannConstant);
      return { x: Math.random(), y: Math.random(), ux, uy, rank: (i + 0.5) / N };
    });
  }

  const model = useMemo(() => {
    const lambda = thermalWavelengthM(RUBIDIUM_87_MASS_KG, temperature);
    return {
      lambda,
      psd: phaseSpaceDensity(DENSITY, RUBIDIUM_87_MASS_KG, temperature),
      fraction: condensateFraction(temperature, TC),
      vrms: Math.sqrt(3) * velocityComponentSigma(RUBIDIUM_87_MASS_KG, temperature),
    };
  }, [temperature]);

  const canvasRef = useCanvasLoop((ctx, width, height, dt) => {
    const list = particles.current!;
    const spacingPx = Math.sqrt((width * height) / N);
    // Raio do halo = λ/2, na mesma escala em que a distância média entre átomos vale spacingPx.
    const haloPx = Math.min(spacingPx * 3, 0.5 * (model.lambda / SPACING_M) * spacingPx);
    const speed = displaySpeed(temperature);
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    if (model.fraction > 0) {
      ctx.fillStyle = cssColor(canvas, '--accent', 0.12 + 0.3 * model.fraction);
      ctx.fillRect(0, 0, width, height);
    }
    for (const p of list) {
      const condensed = p.rank < model.fraction;
      if (!condensed) {
        p.x += (p.ux * speed * dt) / width;
        p.y += (p.uy * speed * dt) / height;
        if (p.x < 0 || p.x > 1) { p.ux *= -1; p.x = Math.min(1, Math.max(0, p.x)); }
        if (p.y < 0 || p.y > 1) { p.uy *= -1; p.y = Math.min(1, Math.max(0, p.y)); }
      }
      const px = p.x * width;
      const py = p.y * height;
      if (condensed) {
        ctx.fillStyle = cssColor(canvas, '--accent', 0.35);
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      if (haloPx > 1.5) {
        ctx.fillStyle = cssColor(canvas, '--primary', 0.13);
        ctx.strokeStyle = cssColor(canvas, '--primary', 0.35);
        ctx.beginPath(); ctx.arc(px, py, haloPx, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = cssColor(canvas, '--foreground', 0.85);
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  });

  const psdPosition = Math.min(1, Math.max(0, (Math.log10(model.psd) + 12) / 13));
  const criticalPosition = (Math.log10(CRITICAL_PHASE_SPACE_DENSITY) + 12) / 13;
  const zeroPoint = zeroPointEnergyJ(TRAP_OMEGA);

  return <ModulePage
    title="Perto do zero absoluto"
    description="Esfriar um gás não é só deixar os átomos mais lentos. Cada átomo é também uma onda, e o tamanho dessa onda cresce quando a temperatura cai. Quando as ondas de átomos vizinhos se sobrepõem, bósons idênticos passam a ocupar juntos o mesmo estado quântico: um condensado de Bose-Einstein."
    number="01"
    tag="MATÉRIA & QUANTUM"
    limitations={[
      <>Gás ideal: os átomos não interagem entre si. Em condensados reais, as interações (comprimento de espalhamento do rubídio-87 ≈ 5 nm) mudam o tamanho e a forma da nuvem e deslocam T_c em alguns por cento.</>,
      <>Caixa uniforme. Os experimentos usam armadilhas magnéticas ou ópticas aproximadamente harmônicas, em que T_c depende do número de átomos e da frequência da armadilha, não só da densidade. Aqui a densidade foi fixada em {formatSci(DENSITY / 1e6)} átomos/cm³ para que T_c seja 170 nK.</>,
      <>A caixa é desenhada em 2D, mas a física é a do gás 3D (n·λ³). A velocidade dos pontos na tela é comprimida: a velocidade real está no painel.</>,
      <>Abaixo de T_c, a parte condensada ocupa o estado de momento zero e está espalhada por toda a caixa, o que aparece como o fundo colorido. As técnicas de resfriamento (laser e evaporação) não são simuladas.</>,
      <>O 4,2 K do hélio líquido é só uma temperatura de referência: o hélio é um líquido com interações fortes, e o modelo de gás ideal não o descreve.</>,
    ]}
    references={[
      { text: 'M. H. Anderson, J. R. Ensher, M. R. Matthews, C. E. Wieman, E. A. Cornell, "Observation of Bose-Einstein Condensation in a Dilute Atomic Vapor", Science 269, 198 (1995).', url: 'https://doi.org/10.1126/science.269.5221.198' },
      { text: 'K. B. Davis et al. (grupo de W. Ketterle), "Bose-Einstein Condensation in a Gas of Sodium Atoms", Physical Review Letters 75, 3969 (1995).', url: 'https://doi.org/10.1103/PhysRevLett.75.3969' },
      { text: 'C. J. Pethick e H. Smith, Bose-Einstein Condensation in Dilute Gases, 2ª ed., Cambridge University Press (2008).' },
    ]}
  >
    <SimCard title="Gás de rubídio-87 numa caixa">
      <div className="controls">
        <LogSlider label="Temperatura" value={temperature} min={1e-8} max={300} onChange={setTemperature} display={formatTemperature(temperature)} testId="input-bec-temperature" ends={['10 nK', '300 K']} />
        <Presets items={PRESETS} onSelect={setTemperature} isActive={(v) => Math.abs(v / temperature - 1) < 0.01} />
      </div>
      <canvas ref={canvasRef} className="sim-canvas" style={{ height: 280 }} aria-label="Partículas com halos do tamanho do comprimento de onda térmico" />
      <p className="plot-note">Cada halo tem diâmetro igual ao comprimento de onda térmico λ, na mesma escala da distância média entre átomos. A 300 K o halo é invisível: λ é ~30 mil vezes menor que essa distância.</p>

      <div style={{ marginTop: 18 }}>
        <div className="log-slider-head"><span>Densidade no espaço de fase n·λ³</span><output data-testid="text-psd">{formatSci(model.psd)}</output></div>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{ width: '100%', height: 12, display: 'block' }} aria-hidden="true">
          <rect x="0" y="3" width="100" height="4" rx="2" style={{ fill: 'hsl(var(--border))' }} />
          <rect x="0" y="3" width={psdPosition * 100} height="4" rx="2" style={{ fill: model.fraction > 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))' }} />
          <rect x={criticalPosition * 100 - 0.3} y="0" width="0.6" height="10" style={{ fill: 'hsl(var(--foreground))' }} />
        </svg>
        <div className="scale-ends"><span>10⁻¹²</span><span>2,612 (transição)</span></div>
      </div>

      {model.fraction > 0
        ? <div className="callout warn" data-testid="text-bec-status">Condensado de Bose-Einstein: n·λ³ passou de 2,612. Cerca de {formatNumber(model.fraction * 100, 0)}% dos átomos estão no mesmo estado quântico, de momento zero.</div>
        : <div className="callout" data-testid="text-bec-status">Gás comum: as ondas dos átomos ainda não se sobrepõem o bastante (n·λ³ &lt; 2,612). A transição ocorre a {formatTemperature(TC)}.</div>}

      <StatGrid>
        <Stat label="Comprimento de onda λ" value={formatLength(model.lambda)} note="h / √(2π m k T)" />
        <Stat label="Distância entre átomos" value={formatLength(SPACING_M)} note="n^(−1/3)" />
        <Stat label="Velocidade rms real" value={`${formatSci(model.vrms)} m/s`} note="√(3kT/m)" />
        <Stat label="Temperatura crítica" value={formatTemperature(TC)} note="n·λ³ = ζ(3/2)" />
        <Stat label="Fração condensada" value={`${formatNumber(model.fraction * 100, 0)}%`} note="1 − (T/T_c)^(3/2)" />
        <Stat label="Átomo" value="⁸⁷Rb" note={`${formatSci(RUBIDIUM_87_MASS_KG)} kg, bóson`} />
      </StatGrid>
    </SimCard>

    <SimCard title="A partícula não para nem em T = 0">
      <p>Um átomo preso numa armadilha harmônica de frequência ω nunca fica completamente parado. Pelo princípio da incerteza, o estado de menor energia ainda tem energia de ponto zero E₀ = ½ħω. Para uma armadilha típica de 100 Hz:</p>
      <StatGrid>
        <Stat label="Frequência" value="ω = 2π × 100 Hz" />
        <Stat label="E₀ = ½ħω" value={`${formatSci(zeroPoint)} J`} testId="text-zero-point" />
        <Stat label="Equivalente térmico" value={formatTemperature(zeroPoint / boltzmannConstant)} note="E₀ / k" />
      </StatGrid>
      <p>Esse movimento residual não é calor: não pode ser extraído para fazer trabalho. O zero absoluto é o estado de menor energia, não de movimento nulo. A terceira lei da termodinâmica também garante que ele não pode ser alcançado com um número finito de etapas.</p>
    </SimCard>

    <div className="claims">
      <Claim level="fato" title="O primeiro condensado, em 1995">
        <p>Eric Cornell e Carl Wieman (JILA, Colorado) condensaram rubídio-87 a cerca de 170 nK em junho de 1995; Wolfgang Ketterle (MIT) fez o mesmo com sódio meses depois. Os três receberam o Nobel de Física de 2001. A previsão teórica era de Bose e Einstein, de 1924–1925.</p>
      </Claim>
      <Claim level="fato" title="O critério n·λ³ ≈ 2,612">
        <p>Para um gás ideal de bósons, a condensação começa quando a densidade no espaço de fase atinge ζ(3/2) ≈ 2,612, ou seja, quando há mais de ~2,6 átomos dentro de um cubo de lado λ. Só vale para bósons; férmions idênticos, como átomos de lítio-6, não podem ocupar o mesmo estado (princípio de Pauli).</p>
      </Claim>
      <Claim level="consenso" title="Superfluidez do hélio-4 e condensação">
        <p>O hélio-4 líquido vira superfluido a 2,17 K. Fritz London propôs em 1938 que isso fosse uma forma de condensação de Bose-Einstein; o modelo de gás ideal dá 3,1 K. Hoje se aceita que só ~10% dos átomos do hélio superfluido estão no estado condensado, por causa das interações fortes.</p>
      </Claim>
    </div>
  </ModulePage>;
}
