import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, BookOpen, FlaskConical } from 'lucide-react';
import { trackForModule } from './tracks';

export type Reference = { text: string; url?: string };

type ModulePageProps = {
  title: string;
  description: string;
  number: string;
  tag: string;
  children: ReactNode;
  limitations: ReactNode[];
  references: Reference[];
};

export default function ModulePage({ title, description, number, tag, children, limitations, references }: ModulePageProps) {
  const track = trackForModule(number);
  return <main className="module-layout">
    <div className="breadcrumb"><Link href="/" data-testid={`link-module-home-${number}`}>Início</Link><span>/</span><Link href={track.path} data-testid={`link-module-track-${number}`}>{track.label}</Link><span>/</span><span>{title}</span></div>
    <section className="module-hero">
      <div className="eyebrow">MÓDULO {number} <span style={{ color: 'hsl(var(--border))' }}> / </span> {tag}</div>
      <h1 data-testid={`text-module-title-${number}`}>{title}</h1>
      <p>{description}</p>
      <div className="module-meta"><span><BookOpen size={13} /> LEITURA CONCEITUAL</span><span><FlaskConical size={13} /> SIMULAÇÃO INTERATIVA</span></div>
    </section>
    {children}
    <section className="module-notes">
      <div className="notes-label">ESCOPO & LIMITES</div>
      <h2>O que este modelo deixa de fora</h2>
      <ul className="limits-list">{limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <div className="notes-label" style={{ marginTop: 32 }}>REFERÊNCIAS</div>
      <ol className="reference-list">{references.map((ref) => <li key={ref.text}>
        {ref.url ? <a href={ref.url} target="_blank" rel="noreferrer">{ref.text}</a> : ref.text}
      </li>)}</ol>
    </section>
    <Link href={track.path} className="back-link" data-testid={`link-back-home-${number}`}><ArrowLeft size={14} /> Voltar à {track.label.toLowerCase()}</Link>
    <footer className="footer" style={{ paddingLeft: 0, paddingRight: 0, marginTop: 58 }}><span>{track.label.toUpperCase()} · {track.title.toUpperCase()}</span><span>{track.counter(number)}</span></footer>
  </main>;
}
