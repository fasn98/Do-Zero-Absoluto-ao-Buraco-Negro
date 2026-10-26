---
title: 'Do zero absoluto ao buraco negro: interactive simulations of modern physics at extreme scales, with explicit evidence levels, for Portuguese-speaking learners'
tags:
  - physics education
  - simulations
  - thermodynamics
  - cosmology
  - open educational resources
  - TypeScript
authors:
  - name: Fabio Augusto Sales Nogueira
    orcid: 0009-0001-9303-8707
    affiliation: 1
affiliations:
  - name: Independent researcher, São Paulo, Brazil
    index: 1
date: 26 October 2026
bibliography: paper.bib
---

# Summary

*Do zero absoluto ao buraco negro* ("From absolute zero to the black hole") is an open web application in Brazilian Portuguese that teaches modern physics through interactive simulations. It runs in any browser at <https://do-zero-absoluto-ao-buraco-negro.replit.app> and is archived on Zenodo [@zenodo2026] (concept DOI 10.5281/zenodo.23674690).

The content is organized in two tracks. The first, *From absolute zero to the black hole*, uses a temperature ruler from 1 nK to the Planck temperature and twelve modules, from Bose–Einstein condensation [@anderson1995] and the thermodynamic cost of erasing a bit [@landauer1961] to stellar fusion [@adelberger2011], Hawking radiation [@hawking1974], gravitational-wave standard sirens [@abbott2017], decoherence [@zurek2003], the cosmological constant problem [@weinberg1989] and the debate on quantum effects in the brain [@tegmark2000; @donadi2021]. The second, *Origin and fate of the universe*, uses a cosmic-time ruler and currently offers three of five planned modules: the cosmic timeline from the Friedmann equation, the possible fates of a universe with different kinds of dark energy, and a confrontation of those scenarios with real data from DESI DR2 [@desi2025], Planck 2018 [@planck2020; @chen2019] and Union3 [@rubin2025].

# Statement of need

The app is aimed at upper secondary and undergraduate students, at teachers who want classroom material, and at Portuguese speakers interested in physics beyond the introductory curriculum. Interactive simulations of modern physics and of extreme scales (near absolute zero, black holes, the early and far-future universe) are scarce in Portuguese, and popular material on these topics often mixes measured facts with speculation. Each module therefore labels its claims as *established fact*, *consensus* or *research hypothesis*, and ends with a section on what the model leaves out, followed by references whose DOIs were checked.

PhET Interactive Simulations [@wieman2008] is the reference point for research-based physics simulations and is available in Portuguese; its HTML5 catalog (122 simulations, consulted on 26 October 2026) includes related topics such as blackbody radiation and quantum measurement, but we found none titled on cosmology, dark energy or black holes. This app is complementary: it covers those extreme-scale topics and makes the level of evidence explicit.

Others can adopt the app directly in the browser, with no installation. Modules are independent pages with stable URLs, so a teacher can assign a single module; several simulations accept URL parameters that open a specific state. Code is MIT-licensed and texts, figures and screenshots are CC BY 4.0, so modules can be translated, adapted or embedded.

# Design and verification

All physics lives in pure TypeScript functions, separated from the interface. Each function is tested with Vitest against reference values from the literature, with a 2% tolerance unless stated (192 tests at version 1.0.0). Fundamental constants come from a single file (CODATA 2022, IAU 2015).

Module 2.3 reproduces a published analysis instead of illustrating one. It computes the profile likelihood of the CPL dark-energy parameters ($w_0$, $w_a$) from DESI DR2 baryon acoustic oscillations, Planck 2018 distance priors [@chen2019] and compressed Union3 supernovae, on a grid evaluated in a Web Worker. An independent Python script recomputes the same $\chi^2$ without the TypeScript code; both agree to better than 0.1 at fixed points, and its Markov chains reproduce the published DESI DR2 means: $w_0 = -0.41 \pm 0.21$ versus $-0.42 \pm 0.21$, and $w_a = -1.76 \pm 0.62$ versus $-1.75 \pm 0.58$, for DESI + CMB [@desi2025]. The preference for evolving dark energy (2.4σ) matches the value DESI reports with a similarly compressed CMB prior; the larger published value (3.1σ) requires CMB lensing, which compressed priors do not carry. The repository documents these comparisons and the issues found in the sources, such as a typo in one fitting coefficient of @chen2019.

A versioned screenshot script renders changed pages at 360 px and desktop widths and extracts the values displayed, which were compared with the reference values for each new module.

# Experience of use

> **TODO (Fabio): fatos reais de uso.**

# Story of the project

The project started in October 2026 on Replit, as a set of simulations about temperature extremes. The Track 1 modules were written first, one task specification at a time; the specifications are kept in `docs/prompts/`. A second track on cosmology followed, built in phases: the Friedmann solver, the dark-energy scenarios, and finally the confrontation with real data, which was validated in Python before any interface was written. Version 1.0.0 was archived on Zenodo on 26 October 2026.

> **TODO (Fabio): a motivação pessoal para o projeto, em uma ou duas frases.**

# AI usage disclosure

Generative AI was used extensively. The initial workspace and application skeleton (template, interface components, first constants and a first calculation module with tests) were generated by Replit Agent (Replit; the version and underlying model are not recorded in the repository). All subsequent work was done with Claude Code (Anthropic) using the Claude Opus 5.5 model, as recorded in the commit trailers; the session logs record Claude Code 2.1.310 for the work of 26 October 2026, while earlier sessions installed the then-current release, whose exact version was not recorded. Claude Code wrote the source code (physics functions, tests, interface, the Python validation script and the screenshot script), drafted the Portuguese texts of the pages, searched for and checked references and DOIs, and drafted this paper and the repository documentation.

> **TODO (Fabio): os enunciados em `docs/prompts/` foram redigidos com ajuda de algum assistente de IA? Se sim, qual e em que versão.**

The author wrote the task specifications that set the scope of each module, the physics conventions, the evidence-labelling rule and the reference values to be reproduced, and made the primary design decisions. The author reviewed, modified and validated all AI-generated content. Concretely: automated tests compare every physics function with published values; the cosmological likelihood is recomputed independently in Python and checked against published results; screenshots of changed pages were inspected at two widths; every DOI was resolved and its metadata compared with the cited reference; and corrections found along the way are recorded in the repository, for example the tubulin dimer mass (corrected to 99.8 kDa from UniProt), the synaptic delay (150 μs) and the issues in @chen2019.

# Acknowledgements

> **TODO (Fabio).**

# References
