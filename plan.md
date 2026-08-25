# Workshop Plan

Living document. Sections marked **TBD** are still open.

## Overview

| Item                        | Value                           |
| --------------------------- | ------------------------------- |
| Event                       | FOSS4G 2026                     |
| Location                    | Hiroshima, Japan                |
| Topic                       | Re:Earth CMS frontend + backend |
| Audience                    | FOSS4G attendees — strong on geodata, light on JavaScript |
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

The finished app lives in `frontend/steps/final`. Steps `01`…`04` were derived
from it by working backwards, each one a superset of the step before it.

The backend keeps its single role: an auth injector. The frontend calls the
token-bearing CMS endpoints directly through it, so the integration token never
reaches the browser. The read is not one of them — the public API needs no auth,
so the browser calls the CMS itself and the map works with no backend running.
The workspace and project aliases and the model key do sit in the frontend —
they are not secrets, and saying so is part of the workshop. Both APIs take them,
so the top of `main.js` carries one set of identifiers rather than one per
path.

## Steps

| Step | Frontend folder             | Backend              | Content                                                                     | Min |
| ---- | --------------------------- | -------------------- | --------------------------------------------------------------------------- | --- |
| —    | —                           | —                    | Intro: what Re:Earth CMS is, demo of the finished app                       | 12  |
| 01   | `frontend/steps/01-map`     | —                    | Install, start the dev server, then Leaflet, GSI tiles and the controls     | 35  |
| —    | — (textbook)                | —                    | Build the CMS project: workspace, model, items, integration token           | 30  |
| —    | —                           | —                    | Break, doubling as catch-up buffer                                          | 10  |
| 02   | `frontend/steps/02-read`    | —                    | Public API read + demo fallback; raw response on screen                     | 20  |
| 03   | `frontend/steps/03-markers` | —                    | Normalise the response into markers; list, filters and stats come alive     | 25  |
| 04   | `frontend/steps/04-report`  | `backend/server.js`  | Token into `.env`, run and read the proxy, then POST the item through it    | 45  |
| —    | `frontend/steps/final`      | `backend/server.js`  | Wrap-up: photos, and where to go next. Not a step — the target              | 8   |
| —    | `frontend/steps/final`      | `backend/server.js`  | Bonus for fast finishers: photo upload via the assets endpoint              | —   |

Attendees code in `frontend/workspace/`; each `steps/NN-*` folder is an
independently runnable snapshot they can jump to if they fall behind.

**Only the code steps are numbered, and they run continuously** — `frontend/steps/`
reads `01 … 04` with no holes in it. The CMS setup is not a repo step because the
textbook covers it, and the proxy is not a step of its own because it has no
frontend folder; it opens step 04 instead. `final` is unnumbered: it is the
target, not a step, and the photo-upload bonus builds on it.

Typing load, counted as code lines added over the previous step, comments
excluded: 01 adds 49, 02 adds 44, 03 adds 90, 04 adds 112. Neither end is as
lopsided as it looks. Step 01 has 35 minutes because it also carries `npm
install` and the first dev server, and step 04 has 45 because its first 15 are
spent reading `backend/server.js` rather than typing. The middle two are the
only slack in the session once the break is spent.

The backend is a single `backend/server.js` with no `workspace/` or `steps/`
folders, and needs none — it is read, not written, and only step 04 touches it.

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
| Read path             | Public API called straight from the browser; only writes go through the injector                       | Nothing to hide on a read, so a proxy hop would only obscure the lesson — and the map then works with no backend and no token               |
| Running both          | Two terminals (`dev:web`, `dev:api`)                                                                  | A single `&`-chained script runs sequentially on Windows; doing it portably needs an extra dependency                                       |
| Language              | Plain JavaScript                                                                                      | Keeps the workshop about the content, not the toolchain                                                                                     |
| Styling               | Tailwind via the browser CDN (`@tailwindcss/browser@4`)                                               | No build step, no config file, no runtime dependency — and no CSS file, since its DOM observer styles the runtime-built Leaflet markers too |
| Map library           | Leaflet 1.9 via the unpkg CDN                                                                         | Smaller and simpler to read aloud than MapLibre; keeps `package.json` free of frontend runtime deps                                         |
| Config                | No `vite.config.js`                                                                                   | Nothing to explain                                                                                                                          |
| Given code            | Everything an attendee never edits lives in `frontend/common/` and is imported, not copied            | One source of truth for the markup, the rendering, the taxonomy and the demo data; a fix lands once instead of once per folder              |
| Shared markup         | `frontend/common/layout.html`, injected by `main.js` with Vite's `?raw`                                | Drops `index.html` from 229 duplicated lines per folder to a ~20-line shell, with no build step, no symlink and still no `vite.config.js`   |
| Step code             | One `main.js` per folder, no `src/`, each step a superset of the one before                                  | An attendee grows a single file and never moves code between files mid-session — the thing most likely to lose a JavaScript-light room      |
| Typed vs given        | Attendees write the config, the map, the CMS read and write, and the wiring; not the markup or the DOM rendering | ~340 code lines of typing across the session, spent on the parts that are actually about the CMS                                   |

Deliberately out of scope: TypeScript, linters/formatters, tests, CI, frameworks.

Photo upload and the list/filter/stats/modal UI are in `final` but are not
hands-on steps: the first is the bonus for fast finishers, the second teaches no
CMS concept and ships pre-built in `common/ui.js`.

## Open questions

- [x] What does the sample app do? — see *Sample app scope*.
- [x] What does the backend do beyond the original ping check? — nothing more. It
      stays an auth injector; the frontend calls CMS endpoints through it.
- [x] Language of the workshop and of the code comments — English.
- [x] Is offline fallback data needed in case venue Wi-Fi fails? — yes. A failed
      read falls back to seven demo reports and the header badge flips to
      "Demo mode".
- [x] Do we need to answer CORS preflights locally? — yes. The item POST sends
      `Content-Type: application/json`, so `backend/server.js` now answers
      `OPTIONS` itself instead of forwarding it upstream.
- [ ] Does the CMS public API send `Access-Control-Allow-Origin` on the item
      list? The proxy used to force it in, so the direct read has never been
      exercised from a browser. If it does not, reads have to go back through the
      injector — a `vite.config.js` dev proxy is ruled out.
- [x] How many steps, and how long is each? — see *Steps*. Four, plus a bonus.
- [ ] Which Re:Earth CMS project do attendees use? Each builds their own by
      following the textbook; a presenter-owned Hiroshima project is still needed
      as the fallback for anyone whose setup breaks, and its aliases have to be
      given out somewhere. `frontend/steps/final` still points at
      `aaaaa-yhwlvy` / `workshop`, and steps 02–04 ship placeholder aliases, so
      everything runs on demo data until this lands.
- [ ] Does the model the textbook builds match the field keys and types in
      `toApiFields()`? Untested against a live project. The code assumes
      `title`/text, `category`/select, `description`/textArea,
      `location`/geometryObject, `status`/select and `photos`/asset, and the four
      category keys have to match `common/categories.js` or every marker comes
      out grey. The textbook and the code have to be checked against each other.
- [ ] Which CMS instance? The steps read from `api.cms.test.reearth.dev` while
      `backend/env.example` targets `api.cms.reearth.io`, so as shipped the read
      and write halves point at different instances. This bites in step 04.
- [x] Does Vite serve `frontend/common/` from a step folder with no
      `vite.config.js`? — yes, ES-module imports and `layout.html?raw` alike, in
      dev via `/@fs` and inlined at build time.
