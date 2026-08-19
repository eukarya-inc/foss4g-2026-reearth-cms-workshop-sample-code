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

Every folder has the same three files:

```txt
<folder>/
├─ index.html      entry point
└─ src/
   ├─ main.js      JavaScript
   └─ style.css    styles
```

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
- Runtime dependencies — Vite stays a devDependency at the repo root

## Step folders are independently runnable

Each `steps/NN-*` folder must run on its own so an attendee who falls behind
can jump straight to it. `style.css` is therefore **duplicated verbatim**
between `workspace/` and every step folder.

This duplication is intentional. Never extract shared files, never add a build
step or symlink to deduplicate them.

## Adding a step

1. Copy the previous step folder, bump the number, keep it fully self-contained.
2. Update the Steps table in `plan.md`.
3. Update `README.md` only if the command list changes.

## Talking to the backend

Call `http://localhost:8787` directly with `fetch`. The backend sends
`Access-Control-Allow-Origin: *`, so cross-origin works without a dev proxy —
which is what lets the repo stay free of `vite.config.js`.

## Placeholders

`workspace/` files carry a `// TODO: workshop code goes here.` comment and
render a visible hint. Keep the workspace obviously alive but empty — an
attendee should be able to tell at a glance that their setup works and that the
blank page is on purpose.
