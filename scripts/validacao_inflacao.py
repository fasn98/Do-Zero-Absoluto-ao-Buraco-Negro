#!/usr/bin/env python3
"""
validacao_inflacao.py — validação independente (numpy e scipy) da física do Módulo 2.4.

Calcula, sem usar o código TypeScript, num universo plano com radiação (fótons a T₀ e três
neutrinos sem massa), matéria (Ω_m = 0,315) e Λ, com H₀ = 67,4 km/s/Mpc:
  - o horizonte de partículas comóvel na recombinação (z = 1.090), a distância comóvel até ela e
    o ângulo que o horizonte ocupa hoje;
  - |Ω − 1| em t = 1 s e no tempo de Planck, para |Ω_k| = 0,0045 hoje, com a(t) obtido por
    integração e busca de raiz (scipy);
  - as e-dobras mínimas para o horizonte e a planura, se a inflação termina a 10¹⁶, 10¹² e 10⁹ GeV;
  - as previsões de rolamento lento e a escala de energia V^(1/4).

Rodar da raiz do workspace (numpy e scipy via Nix no Replit):
  nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_inflacao.py"

Grava artifacts/zero-absoluto/src/data/cosmo/validacao_inflacao.json, que o teste Vitest
(inflation.test.ts) compara com o código TypeScript.
"""
import json
import math
import os

from scipy import integrate, optimize

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "artifacts", "zero-absoluto", "src", "data", "cosmo", "validacao_inflacao.json")

# Constantes (CODATA 2022), escritas de novo aqui de propósito: o script não lê o código do app.
C = 299792458.0
HBAR = 1.054571817e-34
KB = 1.380649e-23
G = 6.67430e-11
E_CHARGE = 1.602176634e-19
T0 = 2.72548
MPC = 3.0856775814913673e22
YEAR = 31557600.0

H0 = 67.4
OM = 0.315
OMEGA_K = 0.0045
H0_SI = H0 * 1000 / MPC


def omega_r_h2(neff=3.0):
    a_rad = math.pi ** 2 * KB ** 4 / (15 * HBAR ** 3 * C ** 3)
    rho_c100 = 3 * (100 * 1000 / MPC) ** 2 / (8 * math.pi * G)
    photons = a_rad * T0 ** 4 / C ** 2 / rho_c100
    return photons * (1 + neff * 7 / 8 * (4 / 11) ** (4 / 3))


OR = omega_r_h2() / (H0 / 100) ** 2
OL = 1 - OM - OR


def E(a):
    return math.sqrt(OR / a ** 4 + OM / a ** 3 + OL)


def comoving_integral(a1, a2):
    """∫ da/(a² E) entre a1 e a2, em ln a (unidades de c/H₀)."""
    f = lambda x: math.exp(-x) / E(math.exp(x))
    return integrate.quad(f, math.log(a1), math.log(a2), epsabs=0, epsrel=1e-11, limit=500)[0]


def particle_horizon(a):
    # De a = 1e-30 (contribuição ~a, desprezível) até a.
    a_min = 1e-30
    tail = a_min / math.sqrt(OR)
    return (C / H0_SI / MPC) * (tail + comoving_integral(a_min, a))


def time_of_a(a):
    """t(a) = ∫ da/(a H), com a solução de radiação abaixo de a = 1e-20."""
    a_min = 1e-20
    t_rad = a_min ** 2 / (2 * H0_SI * math.sqrt(OR))
    f = lambda x: 1 / E(math.exp(x))
    return t_rad + integrate.quad(f, math.log(a_min), math.log(a), epsabs=0, epsrel=1e-11, limit=500)[0] / H0_SI


def a_of_time(t):
    if t < 1e-10:  # pura radiação: a = (2 H₀ √Ω_r t)^(1/2)
        return math.sqrt(2 * H0_SI * math.sqrt(OR) * t)
    return math.exp(optimize.brentq(lambda x: math.log(time_of_a(math.exp(x)) / t), -60, 1, xtol=1e-14))


def curvature(a):
    return OMEGA_K / (a * a * E(a) ** 2)


def planck_time():
    return math.sqrt(HBAR * G / C ** 5)


def min_efolds(gev):
    t_end = gev * 1e9 * E_CHARGE / KB
    a = T0 / t_end
    n_h = math.log(a * E(a))
    return {"horizon": n_h, "flatness": n_h + 0.5 * math.log(1 / OMEGA_K)}


def reduced_planck_mass_gev():
    return math.sqrt(HBAR * C ** 5 / (8 * math.pi * G)) / E_CHARGE / 1e9


def energy_scale(r, a_s):
    return (3 * math.pi ** 2 * a_s * r / 2) ** 0.25 * reduced_planck_mass_gev()


if __name__ == "__main__":
    z = 1090
    a_rec = 1 / (1 + z)
    chi_p = particle_horizon(a_rec)
    d_m = (C / H0_SI / MPC) * comoving_integral(a_rec, 1)
    out = {
        "gerado_por": "scripts/validacao_inflacao.py",
        "omega_k": OMEGA_K,
        "horizonte": {"z": z, "chi_p_mpc": chi_p, "d_m_mpc": d_m, "angulo_graus": math.degrees(chi_p / d_m)},
        "planura": {
            "t_1s": curvature(a_of_time(1.0)),
            "t_planck": curvature(a_of_time(planck_time())),
            "t_planck_s": planck_time(),
        },
        "efolds_minimos": {k: min_efolds(g) for k, g in (("1e16", 1e16), ("1e12", 1e12), ("1e9", 1e9))},
        "rolamento_lento": {str(n): {"phi2": {"ns": 1 - 2 / n, "r": 8 / n}, "starobinsky": {"ns": 1 - 2 / n, "r": 12 / n ** 2}} for n in (50, 55, 60)},
        "escala_energia_gev": {"r_0.01": energy_scale(0.01, 2.1e-9), "r_0.036": energy_scale(0.036, 2.1e-9)},
        "reducao_N60": math.exp(-120),
        "M_P_gev": reduced_planck_mass_gev(),
    }
    with open(SAIDA, "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    print(json.dumps(out, indent=1, ensure_ascii=False))
