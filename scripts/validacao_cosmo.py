#!/usr/bin/env python3
"""
validacao_cosmo.py — validação independente (numpy e scipy) da verossimilhança do Módulo 2.3.

Calcula, sem usar o código TypeScript, os χ² do BAO do DESI DR2, dos "distance priors" do
Planck 2018 (Chen, Huang e Wang, 2019) e das supernovas comprimidas do Union3, num universo
plano com radiação, matéria e energia escura CPL, w(a) = w0 + wa (1 − a).

Rodar da raiz do workspace (numpy e scipy vêm do Nix; o Replit não os tem instalados):

  nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_cosmo.py pontos"
  ... --run "python3 scripts/validacao_cosmo.py ajuste"       melhores ajustes e Δχ² (ΛCDM × w0wa)
  ... --run "python3 scripts/validacao_cosmo.py mcmc"         médias a posteriori (Metropolis-Hastings)

`pontos` grava artifacts/zero-absoluto/src/data/cosmo/validacao_python.json, que o teste
Vitest (cosmoLikelihood.test.ts) compara com o código TypeScript (tolerância de 0,1 em χ²).

Fórmulas (conferidas nas fontes):
  - Radiação: Ω_r = Ω_m / (1 + z_eq), z_eq = 2,5 × 10⁴ Ω_m h² (T/2,7 K)⁻⁴ (Chen et al., eq. 6).
  - z*: Hu e Sugiyama (1996), como no código do apêndice de Chen et al. (g1 com 0,0783; o texto
    do artigo, eq. 9, traz 0,0738, um erro de digitação).
  - r_s(z) = ∫ c_s da / (a² H), c_s = c / √(3 (1 + R_b a)), 3/(4 ω_γ) = 31.500 (T/2,7 K)⁻⁴ (eq. 3).
  - R = √Ω_m H0 D_M(z*) / c; l_A = π D_M(z*) / r_s(z*) (eqs. 1 e 2).
  - r_d = r_s(z_d) × 148,92 / 153,017, com z_d de Eisenstein e Hu (1998), como no apêndice de Chen et al.
  - Supernovas: μ = 5 log10(D_L / 10 pc), com a magnitude absoluta marginalizada analiticamente.
"""
import json
import os
import sys

import numpy as np
from scipy import integrate, optimize, stats

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "artifacts", "zero-absoluto", "src", "data", "cosmo")

C_KMS = 299792.458
T_CMB = 2.72548  # K (Fixsen 2009), o mesmo de constants.js; Chen et al. arredondam para 2,7255
THETA = T_CMB / 2.7
RD_RESCALE = 148.92 / 153.017
# Fórmula de r_d: "chen" (padrão; Eisenstein e Hu reescalado, apêndice de Chen et al.) ou "aubourg".
RD_FORMULA = os.environ.get("COSMO_RD", "chen")


# --- Dados ----------------------------------------------------------------------------------

def linhas(nome):
    with open(os.path.join(DADOS, nome)) as f:
        return [l.split() for l in f if l.strip() and not l.startswith("#")]


def carregar():
    bao = linhas("desi_dr2_bao_mean.txt")
    bao_z = np.array([float(l[0]) for l in bao])
    bao_v = np.array([float(l[1]) for l in bao])
    bao_q = [l[2] for l in bao]
    bao_cov = np.array([[float(x) for x in l] for l in linhas("desi_dr2_bao_cov.txt")])
    cmb = np.array([[float(x) for x in l] for l in linhas("planck2018_distance_priors.txt")])
    sn = np.array([[float(x) for x in l] for l in linhas("union3_compressed.txt")])
    return {
        "bao": (bao_z, bao_v, bao_q, np.linalg.inv(bao_cov)),
        "cmb": (cmb[0], cmb[1:]),
        "sn": (sn[0], sn[1], sn[2:]),
    }


DATA = carregar()


# --- Modelo ---------------------------------------------------------------------------------

def omega_r(om, h):
    zeq = 2.5e4 * om * h * h * THETA ** -4
    return om / (1 + zeq)


def e2(a, om, h, w0, wa):
    orad = omega_r(om, h)
    ode = 1 - om - orad
    return orad / a ** 4 + om / a ** 3 + ode * a ** (-3 * (1 + w0 + wa)) * np.exp(-3 * wa * (1 - a))


def z_star(obh2, omh2):
    g1 = 0.0783 * obh2 ** -0.238 / (1 + 39.5 * obh2 ** 0.763)
    g2 = 0.560 / (1 + 21.1 * obh2 ** 1.81)
    return 1048 * (1 + 0.00124 * obh2 ** -0.738) * (1 + g1 * omh2 ** g2)


