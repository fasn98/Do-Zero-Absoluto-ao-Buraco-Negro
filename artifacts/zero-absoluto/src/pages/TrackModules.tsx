import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import type { Track } from '../modules/tracks';

/** Cabeçalho das páginas de trilha. */
export function TrackHero({ track, children }: { track: Track; children: ReactNode }) {
  return <section className="track-hero">
    <div className="eyebrow">{track.label.toUpperCase()}</div>
    <h1 data-testid={`text-track-title-${track.id}`}>{track.title}</h1>
    <p>{children}</p>
  </section>;
}

/** Cards dos módulos de uma trilha; módulos sem página aparecem como "em breve", sem link. */
export function TrackModuleGrid({ track }: { track: Track }) {
  return <div className="module-grid">{track.modules.map((item) => {
    const body = <div>
      <div className="module-top"><span className="module-index">{track.counter(item.number)}</span><span>{item.tag}</span></div>
      <h3>{item.title}</h3><p>{item.description}</p>
    </div>;
    if (!item.path) {
      return <div className="module-card soon" key={item.number} aria-disabled="true" data-testid={`card-module-soon-${item.number}`}>
        {body}
        <div className="module-bottom"><span>EM BREVE</span></div>
      </div>;
    }
    return <Link href={item.path} className="module-card" key={item.number} data-testid={`link-module-${item.number}`}>
      {body}
      <div className="module-bottom"><span>EXPLORAR MÓDULO</span><ArrowRight size={16} /></div>
    </Link>;
  })}</div>;
}
