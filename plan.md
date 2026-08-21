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
| 01   | `frontend/steps/01-hello` | —                        | Setup check — module import, CSS import, hot reload                  |
| 02   | —                         | —                        | TBD                                                                  |
| 03   | —                         | —                        | TBD                                                                  |
| …    | —                         | —                        | TBD                                                                  |

Attendees code in `frontend/workspace/`; each `steps/NN-*` folder is an
independently runnable snapshot they can jump to if they fall behind.

The backend is currently a single `backend/server.js` with no `workspace/` or
`steps/` folders. If backend steps are added, the numbering will line up with the
frontend — a given number means the same thing on both sides. Not every step
needs both sides.

## Setup decisions

| Decision              | Choice                                                                                 | Why                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Package manager       | npm                                                                                    | Ships with Node; nothing extra for attendees to install                                               |
| Dependency layout     | One root `package.json` for both sides, Vite invoked with a root argument (`vite frontend/workspace`) | Single `npm install`, one lockfile, no nested `node_modules`                            |
| Repo layout           | `frontend/` with `workspace/` + `steps/`; `backend/` a single server file              | Neither side is the implicit default; the backend is small enough not to need steps yet               |
| Build tool (frontend) | Vite (dev dependency only)                                                             | Instant hot reload, ES modules, no config file needed                                                 |
| Backend runtime       | Express + `http-proxy-middleware` + `dotenv`                                            | A hand-rolled proxy is more code to explain than the middleware call it replaces                      |
| Backend restart       | `node --watch`                                                                         | Built in; no nodemon. Stable from Node 22, hence the version bump                                     |
| Backend port          | `8080`, overridable via `PORT`                                                         | Clear of Vite's 5173                                                                                  |
| Cross-origin          | `Access-Control-Allow-Origin: *` injected by the proxy, overriding the upstream's | Keeps the "no `vite.config.js`" decision — no dev proxy needed                                         |
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
- [ ] Do we need to answer CORS preflights locally? `Access-Control-Allow-Origin: *`
      is injected, which covers plain `GET`s, but an `OPTIONS` preflight is still
      forwarded upstream. Only matters if a step sends a JSON body or a custom
      header from the browser.
