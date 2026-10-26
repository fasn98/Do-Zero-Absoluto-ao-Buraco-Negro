#!/usr/bin/env python3
"""
validacao_sirenes.py — previsão (Fisher e catálogos simulados) para sirenes padrão de ondas
gravitacionais no plano w₀ × w_a, validada fora do navegador.

Cenários (src/data/cosmo/sirenes.json): LISA otimista e pessimista (Mangiagli et al. 2022, 2025) e
Einstein Telescope + THESEUS otimista e realista (Belgacem et al. 2019).

Modelos de erro de d_L, somados em quadratura:
  - speri2021 (LISA; Speri et al., PRD 103, 083526, 2021, eqs. A1–A6):
      σ_GW/d_L = 0,05 (d_L/36,6 Gpc);
      σ_lens/d_L = F_delens(z) · 0,066 [(1 − (1+z)^−0,25)/0,25]^1,8, F_delens = 1 − (0,3/(π/2)) arctan(z/0,073);
      σ_v/d_L = [1 + c(1+z)²/(H(z) d_L)] (500 km/s)/c;
      z > 2: redshift fotométrico, σ_z = 0,03(1+z), propagado: (∂d_L/∂z) σ_z.
  - belgacem2019 (ET; Belgacem et al., JCAP 08 (2019) 015): ΔdL/dL instrumental médio por faixa de z
      (Tabelas 24 e 26), lentes 0,05 z (eq. 2.9) e velocidade peculiar como erro em z de 200 km/s / c.

Rodar da raiz (numpy e scipy via Nix):
  nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_sirenes.py"
Grava artifacts/zero-absoluto/src/data/cosmo/validacao_sirenes.json (comparado pelo Vitest).
"""
import json
import math
import os
import sys

import numpy as np
from scipy import optimize

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validacao_cosmo as V  # noqa: E402  (distâncias e χ² dos dados reais, já validados)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "artifacts", "zero-absoluto", "src", "data", "cosmo")
CEN = json.load(open(os.path.join(DADOS, "sirenes.json")))["cenarios"]
C_KMS = V.C_KMS

# Universos "verdadeiros": ΛCDM (Planck 2018) e o melhor ajuste de BAO + CMB + Union3 do app.
VERDADES = {
    "lcdm": (0.315, 67.4, 0.02237, -1.0, 0.0),
    "desi": (0.3260, 66.22, 0.02242, -0.682, -0.999),
}
PONTOS = {"lcdm": (-1.0, 0.0), "desi": (-0.682, -0.999)}


def dl(z, p):
    """Distância de luminosidade (Mpc), d_L = (1+z) D_M."""
    m = V.Rapido(*p)
    return (1 + np.asarray(z)) * np.array([m.DM(zi) for zi in np.atleast_1d(z)])


def dl_dz(z, p, h=1e-4):
    return (dl(z + h, p) - dl(z - h, p)) / (2 * h)


def sigma(z, p, modelo, rel_inst=None):
    """Desvio total de d_L (Mpc) no universo verdadeiro p."""
    z = np.asarray(z, float)
    d = dl(z, p)
    if modelo == "speri2021":
        gw = 0.05 * d / 36.6e3 * d
        f_delens = 1 - (0.3 / (math.pi / 2)) * np.arctan(z / 0.073)
        lens = f_delens * 0.066 * ((1 - (1 + z) ** -0.25) / 0.25) ** 1.8 * d
        H = p[1] * np.sqrt(V.e2(1 / (1 + z), p[0], p[1] / 100, p[3], p[4]))
        vel = (1 + C_KMS * (1 + z) ** 2 / (H * d)) * (500 / C_KMS) * d
        photo = np.where(z > 2, dl_dz(z, p) * 0.03 * (1 + z), 0.0)
        return np.sqrt(gw ** 2 + lens ** 2 + vel ** 2 + photo ** 2)
    if modelo == "belgacem2019":
        inst = rel_inst * d
        lens = 0.05 * z * d
        vel = dl_dz(z, p) * 200 / C_KMS
        return np.sqrt(inst ** 2 + lens ** 2 + vel ** 2)
    raise ValueError(modelo)


