import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { MODULES, MODULE_TOTAL, contextForTemperature, modulesForTemperature } from './modules/temperatureBands';
import { EvidenceTag } from './modules/shared';
import { formatTemperature } from './lib/format';
import { cmbTemperature, planckTemperature, solarCoreTemperature, solarSurfaceTemperature } from './physics/constants';
import {
  logPositionToTemperature,
  temperatureToLogPosition,
} from './physics/calculations';
import NearZero from './modules/perto-do-zero-absoluto/Page';
import Entropy from './modules/entropia-e-informacao/Page';
import Gamow from './modules/por-que-o-sol-brilha/Page';
import Muon from './modules/fusao-a-frio-e-por-muons/Page';
import BlackHole from './modules/a-temperatura-dos-buracos-negros/Page';
import SunBirth from './modules/o-nascimento-do-sol/Page';
import Gravity from './modules/a-gravidade-guarda-informacao/Page';
import Listening from './modules/ouvindo-o-universo/Page';

const modules = MODULES;

const milestones = [
  { value: 1.7e-7, display: '~170 nK', name: 'Condensado de Bose-Einstein' },
  { value: cmbTemperature, display: '2,725 K', name: 'Radiação cósmica de fundo' },
  { value: 4.2, display: '4,2 K', name: 'Hélio líquido' },
  { value: 300, display: '300 K', name: 'Temperatura ambiente' },
  { value: solarSurfaceTemperature, display: '5.772 K', name: 'Superfície do Sol' },
  { value: solarCoreTemperature, display: '15,7 milhões K', name: 'Núcleo do Sol' },
  { value: 1.5e8, display: '~150 milhões K', name: 'Plasma do ITER' },
  { value: planckTemperature, display: '1,417 × 10³² K', name: 'Temperatura de Planck' },
];

function Header({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [location] = useLocation();
  return <><header className="topbar">
    <Link href="/" className="brand" data-testid="link-home-brand">
      <span className="brand-mark" aria-hidden="true">∿</span>
      <span className="brand-word">Do zero absoluto<small>ao buraco negro</small></span>
    </Link>
    <div className="top-actions">
      <nav className="nav-links" aria-label="Navegação principal">
        <Link href="/" className={location === '/' ? 'active' : ''} data-testid="link-nav-inicio">Início</Link>
        {modules.map((item) => <Link key={item.path} href={item.path} title={item.title} aria-label={`Módulo ${item.number}: ${item.title}`} className={location === item.path ? 'active' : ''} data-testid={`link-nav-${item.number}`}>{item.number}</Link>)}
      </nav>
      <button type="button" className="theme-toggle" onClick={onToggle} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} data-testid="button-theme-toggle">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  </header><MobileNav location={location} /></>;
}

/** Menu horizontal do celular: degradê na borda onde há mais itens e rolagem até o item ativo. */
function MobileNav({ location }: { location: string }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const update = () => {
    const nav = ref.current;
    if (!nav) return;
    setEdges({ left: nav.scrollLeft > 2, right: nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2 });
  };
  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('a.active');
    if (nav && active) nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [location]);
  const fade = `${edges.left ? 'fade-left' : ''} ${edges.right ? 'fade-right' : ''}`;
  return <div className={`mobile-nav-wrap ${fade}`}>
    <nav ref={ref} className="mobile-nav" aria-label="Navegação dos módulos" onScroll={update}>
    <Link href="/" className={location === '/' ? 'active' : ''} data-testid="link-mobile-inicio">Início</Link>
    {modules.map((item) => <Link key={item.path} href={item.path} className={location === item.path ? 'active' : ''} data-testid={`link-mobile-${item.number}`}>{item.number} · {item.title}</Link>)}
    </nav>
  </div>;
}

function Home() {
  const [slider, setSlider] = useState(() => temperatureToLogPosition(300) * 1000);
  const value = logPositionToTemperature(Math.min(1, Math.max(0, slider / 1000)));
  const matches = modulesForTemperature(value);
  const contexts = contextForTemperature(value);
  return <main className="page-wrap">
    <section className="home-hero">
      <div className="hero-copy">
        <div className="eyebrow">UM PERCURSO PELA FÍSICA</div>
        <h1>Do zero absoluto<br />ao <em>buraco negro.</em></h1>
        <p>Uma jornada por temperaturas extremas, matéria quântica e as ideias que conectam o muito pequeno ao universo inteiro.</p>
      </div>
      <div className="hero-art" aria-label="Diagrama orbital abstrato inspirado em uma estrela">
        <span className="orbit one" /><span className="orbit two" /><span className="orbit three" /><span className="sun-core" /><span className="orbit-dot" />
        <span className="art-caption">MATÉRIA · ENERGIA · UNIVERSO</span>
      </div>
    </section>
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
        <div><div className="eyebrow">OITO PORTAS DE ENTRADA</div><h2 id="modules-heading">Escolha seu próximo passo</h2></div>
        <p>Ideias estabelecidas da termodinâmica e da física quântica, explicadas sem atalhos.</p>
      </div>
      <div className="module-grid">{modules.map((item) => <Link href={item.path} className="module-card" key={item.path} data-testid={`link-module-${item.number}`}>
        <div>
          <div className="module-top"><span className="module-index">{item.number} / {MODULE_TOTAL}</span><span>{item.tag}</span></div>
          <h3>{item.title}</h3><p>{item.description}</p>
        </div>
        <div className="module-bottom"><span>EXPLORAR MÓDULO</span><ArrowRight size={16} /></div>
      </Link>)}</div>
    </section>
    <footer className="footer"><span>FÍSICA COM CURIOSIDADE E PRECISÃO</span><span>Uma jornada, do quase nada ao infinito.</span></footer>
  </main>;
}

function NotFound() {
  return <main className="module-layout"><div className="eyebrow">404 · CAMINHO NÃO ENCONTRADO</div><h1 style={{ fontFamily: 'var(--app-font-serif)', fontSize: 56 }}>Esta página ainda não existe.</h1><Link href="/" className="back-link" data-testid="link-return-home"><ArrowRight size={15} /> Voltar ao início</Link></main>;
}

function App() {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return <div className={dark ? 'shell dark' : 'shell'}>
    <Header dark={dark} onToggle={() => setDark((current) => !current)} />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/perto-do-zero-absoluto" component={NearZero} />
      <Route path="/entropia-e-informacao" component={Entropy} />
      <Route path="/por-que-o-sol-brilha" component={Gamow} />
      <Route path="/fusao-a-frio-e-por-muons" component={Muon} />
      <Route path="/a-temperatura-dos-buracos-negros" component={BlackHole} />
      <Route path="/o-nascimento-do-sol" component={SunBirth} />
      <Route path="/a-gravidade-guarda-informacao" component={Gravity} />
      <Route path="/ouvindo-o-universo" component={Listening} />
      <Route component={NotFound} />
    </Switch>
  </div>;
}

export default App;
