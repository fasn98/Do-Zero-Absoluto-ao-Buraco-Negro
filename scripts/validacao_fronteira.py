#!/usr/bin/env python3
"""
validacao_fronteira.py — validação independente do Módulo 2.5 (A fronteira).

Calcula, sem usar o código do app:
  - tempo de evaporação de Hawking t = 5120 π G² M³ / (ħ c⁴) para 1 e 10¹¹ massas solares;
  - temperatura de Gibbons-Hawking T_dS = ħ H₀ √Ω_Λ / (2π k) (Gibbons e Hawking, PRD 15, 2738, 1977);
  - o instante em que o fundo cósmico (T = T₀/a) chega a T_dS, integrando t(a) = ∫ da / (a H) com
    radiação, matéria e Λ (quadratura do scipy, em ln a);
  - o instante em que o fundo fica mais frio que um buraco negro de 1 massa solar;
  - as escalas de Planck.

Constantes: CODATA 2022 e IAU 2015, as mesmas de src/physics/constants.js (lidas do arquivo).

Rodar da raiz:
  nix-shell -p "python3.withPackages (ps: [ps.numpy ps.scipy])" --run "python3 scripts/validacao_fronteira.py"
Grava artifacts/zero-absoluto/src/data/cosmo/validacao_fronteira.json (comparado pelo Vitest).
"""
import json
import math
import os
import re

from scipy import integrate

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(RAIZ, "artifacts", "zero-absoluto", "src")


def constante(nome):
    texto = open(os.path.join(APP, "physics", "constants.js"), encoding="utf8").read()
    m = re.search(r"export const %s = ([0-9_.e+-]+);" % nome, texto)
    return float(m.group(1).replace("_", ""))


C = constante("speedOfLight")
HBAR = constante("reducedPlanckConstant")
KB = constante("boltzmannConstant")
G = constante("gravitationalConstant")
MSUN = constante("solarMass")
T0 = constante("cmbTemperature")
YEAR = constante("julianYear")
MPC = constante("parsec") * 1e6

# Planck 2018 (TT,TE,EE+lowE+lensing), os mesmos de friedmann.ts: H₀ = 67,4, Ω_m = 0,315, universo plano.
H0 = 67.4
OM = 0.315
H0_SI = H0 * 1000 / MPC


def omega_r_h2(neff=3.0):
    """Fótons a T₀ mais três neutrinos sem massa."""
    a_rad = math.pi ** 2 * KB ** 4 / (15 * HBAR ** 3 * C ** 3)
    rho_c100 = 3 * (100 * 1000 / MPC) ** 2 / (8 * math.pi * G)
    return a_rad * T0 ** 4 / C ** 2 / rho_c100 * (1 + neff * 7 / 8 * (4 / 11) ** (4 / 3))


OR = omega_r_h2() / (H0 / 100) ** 2
OL = 1 - OM - OR


def evaporacao_anos(m_solar):
    m = m_solar * MSUN
    return 5120 * math.pi * G ** 2 * m ** 3 / (HBAR * C ** 4) / YEAR


def temperatura_hawking(m_kg):
    return HBAR * C ** 3 / (8 * math.pi * G * m_kg * KB)


def t_de_lna(lna):
    """t(a) = ∫ d(ln a') / H(a'), de a' → 0 até a, em segundos (radiação, matéria e Λ)."""
    def integrando(x):
        e2 = OR * math.exp(-4 * x) + OM * math.exp(-3 * x) + OL
        return 1 / (H0_SI * math.sqrt(e2))
    inicio = math.log(1e-12)
    a_ini = math.exp(inicio)
    t_ini = a_ini ** 2 / (2 * H0_SI * math.sqrt(OR))  # era da radiação, analítica
    pontos = [inicio, -10, -5, 0, 5, 10, 20, 40, 60]
    t, x0 = t_ini, inicio
    for x1 in [p for p in pontos[1:] if p < lna] + [lna]:
        t += integrate.quad(integrando, x0, x1, epsabs=0, epsrel=1e-12, limit=400)[0]
        x0 = x1
    return t


def main():
    t_ds = HBAR * H0_SI * math.sqrt(OL) / (2 * math.pi * KB)
    lna_cruz = math.log(T0 / t_ds)
    cruzamento_anos = t_de_lna(lna_cruz) / YEAR
    th_sol = temperatura_hawking(MSUN)
    inicio_sol_anos = t_de_lna(math.log(T0 / th_sol)) / YEAR
    m_max = HBAR * C ** 3 / (8 * math.pi * G * KB * t_ds)
    out = {
        "_fonte": "scripts/validacao_fronteira.py (scipy.integrate.quad); constantes de src/physics/constants.js",
        "omega_lambda": OL,
        "evaporacao_anos": {"1": evaporacao_anos(1), "1e11": evaporacao_anos(1e11)},
        "t_ds_K": t_ds,
        "idade_hoje_anos": t_de_lna(0) / YEAR,
        "cruzamento_fundo_tds_anos": cruzamento_anos,
        "fator_de_escala_no_cruzamento": math.exp(lna_cruz),
        "temperatura_hawking_1msol_K": th_sol,
        "inicio_evaporacao_1msol_anos": inicio_sol_anos,
        "maior_massa_que_evapora_msol": m_max / MSUN,
        "planck": {
            "comprimento_m": math.sqrt(HBAR * G / C ** 3),
            "tempo_s": math.sqrt(HBAR * G / C ** 5),
            "temperatura_K": math.sqrt(HBAR * C ** 5 / G) / KB,
        },
    }
    destino = os.path.join(APP, "data", "cosmo", "validacao_fronteira.json")
    with open(destino, "w", encoding="utf8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
