# Step 02 — Build your CMS project

**30 minutes. No code in this step** — everything happens in the Re:Earth CMS web
interface. You come out of it with four things the rest of the workshop needs:

| What | Example | Where it goes later |
| --- | --- | --- |
| Workspace alias | `foss4g-abc123` | top of `src/main.js` |
| Project alias | `hiroshima-hazards` | top of `src/main.js` |
| Model key | `hazard_reports` | top of `src/main.js` |
| Integration token | `secret_…` | `backend/.env`, never in `src/` |

Write the first three down somewhere you can copy from. The token you will paste
straight into `backend/.env` in step 06.

> **Use the keys exactly as written below.** The model key, the field keys and
> the select values are already hard-coded in the sample code. Only the
> workspace and project aliases are yours. Changing anything else means changing
> the code to match, which is not what you want to be doing at minute 40.

---

## 1. Create a workspace

Sign in to the CMS and create a workspace, or use one you already have.

Open the workspace settings and find its **alias** — the short slug in the URL,
not the display name. That is your `WORKSPACE_ALIAS`.

## 2. Create a project

Create a project inside that workspace. Call it whatever you like; the display
name does not matter, the **alias** does.

That is your `PROJECT_ALIAS`.

## 3. Turn on the public API

The map reads through the CMS **public API**, which needs no token — that is why
the map works in step 04 with no backend running at all.

In the project settings, enable public access for the project and for the
`hazard_reports` model you are about to create. If you skip this, step 04 gets a
`404` and quietly falls back to demo data, which is a confusing way to find out.

## 4. Create the model

Create a model with the key **`hazard_reports`**. Display name is up to you.

## 5. Add the fields

Six fields. Key and type both matter — the key is what the API sends, and the
sample code sends exactly these:

| Key | Type | Notes |
| --- | --- | --- |
| `title` | Text | The one required field in the form |
| `category` | Select | Options, exactly: `road`, `facility`, `disaster`, `other` |
| `description` | Text Area | |
| `location` | Geometry Object | Point |
| `status` | Select | Options, exactly: `pending`, `approved`, `public`, `resolved` |
| `photos` | Asset | Allow multiple. Only used by the bonus step |

The four `category` values are the ones in `frontend/common/categories.js`. If
they differ, items come back with a category the map does not recognise and
every marker turns grey.

Leave everything optional except `title`. The form only ever fills the fields
above, so a required field it does not know about makes every write fail.

## 6. Add two or three items

Create them **in the CMS interface**, not through the API — this is the last
time you touch the CMS by hand, and it gives your map something to show in
step 04.

Pick real places near the venue. For `location`, enter a point in Hiroshima —
around `132.45` longitude, `34.39` latitude. For `status`, anything except
`pending` so the stats panel is not all one number.

**Publish them.** An unpublished item does not come back from the public API,
which looks exactly like a broken URL.

## 7. Check it works

Put your three identifiers into this URL and open it in a browser tab:

```
https://api.cms.test.reearth.dev/api/p/<WORKSPACE_ALIAS>/<PROJECT_ALIAS>/hazard_reports
```

You should get JSON containing the items you just created. This is the exact URL
your code builds in step 04, so if it works here it will work there.

If you get a `404`, the usual causes in order: public API not enabled (step 3),
items not published (step 6), or a typo in an alias.

## 8. Create an integration and a token

Writing needs a token. Create an integration, give it access to your workspace
with **write** permission on the project, and copy its token.

Keep the tab open — you need it in step 06.

> The token is the only secret in this workshop. It goes in `backend/.env`,
> which is gitignored, and it never appears in `src/`. The three aliases are not
> secrets: they end up in the browser either way, and the public API is public
> by design. Being clear about which is which is half the point of the backend.

---

## If you get stuck

Fall back to the shared workshop project — you can come back and finish your own
later. Ask the presenter for the aliases, or use the ones below:

```js
const WORKSPACE_ALIAS = "TBD";
const PROJECT_ALIAS = "TBD";
const MODEL_KEY = "hazard_reports";
```

That gets you a working read path. Writes still need your own token, so if the
CMS is refusing to give you one, pair up with a neighbour for step 07.

And if the network gives out entirely: the sample falls back to seven demo
reports and the header badge flips to **Demo mode**. Every step after this one
still works offline — you just will not see your own data.
