# Do Zero Absoluto ao Buraco Negro

Aplicação educativa em português do Brasil sobre termodinâmica e física
quântica, com onze módulos interativos. Toda simulação usa apenas física
estabelecida; cada módulo termina com "O que este modelo deixa de fora" e
referências, e cada afirmação é marcada como **fato estabelecido**,
**consenso** ou **hipótese em pesquisa**.

## Executar

No workspace pnpm:

```bash
pnpm --filter @workspace/zero-absoluto run dev
```

Verificar os tipos e executar os testes:

```bash
pnpm --filter @workspace/zero-absoluto run typecheck
pnpm --filter @workspace/zero-absoluto run test
```

O build exige as variáveis `PORT` e `BASE_PATH` (definidas em `.replit-artifact/artifact.toml`):

```bash
PORT=19201 BASE_PATH=/ pnpm --filter @workspace/zero-absoluto run build
```

## Estrutura

- `src/App.tsx`: página inicial (régua de temperatura), navegação e rotas.
- `src/modules/ModulePage.tsx`: estrutura comum dos módulos (limitações e referências).
- `src/modules/shared.tsx`: controles (escala log, atalhos), selos de evidência, laço de Canvas.
- `src/modules/Plot.tsx`: gráfico de linhas em SVG próprio, sem biblioteca de gráficos.
- `src/modules/temperatureBands.ts`: qual módulo descreve cada faixa de temperatura.
- `src/modules/<modulo>/Page.tsx`: interface de cada módulo.
- `src/lib/format.ts`: formatação pt-BR, incluindo números a partir de log₁₀ (ex.: 10⁻¹⁹³).
- `src/physics/constants.js`: **única** fonte de constantes (CODATA 2022, IAU 2015, PDG, AME 2020), com unidade e fonte.
- `src/physics/*.ts`: funções físicas puras, uma por módulo, cada uma com `*.test.ts`.
- `src/physics/holography.ts`, `pageCurve.ts`, `gravityEntanglement.ts`: física do Módulo 7.
- `src/physics/gravitationalWaves.ts`, `hubble.ts`: física do Módulo 8.
- `src/physics/unification.ts`: física do Módulo 9.
- `src/physics/decoherence.ts`, `diosiPenrose.ts`: física do Módulo 10.
- `src/physics/vacuumEnergy.ts`: física do Módulo 11.
- `src/physics/logmath.ts`: log-sum-exp, integração em malha logarítmica, ln Γ e ln C(n, k).

Os testes comparam com valores de referência com tolerância de 2%.

## Física por módulo

### Tela inicial: régua de temperatura

Escala logarítmica de 1 nK até a temperatura de Planck, T_P = 1,416784 × 10³² K.
Para cada temperatura, `modulesForTemperature` lista os módulos relevantes (por
exemplo, a massa de buraco negro com aquela temperatura de Hawking ou o custo de
Landauer). Acima de ~10¹² K, mostra só contexto com nível de evidência.

### Módulo 1: Perto do zero absoluto (`quantumGas.ts`)

- Comprimento de onda térmico: λ = h / √(2π m k T)
- Densidade no espaço de fase: n·λ³; condensação em n·λ³ = ζ(3/2) ≈ 2,612
- Temperatura crítica: T_c = (2πħ² / (m k)) (n / ζ(3/2))^(2/3)
- Fração condensada (gás ideal uniforme): 1 − (T/T_c)^(3/2)
- Energia de ponto zero: E₀ = ½ħω
- Velocidades de Maxwell-Boltzmann: cada componente gaussiana com σ = √(kT/m)
- Átomo: rubídio-87; densidade fixada para T_c = 170 nK.

### Módulo 2: Entropia e informação (`entropy.ts`)

- S = k ln W, com W = C(N, N_esq) (sempre em ln W)
- Probabilidade de todas as partículas numa metade: 2⁻ᴺ
- Expansão livre de 1 mol: ΔS = R ln 2
- Demônio de Maxwell, gás 2D: S/k = Σ Nᵢ ln Tᵢ + ln C(N, N_esq) + const.; cada observação = 1 bit
- Princípio de Landauer: E_min = kT ln 2 por bit apagado (≈ 2,87 × 10⁻²¹ J a 300 K)

### Módulo 3: Por que o Sol brilha (`gamow.ts`)