def z_drag(obh2, omh2):
    b1 = 0.313 * omh2 ** -0.419 * (1 + 0.607 * omh2 ** 0.674)
    b2 = 0.238 * omh2 ** 0.223
    return 1291 * omh2 ** 0.251 / (1 + 0.659 * omh2 ** 0.828) * (1 + b1 * obh2 ** b2)


class Exato:
    """Distâncias por quadratura adaptativa (scipy.integrate.quad), lentas e de referência."""

    def __init__(self, om, H0, obh2, w0, wa):
        self.p = (om, H0 / 100, w0, wa)
        self.H0, self.obh2, self.om = H0, obh2, om

    def E(self, z):
        om, h, w0, wa = self.p
        return np.sqrt(e2(1 / (1 + z), om, h, w0, wa))

    def DM(self, z):  # Mpc
        # Em ln(1+z), o integrando é suave até z ~ 1000.
        f = lambda x: np.exp(x) / self.E(np.expm1(x))
        return C_KMS / self.H0 * integrate.quad(f, 0, np.log1p(z), epsabs=0, epsrel=1e-11, limit=400)[0]

    def DH(self, z):
        return C_KMS / (self.H0 * self.E(z))

    def rs(self, z):
        om, h, w0, wa = self.p
        rb = 31500 * self.obh2 * THETA ** -4
        # ∫ c_s / (a H) d ln a, de ln a = −30 até ln a(z).
        f = lambda x: 1 / np.sqrt(3 * (1 + rb * np.exp(x))) / (np.exp(x) * np.sqrt(e2(np.exp(x), om, h, w0, wa)))
        return C_KMS / self.H0 * integrate.quad(f, -30, -np.log1p(z), epsabs=0, epsrel=1e-11, limit=400)[0]

    def rd(self):
        omh2 = self.om * (self.H0 / 100) ** 2
        if RD_FORMULA == "aubourg":
            # Aubourg et al., PRD 92, 123516 (2015), eq. 16, com Σm_ν = 0,06 eV (ω_ν = 0,06/93,14).
            onu = 0.06 / 93.14
            return 55.154 * np.exp(-72.3 * (onu + 0.0006) ** 2) / ((omh2 - onu) ** 0.25351 * self.obh2 ** 0.12807)
        return self.rs(z_drag(self.obh2, omh2)) * RD_RESCALE

    def cmb(self):
        omh2 = self.om * (self.H0 / 100) ** 2
        zs = z_star(self.obh2, omh2)
        dm = self.DM(zs)
        return np.array([np.sqrt(self.om) * self.H0 * dm / C_KMS, np.pi * dm / self.rs(zs), self.obh2])


class Rapido(Exato):
    """Mesmas distâncias numa malha fixa em ln a (Simpson cumulativo), para ajustes e MCMC."""

    X = np.linspace(-30, 0, 24001)

    def __init__(self, om, H0, obh2, w0, wa):
        super().__init__(om, H0, obh2, w0, wa)
        om_, h, w0_, wa_ = self.p
        a = np.exp(self.X)
        self.Ea = np.sqrt(e2(a, om_, h, w0_, wa_))
        rb = 31500 * obh2 * THETA ** -4
        # Integrais acumuladas a partir de a = 1 (D_M) e de a → 0 (r_s).
        fdm = 1 / (a * self.Ea)
        self.cum_dm = integrate.cumulative_trapezoid(fdm[::-1], -self.X[::-1], initial=0)[::-1]
        frs = 1 / np.sqrt(3 * (1 + rb * a)) / (a * self.Ea)
        self.cum_rs = integrate.cumulative_trapezoid(frs, self.X, initial=0) + frs[0]  # cauda ∝ a

    def DM(self, z):
        x = -np.log1p(z)
        return C_KMS / self.H0 * np.interp(x, self.X, self.cum_dm)

    def rs(self, z):
        return C_KMS / self.H0 * np.interp(-np.log1p(z), self.X, self.cum_rs)


# --- χ² -------------------------------------------------------------------------------------

def bao_teoria(m, rd):
    z, _, q, _ = DATA["bao"]
    out = []
    for zi, qi in zip(z, q):
        dm, dh = m.DM(zi), m.DH(zi)
        out.append({"DM_over_rs": dm, "DH_over_rs": dh, "DV_over_rs": (zi * dm * dm * dh) ** (1 / 3)}[qi] / rd)
    return np.array(out)


def chi2_bao(m, rd=None):
    _, v, _, icov = DATA["bao"]
    d = bao_teoria(m, m.rd() if rd is None else rd) - v
    return float(d @ icov @ d)


