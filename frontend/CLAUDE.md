# Frontend — workshop sample code

Browser-side sample code for the Re:Earth CMS workshop at FOSS4G 2026.

This is teaching material, not production code. Attendees read every line
during the session, so boring and explicit beats clever. Prefer code that can
be read top to bottom without jumping around.

## Layout

| Path             | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `common/`        | Given code. Imported by every folder, edited by no attendee.   |
| `workspace/`     | Attendee starting point. They write their code here.           |
| `steps/NN-name/` | Reference snapshot for one step. Used to catch up or compare.  |
| `steps/final/`   | The finished app the steps build toward. See *The final step*. |

Every folder except `steps/01-hello/` has the same shape — a shell `index.html`
plus a single `src/main.js`:

```txt
<folder>/
├─ index.html      ~20-line shell: CDN tags, <div id="app">, the module script
└─ src/
   └─ main.js      all of this folder's JavaScript
```

`steps/01-hello/` predates this and keeps its own `main.js` + `style.css`; it is
a setup check, and the Vite CSS import is the point of it. Nothing else has a
`style.css` — Tailwind from the CDN covers every rule the app needs.

## What lives in `common/`

| File               | Contents                                                     |
| ------------------ | ------------------------------------------------------------ |
| `layout.html`      | The app's markup. Injected into `#app`, not parsed from HTML. |
| `ui.js`            | Every DOM rendering function. No data logic.                  |
| `categories.js`    | `CATEGORIES`, `STATUS_LABELS`, `MAX_PHOTOS`, `categoryOf`.    |
| `parse.js`         | `readPoint`, `toPhotoUrls` — tolerant field reading.          |
| `demo-reports.js`  | The seven offline reports.                                    |

A step's `main.js` starts by importing these and injecting the layout:

```js
import LAYOUT from "../../../common/layout.html?raw";
import * as ui from "../../../common/ui.js";

document.getElementById("app").innerHTML = LAYOUT;
```

`?raw` is a Vite built-in, so this needs no config and no build step, and the
markup stays a real `.html` file rather than a template literal. `workspace/`
sits one directory shallower than a step, so its imports are `../../common/…`
where a step's are `../../../common/…`. That import block is the only difference
between an attendee's file and the matching step snapshot.

**Anything that measures an element at startup must cope with being early.**
Tailwind styles the injected markup a moment after `main.js` runs, so an element
read immediately gives a pre-Tailwind size. `initMap()` observes its container
and calls `map.invalidateSize()` for exactly this reason — without it the bottom
of the map stays grey.

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

Each `steps/NN-*` folder must run on its own so an attendee who falls behind can
jump straight to it. Every folder is its own Vite root, which is why each one
needs its own `index.html`.

That shell is the **only** duplicated file, and it is duplicated verbatim — the
same ~20 lines everywhere, `workspace/` included. Keep it that way: if you
change one, change them all.

Everything else that is shared lives in `common/` and is imported. This does not
break standalone runnability: `common/` is inside the repo workspace root, so
Vite's default `server.fs.allow` serves it in dev and Rollup inlines it at build
time, with no `vite.config.js` either way.

Never deduplicate the shell with a symlink or a build step — a symlink breaks
for attendees on Windows, and a build step is a thing to explain.

## Adding a step

1. Copy the previous step folder and bump the number. Its `main.js` should stay a
   superset of the one before it — steps grow a file, they never rearrange it.
2. Copy the shell `index.html` across unchanged.
3. Update the Steps table in `plan.md`, including the typing-load line.
4. Update `README.md` only if the command list changes.

Adding shared code means adding it to `common/`, never copying it into each
folder.

## Talking to the backend

Only the **writes** go to the backend. Call `http://localhost:8080` directly
with `fetch`. The backend is an auth injector: it forwards every request to the
CMS API and attaches the token, so never send credentials from the browser.

**Reads go straight to the CMS.** The public API
(`/api/p/<workspaceAlias>/<projectAlias>/<modelKey>`) needs no auth, so routing
it through the proxy would buy nothing and hide the point. The configuration
block at the top of `main.js` names the two origins apart — `CMS_BASE_URL` for
the public read, `PROXY_BASE_URL` for the token-bearing writes — and `request()`
takes a full URL, so each call site says which one it is talking to.

The proxy injects `Access-Control-Allow-Origin: *`, overriding whatever the
upstream sent, so cross-origin `fetch` works without a dev proxy — which is what
lets the repo stay free of `vite.config.js`.

## The final step

`steps/final/` is the finished sample — the Hiroshima citizen hazard-report map.
It follows the same shape as every step folder; the only difference is that it
is the target rather than a step, so it is named `final` and not `NN-name`. It
is step 07 plus photo upload and polish.

Tailwind and Leaflet come from a CDN, which keeps `package.json` free of
frontend runtime dependencies and the repo free of a Tailwind config. Both tags
sit in the shell `index.html`. Leaflet is a classic `<script>`, so `L` is a
global by the time the deferred module in `src/` runs — that is why the map
section starts with `const { L } = window;`.

There is no CSS file. Tailwind's browser build watches the DOM for new classes,
so the Leaflet `divIcon` markers get utility classes too, even though their HTML
is built at runtime — see `MARKER_CLASS` and `PICK_MARKER_CLASS`. Marker colors
come from `CATEGORIES` in `common/categories.js` as an inline style, so a new
category is a one-line change in one file.

Keep it that way: if a rule looks like it needs a stylesheet, check for a
utility first. `animate-ping` replaced a hand-written pulse keyframe here.

Anything read out of the CMS goes through `escapeHtml()` before it reaches
`innerHTML`. `normalizeItem()` deliberately accepts more than one response shape
— fields as an array or as plain properties — and `common/parse.js` does the
same for geometry and assets, so a model whose schema differs slightly still
renders instead of producing an empty map.

## Placeholders

`workspace/src/main.js` carries one `// TODO (step NN): …` line per remaining
step, and renders the parts of the panel that need no data so the page is
visibly working. Keep the workspace obviously alive but empty — an attendee
should be able to tell at a glance that their setup works and that the empty map
is on purpose.

The map area is deliberately left blank rather than initialised, so it cannot be
mistaken for the grey-tiles failure described above.
