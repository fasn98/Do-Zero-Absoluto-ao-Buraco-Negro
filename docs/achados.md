# Achados

Problemas encontrados nas fontes ao reproduzir análises publicadas. Cada achado traz a referência, o cálculo e como o app lida com ele. Os números foram calculados com `scripts/validacao_cosmo.py` (quadratura adaptativa do scipy), salvo indicação.

## 0. Reprodução dos resultados do DESI DR2 (Módulo 2.3, Etapa A)

Médias a posteriori de `scripts/validacao_cosmo.py mcmc` (duas cadeias de Metropolis-Hastings de 60 mil passos por combinação, R̂ = 1,00 em w₀ e w_a; priors do DESI: w₀ ∈ [−3, 1], w_a ∈ [−3, 2], w₀ + w_a < 0) e Δχ² de `scripts/validacao_cosmo.py ajuste`, comparados com a Tabela V e a Tabela VI de DESI Collaboration, Phys. Rev. D 112, 083515 (2025):

| Combinação | Grandeza | Este projeto | DESI DR2 publicado | Diferença |
|---|---|---|---|---|
| DESI + CMB | w₀ | −0,411 ± 0,21 | −0,42 ± 0,21 | +0,04σ |
| | w_a | −1,756 ± 0,62 | −1,75 ± 0,58 | −0,01σ |
| | Ω_m | 0,3532 ± 0,022 | 0,353 ± 0,021 | +0,01σ |
| | H₀ | 63,81 ± 1,9 | 63,6 (+1,6 −2,1) | +0,1σ |
| | Δχ² (w₀w_a − ΛCDM) | −8,21 → 2,40σ | −12,5 → 3,1σ (CMB completo); −8,0 → 2,4σ (CMB comprimido em θ*, ω_b, ω_bc) | ver o achado 3 |
| DESI + CMB + Union3 | w₀ | −0,674 ± 0,092 | −0,667 ± 0,088 | −0,08σ |
| | w_a | −1,041 ± 0,32 | −1,09 (+0,31 −0,27) | +0,17σ |
| | Ω_m | 0,3265 ± 0,0088 | 0,3275 ± 0,0086 | −0,12σ |
| | H₀ | 66,20 ± 0,84 | 65,91 ± 0,84 | +0,35σ |
| | Δχ² | −14,08 → 3,33σ | −17,4 → 3,8σ | — |
| Só DESI (BAO) | Ω_m (ΛCDM) | 0,2973 | 0,2975 ± 0,0086 | 0,0σ |
| | Δχ² | −4,66 → 1,66σ | −4,7 → 1,7σ | 0,0σ |

O CMB entra aqui pelos "distance priors" (R, l_A, ω_b), que não carregam o lenteamento do CMB; por isso a preferência por w₀w_a coincide com a versão comprimida publicada pelo DESI (2,4σ) e fica abaixo da obtida com o CMB completo (3,1σ).

## 1. Chen, Huang e Wang (2019): coeficiente de g₁ na eq. 9

