import { useEffect, useRef, useState } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { TRACKS, trackForPath, type Track } from './modules/tracks';
import TrackOne from './pages/TrackOne';
import TrackTwo from './pages/TrackTwo';
import NearZero from './modules/perto-do-zero-absoluto/Page';
import Entropy from './modules/entropia-e-informacao/Page';
import Gamow from './modules/por-que-o-sol-brilha/Page';
import Muon from './modules/fusao-a-frio-e-por-muons/Page';
import BlackHole from './modules/a-temperatura-dos-buracos-negros/Page';
import SunBirth from './modules/o-nascimento-do-sol/Page';
import Gravity from './modules/a-gravidade-guarda-informacao/Page';
import Listening from './modules/ouvindo-o-universo/Page';
import Forces from './modules/as-forcas-convergem/Page';
import QuantumToClassical from './modules/quantico-para-classico/Page';
import WorstPrediction from './modules/pior-previsao/Page';
import CosmicTimeline from './modules/linha-do-tempo-cosmica/Page';

/** Itens do menu: na página inicial, as duas trilhas; dentro de uma trilha, o nome dela e os seus módulos. */
function navItems(track: Track | null) {
  if (!track) return TRACKS.map((t) => ({ key: t.id, href: t.path, short: t.label, long: `${t.label} · ${t.title}`, title: t.title }));
  return [
    { key: `trilha-${track.id}`, href: track.path, short: track.label, long: track.label, title: track.title },
    ...track.modules.map((m) => ({ key: m.number, href: m.path, short: m.number, long: `${m.number} · ${m.title}`, title: m.path ? m.title : `${m.title} (em breve)` })),
  ];
}

function Header({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [location] = useLocation();
  const track = trackForPath(location);
  return <><header className="topbar">
    <Link href="/" className="brand" data-testid="link-home-brand">
      <span className="brand-mark" aria-hidden="true">∿</span>
      <span className="brand-word">Do zero absoluto<small>ao buraco negro</small></span>
    </Link>
    <div className="top-actions">
      <nav className="nav-links" aria-label="Navegação principal">
        <Link href="/" className={location === '/' ? 'active' : ''} data-testid="link-nav-inicio">Início</Link>
        {navItems(track).map((item, index) => item.href
          ? <Link key={item.key} href={item.href} title={item.title} className={`${location === item.href ? 'active' : ''} ${track && index === 0 ? 'nav-track' : ''}`} data-testid={`link-nav-${item.key}`}>{item.short}</Link>
          : <span key={item.key} className="nav-soon" title={item.title} aria-disabled="true">{item.short}</span>)}
      </nav>
      <button type="button" className="theme-toggle" onClick={onToggle} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} data-testid="button-theme-toggle">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  </header><MobileNav location={location} track={track} /></>;
}

/** Menu horizontal do celular: degradê na borda onde há mais itens e rolagem até o item ativo. */
function MobileNav({ location, track }: { location: string; track: Track | null }) {
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
    <nav ref={ref} className="mobile-nav" aria-label="Navegação das trilhas e módulos" onScroll={update}>
    <Link href="/" className={location === '/' ? 'active' : ''} data-testid="link-mobile-inicio">Início</Link>
    {navItems(track).map((item) => item.href
      ? <Link key={item.key} href={item.href} className={location === item.href ? 'active' : ''} data-testid={`link-mobile-${item.key}`}>{item.long}</Link>
      : <span key={item.key} className="nav-soon" aria-disabled="true">{item.long} (em breve)</span>)}
    </nav>
  </div>;
}

function Home() {
  return <main className="page-wrap">
    <section className="home-hero">
      <div className="hero-copy">
        <div className="eyebrow">UM PERCURSO PELA FÍSICA</div>
        <h1>Do zero absoluto<br />ao <em>buraco negro.</em></h1>
        <p>Duas trilhas: uma pelas temperaturas extremas e pela matéria quântica, outra pela história do universo, do primeiro instante ao futuro distante.</p>
      </div>
      <div className="hero-art" aria-label="Diagrama orbital abstrato inspirado em uma estrela">
        <span className="orbit one" /><span className="orbit two" /><span className="orbit three" /><span className="sun-core" /><span className="orbit-dot" />
        <span className="art-caption">MATÉRIA · ENERGIA · UNIVERSO</span>
      </div>
    </section>
    <section aria-labelledby="tracks-heading">
      <div className="section-heading">
        <div><div className="eyebrow">DUAS TRILHAS</div><h2 id="tracks-heading">Por onde começar</h2></div>
        <p>Cada módulo separa o que é fato estabelecido, o que é consenso e o que ainda é hipótese.</p>
      </div>
      <div className="track-grid">{TRACKS.map((track) => {
        const ready = track.modules.filter((m) => m.path);
        const soon = track.modules.length - ready.length;
        return <Link key={track.id} href={track.path} className="track-card" data-testid={`link-track-${track.id}`}>
          <div className="module-top"><span className="module-index">{track.label.toUpperCase()}</span><span>{soon ? `${ready.length} DISPONÍVEL · ${soon} EM BREVE` : `${ready.length} MÓDULOS`}</span></div>
          <h3>{track.title}</h3>
          <p>{track.summary}</p>
          <ol className="track-preview">{track.modules.slice(0, track.modules.length <= 5 ? 5 : 4).map((m) => <li key={m.number} className={m.path ? '' : 'soon'}><span>{m.number}</span>{m.title}{m.path ? '' : ' (em breve)'}</li>)}
            {track.modules.length > 5 && <li className="more"><span>…</span>e mais {track.modules.length - 4}</li>}
          </ol>
          <div className="module-bottom"><span>ABRIR TRILHA</span><ArrowRight size={16} /></div>
        </Link>;
      })}</div>
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
      <Route path="/trilha-1" component={TrackOne} />
      <Route path="/trilha-2" component={TrackTwo} />
      <Route path="/perto-do-zero-absoluto" component={NearZero} />
      <Route path="/entropia-e-informacao" component={Entropy} />
      <Route path="/por-que-o-sol-brilha" component={Gamow} />
      <Route path="/fusao-a-frio-e-por-muons" component={Muon} />
      <Route path="/a-temperatura-dos-buracos-negros" component={BlackHole} />
      <Route path="/o-nascimento-do-sol" component={SunBirth} />
      <Route path="/a-gravidade-guarda-informacao" component={Gravity} />
      <Route path="/ouvindo-o-universo" component={Listening} />
      <Route path="/as-forcas-convergem" component={Forces} />
      <Route path="/quantico-para-classico" component={QuantumToClassical} />
      <Route path="/pior-previsao" component={WorstPrediction} />
      <Route path="/a-linha-do-tempo-cosmica" component={CosmicTimeline} />
      <Route component={NotFound} />
    </Switch>
  </div>;
}

export default App;
