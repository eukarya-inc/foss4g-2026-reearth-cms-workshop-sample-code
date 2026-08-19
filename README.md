# FOSS4G 2026 — Re:Earth CMS Frontend Sample Code

Sample frontend code for the Re:Earth CMS workshop at FOSS4G 2026.
Plain HTML, CSS and JavaScript — no framework, served by [Vite](https://vite.dev/).

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)
- npm (bundled with Node.js)

Check your versions:

```bash
node -v
npm -v
```

## Setup

```bash
git clone <this-repo-url>
cd foss4g-2026-reearth-cms-frontend-sample-code
npm install
```

One `npm install` at the repo root covers every folder.

## Running

```bash
npm run dev
```

Open <http://localhost:5173>. The page reloads automatically as you edit.

To run a reference step instead of your own code:

```bash
npm run step -- steps/01-hello
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server for `workspace/` |
| `npm run step -- steps/<name>` | Dev server for a reference step |
| `npm run build` | Production build of `workspace/` into `workspace/dist/` |
| `npm run preview` | Serve the production build locally |

## Structure

| Path | Purpose |
| --- | --- |
| `workspace/` | **Write your code here.** This is your starting point during the workshop. |
| `steps/` | Reference code for each step. Use it to catch up or to compare. |
| `plan.md` | Workshop outline and open questions. |

Every folder follows the same layout:

```
<folder>/
├─ index.html      entry point
└─ src/
   ├─ main.js      JavaScript
   └─ style.css    styles
```

There is no `vite.config.js` — Vite's defaults are used as-is.

## Workshop links

- Slides: TBD
- Re:Earth CMS instance / endpoint: TBD
- Re:Earth CMS docs: <https://docs.reearth.io/>