- Energia de Gamow: E_G = 2 m_r c² (π α Z₁Z₂)² (p+p ≈ 493 keV)
- Pico de Gamow: E₀ = (E_G (kT)² / 4)^(1/3); largura Δ = (4/√3) √(E₀ kT)
- Taxa relativa: (kT)^(−3/2) ∫ exp(−E/kT − √(E_G/E)) dE, normalizada pela mesma reação a 15,7 milhões K, com S(E) constante; integral em malha logarítmica com log-sum-exp
- Barreira de Coulomb: αħc · Z₁Z₂ / r ≈ 1,44 MeV·fm × Z₁Z₂ / r, r = 1,2 (A₁^(1/3) + A₂^(1/3)) fm
- Previsão clássica: exp(−barreira/kT); quântica no pico: exp(−√(E_G/E₀))
- Energia da reação D+T a partir das massas CODATA: Q ≈ 17,59 MeV
- Teste extra: a integral numérica concorda com a aproximação gaussiana corrigida, (√π/2) Δ e^(−τ) (1 + 5/(12τ)), com τ = 3E₀/kT.

### Módulo 4: Fusão a frio e fusão por múons (`muonCatalysis.ts`, reusa `gamow.ts`)

- Tunelamento D+D a 300 K pela física do Módulo 3 (E_G(D+D) ≈ 0,986 MeV)
- Raio de Bohr: a = ħ / (m_r c α); encolhimento da molécula = m_r(μ, d) / m_r(e, d) ≈ 196 (m_μ/m_e ≈ 207)
- Fusões antes da aderência: ≈ 1/ω_s, com ω_s ≈ 0,4% a 0,9%
- Balanço: n × 17,59 MeV contra ~5 GeV por múon (estimativa da literatura); empate em ~284 fusões
- Vida média do múon: τ = 2,197 μs

### Módulo 5: A temperatura dos buracos negros (`blackHole.ts`)

- Temperatura de Hawking: T = ħc³ / (8πGMk) (1 M☉ ≈ 6,2 × 10⁻⁸ K)
- Raio de Schwarzschild: r_s = 2GM/c²; área A = 4π r_s²
- Entropia de Bekenstein-Hawking: S = k c³ A / (4 G ħ) (1 M☉ ≈ 10⁷⁷ k)
- Evaporação (só fótons): t ≈ 5120 π G² M³ / (ħ c⁴) (1 M☉ ≈ 2,1 × 10⁶⁷ anos)
- Massa com temperatura T: M = ħc³ / (8πGkT) (T da radiação de fundo → ≈ 4,5 × 10²² kg)

### Módulo 6: O nascimento do Sol (`stellar.ts`)

- Kelvin-Helmholtz: t_KH = G M² / (R L) (Sol atual ≈ 3,1 × 10⁷ anos)
- Queda livre: t_ff = √(3π / (32 G ρ))
- Sol jovem fraco, Gough (1981): L(t) = L☉ / (1 + 0,4 (1 − t / 4,57 × 10⁹ anos)) (t = 0 → ≈ 0,71 L☉)
- As fases da linha do tempo (0 a 100 milhões de anos) são texto com nível de evidência; a cena é esquemática e não simula a luminosidade antes da sequência principal.

### Módulo 7: A gravidade guarda informação (`holography.ts`, `pageCurve.ts`, `gravityEntanglement.ts`)

- Comprimento de Planck: l_P = √(ħG/c³) ≈ 1,616 × 10⁻³⁵ m
- Limite holográfico de uma esfera: S_máx/k = A / (4 l_P²), A = 4πR² (R = 1 m → 1,20 × 10⁷⁰; em bits, ÷ ln 2)
- Contagem ilustrativa por volume: (4/3)πR³ / l_P³ bits, acima do limite holográfico a partir de R ≈ 1,08 l_P
- Limite de Bekenstein: S/k ≤ 2πRE/(ħc), E = mc² (1 kg em 1 m → 1,79 × 10⁴³); no raio de Schwarzschild coincide com a entropia de Bekenstein-Hawking
- Curva de Page (modelo idealizado): M = M₀(1 − t/t_evap)^(1/3), S_BH = S₀(M/M₀)²; Hawking: S₀ − S_BH; Page: mín(S₀ − S_BH, S_BH); tempo de Page t = (1 − 2^(−3/2)) t_evap ≈ 0,646 t_evap
- Emaranhamento mediado pela gravidade: φ = G m² τ / (ħ d) (10⁻¹⁴ kg, 200 µm, 2,5 s → 0,791 rad); esferas de diamante (3.510 kg/m³) e comparação com o recorde de superposição (~25.000 u, Fein et al. 2019)

### Módulo 8: Ouvindo o universo se expandir (`gravitationalWaves.ts`, `hubble.ts`)