def eventos_esperados(nome, sub=5):
    """Pontos (z, peso, ΔdL/dL instrumental) que representam o número esperado de eventos por faixa."""
    c = CEN[nome]
    bins = c["bins"]
    total = sum(b[2] for b in bins)
    escala = c["eventos_total"] / total
    zs, pesos, rels = [], [], []
    for b in bins:
        a, bb, n = b[0], b[1], b[2] * escala
        if c["erro"] == "belgacem2019":  # usa o z médio publicado da faixa
            zs.append(b[3]); pesos.append(n); rels.append(b[4])
        else:
            lo = max(a, 0.1) if nome.startswith("speri") else max(a, 1e-3)
            for k in range(sub):
                zs.append(lo + (bb - lo) * (k + 0.5) / sub); pesos.append(n / sub); rels.append(None)
    return np.array(zs), np.array(pesos), rels


def sigmas_de(nome, p):
    zs, w, rels = eventos_esperados(nome)
    if CEN[nome]["erro"] == "belgacem2019":
        return zs, w, sigma(zs, p, "belgacem2019", np.array(rels))
    return zs, w, sigma(zs, p, "speri2021")


# --- Fisher -------------------------------------------------------------------------------

PASSOS = np.array([0.002, 0.2, 0.00005, 0.01, 0.03])


def fisher_sirenes(nome, p, livres):
    zs, w, s = sigmas_de(nome, p)
    p = np.array(p, float)
    der = []
    for i in livres:
        dp = np.zeros(5); dp[i] = PASSOS[i]
        der.append((dl(zs, p + dp) - dl(zs, p - dp)) / (2 * PASSOS[i]))
    der = np.array(der)
    return (der * (w / s ** 2)) @ der.T


def residuos_reais(p):
    """Resíduos branqueados (χ² = |r|²) de BAO + CMB + Union3; nas supernovas, a magnitude absoluta é projetada fora."""
    m = V.Rapido(*p)
    z, v, q, icov = V.DATA["bao"]
    rd = m.rd()
    d_bao = V.bao_teoria(m, rd) - v
    mean, icov_c = V.DATA["cmb"]
    d_cmb = m.cmb() - mean
    zs, mu, icov_s = V.DATA["sn"]
    d_sn = 5 * np.log10((1 + zs) * np.array([m.DM(x) for x in zs])) + 25 - mu
    d_sn = d_sn - (icov_s.sum(axis=1) @ d_sn) / icov_s.sum()
    out = []
    for d, ic in ((d_bao, icov), (d_cmb, icov_c), (d_sn, icov_s)):
        L = np.linalg.cholesky(ic)  # ic = L Lᵀ → χ² = |Lᵀ d|²
        out.append(L.T @ d)
    return np.concatenate(out)


def fisher_reais(p, livres):
    """Fisher de Gauss-Newton dos dados reais, F = Jᵀ J com os resíduos branqueados (positivo por construção)."""
    p = np.array(p, float)
    J = []
    for i in livres:
        dp = np.zeros(5); dp[i] = PASSOS[i]
        J.append((residuos_reais(p + dp) - residuos_reais(p - dp)) / (2 * PASSOS[i]))
    J = np.array(J)
    return J @ J.T


def marginal(F, livres, alvo):
    cov = np.linalg.inv(F)
    return {nm: math.sqrt(cov[livres.index(i), livres.index(i)]) for nm, i in alvo.items()}


# --- Separação ΛCDM × DESI (catálogo sem ruído, perfil) -----------------------------------

def chi2_sirenes(p, nome, verdade, ruido=None):
    zs, w, s = sigmas_de(nome, verdade)
    alvo = dl(zs, verdade) if ruido is None else ruido
    return float(np.sum(w * (dl(zs, p) - alvo) ** 2 / s ** 2))