**Referência:** L. Chen, Q.-G. Huang e K. Wang, "Distance Priors from Planck Final Release", JCAP 02, 028 (2019), DOI [10.1088/1475-7516/2019/02/028](https://doi.org/10.1088/1475-7516/2019/02/028), arXiv:1808.05724v1.

**O que diz o artigo.** A eq. 8 dá o redshift do desacoplamento pela fórmula de ajuste de Hu e Sugiyama,

z* = 1048 [1 + 0,00124 (Ω_b h²)^−0,738] [1 + g₁ (Ω_m h²)^g₂],  g₂ = 0,560 / [1 + 21,1 (Ω_b h²)^1,81],

e a eq. 9, no texto, traz **g₁ = 0,0738 (Ω_b h²)^−0,238 / [1 + 39,5 (Ω_b h²)^0,763]**.

**A discrepância.** O código CosmoMC do apêndice do mesmo artigo (`distance.f90`, função `Distance_LnLike`) usa **0,0783**:

```
g_1 = 0.0783 D0*(CMB%ombh2)**(-0.238 D0)/(1.0 D0+39.5 D0*(CMB%ombh2)**0.763 D0)
```

O valor 0,0783 é o da fórmula de Hu e Sugiyama (ApJ 471, 542, 1996), como reproduzida, por exemplo, em E. Komatsu et al. (WMAP5), ApJS 180, 330 (2009), eqs. 66 e 67, DOI [10.1088/0067-0049/180/2/330](https://doi.org/10.1088/0067-0049/180/2/330). Conferimos o texto do arXiv de Komatsu et al. (0803.0547).

**Efeito numérico.** Com os parâmetros do Planck 2018 TT,TE,EE+lowE (Ω_m = 0,3166, H₀ = 67,27, Ω_b h² = 0,02236, Ω_m h² = 0,14327):

| g₁ com | z* | r_s(z*) [Mpc] | l_A | R |
|---|---|---|---|---|
| 0,0783 (código e Hu-Sugiyama) | 1.091,94 | 144,32 | 301,792 | 1,75039 |
| 0,0738 (eq. 9 do texto) | 1.090,65 | 144,43 | 301,553 | 1,75036 |

A troca muda l_A em 0,24, ou 2,7 vezes o erro do prior (σ = 0,089). R quase não muda.

**Como o app lida.** Usamos 0,0783, o valor do código do apêndice e da fórmula original, em `physics/cosmoLikelihood.ts` e em `scripts/validacao_cosmo.py`. A curiosidade é que o valor com o erro de digitação deixa l_A mais perto da média do prior (301,471); ver o achado 2, que explica a origem dessa diferença.

## 2. Chen, Huang e Wang (2019): o prior de l_A e a teoria usam z* diferentes

**O que diz o artigo.** Na Sec. II A, as médias de R e l_A da Tabela I foram obtidas das cadeias públicas do Planck com as eqs. 1 e 2, **usando "os valores de z* dados pelas cadeias do Planck 2018"**, isto é, o z* do código de recombinação completo. Na Sec. II C, para comparar um modelo com os priors, o artigo calcula R e l_A **com a fórmula de ajuste de Hu e Sugiyama** (eq. 8), e o código do apêndice faz o mesmo.

**A discrepância.** As duas definições de z* diferem em cerca de 2:

- Planck 2018, TT,TE,EE+lowE (Aghanim et al., A&A 641, A6, 2020, Tabela 2): **z* = 1.089,95 ± 0,27**, r* = 144,39 ± 0,30 Mpc, 100θ* = 1,04109 ± 0,00030.
- Hu e Sugiyama, com os mesmos parâmetros: **z* = 1.091,94**.

Para os mesmos parâmetros cosmológicos do Planck:

| z* usado | l_A | Diferença para o prior (301,471 ± 0,089) |
|---|---|---|
| 1.089,95 (cadeias do Planck) | 301,423 | −0,5σ |
| 1.091,94 (Hu e Sugiyama, eq. 8) | 301,792 | +3,6σ |

Ou seja, no ponto de melhor ajuste do próprio Planck a teoria de Chen et al. dá um l_A a 3,6σ do prior. O prior e a teoria não usam a mesma definição de z*.

**Por que o ajuste ainda funciona.** Com três parâmetros (Ω_m, H₀, ω_b) e três medidas (R, l_A, ω_b), o ajuste só com o CMB absorve a diferença numa pequena mudança de H₀:

| Ajuste ΛCDM só com o CMB | Ω_m | H₀ | ω_b |
|---|---|---|---|
| z* de Hu e Sugiyama (como no artigo) | 0,3163 | 67,44 | 0,022360 |
| z* deslocado em −2 (diagnóstico) | 0,3164 | 67,26 | 0,022360 |
| Planck 2018 TT,TE,EE+lowE | 0,3166 ± 0,0084 | 67,27 ± 0,60 | 0,02236 ± 0,00015 |

O desvio vira +0,17 km/s/Mpc em H₀ (0,3σ do Planck). Combinado com o BAO, o efeito é pequeno, mas existe.

**Como o app lida.** Seguimos o artigo à risca: z* de Hu e Sugiyama na teoria e as médias publicadas do prior. Com isso reproduzimos as médias de w₀ e w_a do DESI DR2 a menos de 0,2σ (ver docs/prompts/trilha2-fase3.md e o relatório da Etapa A).

## 3. Neutrinos massivos não explicam o H₀ do ΛCDM com DESI + CMB

**Contexto.** No ΛCDM com DESI + CMB comprimido, o nosso melhor ajuste dá Ω_m = 0,2994 e H₀ = 68,69. O DESI DR2 publica 0,3027 ± 0,0036 e 68,17 ± 0,28 com o CMB completo (Tabela V), uma diferença de −0,9σ e +1,9σ.

**Teste.** Incluímos Σm_ν = 0,06 eV como matéria não relativística, com Ω_ν h² = Σm_ν / 93,14 eV = 6,44 × 10⁻⁴:

| Tratamento | Ω_m total | H₀ | Δχ² w₀w_a × ΛCDM |
|---|---|---|---|
| Sem massa (atual) | 0,2994 | 68,69 | −8,21 (2,40σ) |
| ν como matéria em todas as épocas, Ω_cb livre | 0,2994 | 68,69 | −8,21 (2,40σ) |
| ν como radiação antes de 1 + z ≈ 113 e z*, z_d com ω_cb | 0,2996 | 73,27 | −7,65 (2,29σ) |

O segundo caso é só uma reparametrização: Chen et al. definem R, z* e z_d com o Ω_m total (incluindo neutrinos), e o nosso Ω_m já faz esse papel. O terceiro é incoerente com a definição dos priors e piora o ajuste. **Nenhum foi mantido.**

**Causa provável.** Compressão do CMB. Na Tabela V do artigo do DESI DR2 (DESI Collaboration, Phys. Rev. D 112, 083515, 2025, DOI 10.1103/tr6y-kpc6; arXiv:2503.14738v3), bloco ΛCDM, a linha **DESI+BBN+θ∗** dá Ω_m = 0,2967 ± 0,0045 e **H₀ = 68,45 ± 0,47** km/s/Mpc. Nessa combinação o CMB entra só pelo ângulo acústico θ* e ω_b vem da nucleossíntese (BBN): é a informação "geométrica" do CMB, sem o resto do espectro nem o lenteamento. O nosso H₀ = 68,69 fica a 0,5σ desse valor. Na mesma tabela, a linha DESI+CMB (CMB completo) dá 68,17 ± 0,28, de onde vem a diferença de 1,9σ. A informação que falta nos distance priors (sobretudo o lenteamento do CMB) é a mesma que eleva a preferência por w₀w_a de 2,4σ para 3,1σ no artigo do DESI (Tabela VI).

## 4. Previsão com sirenes: o Fisher não reproduz exatamente Belgacem et al. (2019) no ET

**Referência:** E. Belgacem et al., "Cosmology and dark energy from joint gravitational wave-GRB observations", JCAP 08, 015 (2019), DOI [10.1088/1475-7516/2019/08/015](https://doi.org/10.1088/1475-7516/2019/08/015), Tabelas 4 e 11 (Einstein Telescope + THESEUS, massas planas, cenário otimista).

**O que o artigo usa.** As colunas "ET, flat" são só sirenes: CMB, BAO e supernovas entram em colunas separadas ("CMB+BAO+SNe" e "combined"). O universo de referência é ΛCDM com Ω_m = 0,3087 e H₀ = 67,64 km/s/Mpc (a média do CMB + BAO + SNe deles). Os números vêm de uma MCMC com CLASS, nos seis parâmetros do ΛCDM, mais w constante na Tabela 11 (w_a = 0, Ξ₀ = 1). A soma das massas dos neutrinos é fixa em 0,06 eV. A MCMC roda sobre **um único catálogo sorteado**, com ruído. Os priors não são informados.

**Comparação** (Fisher do app, `physics/sirens.ts`; MCMC em 40 catálogos com ruído, `scripts/investigacao_belgacem.py`):

| Grandeza | Publicado | Fisher | MCMC, 40 catálogos (mediana; faixa) |
|---|---|---|---|
| σ(H₀)/H₀, ΛCDM | 0,28% | 0,276% | 0,275% |
| σ(Ω_m)/Ω_m, ΛCDM | 3,68% | 4,39% | 4,35%; 4,06% a 4,71% |
| σ(w₀), wCDM | 0,109 | 0,153 | 0,148; 0,088 a 0,192 (3 de 40 catálogos ≤ 0,109) |

**Conclusão.**
- **w₀:** a diferença cabe na dispersão entre catálogos. A largura da posterior de um catálogo único pode sair menor que o Fisher. O limite de Cramér-Rao vale para a variância média entre realizações, não para a posterior de um catálogo só.
- **Ω_m no ΛCDM:** nenhum dos 40 catálogos chega a 3,68%, e a causa **não foi identificada**.
  - A dispersão do erro instrumental dentro de cada faixa de z (Tabela 24) explica só ~4%: dá 4,21%.
  - Sem o termo de lentes, Ω_m sai 3,73%, mas o H₀ cai para 0,247% e deixa de bater com os 0,28% publicados.
  - O mais provável é o catálogo evento a evento, que o artigo só resume por faixa.
- **Consequência:** os erros do app no ET são iguais ou um pouco maiores que os publicados, e a separação prevista (~6,8σ no ET otimista) é, se algo, conservadora.
