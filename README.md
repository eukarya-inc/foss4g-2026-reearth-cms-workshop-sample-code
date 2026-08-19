# FOSS4G 2026 — Re:Earth CMS Workshop Sample Code

Sample code for the Re:Earth CMS workshop at FOSS4G 2026.

- **Frontend** — plain HTML, CSS and JavaScript, served by [Vite](https://vite.dev/).
- **Backend** — plain Node.js using the built-in `node:http` module.

No frameworks on either side.

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
git clone <this-repo-url>
cd foss4g-2026-reearth-cms-workshop-sample-code
npm install
```

One `npm install` at the repo root covers every folder.

## Running

The frontend and the backend are separate processes. Open **two terminals** and run
one in each:

```bash
npm run dev:web   # terminal 1 — http://localhost:5173
npm run dev:api   # terminal 2 — http://localhost:8787
```

The frontend page reloads automatically as you edit. The backend restarts
automatically too, thanks to `node --watch`.

To run a reference step instead of your own code:

```bash
npm run step:web -- frontend/steps/01-hello
npm run step:api -- backend/steps/01-hello/src/main.js
```

Other commands:

| Command                                                | What it does                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `npm run dev:web`                                      | Dev server for `frontend/workspace/`                                      |
| `npm run dev:api`                                      | API server for `backend/workspace/`                                       |
| `npm run step:web -- frontend/steps/<name>`            | Dev server for a frontend reference step                                  |
| `npm run step:api -- backend/steps/<name>/src/main.js` | API server for a backend reference step                                   |
| `npm run build:web`                                    | Production build of `frontend/workspace/` into `frontend/workspace/dist/` |
| `npm run preview:web`                                  | Serve the production build locally                                        |

## Structure

| Path        | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `frontend/` | Browser code — Vite, HTML, CSS, JavaScript.        |
| `backend/`  | Node.js API server — `node:http`, no dependencies. |
| `plan.md`   | Workshop outline and open questions.               |

Both sides have the same two folders:

| Path         | Purpose                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `workspace/` | **Write your code here.** This is your starting point during the workshop. |
| `steps/`     | Reference code for each step. Use it to catch up or to compare.            |

Every frontend folder follows this layout:

```txt
frontend/<folder>/
├─ index.html      entry point
└─ src/
   ├─ main.js      JavaScript
   └─ style.css    styles
```

Every backend folder follows the same layout, minus the browser-only files:

```txt
backend/<folder>/
└─ src/
   └─ main.js      server entry point
```

Step numbers line up across both sides — `01-hello` is the setup check for the
frontend and for the backend.

There is no `vite.config.js` — Vite's defaults are used as-is.

## The backend

`backend/steps/01-hello` is a setup check, the server-side twin of the frontend's
step 01. It exposes a single endpoint:

```txt
GET /api/ping  →  {"message":"pong"}
```

Anything else returns `404` with `{"error":"not found"}`.

Verify it from a terminal:

```bash
curl http://localhost:8787/api/ping
```

Notes:

- The port is `8787`. Override it with the `PORT` environment variable.
- The server sends `Access-Control-Allow-Origin: *`, so the frontend on port 5173
  can call it directly without any Vite proxy configuration.

## Workshop links

- Slides: TBD
- Re:Earth CMS instance / endpoint: TBD
- Re:Earth CMS docs: <https://docs.reearth.io/>