def perfil(w0, wa, nome, verdade, com_reais, ruido=None):
    def f(q):
        if com_reais:
            p = (q[0], q[1], q[2], w0, wa)
            if not V.dentro(p):
                return 1e10
            return V.chi2(p, "bao+cmb+sn") + chi2_sirenes(p, nome, verdade, ruido)
        p = (q[0], q[1], verdade[2], w0, wa)
        if not V.dentro(p):
            return 1e10
        return chi2_sirenes(p, nome, verdade, ruido)
    x0 = [verdade[0], verdade[1], verdade[2]] if com_reais else [verdade[0], verdade[1]]
    best = None
    for start in (x0, [0.31, 67.5, 0.0224][: len(x0)], [0.33, 66.0, 0.0224][: len(x0)]):
        r = optimize.minimize(f, start, method="Nelder-Mead", options={"xatol": 1e-7, "fatol": 1e-7, "maxiter": 8000})
        r = optimize.minimize(f, r.x, method="Nelder-Mead", options={"xatol": 1e-8, "fatol": 1e-8, "maxiter": 8000})
        if best is None or r.fun < best.fun:
            best = r
    return best.fun


def separacao(nome, verdade_id, com_reais):
    """Δχ² entre o ponto falso e o verdadeiro (cada um com perfil em Ω_m, H₀ e ω_b) → σ (2 parâmetros)."""
    verdade = VERDADES[verdade_id]
    falso = PONTOS["desi" if verdade_id == "lcdm" else "lcdm"]
    certo = PONTOS[verdade_id]
    d = perfil(*falso, nome, verdade, com_reais) - perfil(*certo, nome, verdade, com_reais)
    return d, (V.sigma_de_dchi2(-max(d, 0)) if d < 1400 else float("inf"))


def separacao_fisher(nome, verdade_id, com_atuais):
    """Separação esperada pelo Fisher centrado no universo verdadeiro: Δχ² = Δθᵀ C⁻¹ Δθ em (w₀, w_a),
    com C a covariância marginal (dados atuais com a mesma precisão, mas centrados na verdade)."""
    verdade = VERDADES[verdade_id]
    livres = [0, 1, 2, 3, 4]
    F = fisher_sirenes(nome, verdade, livres) if nome else np.zeros((5, 5))
    if com_atuais:
        F = F + fisher_reais(verdade, livres)
    if not com_atuais:
        livres = [0, 1, 3, 4]
        F = fisher_sirenes(nome, verdade, livres)
    C = np.linalg.inv(F)
    i, j = livres.index(3), livres.index(4)
    C2 = C[np.ix_([i, j], [i, j])]
    a, b = PONTOS["lcdm"], PONTOS["desi"]
    d = np.array([a[0] - b[0], a[1] - b[1]])
    dchi2 = float(d @ np.linalg.inv(C2) @ d)
    return dchi2, (V.sigma_de_dchi2(-dchi2) if dchi2 < 1400 else float("inf"))


def faixa_z(nome):
    b = [x for x in CEN[nome]["bins"] if x[2] > 0]
    return (b[0][0], b[-1][1])


# --- Reprodução de previsões publicadas ----------------------------------------------------

