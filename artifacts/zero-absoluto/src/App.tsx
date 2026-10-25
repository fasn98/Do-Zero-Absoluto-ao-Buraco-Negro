import { useState, type CSSProperties } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { ArrowRight, Moon, Sun } from 'lucide-react';
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

const modules = [
  { title: 'Perto do zero absoluto', description: 'O que acontece com a matéria quando o movimento térmico quase desaparece?', path: '/perto-do-zero-absoluto', number: '01', tag: 'MATÉRIA & QUANTUM' },
  { title: 'Entropia e informação', description: 'A seta do tempo, a ordem e o que significa conhecer um sistema.', path: '/entropia-e-informacao', number: '02', tag: 'TERMODINÂMICA' },
  { title: 'Por que o Sol brilha — pico de Gamow', description: 'O pico de Gamow e a chance extraordinária de dois prótons se fundirem.', path: '/por-que-o-sol-brilha', number: '03', tag: 'FÍSICA NUCLEAR' },
  { title: 'Fusão a frio e fusão por múons', description: 'Entre uma promessa controversa e um mecanismo quântico conhecido.', path: '/fusao-a-frio-e-por-muons', number: '04', tag: 'FUSÃO' },
  { title: 'A temperatura dos buracos negros', description: 'Como a teoria quântica de campos em espaço-tempo curvo prevê a radiação Hawking.', path: '/a-temperatura-dos-buracos-negros', number: '05', tag: 'ASTROFÍSICA' },
  { title: 'O nascimento do Sol', description: 'Da nuvem molecular à estrela: uma história de gravidade e calor.', path: '/o-nascimento-do-sol', number: '06', tag: 'COSMOLOGIA' },
];

const milestones = [
  { value: 1.7e-7, display: '170 nK', name: 'Condensado de Bose-Einstein' },
  { value: 2.7, display: '2,7 K', name: 'Radiação cósmica de fundo' },
  { value: 300, display: '300 K', name: 'Temperatura ambiente' },
  { value: 5772, display: '5.772 K', name: 'Superfície do Sol' },
  { value: 15.7e6, display: '15,7 milhões K', name: 'Núcleo do Sol' },
  { value: 150e6, display: '150 milhões K', name: 'Reator ITER' },
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
  </header><nav className="mobile-nav" aria-label="Navegação dos módulos">
    <Link href="/" data-testid="link-mobile-inicio">Início</Link>
    {modules.map((item) => <Link key={item.path} href={item.path} className={location === item.path ? 'active' : ''} data-testid={`link-mobile-${item.number}`}>{item.number} · {item.title}</Link>)}
  </nav></>;
}

function formatTemperature(value: number) {
  if (value < 1e-6) return `${(value * 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} nK`;
  if (value < 1) return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} K`;
  if (value < 1000) return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} K`;
  if (value < 1e6) return `${Math.round(value).toLocaleString('pt-BR')} K`;
  if (value < 1e9) return `${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} milhões K`;
  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  const superscript = String(exponent).replace(/[0-9-]/g, (digit) =>
    ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' })[digit] ?? digit,
  );
  return `${mantissa.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} × 10${superscript} K`;
}

function Home() {
  const [slider, setSlider] = useState(0);
  const value = logPositionToTemperature(slider / 1000);
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
        <div className="scale-ends"><span>1 nK</span><span>1,4 × 10³² K</span></div>
      </div>
      <div className="milestones">
        <div className="milestones-title"><span>REFERÊNCIAS CONHECIDAS</span><span>selecione para explorar</span></div>
        <div className="milestone-list">{milestones.map((milestone) => {
          const pos = temperatureToLogPosition(milestone.value) * 1000;
          return <button type="button" className={`milestone ${Math.abs(slider-pos)<2 ? 'selected' : ''}`} key={milestone.name} onClick={() => setSlider(pos)} data-testid={`button-milestone-${milestone.name.toLowerCase().replaceAll(' ','-')}`}>
            <b>{milestone.display}</b><span>{milestone.name}</span>
          </button>;
        })}</div>
      </div>
    </section>
    <section aria-labelledby="modules-heading">
      <div className="section-heading">
        <div><div className="eyebrow">SEIS PORTAS DE ENTRADA</div><h2 id="modules-heading">Escolha seu próximo passo</h2></div>
        <p>Ideias estabelecidas da termodinâmica e da física quântica, explicadas sem atalhos.</p>
      </div>
      <div className="module-grid">{modules.map((item) => <Link href={item.path} className="module-card" key={item.path} data-testid={`link-module-${item.number}`}>
        <div>
          <div className="module-top"><span className="module-index">{item.number} / 06</span><span>{item.tag}</span></div>
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
  const [dark, setDark] = useState(false);
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
      <Route component={NotFound} />
    </Switch>
  </div>;
}

export default App;
