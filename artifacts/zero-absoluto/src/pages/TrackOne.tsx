import { useState, type CSSProperties } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { contextForTemperature, modulesForTemperature } from '../modules/temperatureBands';
import { EvidenceTag } from '../modules/shared';
import { TRACKS } from '../modules/tracks';
import { formatTemperature } from '../lib/format';
import { cmbTemperature, humanBodyTemperature, planckTemperature, solarCoreTemperature, solarSurfaceTemperature } from '../physics/constants';
import { logPositionToTemperature, temperatureToLogPosition } from '../physics/calculations';
import { TrackHero, TrackModuleGrid } from './TrackModules';

const track = TRACKS[0];

const milestones = [
  { value: 1.7e-7, display: '~170 nK', name: 'Condensado de Bose-Einstein' },
  { value: cmbTemperature, display: '2,725 K', name: 'Radiação cósmica de fundo' },
  { value: 4.2, display: '4,2 K', name: 'Hélio líquido' },
  { value: 300, display: '300 K', name: 'Temperatura ambiente' },
  { value: humanBodyTemperature, display: '310 K', name: 'Corpo humano' },
  { value: solarSurfaceTemperature, display: '5.772 K', name: 'Superfície do Sol' },
  { value: solarCoreTemperature, display: '15,7 milhões K', name: 'Núcleo do Sol' },
  { value: 1.5e8, display: '~150 milhões K', name: 'Plasma do ITER' },
  { value: planckTemperature, display: '1,417 × 10³² K', name: 'Temperatura de Planck' },
];

/** Página da Trilha 1: régua de temperatura e os módulos da trilha. */
export default function TrackOne() {
  const [slider, setSlider] = useState(() => temperatureToLogPosition(300) * 1000);
  const value = logPositionToTemperature(Math.min(1, Math.max(0, slider / 1000)));
  const matches = modulesForTemperature(value);
  const contexts = contextForTemperature(value);
  return <main className="page-wrap">
    <TrackHero track={track}>Uma jornada por temperaturas extremas, matéria quântica e as ideias que conectam o muito pequeno ao universo inteiro.</TrackHero>
    <section className="temperature-panel" aria-labelledby="temperature-heading">
      <div className="panel-head">
        <div><div className="eyebrow">EXPLORE A ESCALA</div><h2 id="temperature-heading">Uma régua para o impossível</h2></div>
        <span className="scale-note">ESCALA LOGARÍTMICA</span>
      </div>
      <div className="temp-reading">
        <output className="temp-value" data-testid="text-selected-temperature">{formatTemperature(value)}</output>
        <span className="temp-label">temperatura selecionada</span>
      </div>
      <div className="slider-track-wrap">
        <input className="temperature-slider" type="range" min="0" max="1000" step="1" value={slider} onChange={(event) => setSlider(Number(event.target.value))} aria-label="Temperatura em escala logarítmica" style={{ '--slider-progress': `${slider / 10}%` } as CSSProperties} data-testid="input-temperature-slider" />
        <div className="scale-ends"><span>1 nK</span><span>Planck · 1,417 × 10³² K</span></div>
      </div>
      <div className="band-list" aria-live="polite">
        {matches.map((match) => <Link key={match.module.number} href={match.module.path} className="band-item" data-testid={`link-band-${match.module.number}`}>
          <div><b>MÓDULO {match.module.number}</b><strong>{match.module.title}</strong><p>{match.reason}</p></div>
          <ArrowRight size={16} />
        </Link>)}
        {contexts.map((context) => <div key={context.text} className="band-item band-empty">
          <div><EvidenceTag level={context.level} /><p style={{ marginTop: 8 }}>{context.text}</p></div>
        </div>)}
        {matches.length === 0 && contexts.length === 0 && <div className="band-item band-empty"><p>Nenhum módulo descreve esta faixa diretamente.</p></div>}
      </div>
      <div className="milestones">
        <div className="milestones-title"><span>REFERÊNCIAS CONHECIDAS</span><span>selecione para explorar</span></div>
        <div className="milestone-list">{milestones.map((milestone) => {
          const pos = temperatureToLogPosition(milestone.value) * 1000;
          return <button type="button" className={`milestone ${Math.abs(slider - pos) < 2 ? 'selected' : ''}`} key={milestone.name} onClick={() => setSlider(pos)} data-testid={`button-milestone-${milestone.name.toLowerCase().replaceAll(' ','-')}`}>
            <b>{milestone.display}</b><span>{milestone.name}</span>
          </button>;
        })}</div>
      </div>
    </section>
    <section aria-labelledby="modules-heading">
      <div className="section-heading">
        <div><div className="eyebrow">ONZE PORTAS DE ENTRADA</div><h2 id="modules-heading">Escolha seu próximo passo</h2></div>
        <p>Ideias estabelecidas da termodinâmica e da física quântica, explicadas sem atalhos.</p>
      </div>
      <TrackModuleGrid track={track} />
    </section>
    <footer className="footer"><span>FÍSICA COM CURIOSIDADE E PRECISÃO</span><span>Uma jornada, do quase nada ao infinito.</span></footer>
  </main>;
}
