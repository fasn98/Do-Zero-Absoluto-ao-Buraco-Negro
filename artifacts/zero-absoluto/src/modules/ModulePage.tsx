import { Link } from 'wouter';
import { ArrowLeft, Atom, BookOpen, CircleDashed } from 'lucide-react';

type ModulePageProps = { title: string; description: string; number: string; tag: string; limitation: string };

export default function ModulePage({ title, description, number, tag, limitation }: ModulePageProps) {
  return <main className="module-layout">
    <div className="breadcrumb"><Link href="/" data-testid={`link-module-home-${number}`}>Início</Link><span>/</span><span>{title}</span></div>
    <section className="module-hero">
      <div className="eyebrow">MÓDULO {number} <span style={{ color: 'hsl(var(--border))' }}> / </span> {tag}</div>
      <h1 data-testid={`text-module-title-${number}`}>{title}</h1>
      <p>{description}</p>
      <div className="module-meta"><span><BookOpen size={13} /> LEITURA CONCEITUAL</span><span><CircleDashed size={13} /> SIMULAÇÃO EM BREVE</span></div>
    </section>
    <section className="simulation-card" aria-label="Espaço reservado para simulação">
      <div className="sim-symbol"><Atom size={24} strokeWidth={1.3} /></div>
      <h2>O laboratório está sendo preparado</h2>
      <p>Este espaço será dedicado a explorar visualmente as ideias deste módulo. Por enquanto, fique com as perguntas — elas também fazem parte da física.</p>
      <span className="coming-label">SIMULAÇÃO EM DESENVOLVIMENTO</span>
    </section>
    <Link href="/" className="back-link" data-testid={`link-back-home-${number}`}><ArrowLeft size={14} /> Voltar à jornada</Link>
    <section className="module-notes">
      <div className="notes-label">ESCOPO & LIMITES</div>
      <h2>O que este modelo deixa de fora</h2>
      <p>{limitation}</p>
    </section>
    <footer className="footer" style={{ paddingLeft: 0, paddingRight: 0, marginTop: 58 }}><span>DO ZERO ABSOLUTO AO BURACO NEGRO</span><span>{number} / 06</span></footer>
  </main>;
}
