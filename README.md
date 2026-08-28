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

Both sides read one env file at the repo root:

```bash
cp env.example .env
```

Then edit `.env` and put a real token in `AUTH_HEADER_VALUE`. It is gitignored,
so it never gets committed.

`TARGET_URL` in that file is the CMS host, and **both** sides read it — the
frontend for the public read, the proxy for the authenticated write — so the
two can never point at different instances.

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
npm run step:web -- frontend/steps/01-connect
```

Other commands:

| Command                                     | What it does                                             |
| ------------------------------------------- | -------------------------------------------------------- |
| `npm run dev:web`                           | Dev server for `frontend/workspace/`                     |
| `npm run dev:api`                           | Proxy from `backend/server.js`, restarting on every edit |
| `npm run step:web -- frontend/steps/<name>` | Dev server for a frontend reference step                 |

## Structure

| Path                | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `frontend/`         | Browser code — Vite, HTML, JavaScript.                 |
| `backend/server.js` | The auth-injecting proxy.                              |
| `env.example`       | Template for `.env`, read by both sides.               |
| `vite.config.js`    | Env loading only — `envDir` and `envPrefix`.           |
| `images/`           | Sample hazard photos, for the upload in `steps/final`. |

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
└─ main.js         ← everything you write goes here
```

**What you write is a CMS client — nothing else.** The Leaflet map, the panel,
the list, the state and every event listener live in `frontend/common/` and are
imported. You hand your client to `startApp()` and it does the rest:

```js
startApp({ listReports, createItem });
```

That is why there is no `style.css` and no HTML to write: Tailwind and Leaflet
come from a CDN, so there is nothing to install either.

`frontend/steps/final` is the finished app — the Hiroshima citizen hazard-report
map, which is step 04 plus photo upload:

```bash
npm run step:web -- frontend/steps/final
```

`images/` holds a few sample hazard photos to attach when you try that upload.

To point any folder at a real CMS project, fill in the three identifiers at the
**top of its `main.js`** — the read path and the write path share that one set.
Each takes an id or an alias, which is what their names say; a personal
workspace has only an id. The workshop textbook walks
through creating the project and finding them. Until you do — or whenever the CMS
is unreachable — the app falls back to demo data and says so in the header.

The backend is a single file today — it has no `workspace/` or `steps/` folders.
If backend steps are added later, they will mirror the frontend numbering.

`vite.config.js` at the repo root is four lines and does exactly two things:
point `envDir` at the repo root so every Vite root finds the same `.env`, and
set `envPrefix` to `TARGET_` so only `TARGET_URL` is injected into the bundle.
Everything else is Vite's default.

It is not auto-discovered — Vite looks for a config in its *root*, which is a
folder under `frontend/` — so the npm scripts pass `--config vite.config.js`.

## The backend

`backend/server.js` is an auth injector. It forwards **every** request it
receives to `TARGET_URL`, adds one header on the way out, and replays the
upstream response verbatim. It has no routes of its own and rewrites nothing.

The point is to keep the API token on the server: the frontend calls
`http://localhost:8080/…` with no credentials, and the proxy attaches them.

Only the calls that actually need the token go through it — the asset upload and
the item POST. The read hits the CMS **public API**
(`/api/p/<workspace>/<project>/<model>`), which needs no auth, so
the browser calls the CMS host directly and skips the proxy entirely. That means
the map fills with real data with no backend running at all; the backend is only
needed to submit a report.

`TARGET_URL` is the host the proxy forwards to, and it is the same variable the
frontend reads for its public GET — one value, both sides, so a read/write host
mismatch is not a thing that can happen.

It is configured entirely through the repo-root `.env`:

| Variable            | Default         | Purpose                                         |
| ------------------- | --------------- | ----------------------------------------------- |
| `PORT`              | `8080`          | Port the proxy listens on                       |
| `TARGET_URL`        | —               | **Required.** The CMS host — read by both sides |
| `AUTH_HEADER_NAME`  | `Authorization` | Name of the header to inject                    |
| `AUTH_HEADER_VALUE` | —               | **Required.** Its value, e.g. `Bearer <token>`  |

The server exits with an error message if `TARGET_URL` or `AUTH_HEADER_VALUE` is
missing. The frontend is softer about it: with no `.env` at all it falls back to
the literal host in `main.js`, so every step folder still runs.

`AUTH_HEADER_VALUE` sits in the same file the frontend reads from and still
never reaches the browser — `envPrefix` in `vite.config.js` only lets `TARGET_`
through. That is worth showing attendees in step 03.

Verify it from a terminal — the path is whatever the upstream API expects:

```bash
curl -i http://localhost:8080/api/...
```

The proxy also sets `Access-Control-Allow-Origin: *` on every response,
replacing whatever the upstream sent. That is what lets the frontend on port
5173 call it directly with `fetch`, so there is no dev proxy in
`vite.config.js` — it handles env loading and nothing else.

`OPTIONS` is the one method the proxy answers itself, with a `204` and the
`Allow-Methods` / `Allow-Headers` a preflight needs. Everything else is
forwarded. Plain `GET`s never trigger a preflight, but posting a JSON body does,
and the upstream does not reply to those preflights in a way the browser
accepts.

## The steps

| Step | Where                         | Content                                            |
| ---- | ----------------------------- | -------------------------------------------------- |
| 01   | `frontend/steps/01-connect`   | Install and run, then read the public API          |
| 02   | `frontend/steps/02-normalize` | Turn the response into reports on the map          |
| 03   | `frontend/steps/03-token`     | The token and the proxy — mostly reading, not code |
| 04   | `frontend/steps/04-write`     | Send a new report back to the CMS                  |
| —    | `frontend/steps/final`        | The finished app, step 04 plus photo upload        |

Building the CMS project itself — workspace, model, items, integration token —
is covered by the workshop textbook, not by this repo. You need it done before
step 01, which is the first step that reads from your project.

The textbook also carries the session timings and the reasoning behind the
split — this repo is the code only.

## Workshop links

- Slides: TBD
- Re:Earth CMS instance / endpoint: TBD
- Re:Earth CMS docs: <https://docs.reearth.io/>
