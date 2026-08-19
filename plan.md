# Workshop Plan

Living document. Sections marked **TBD** are still open.

## Overview

| Item | Value |
| --- | --- |
| Event | FOSS4G 2026 |
| Topic | Re:Earth CMS frontend |
| Audience | TBD |
| Duration | TBD |
| Prerequisites for attendees | Basic HTML / CSS / JavaScript |

## Sample app scope — TBD

Not decided yet. Candidates discussed so far:

1. **Fetch & render CMS items** — call the Re:Earth CMS public API and render items as a list or cards. Pure `fetch` + DOM, no map.
2. **CMS items on a map** — same fetch, but render items with geometry on a map (MapLibre or Cesium). Heavier, but a better fit for a FOSS4G audience.

Decide this before writing any step beyond `01`.

## Steps

| Step | Folder | Content |
| --- | --- | --- |
| 01 | `steps/01-hello` | Setup check — module import, CSS import, hot reload |
| 02 | — | TBD |
| 03 | — | TBD |
| … | — | TBD |

Attendees code in `workspace/`; each `steps/NN-*` folder is an independently
runnable snapshot they can jump to if they fall behind.

## Setup decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Package manager | npm | Ships with Node; nothing extra for attendees to install |
| Dependency layout | One root `package.json`, Vite invoked with a root argument (`vite workspace`) | Single `npm install`, no duplicated `node_modules` per step |
| Build tool | Vite (dev dependency only) | Instant hot reload, ES modules, no config file needed |
| Language | Plain JavaScript | Keeps the workshop about the content, not the toolchain |
| Config | No `vite.config.js` | Nothing to explain |

Deliberately out of scope: TypeScript, linters/formatters, tests, CI, frameworks.

## Open questions

- [ ] What does the sample app do? (see *Sample app scope*)
- [ ] Which Re:Earth CMS instance and project do attendees use? Is an API key or token needed?
- [ ] How many steps, and how long is each?
- [ ] Language of the workshop and of the code comments (English / Japanese)?
- [ ] Is offline fallback data needed in case venue Wi-Fi fails?