- Massa de chirp: 𝓜 = (m₁m₂)^(3/5) / (m₁ + m₂)^(1/5) (36 + 29 M☉ → 28,1 M☉ na fonte; × (1 + z) ≈ 30,6 M☉ no detector)
- Tempo até a fusão: τ(f) = (5/256)(G𝓜/c³)^(−5/3)(πf)^(−8/3) (35 Hz, 𝓜 = 30 M☉ → 0,170 s); inverso f(τ); fase Φ(τ) = −2(τ/(5G𝓜/c³))^(5/8)
- Forma de onda h ∝ f^(2/3) cos Φ, normalizada para o pico medido de GW150914 (~10⁻²¹), até f_ISCO = c³ / (6^(3/2) π G M) (M = 65 × 1,09 M☉ → 62 Hz)
- Lei de Hubble: H₀ = v / d (GW170817: 3.017 km/s, 43,8 Mpc → 68,9 km/s/Mpc; publicado 70 +12 −8)
- Discrepância entre medições: |a − b| / √(σa² + σb²), com o lado da barra voltado para a outra medição quando assimétrica (Planck × SH0ES ≈ 4,9σ; Planck × CCHP ≈ 1,6σ)

### Módulo 9: As forças convergem? (`unification.ts`)

- Insumos em M_Z = 91,1879 GeV (MS-barra): α_em⁻¹ = 127,930 (PDG 2024), sen²θ_W = 0,23122 e α_s = 0,1180 (PDG 2026)
- Normalização de grande unificação: α₁⁻¹ = (3/5) cos²θ_W α_em⁻¹ ≈ 59,0; α₂⁻¹ = sen²θ_W α_em⁻¹ ≈ 29,6; α₃⁻¹ = 1/α_s ≈ 8,47
- Um laço: α_i⁻¹(μ) = α_i⁻¹(M_Z) − (b_i/2π) ln(μ/M_Z); Modelo Padrão b = (41/10, −19/6, −7); MSSM b = (33/5, 1, −3) acima de M_SUSY
- Modelo Padrão: cruzamentos em 1,03 × 10¹³, 2,4 × 10¹⁴ e 9,6 × 10¹⁶ GeV; MSSM (M_SUSY = 1 TeV): entre ~1 e 2,5 × 10¹⁶ GeV, α⁻¹ ≈ 25,6–26,0
- Gravidade: E_Planck = √(ħc⁵/G) ≈ 1,22 × 10¹⁹ GeV; α_G = (E/E_Planck)² (2 × 10¹⁶ GeV → 2,7 × 10⁻⁶)

### Módulo 10: Onde o quântico vira clássico (`decoherence.ts`, `diosiPenrose.ts`)

- Decoerência por espalhamento, regime de comprimento de onda longo: τ_D = 1/(Λ Δx²), com Λ (cm⁻² s⁻¹) da tabela de Joos e Zeh (1985), reproduzida em Joos, arXiv:quant-ph/9908008
- Regime: vale se Δx for menor que o comprimento de onda típico do ambiente (pico de Wien b/T para fótons; de Broglie térmico h/√(2πmkT) do ar a 300 K para o gás); acima disso a decoerência satura e nenhum número é mostrado
- Recordes de superposição: elétron, nêutron, C₆₀ (720 u), ~25.000 u (Fein et al. 2019); do recorde ao alvo de 10⁻¹⁴ kg: ≈ 8,4 ordens de grandeza
- Diósi-Penrose, esfera homogênea: E_G = G m² (6/(5R) − 1/d) para d ≥ 2R; (G m²/R)(2λ² − (3/2)λ³ + (1/5)λ⁵), λ = d/(2R), para d < 2R; τ ≈ ħ/E_G (10⁻¹⁴ kg de diamante a 250 µm → 11,6 ms)

### Módulo 11: A pior previsão da física (`vacuumEnergy.ts`)

- Observado (Planck 2018, H₀ = 67,4 km/s/Mpc, Ω_Λ = 0,685): ρ_c = 3H₀²/(8πG) ≈ 8,53 × 10⁻²⁷ kg/m³; ρ_Λ = Ω_Λ ρ_c ≈ 5,85 × 10⁻²⁷ kg/m³; u_Λ = ρ_Λ c² ≈ 5,25 × 10⁻¹⁰ J/m³
- Previsto (um campo, corte abrupto): u_vac = ħ c k_máx⁴/(16π²), k_máx = E_corte/(ħc); corte de Planck → 2,93 × 10¹¹¹ J/m³, razão ≈ 10^120,7
- Corte que reproduz u_Λ ≈ 7,9 meV (λ = 2π/k ≈ 0,156 mm); densidade de Planck c⁷/(ħG²) ≈ 4,63 × 10¹¹³ J/m³ (razão ≈ 10^122,9)
- Casimir, placas ideais: P = π²ħc/(240 d⁴) (1 µm → 1,30 × 10⁻³ Pa)