def chi2_cmb(m):
    mean, icov = DATA["cmb"]
    d = m.cmb() - mean
    return float(d @ icov @ d)


def chi2_sn(m):
    z, mu, icov = DATA["sn"]
    dl = (1 + z) * np.array([m.DM(zi) for zi in z])
    d = 5 * np.log10(dl) + 25 - mu
    # Marginalização analítica da magnitude absoluta (constante somada a todos os μ).
    a = d @ icov @ d
    b = icov.sum(axis=1) @ d
    c = icov.sum()
    return float(a - b * b / c)


CONJUNTOS = {
    "bao": ("bao",),
    "bao+cmb": ("bao", "cmb"),
    "bao+cmb+sn": ("bao", "cmb", "sn"),
    "bao+sn": ("bao", "sn"),
}


def chi2(p, conj, modelo=Rapido):
    om, H0, obh2, w0, wa = p
    m = modelo(om, H0, obh2, w0, wa)
    total = 0.0
    for parte in CONJUNTOS[conj]:
        total += {"bao": chi2_bao, "cmb": chi2_cmb, "sn": chi2_sn}[parte](m)
    return total


# Priors do DESI DR2 (Sec. VI): w0 ∈ U[−3, 1], wa ∈ U[−3, 2], w0 + wa < 0.
def dentro(p):
    om, H0, obh2, w0, wa = p
    return 0.01 < om < 0.99 and 20 < H0 < 100 and 0.005 < obh2 < 0.1 and -3 < w0 < 1 and -3 < wa < 2 and w0 + wa < 0


def sigma_de_dchi2(dchi2, dof=2):
    """Δχ² com dof parâmetros a mais → nível de confiança → σ gaussiano bilateral (como o DESI)."""
    p = stats.chi2.sf(-dchi2, dof)
    return float(stats.norm.isf(p / 2))


# --- Modos ----------------------------------------------------------------------------------

PONTOS = [
    ("Planck ΛCDM", (0.3153, 67.36, 0.02237, -1.0, 0.0)),
    ("DESI+CMB ΛCDM", (0.3027, 68.17, 0.02236, -1.0, 0.0)),
    ("DESI+CMB+DESY5 w0wa", (0.3191, 66.74, 0.02236, -0.752, -0.86)),
    ("DESI+CMB w0wa", (0.353, 63.6, 0.0224, -0.42, -1.75)),
    ("w = −1,5", (0.30, 70.0, 0.0224, -1.5, 0.0)),
    ("extremo", (0.25, 72.0, 0.0220, -0.6, -1.5)),
]


def modo_pontos():
    out = []
    for nome, p in PONTOS:
        m, mx = Rapido(*p), Exato(*p)
        cmb = mx.cmb()
        linha = {
            "nome": nome,
            "params": dict(zip(["omegaM", "h0", "omegaBh2", "w0", "wa"], p)),
            "rd": mx.rd(),
            "R": cmb[0],
            "lA": cmb[1],
            "chi2": {k: chi2(p, k, Exato) for k in ("bao", "bao+cmb", "bao+cmb+sn")},
            "chi2_sn": chi2_sn(mx),
        }
        # A malha rápida tem de coincidir com a quadratura.
        for k in ("bao", "bao+cmb", "bao+cmb+sn"):
            assert abs(chi2(p, k) - linha["chi2"][k]) < max(0.01, 2e-5 * linha["chi2"][k]), (nome, k)
        out.append(linha)
        print(f"{nome:22s} r_d = {linha['rd']:.3f}  R = {cmb[0]:.5f}  l_A = {cmb[1]:.3f}  "
              + "  ".join(f"χ²[{k}] = {v:.3f}" for k, v in linha["chi2"].items()))
    with open(os.path.join(DADOS, "validacao_python.json"), "w") as f:
        json.dump({"gerado_por": "scripts/validacao_cosmo.py pontos", "pontos": out}, f, indent=1, ensure_ascii=False)


def melhor(conj, lcdm, partida):
    """Mínimo de χ²: Nelder-Mead a partir de várias partidas, com os priors como barreira."""
    def f(q):
        p = (q[0], q[1], q[2], -1.0, 0.0) if lcdm else tuple(q)
        if not dentro(p):
            return 1e10
        return chi2(p, conj)
    best = None
    for start in partida:
        q0 = start[:3] if lcdm else start
        r = optimize.minimize(f, q0, method="Nelder-Mead", options={"xatol": 1e-7, "fatol": 1e-7, "maxiter": 20000, "maxfev": 40000})
        r = optimize.minimize(f, r.x, method="Nelder-Mead", options={"xatol": 1e-8, "fatol": 1e-8, "maxiter": 20000, "maxfev": 40000})
        if best is None or r.fun < best.fun:
            best = r
    return best


