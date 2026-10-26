#!/usr/bin/env python3
"""
investigacao_belgacem.py: por que o Fisher do ET otimista não reproduz exatamente Belgacem et al.
(JCAP 08 (2019) 015), Tabelas 4 e 11 (docs/achados.md, achado 4).

MCMC (Metropolis) só com as sirenes do ET otimista, em catálogos com ruído (um por semente):
compara a largura da posterior de cada catálogo com o Fisher. Usa o mesmo src/data/cosmo/sirenes.json.

  nix-shell -p "python3.withPackages (ps: [ps.numpy])" --run "python3 scripts/investigacao_belgacem.py 0 40 --wcdm"
  (sem --wcdm: ΛCDM, só Ω_m e H₀ livres; --sem-lentes tira o termo 0,05 z)
"""
import json, os, sys, numpy as np
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(RAIZ, "artifacts", "zero-absoluto", "src", "data", "cosmo", "sirenes.json")))["cenarios"]["et-otimista"]["bins"]
C = 299792.458
x, wgl = np.polynomial.legendre.leggauss(48)
zb = np.array([r[3] for r in T]); nb = np.array([r[2] for r in T], float); mu = np.array([r[4] for r in T])
tt = 0.5*zb[:, None]*(x+1); wt = 0.5*zb[:, None]*wgl
def dl(om, h0, w0):
    E = np.sqrt(om*(1+tt)**3 + (1-om)*(1+tt)**(3*(1+w0)))
    return (1+zb)*C/h0*np.sum(wt/E, axis=1)
P0 = (0.3087, 67.64, -1.0)
d0 = dl(*P0); h = 1e-4
zp = zb + h; zm = zb - h
def dlz(z, om, h0, w0):
    t = 0.5*z[:, None]*(x+1); w_ = 0.5*z[:, None]*wgl
    E = np.sqrt(om*(1+t)**3 + (1-om)*(1+t)**(3*(1+w0)))
    return (1+z)*C/h0*np.sum(w_/E, axis=1)
dz = (dlz(zp, *P0) - dlz(zm, *P0))/(2*h)
lens_on = '--sem-lentes' not in sys.argv
sig = np.sqrt((mu*d0)**2 + (0.05*zb*d0*lens_on)**2 + (dz*200/C)**2)
wcdm = '--wcdm' in sys.argv
lo = np.array([0.01, 40, -4.0]); hi = np.array([1.0, 100, 1.0])
def run(seed, n=60000):
    rng = np.random.default_rng(seed)
    dbar = d0 + rng.normal(0, 1, len(zb))*sig/np.sqrt(nb)  # média dos n eventos da faixa
    def lnL(p):
        if np.any(p < lo) or np.any(p > hi): return -np.inf
        return -0.5*np.sum(nb*(dl(*p) - dbar)**2/sig**2)
    p = np.array(P0); L = lnL(p); step = np.array([0.012, 0.15, 0.08]) if wcdm else np.array([0.01, 0.12, 0])
    ch = []
    for i in range(n):
        q = p + step*rng.normal(size=3)
        Lq = lnL(q)
        if np.log(rng.random()) < Lq - L: p, L = q, Lq
        if i > n//5: ch.append(p.copy())
    ch = np.array(ch)
    return ch.std(axis=0), ch.mean(axis=0)
out = []
for s in range(int(sys.argv[1]), int(sys.argv[2])):
    sd, m = run(s)
    out.append(sd)
    print(s, 'σΩm/Ωm=%.2f%%  σH0/H0=%.3f%%  σw0=%.3f   média w0=%.3f Ωm=%.3f' % (sd[0]/0.3087*100, sd[1]/67.64*100, sd[2], m[2], m[0]), flush=True)
out = np.array(out)
print('mediana: σΩm/Ωm=%.2f%%  σH0/H0=%.3f%%  σw0=%.3f; faixa σw0 %.3f–%.3f; σΩm %.2f–%.2f%%' % (np.median(out[:,0])/0.3087*100, np.median(out[:,1])/67.64*100, np.median(out[:,2]), out[:,2].min(), out[:,2].max(), out[:,0].min()/0.3087*100, out[:,0].max()/0.3087*100))
