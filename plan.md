# Workshop Plan

Living document. Sections marked **TBD** are still open.

## Overview

| Item                        | Value                           |
| --------------------------- | ------------------------------- |
| Event                       | FOSS4G 2026                     |
| Location                    | Hiroshima, Japan                |
| Topic                       | Re:Earth CMS frontend + backend |
| Audience                    | TBD                             |
| Duration                    | 3hr                             |
| Prerequisites for attendees | Basic HTML / CSS / JavaScript   |

## Sample app scope

**A citizen hazard-report map for Hiroshima** — read *and* write. Ported from
the internal `kobe-map-server` demo, whose frontend was one 2200-line
`index.html`, and rethemed for the host city.

- Leaflet map (GSI pale tiles) with one marker per report, keyed by category.
- A form that posts a new report: category, a location picked by clicking the
  map, title, description, up to four photos.
- A list tab with category filters, a detail modal, and a stats panel.
- Demo data when the CMS is unreachable, so the sample runs offline.

The finished app lives in `frontend/steps/final`. Steps `02`…`NN` get derived
from it by working backwards.

The backend keeps its single role: an auth injector. The frontend calls the CMS
endpoints directly through it, so the integration token never reaches the
browser. Workspace / project / model ids do sit in the frontend — they are not
secrets, and saying so is part of the workshop.

## Steps

| Step | Frontend folder           | Backend folder      | Content                                                                     |
| ---- | ------------------------- | ------------------- | --------------------------------------------------------------------------- |
| 01   | `frontend/steps/01-hello` | —                   | Setup check — module import, CSS import, hot reload                         |
| 02   | —                         | —                   | TBD                                                                         |
| 03   | —                         | —                   | TBD                                                                         |
| …    | —                         | —                   | TBD                                                                         |
| —    | `frontend/steps/final`    | `backend/server.js` | The finished app. Not a step of its own — the target the steps build toward |

Attendees code in `frontend/workspace/`; each `steps/NN-*` folder is an
independently runnable snapshot they can jump to if they fall behind.

The backend is currently a single `backend/server.js` with no `workspace/` or
`steps/` folders. If backend steps are added, the numbering will line up with the
frontend — a given number means the same thing on both sides. Not every step
needs both sides.

## Setup decisions

| Decision              | Choice                                                                                                | Why                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager       | npm                                                                                                   | Ships with Node; nothing extra for attendees to install                                                                                     |
| Dependency layout     | One root `package.json` for both sides, Vite invoked with a root argument (`vite frontend/workspace`) | Single `npm install`, one lockfile, no nested `node_modules`                                                                                |
| Repo layout           | `frontend/` with `workspace/` + `steps/`; `backend/` a single server file                             | Neither side is the implicit default; the backend is small enough not to need steps yet                                                     |
| Build tool (frontend) | Vite (dev dependency only)                                                                            | Instant hot reload, ES modules, no config file needed                                                                                       |
| Backend runtime       | Express + `http-proxy-middleware` + `dotenv`                                                          | A hand-rolled proxy is more code to explain than the middleware call it replaces                                                            |
| Backend restart       | `node --watch`                                                                                        | Built in; no nodemon. Stable from Node 22, hence the version bump                                                                           |
| Backend port          | `8080`, overridable via `PORT`                                                                        | Clear of Vite's 5173                                                                                                                        |
| Cross-origin          | `Access-Control-Allow-Origin: *` injected by the proxy, overriding the upstream's                     | Keeps the "no `vite.config.js`" decision — no dev proxy needed                                                                              |
| Running both          | Two terminals (`dev:web`, `dev:api`)                                                                  | A single `&`-chained script runs sequentially on Windows; doing it portably needs an extra dependency                                       |
| Language              | Plain JavaScript                                                                                      | Keeps the workshop about the content, not the toolchain                                                                                     |
| Styling               | Tailwind via the browser CDN (`@tailwindcss/browser@4`)                                               | No build step, no config file, no runtime dependency — and no CSS file, since its DOM observer styles the runtime-built Leaflet markers too |
| Map library           | Leaflet 1.9 via the unpkg CDN                                                                         | Smaller and simpler to read aloud than MapLibre; keeps `package.json` free of frontend runtime deps                                         |
| Config                | No `vite.config.js`                                                                                   | Nothing to explain                                                                                                                          |

Deliberately out of scope: TypeScript, linters/formatters, tests, CI, frameworks.

## Open questions

- [x] What does the sample app do? — see *Sample app scope*.
- [x] What does the backend do beyond the step 01 ping check? — nothing more. It
      stays an auth injector; the frontend calls CMS endpoints through it.
- [x] Language of the workshop and of the code comments — English.
- [x] Is offline fallback data needed in case venue Wi-Fi fails? — yes. A failed
      read falls back to seven demo reports and the header badge flips to
      "Demo mode".
- [x] Do we need to answer CORS preflights locally? — yes. The item POST sends
      `Content-Type: application/json`, so `backend/server.js` now answers
      `OPTIONS` itself instead of forwarding it upstream.
- [ ] Which Re:Earth CMS project do attendees use? A Hiroshima project still has
      to be created. Every identifier in `frontend/steps/final/src/config.js` is
      a placeholder — the aliases for reading as well as the ids for writing —
      so the app runs on demo data until they are filled in.
- [ ] How many steps, and how long is each?
- [ ] Does the demo model's schema match the field keys and types in
      `toApiFields()` (`cms.js`)? Untested against a live project.
