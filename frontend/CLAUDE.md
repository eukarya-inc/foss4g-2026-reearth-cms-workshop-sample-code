# Frontend — workshop sample code

Browser-side sample code for the Re:Earth CMS workshop at FOSS4G 2026.

This is teaching material, not production code. Attendees read every line
during the session, so boring and explicit beats clever. Prefer code that can
be read top to bottom without jumping around.

## Layout

| Path             | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `workspace/`     | Attendee starting point. They write their code here.          |
| `steps/NN-name/` | Reference snapshot for one step. Used to catch up or compare. |
| `steps/final/`   | The finished app the steps build toward. See *The final step*. |

Every folder has the same shape — an `index.html` plus a `src/`:

```txt
<folder>/
├─ index.html      entry point
└─ src/
   ├─ main.js      JavaScript
   └─ style.css    styles
```

`steps/final/` splits its JavaScript across several modules in `src/` and has no
`style.css` at all; every other folder keeps its JavaScript in `main.js` and its
styles in `style.css`.

## Commands

Always run from the repo root, never from inside `frontend/`:

| Command                                     | What it does                                          |
| ------------------------------------------- | ----------------------------------------------------- |
| `npm run dev:web`                           | Dev server for `workspace/` — <http://localhost:5173> |
| `npm run step:web -- frontend/steps/<name>` | Dev server for a reference step                       |
| `npm run build:web`                         | Production build into `workspace/dist/`               |
| `npm run preview:web`                       | Serve the production build                            |

## Style

The repo has no formatter config, but the code is Prettier-formatted with
defaults. Match it:

- ESM (`"type": "module"` at the root), 2-space indent, 80-column wrap
- Double quotes, always semicolons
- Arrow functions assigned to `const` — no `function` declarations
- `const` by default; `let` only for state that is actually reassigned
- camelCase identifiers, kebab-case folders, `NN-` numeric prefix for steps
- Comments in English, sparse, `// TODO:` style

## Hard constraints

Recorded in `plan.md` as deliberate decisions. Do not introduce:

- TypeScript
- Any framework (React, Vue, Svelte, …)
- Linter or formatter config files
- Tests or CI
- `vite.config.js` — Vite's defaults are used as-is
- Runtime dependencies on the frontend — Vite stays a devDependency at the repo
  root. (The backend does have runtime deps; they live in the root
  `package.json` too, since the repo has exactly one manifest.)

## Step folders are independently runnable

Each `steps/NN-*` folder must run on its own so an attendee who falls behind
can jump straight to it. `style.css` is therefore **duplicated verbatim**
between `workspace/` and every step folder.

This duplication is intentional. Never extract shared files, never add a build
step or symlink to deduplicate them.

`steps/final/` is the exception: it styles entirely with Tailwind and ships no
`style.css`, so there is nothing to duplicate.

## Adding a step

1. Copy the previous step folder, bump the number, keep it fully self-contained.
2. Update the Steps table in `plan.md`.
3. Update `README.md` only if the command list changes.

## Talking to the backend

Call `http://localhost:8080` directly with `fetch`. The backend is an auth
injector: it forwards every request to the CMS API and attaches the token, so
never send credentials from the browser.

The proxy injects `Access-Control-Allow-Origin: *`, overriding whatever the
upstream sent, so cross-origin `fetch` works without a dev proxy — which is what
lets the repo stay free of `vite.config.js`.

## The final step

`steps/final/` is the finished sample — the Kobe citizen hazard-report map. It
departs from the conventions above in three ways, all deliberate:

| Deviation | Why |
| --- | --- |
| Folder is `final`, not `NN-name` | It is the target, not a step. Steps `02`…`NN` get derived from it. |
| `src/` holds several modules, not one `main.js` | ~600 lines of JS. Split by concern: `config.js`, `cms.js`, `map.js`, `ui.js`, and `main.js` for the wiring. |
| No `style.css` | Tailwind covers every rule the app needs, including the runtime-built Leaflet markers. |
| Tailwind and Leaflet come from a CDN | Keeps `package.json` free of frontend runtime dependencies and keeps the repo free of a Tailwind config. |

Both CDN tags sit in `index.html`. Leaflet is a classic `<script>`, so `L` is a
global by the time the deferred module in `src/` runs — that is why `map.js`
starts with `const { L } = window;`.

There is no CSS file. Tailwind's browser build watches the DOM for new classes,
so the Leaflet `divIcon` markers get utility classes too, even though `map.js`
builds their HTML at runtime — see `MARKER_CLASS` and `PICK_MARKER_CLASS` at the
top of that file. Marker colors come from `CATEGORIES` in `config.js` as an
inline style, so a new category is a one-line change in one file.

Keep it that way: if a rule looks like it needs a stylesheet, check for a
utility first. `animate-ping` replaced a hand-written pulse keyframe here.

Anything read out of the CMS goes through `escapeHtml()` before it reaches
`innerHTML`. `normalizeItem()` in `cms.js` deliberately accepts more than one
response shape — fields as an array or as plain properties, geometry as GeoJSON
or as a JSON string — so a model whose schema differs slightly still renders.

## Placeholders

`workspace/` files carry a `// TODO: workshop code goes here.` comment and
render a visible hint. Keep the workspace obviously alive but empty — an
attendee should be able to tell at a glance that their setup works and that the
blank page is on purpose.
