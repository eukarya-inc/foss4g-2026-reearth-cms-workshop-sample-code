# Plan

3 hours. 168 minutes scheduled, 12 minutes of float.

| Block                                                                  | Min | Cum. |
| ---------------------------------------------------------------------- | --- | ---- |
| Introduction — including a live demo of the finished app               | 12  | 12   |
| Preflight — `node -v`, clone, start `npm install` and leave it running | 5   | 17   |
| Account signup and workspace                                           | 10  | 27   |
| CMS structure and terms                                                | 15  | 42   |
| CMS setup — project, model, content, integration token                 | 25  | 67   |
| Break — plus install triage for anyone stuck                           | 10  | 77   |
| The API contract — read path, response shape, token, why the proxy     | 15  | 92   |
| Coding time                                                            | 50  | 142  |
| End-to-end testing and troubleshooting                                 | 10  | 152  |
| Recap                                                                  | 5   | 157  |
| Next step (optional) — photo upload                                    | 8   | 165  |
| Resources                                                              | 3   | 168  |
| Floating buffer                                                        | 12  | 180  |

## Concepts, split in two

The terminology and the API contract are 30 minutes of lecture between them, but
they serve different blocks and are deliberately not adjacent.

**CMS structure and terms** comes before the CMS setup because attendees need it
to do the setup: workspace, project, model, field, item, asset.

**The API contract** comes immediately before coding, because it is what the
coding block spends its minutes on. It has to cover exactly four things, or step
02 stalls:

- `$createdAt` — timestamps come back prefixed, fields you defined do not.
- `location` is GeoJSON, so `[longitude, latitude]` — the opposite of Leaflet.
- `photos` is a list of asset objects carrying a `url`, absent when there are none.
- Two paths, not one: the public `/api/p/<workspace>/<project>/<model>` needs no
  auth, the authenticated `/api/<workspace>/projects/.../items` does.

The last one is the auth lesson, and the reason the write goes through
`backend/server.js` while the read does not.

## CMS setup includes the integration token

Project, model and a few content items, **and** an integration with a token —
about 4 of the 25 minutes. Step 03 has attendees paste that token into `.env`;
without it the coding block stops at the write.

## Coding time, 50 minutes

| Sub-block                                                               | Min |
| ----------------------------------------------------------------------- | --- |
| Orientation — `main.js` tour, `startApp()` contract, how to catch up    | 4   |
| 01 read — the public URL, the fetch, the response in the console        | 12  |
| Checkpoint                                                              | 2   |
| 02 normalize — `normalizeItem`, markers appear, badge flips to **Live** | 13  |
| Checkpoint                                                              | 2   |
| 03 token — paste into `.env`, `npm run dev:api`, the write address      | 5   |
| 04 write — `toApiFields`, POST, the report comes back                   | 11  |
| Checkpoint                                                              | 1   |

Two rules make this fit.

**The plumbing is given, not typed.** `frontend/workspace/main.js` ships the
`request` helper and the whole `try`/`catch` skeleton pre-filled — generic HTTP
and error handling, nothing CMS about either. Both URL templates stay typed: the
public-vs-authenticated difference is the point.

Step 01 is additive, not scaffolding to be torn down. `startApp({ listReports })`
is in place from the start, and the step's payoff is the real CMS response in the
devtools console — one given `console.log` line, which step 02 deletes. That is
the only line anyone removes all session; the earlier version had attendees type
a `showRaw` render chain in 01 and delete eight lines of it in 02.

Typed lines: 7 in step 01, 13 in 02, 2 in 03, 20 in 04 — 42 in total, against
roughly 41 minutes of actual typing time in the block.

**Checkpoints resync the room, not individuals.** There is no time to debug one
attendee. At each checkpoint, anyone behind switches to the finished folder:

```bash
npm run step:web -- frontend/steps/02-normalize
```

Anyone whose own CMS project did not come out right uses the shared identifiers
every `steps/` folder already ships — `demo-workspace` / `foss4g-workshop` /
`hazard_reports` — and keeps going.

## Where the slack is

`End-to-end testing and troubleshooting` sits right after coding on purpose: it
is the coding block's overrun space, so coding is really 50–60 minutes. The 12
minutes of float at the end absorb signup and install failures, which are the
two things most likely to cost time and the two least possible to plan around.

The photo-upload bonus is optional and unscheduled. It adds more lines than any
taught step, so it is a pointer to `frontend/steps/final` and the `images/`
folder, not a block.