def reproducoes():
    out = {}
    # Speri et al. (2021), Tabela I: 15 sirenes popIII, ΛCDM (H0 = 70, Ωm = 0,3), só LISA: 3% em h e 16% em Ωm (68%).
    p = (0.3, 70.0, 0.0224, -1.0, 0.0)
    F = fisher_sirenes("speri-popIII-15", p, [0, 1])
    s = marginal(F, [0, 1], {"om": 0, "h0": 1})
    out["speri2021"] = {"sigma_h_rel": s["h0"] / 70, "sigma_om_rel": s["om"] / 0.3, "publicado": {"h": 0.03, "om": 0.16}}
    # Belgacem et al. (2019), Tabela 4: só sirenes, ET otimista (massas planas), ΛCDM (Ωm 0,3087, H0 67,64): 0,28% e 3,68%.
    p = (0.3087, 67.64, 0.0224, -1.0, 0.0)
    F = fisher_sirenes("et-otimista", p, [0, 1])
    s = marginal(F, [0, 1], {"om": 0, "h0": 1})
    out["belgacem2019_lcdm"] = {"sigma_h_rel": s["h0"] / 67.64, "sigma_om_rel": s["om"] / 0.3087, "publicado": {"h": 0.0028, "om": 0.0368}}
    # Belgacem (2019), Tabela 11: wCDM, só ET otimista (plana): Δw0 = 0,109 (Ωm, H0 e w0 livres).
    # w constante: usamos (w0, wa = 0) e só w0 livre além de Ωm e H0.
    F = fisher_sirenes("et-otimista", p, [0, 1, 3])
    out["belgacem2019_wcdm"] = {"sigma_w0": marginal(F, [0, 1, 3], {"w0": 3})["w0"], "publicado": {"w0": 0.109}}
    return out


def previsoes():
    res = {"atuais_sozinhos": {vid: separacao_fisher(None, vid, True) for vid in VERDADES}}
    for nome in ("lisa-otimista", "lisa-pessimista", "et-otimista", "et-realista"):
        linha = {"eventos": CEN[nome]["eventos_total"], "faixa_z": faixa_z(nome)}
        for vid, verdade in VERDADES.items():
            livres = [0, 1, 2, 3, 4]
            Fr = fisher_reais(verdade, livres)
            Fs = fisher_sirenes(nome, verdade, livres)
            so = fisher_sirenes(nome, verdade, [0, 1, 3, 4])
            linha[vid] = {
                "atuais": marginal(Fr, livres, {"w0": 3, "wa": 4}),
                "combinado": marginal(Fr + Fs, livres, {"w0": 3, "wa": 4}),
                "sirenes_sozinhas": marginal(so, [0, 1, 3, 4], {"w0": 3, "wa": 4}),
                "separacao_com_dados_reais": separacao(nome, vid, True),
                "separacao_sirenes": separacao(nome, vid, False),
                "separacao_fisher_combinado": separacao_fisher(nome, vid, True),
                "separacao_fisher_sirenes": separacao_fisher(nome, vid, False),
            }
        res[nome] = linha
    return res


def sementes(nome="et-otimista", verdade_id="desi", n=8):
    """Δχ² (ΛCDM − DESI), só com sirenes, em catálogos com ruído e sementes diferentes."""
    verdade = VERDADES[verdade_id]
    zs, w, s = sigmas_de(nome, verdade)
    out = []
    for seed in range(1, n + 1):
        rng = np.random.default_rng(seed)
        ruido = dl(zs, verdade) + rng.normal(0, s / np.sqrt(np.maximum(w, 1e-9)))  # pontos ponderados: erro do valor médio
        d = perfil(*PONTOS["lcdm"], nome, verdade, False, ruido) - perfil(*PONTOS["desi"], nome, verdade, False, ruido)
        out.append(d)
    return out


if __name__ == "__main__":
    modo = sys.argv[1] if len(sys.argv) > 1 else "tudo"
    out = {"gerado_por": "scripts/validacao_sirenes.py"}
    out["reproducoes"] = reproducoes()
    print(json.dumps(out["reproducoes"], indent=1))
    if modo == "tudo":
        out["previsoes"] = previsoes()
        out["sementes_et_otimista_desi_so_sirenes"] = sementes()
        print(json.dumps(out["previsoes"], indent=1))
        print("sementes:", out["sementes_et_otimista_desi_so_sirenes"])
        with open(os.path.join(DADOS, "validacao_sirenes.json"), "w") as f:
            json.dump(out, f, indent=1, ensure_ascii=False)
