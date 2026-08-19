# Workshop Plan

Living document. Sections marked **TBD** are still open.

## Overview

| Item                        | Value                           |
| --------------------------- | ------------------------------- |
| Event                       | FOSS4G 2026                     |
| Topic                       | Re:Earth CMS frontend + backend |
| Audience                    | TBD                             |
| Duration                    | TBD                             |
| Prerequisites for attendees | Basic HTML / CSS / JavaScript   |

## Sample app scope — TBD

Not decided yet. Candidates discussed so far:

1. **Fetch & render CMS items** — call the Re:Earth CMS public API and render items as a list or cards. Pure `fetch` + DOM, no map.
2. **CMS items on a map** — same fetch, but render items with geometry on a map (MapLibre or Cesium). Heavier, but a better fit for a FOSS4G audience.

Decide this before writing any step beyond `01`.

The backend's role is also open beyond the step 01 ping check — see *Open questions*.

## Steps

| Step | Frontend folder           | Backend folder           | Content                                                              |
| ---- | ------------------------- | ------------------------ | -------------------------------------------------------------------- |
| 01   | `frontend/steps/01-hello` | `backend/steps/01-hello` | Setup check — module import, CSS import, hot reload; `GET /api/ping` |
| 02   | —                         | —                        | TBD                                                                  |
| 03   | —                         | —                        | TBD                                                                  |
| …    | —                         | —                        | TBD                                                                  |

Attendees code in `frontend/workspace/` and `backend/workspace/`; each
`steps/NN-*` folder is an independently runnable snapshot they can jump to if they
fall behind. Step numbers line up across both sides — a given number means the same
thing on the frontend and on the backend.

Not every step needs both sides. A frontend-only step simply has no backend folder.

## Setup decisions

| Decision              | Choice                                                                                 | Why                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Package manager       | npm                                                                                    | Ships with Node; nothing extra for attendees to install                                               |
| Dependency layout     | One root `package.json`, Vite invoked with a root argument (`vite frontend/workspace`) | Single `npm install`, no duplicated `node_modules` per step                                           |
| Repo layout           | `frontend/` and `backend/`, each with `workspace/` + `steps/`                          | Symmetric; neither side is the implicit default                                                       |
| Build tool (frontend) | Vite (dev dependency only)                                                             | Instant hot reload, ES modules, no config file needed                                                 |
| Backend runtime       | Node.js built-in `node:http`, zero dependencies                                        | Attendees see the raw request/response, nothing to explain                                            |
| Backend restart       | `node --watch`                                                                         | Built in; no nodemon. Stable from Node 22, hence the version bump                                     |
| Backend port          | `8787`, overridable via `PORT`                                                         | Clear of Vite's 5173                                                                                  |
| Cross-origin          | `Access-Control-Allow-Origin: *` sent by the backend                                   | Keeps the "no `vite.config.js`" decision — no dev proxy needed                                        |
| Running both          | Two terminals (`dev:web`, `dev:api`)                                                   | A single `&`-chained script runs sequentially on Windows; doing it portably needs an extra dependency |
| Language              | Plain JavaScript                                                                       | Keeps the workshop about the content, not the toolchain                                               |
| Config                | No `vite.config.js`                                                                    | Nothing to explain                                                                                    |

Deliberately out of scope: TypeScript, linters/formatters, tests, CI, frameworks.

## Open questions

- [ ] What does the sample app do? (see *Sample app scope*)
- [ ] What does the backend do beyond the step 01 ping check — CMS proxy that hides the API token, offline fallback data, a write path? Tied to the API key question below.
- [ ] Which Re:Earth CMS instance and project do attendees use? Is an API key or token needed?
- [ ] How many steps, and how long is each?
- [ ] Language of the workshop and of the code comments (English / Japanese)?
- [ ] Is offline fallback data needed in case venue Wi-Fi fails?
