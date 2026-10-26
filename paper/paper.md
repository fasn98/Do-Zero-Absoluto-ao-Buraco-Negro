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
  - name:
      given-names: Fabio Augusto
      surname: Sales Nogueira
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

The content is organized in two tracks. The first, *From absolute zero to the black hole*, uses a temperature ruler from 1 nK to the Planck temperature and twelve modules, from Bose–Einstein condensation [@anderson1995] and the thermodynamic cost of erasing a bit [@landauer1961] to stellar fusion [@adelberger2011], Hawking radiation [@hawking1974], gravitational-wave standard sirens [@abbott2017], decoherence [@zurek2003], the cosmological constant problem [@weinberg1989] and the debate on quantum effects in the brain [@tegmark2000; @donadi2021]. The second, *Origin and fate of the universe*, uses a cosmic-time ruler and five of five modules: the cosmic timeline from the Friedmann equation, the possible fates of a universe with different kinds of dark energy, a confrontation of those scenarios with real data from DESI DR2 [@desi2025], Planck 2018 [@planck2020; @chen2019] and Union3 [@rubin2025], inflation and primordial perturbations, and a closing module on open questions and the far future, including the Gibbons–Hawking temperature of the cosmological horizon [@gibbons1977]. A separate section of Module 2.3, built only from published forecasts and never mixed with the real data, asks whether future gravitational-wave standard sirens from LISA and the Einstein Telescope could take the dark-energy question to 5σ.

# Statement of need

The app is aimed at upper secondary and undergraduate students, at teachers who want classroom material, and at Portuguese speakers interested in physics beyond the introductory curriculum. We found few interactive simulations in Portuguese on modern physics at extreme scales (near absolute zero, black holes, the early and far-future universe), and popular material on these topics often mixes measured facts with speculation. Each module therefore labels its claims as *established fact*, *consensus* or *research hypothesis*, and ends with a section on what the model leaves out, followed by references whose DOIs were checked.

PhET Interactive Simulations [@wieman2008] is the reference point for research-based physics simulations and is available in Portuguese; its HTML5 catalog (122 simulations, consulted on 26 October 2026) includes related topics such as blackbody radiation and quantum measurement, but we found none titled on cosmology, dark energy or black holes. This app is complementary: it covers those extreme-scale topics and makes the level of evidence explicit.

Others can adopt the app directly in the browser, with no installation. Modules are independent pages with stable URLs, so a teacher can assign a single module; several simulations accept URL parameters that open a specific state. Code is MIT-licensed and texts, figures and screenshots are CC BY 4.0, so modules can be translated, adapted or embedded.

# Design and verification

All physics lives in pure TypeScript functions, separated from the interface and tested with Vitest against published reference values, with a 2% tolerance unless stated (230 tests at version 1.1.0). Fundamental constants come from a single file (CODATA 2022, IAU 2015).

Module 2.3 reproduces a published analysis: the profile likelihood of the CPL dark-energy parameters ($w_0$, $w_a$) from DESI DR2 baryon acoustic oscillations, Planck 2018 distance priors [@chen2019] and compressed Union3 supernovae. An independent Python script recomputes the same $\chi^2$ (agreement better than 0.1 at fixed points), and its Markov chains reproduce the DESI DR2 means for DESI + CMB: $w_0 = -0.41 \pm 0.21$ versus $-0.42 \pm 0.21$, $w_a = -1.76 \pm 0.62$ versus $-1.75 \pm 0.58$ [@desi2025]. Our 2.4σ preference for evolving dark energy matches DESI's value with a similarly compressed CMB prior; their 3.1σ needs CMB lensing.

A versioned script renders changed pages at 360 px and desktop widths and extracts the displayed values for checking.

# Experience of use

> **TODO (Fabio): fatos reais de uso.**

# Story of the project

The project started in October 2026 on Replit, as a set of simulations about temperature extremes. The Track 1 modules were written first, one task specification at a time; the specifications are kept in `docs/prompts/`. A second track on cosmology followed, built in phases: the Friedmann solver, the dark-energy scenarios, and finally the confrontation with real data, which was validated in Python before any interface was written. Version 1.0.0 was archived on Zenodo on 26 October 2026; version 1.1.0 completes the second track with the modules on inflation and on the open questions at the frontier.

The author, a postgraduate student in astronomy, built it as a step towards a longer-term goal: open simulation tools in which learners can test, with established physics and real data, competing scenarios for the origin and fate of the universe.

# AI usage disclosure

Generative AI was used extensively. Replit Agent (Replit; version and model not recorded) generated the initial workspace and skeleton: template, interface components, first constants and a first calculation module with tests. All later work used Claude Code (Anthropic) with Claude Opus 5.5, as recorded in the commit trailers; session logs record Claude Code 2.1.310 for 26 October 2026, and earlier sessions used the then-current release, version not recorded. Claude Code wrote the source code (physics, tests, interface, Python validation and screenshot scripts), drafted the Portuguese page texts, searched for and checked references and DOIs, and drafted this paper and the documentation.

The task specifications in `docs/prompts/` were drafted by Claude (Anthropic, Claude Opus 5.5, in the claude.ai chat interface) in conversation with the author, who set the goals, chose the topics, defined the evidence-labelling rule and the requirement to reproduce published values, and approved, rejected or corrected each specification. Verification was largely automated and itself AI-assisted: automated tests against published values; an independent Python recomputation of the cosmological likelihood checked against published DESI results; DOI resolution and metadata checks; screenshots at two widths; and a separate Claude conversation that cross-checked each Claude Code report and its numbers. The author directed this process, read every report, inspected the screenshots, requested corrections and decided what was published. Corrections found along the way are recorded in the repository, for example the tubulin dimer mass (99.8 kDa, from UniProt), the synaptic delay (150 μs) and the issues found in @chen2019.

# Acknowledgements

> **TODO (Fabio).**

# References
