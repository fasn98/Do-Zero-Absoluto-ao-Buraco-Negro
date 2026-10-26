import { useEffect } from 'react';
import { Link } from 'wouter';
import { EvidenceTag } from '../modules/shared';
import { TRACKS, TRACK2_MODULES } from '../modules/tracks';
import { cosmicEpoch, cosmicMilestones, nearestMilestone, temperatureReading } from '../modules/cosmicMilestones';
import { CosmicTimeSlider, EpochNotice, timeFromUrl, useCosmicTime } from '../modules/cosmicTime';
import { ageOfUniverseS } from '../physics/friedmann';
import { julianYear } from '../physics/constants';
import { formatDuration } from '../lib/format';
import { TrackHero, TrackModuleGrid } from './TrackModules';

const track = TRACKS[1];
const MILESTONES = cosmicMilestones();
const T0 = ageOfUniverseS();
const MODULE_21 = TRACK2_MODULES[0];
const READY = TRACK2_MODULES.filter((m) => m.path).length;

/** Régua de tempo cósmico (parâmetros do Planck 2018), sincronizada com o Módulo 2.1. */
function CosmicRuler() {
  const [time, setTime] = useCosmicTime();
  useEffect(() => {
    const t = timeFromUrl(MILESTONES);
    if (t !== null) setTime(t);
  }, [setTime]);
  const epoch = cosmicEpoch(time);
  const temperature = temperatureReading(time);
  const nearest = nearestMilestone(time, MILESTONES);
  return <section className="temperature-panel" aria-labelledby="cosmic-heading">
    <div className="panel-head">
      <div><div className="eyebrow">EXPLORE A HISTÓRIA</div><h2 id="cosmic-heading">Uma régua para o tempo cósmico</h2></div>
      <span className="scale-note">ESCALA LOGARÍTMICA</span>
    </div>
    <div className="temp-reading cosmic-reading">
      <output className="temp-value" data-testid="text-cosmic-time">{formatDuration(time, julianYear)}</output>
      <span className="temp-label">{time > T0 * (1 + 1e-6) ? `desde o Big Bang (daqui a ${formatDuration(time - T0, julianYear)})` : 'desde o Big Bang'}</span>
    </div>
    <CosmicTimeSlider value={time} onChange={setTime} todayS={T0} testId="input-cosmic-ruler" />
    <div className="cosmic-temperature">
      <span>Temperatura do universo</span>
      <output data-testid="text-cosmic-temperature">{temperature.value}</output>
      {temperature.note && <small>{temperature.note}</small>}
    </div>
    <div className="band-list" aria-live="polite">
      <EpochNotice epoch={epoch} />
      <div className="band-item milestone-card" data-testid="text-nearest-milestone">
        <div>
          <div className="claim-head"><b>MARCO MAIS PRÓXIMO</b><EvidenceTag level={nearest.level} /></div>
          <strong>{nearest.name}</strong>
          <p className="milestone-when">{nearest.when}</p>
          <p>{nearest.text}</p>
          <p className="milestone-links">
            <Link href={MODULE_21.path!} className="inline-link" data-testid="link-ruler-module-21">Explorar no Módulo 2.1</Link>
            {nearest.link && <> · <Link href={nearest.link.href} className="inline-link">{nearest.link.label}</Link></>}
          </p>
        </div>
      </div>
    </div>
    <div className="milestones">
      <div className="milestones-title"><span>MARCOS</span><span>selecione para explorar</span></div>
      <div className="milestone-list">{MILESTONES.map((m) => <button type="button" key={m.id} className={`milestone ${nearest.id === m.id ? 'selected' : ''}`} onClick={() => setTime(m.anchor)} data-testid={`button-cosmic-${m.id}`}>
        <b>{m.short}</b><span>{m.whenShort}</span>
      </button>)}</div>
    </div>
  </section>;
}

/** Página da Trilha 2: régua de tempo cósmico e os módulos da trilha. */
export default function TrackTwo() {
  return <main className="page-wrap">
    <TrackHero track={track}>Do primeiro instante ao futuro distante: o que se sabe, o que é consenso e o que ainda é hipótese sobre a história do universo.</TrackHero>
    <CosmicRuler />
    <section aria-labelledby="track2-modules-heading">
      <div className="section-heading">
        <div><div className="eyebrow">CINCO ETAPAS</div><h2 id="track2-modules-heading">A história do cosmos</h2></div>
        <p>{READY === 1 ? 'Um módulo disponível' : `${READY} módulos disponíveis`}; os outros {TRACK2_MODULES.length - READY === 3 ? 'três' : TRACK2_MODULES.length - READY} estão em preparação.</p>
      </div>
      <TrackModuleGrid track={track} />
    </section>
    <footer className="footer"><span>FÍSICA COM CURIOSIDADE E PRECISÃO</span><span>Do primeiro instante ao futuro distante.</span></footer>
  </main>;
}