PARTIDAS = [(0.31, 67.5, 0.0224, -0.8, -0.6), (0.33, 66.0, 0.0224, -0.6, -1.2), (0.35, 64.0, 0.0224, -0.4, -1.8), (0.30, 68.5, 0.0224, -1.0, 0.0)]


def modo_ajuste(conjs=("bao+cmb", "bao+cmb+sn")):
    res = {}
    for conj in conjs:
        l = melhor(conj, True, PARTIDAS)
        w = melhor(conj, False, PARTIDAS)
        d = w.fun - l.fun
        res[conj] = {"lcdm": list(l.x), "chi2_lcdm": l.fun, "w0wa": list(w.x), "chi2_w0wa": w.fun, "dchi2": d, "sigma": sigma_de_dchi2(d)}
        print(f"{conj}: ΛCDM χ² = {l.fun:.3f} em Ωm = {l.x[0]:.4f}, H0 = {l.x[1]:.2f}, ωb = {l.x[2]:.5f}")
        print(f"   w0wa χ² = {w.fun:.3f} em Ωm = {w.x[0]:.4f}, H0 = {w.x[1]:.2f}, ωb = {w.x[2]:.5f}, w0 = {w.x[3]:.3f}, wa = {w.x[4]:.3f}")
        print(f"   Δχ² = {d:.2f} → {sigma_de_dchi2(d):.2f}σ")
    return res


def mcmc(conj, n, inicio, passo, semente=1):
    """Metropolis-Hastings com proposta gaussiana adaptada (covariância das amostras da fase de aquecimento)."""
    rng = np.random.default_rng(semente)
    p = np.array(inicio, float)
    c = chi2(tuple(p), conj)
    cov = np.diag(np.array(passo) ** 2)
    amostras, aceitas = [], 0
    for i in range(n):
        if i in (n // 10, n // 5):  # adapta a proposta duas vezes durante o aquecimento
            cov = np.cov(np.array(amostras[len(amostras) // 3:]).T) * 2.38 ** 2 / 5 + np.diag(np.array(passo) ** 2) * 1e-4
        q = rng.multivariate_normal(p, cov)
        if dentro(tuple(q)):
            cq = chi2(tuple(q), conj)
            if np.log(rng.random()) < (c - cq) / 2:
                p, c = q, cq
                aceitas += 1
        amostras.append(p.copy())
    s = np.array(amostras[n // 5:])
    return s, aceitas / n


def modo_mcmc(conjs=("bao+cmb", "bao+cmb+sn"), n=60000):
    out = {}
    for conj in conjs:
        cadeias = [mcmc(conj, n, PARTIDAS[k], (0.005, 0.5, 0.0001, 0.05, 0.15), semente=k + 1) for k in range(2)]
        s = np.vstack([c[0] for c in cadeias])
        media, desvio = s.mean(axis=0), s.std(axis=0)
        # Gelman-Rubin simples entre as duas cadeias, para w0 e wa.
        rhat = []
        for j in (3, 4):
            ms = [c[0][:, j].mean() for c in cadeias]
            vs = [c[0][:, j].var() for c in cadeias]
            W, B = np.mean(vs), np.var(ms) * len(cadeias[0][0])
            rhat.append(np.sqrt(((len(cadeias[0][0]) - 1) / len(cadeias[0][0]) * W + B / len(cadeias[0][0])) / W))
        out[conj] = {"media": list(media), "desvio": list(desvio), "aceitacao": [c[1] for c in cadeias], "rhat_w0_wa": rhat}
        nomes = ["Ωm", "H0", "ωb", "w0", "wa"]
        print(conj + ": " + ", ".join(f"{k} = {m:.4g} ± {d:.2g}" for k, m, d in zip(nomes, media, desvio)) + f"  (aceitação {cadeias[0][1]:.2f}, R̂ w0/wa {rhat[0]:.3f}/{rhat[1]:.3f})")
    return out


if __name__ == "__main__":
    modo = sys.argv[1] if len(sys.argv) > 1 else "pontos"
    if modo == "pontos":
        modo_pontos()
    elif modo == "ajuste":
        modo_ajuste()
    elif modo == "mcmc":
        modo_mcmc(n=int(sys.argv[2]) if len(sys.argv) > 2 else 60000)
    else:
        sys.exit(f"modo desconhecido: {modo}")
