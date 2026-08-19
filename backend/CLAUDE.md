# Backend — workshop sample code

Server-side sample code for the Re:Earth CMS workshop at FOSS4G 2026. Plain
Node.js using the built-in `node:http` module.

This is teaching material, not production code. Attendees read every line
during the session, so boring and explicit beats clever. Prefer code that can
be read top to bottom without jumping around.

## Layout

| Path             | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `workspace/`     | Attendee starting point. They write their code here.          |
| `steps/NN-name/` | Reference snapshot for one step. Used to catch up or compare. |

Every folder has a single file — no `index.html`, no CSS:

```txt
<folder>/
└─ src/
   └─ main.js      server entry point
```

Step numbers line up with the frontend: `01-hello` is the setup check on both
sides. Not every step needs a backend folder — a frontend-only step simply has
none.

## Commands

Always run from the repo root, never from inside `backend/`:

| Command                                                | What it does                                          |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `npm run dev:api`                                      | API server for `workspace/` — <http://localhost:8787> |
| `npm run step:api -- backend/steps/<name>/src/main.js` | API server for a reference step                       |

Both use `node --watch`, so the server restarts on save.

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

- Any dependency — `node:http` only. No Express, no Hono, no router, no
  dotenv. `backend/` must stay runnable with zero runtime dependencies.
- TypeScript
- Tests or CI
- A framework or project structure beyond `src/main.js`

Node 22 or newer is assumed, so `node --watch` is stable rather than
experimental.

## Server conventions

Follow the shape in `steps/01-hello/src/main.js`:

- Port: `const port = Number(process.env.PORT ?? 8787);` — 8787 keeps clear of
  Vite's 5173.
- Set `Access-Control-Allow-Origin: *` before routing, so every response carries
  it. This is what lets the frontend call the API without a Vite dev proxy, and
  keeps the repo free of `vite.config.js`.
- JSON responses:
  `res.writeHead(status, { "content-type": "application/json" })` then
  `res.end(JSON.stringify(...))`.
- Route with an exact `req.method` + `req.url` match and an early `return`.
- Always end with a 404 fallback returning `{ error: "not found" }`.
- Log `` `... listening on http://localhost:${port}` `` on start — the word
  "listening" is a useful readiness signal.

**Known limitation, worth stating to attendees:** exact-match routing means
`/api/ping?x=1` does not match `/api/ping` and falls through to the 404. When a
step needs query parameters, parse them with
`new URL(req.url, "http://localhost")` rather than adding a router.

## Step folders are independently runnable

Each `steps/NN-*` folder must run on its own so an attendee who falls behind can
jump straight to it. Server boilerplate is therefore **duplicated** across step
folders.

This duplication is intentional. Never extract a shared module, never add a
build step to deduplicate it.

## Adding a step

1. Copy the previous step folder, bump the number, keep it fully self-contained.
2. Update the Steps table in `plan.md`.
3. Update `README.md` only if the command list changes.

## Secrets

`.env.example` is the committed template; `.env` itself is gitignored
(`.gitignore` ignores `.env` and `.env.*` while allowing `!.env.example`).
Keep the two in sync — every variable the code reads must appear in the
example, with a placeholder rather than a real value.

Nothing loads `.env` yet. `dev:api` deliberately does not pass `--env-file`,
because that flag errors when the file is missing and would break a first run
for anyone who has not copied the template. Today `PORT` works because Node
reads the process environment directly:

```bash
PORT=9000 npm run dev:api
```

When the Re:Earth CMS token arrives:

- Add `--env-file=.env` to the `dev:api` and `step:api` scripts at that point,
  and say so in `README.md`.
- Uncomment the matching keys in `.env.example`.
- Never hardcode a token in `src/main.js`, and never commit a real `.env`.

## Placeholders

`workspace/src/main.js` carries a `// TODO: workshop code goes here.` comment
and 404s every route. It is meant to be an empty but running server.
