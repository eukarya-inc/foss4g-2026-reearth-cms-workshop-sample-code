# FOSS4G 2026 — Re:Earth CMS Workshop Sample Code

Sample code for the Re:Earth CMS workshop at FOSS4G 2026.

- **Frontend** — plain HTML, CSS and JavaScript, served by
  [Vite](https://vite.dev/). No framework.
- **Backend** — a small [Express](https://expressjs.com/) proxy that forwards
  requests to the Re:Earth CMS API and injects the auth header, so the API token
  never reaches the browser. Only the *write* calls need it: reading goes from
  the browser straight to the CMS public API, which needs no auth.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer (LTS recommended)
- npm (bundled with Node.js)

Check your versions:

```bash
node -v
npm -v
```

## Setup

```bash
git clone https://github.com/eukarya-inc/foss4g-2026-reearth-cms-workshop-sample-code
cd foss4g-2026-reearth-cms-workshop-sample-code
npm install
```

One `npm install` at the repo root covers every folder — there is a single
`package.json` and a single `package-lock.json` for the whole repo.

The backend also needs an env file:

```bash
cp backend/env.example backend/.env
```

Then edit `backend/.env` and put a real token in `AUTH_HEADER_VALUE`. It is
gitignored, so it never gets committed.

## Running

The frontend and the backend are separate processes. Open **two terminals** and run
one in each:

```bash
npm run dev:web   # terminal 1 — http://localhost:5173
npm run dev:api   # terminal 2 — http://localhost:8080
```

The frontend page reloads automatically as you edit. The backend restarts
automatically too, thanks to `node --watch`.

**Falling behind?** Every step has a finished copy you can run instead of your
own code, and you can jump straight to the one the room is on:

```bash
npm run step:web -- frontend/steps/02-map
```

Other commands:

| Command                                     | What it does                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev:web`                           | Dev server for `frontend/workspace/`                                      |
| `npm run dev:api`                           | Proxy from `backend/server.js`, restarting on every edit                   |
| `npm run step:web -- frontend/steps/<name>` | Dev server for a frontend reference step                                  |
| `npm run step:api -- <file>`                | `node --watch` on any server entry point                                   |
| `npm run build:web`                         | Production build of `frontend/workspace/` into `frontend/workspace/dist/` |
| `npm run preview:web`                       | Serve the production build locally                                        |

## Structure

| Path                  | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `frontend/`           | Browser code — Vite, HTML, JavaScript.         |
| `backend/server.js`   | The auth-injecting proxy.                      |
| `backend/env.example` | Template for `backend/.env`.                   |
| `plan.md`             | Workshop outline and open questions.           |

The frontend has three folders:

| Path         | Purpose                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `common/`    | Code you never have to write. Imported by every folder — do not edit.      |
| `workspace/` | **Write your code here.** This is your starting point during the workshop. |
| `steps/`     | Reference code for each step. Use it to catch up or to compare.            |

You write in exactly one file all session:

```txt
frontend/workspace/
├─ index.html      a ~20-line shell you never touch
└─ src/
   └─ main.js      ← everything you write goes here
```

The markup, the DOM rendering, the category list and the offline demo data live
in `frontend/common/` and are imported. That is why there is no `style.css` and
no HTML to write: Tailwind and Leaflet come from a CDN, so there is nothing to
install either.

`frontend/steps/final` is the finished app — the Hiroshima citizen hazard-report
map, which is step 05 plus photo upload:

```bash
npm run step:web -- frontend/steps/final
```

To point any folder at a real CMS project, fill in the workspace and project
aliases and the model key at the **top of its `src/main.js`** — the read path and
the write path share that one set of identifiers. The workshop textbook walks
through creating the project and finding them. Until you do — or whenever the CMS
is unreachable — the app falls back to demo data and says so in the header.

The backend is a single file today — it has no `workspace/` or `steps/` folders.
If backend steps are added later, they will mirror the frontend numbering.

There is no `vite.config.js` — Vite's defaults are used as-is.

## The backend

`backend/server.js` is an auth injector. It forwards **every** request it
receives to `TARGET_URL`, adds one header on the way out, and replays the
upstream response verbatim. It has no routes of its own and rewrites nothing.

The point is to keep the API token on the server: the frontend calls
`http://localhost:8080/…` with no credentials, and the proxy attaches them.

Only the calls that actually need the token go through it — the asset upload and
the item POST. The read hits the CMS **public API**
(`/api/p/<workspaceAlias>/<projectAlias>/<modelKey>`), which needs no auth, so
the browser calls the CMS host directly and skips the proxy entirely. That means
the map fills with real data with no backend running at all; the backend is only
needed to submit a report.

Point `TARGET_URL` at the same CMS host the frontend reads from — the value at
the top of your `src/main.js`. If the two disagree you will read from one
instance and write to another, which fails in a confusing way.

It is configured entirely through `backend/.env`:

| Variable            | Default         | Purpose                                                  |
| ------------------- | --------------- | -------------------------------------------------------- |
| `PORT`              | `8080`          | Port the proxy listens on                                |
| `TARGET_URL`        | —               | **Required.** Upstream to forward to                     |
| `AUTH_HEADER_NAME`  | `Authorization` | Name of the header to inject                             |
| `AUTH_HEADER_VALUE` | —               | **Required.** Its value, e.g. `Bearer <token>`           |

The server exits with an error message if `TARGET_URL` or `AUTH_HEADER_VALUE` is
missing.

Verify it from a terminal — the path is whatever the upstream API expects:

```bash
curl -i http://localhost:8080/api/...
```

The proxy also sets `Access-Control-Allow-Origin: *` on every response,
replacing whatever the upstream sent. That is what lets the frontend on port
5173 call it directly with `fetch`, and why the repo needs no `vite.config.js`
dev proxy.

`OPTIONS` is the one method the proxy answers itself, with a `204` and the
`Allow-Methods` / `Allow-Headers` a preflight needs. Everything else is
forwarded. Plain `GET`s never trigger a preflight, but posting a JSON body does,
and the upstream does not reply to those preflights in a way the browser
accepts.

## The steps

| Step | Where                       | Content                                            |
| ---- | --------------------------- | -------------------------------------------------- |
| 01   | `frontend/steps/01-hello`   | Setup check                                        |
| 02   | `frontend/steps/02-map`     | Leaflet map and tiles                              |
| 03   | `frontend/steps/03-read`    | Read from the CMS public API                       |
| 04   | `frontend/steps/04-markers` | Reports become markers                             |
| 05   | `frontend/steps/05-report`  | The proxy and the token, then send a report        |
| —    | `frontend/steps/final`      | The finished app, step 05 plus photo upload        |

Building the CMS project itself — workspace, model, items, integration token —
is covered by the workshop textbook, not by this repo. You need it done before
step 03, which is the first step that reads from your project.

Timings and the reasoning behind the split are in `plan.md`.

## Workshop links

- Slides: TBD
- Re:Earth CMS instance / endpoint: TBD
- Re:Earth CMS docs: <https://docs.reearth.io/>
