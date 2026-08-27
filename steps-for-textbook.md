# The code steps

Four steps. By the end you will have a map of Hiroshima that reads citizen hazard reports out of your own Re:Earth CMS project and lets you file a new one.

> The identifiers below point at the **shared workshop project**, so every step runs
against real data out of the box. Swap in your own once you have built your project.

## What you write, and what is given

**You write a CMS client. That is the whole exercise.**

The map, the side panel, the list, the filters, the stats, the detail modal and every button already exist. They are in `frontend/common/`, you never edit them, and they are not what this workshop is about. Your job is the part that talks to the CMS: where your project is, how to read reports out of it, and how to send one back.

The two halves meet in one line:

```jsx
startApp({ listReports, createItem });
```

`startApp` is given. You supply the functions. It calls `listReports()` to get reports and draws them; it calls `createItem()` when someone submits the form. Everything you write this session is one of those two functions or something they use.

That comes to about **60 lines of code**, all of it about the CMS.

| Given, in `frontend/common/` | What it does                                                        |
| ---------------------------- | ------------------------------------------------------------------- |
| `app.js`                     | `startApp()` — holds the state, draws the panel, wires every button |
| `map.js`                     | All the Leaflet: the map, the tiles, the markers, the pick marker   |
| `ui.js`                      | Every function that draws something                                 |
| `categories.js`              | The four hazard categories and the four statuses                    |
| `demo-reports.js`            | Seven example reports, used when the CMS is unreachable             |

**You write in one file, all session: `frontend/workspace/main.js`.** You never create a file, never move code between files, and never touch the HTML.

**If you fall behind**, every step has a finished copy you can run instead of your own:

```bash
npm run step:web -- frontend/steps/01-connect
```

Your own code is never overwritten by doing that — it just runs a different folder.

## Before you start

You need Node.js 22 or newer, and the repository:

```bash
git clone https://github.com/eukarya-inc/foss4g-2026-reearth-cms-workshop-sample-code
cd foss4g-2026-reearth-cms-workshop-sample-code
```

# Step 01 — Connecting to your project

**Time** 35 minutes · **Folder** `frontend/steps/01-connect`

**Goal** — get the project running, then fetch your reports from the CMS and look at exactly what comes back.

## 1.1 Install and run

From the repo root:

```bash
node -v          # 22 or newer
npm install      # once; this covers the backend too
npm run dev:web  # then open http://localhost:5173
```

Leave that running. It reloads the page every time you save.

**The whole app is already on screen** — map, markers, list, filters, stats. It is running on seven demo reports, which is why the header badge says **Demo mode**. Look at the bottom of `frontend/workspace/main.js` and you will see why:

```jsx
const listReports = async () => ({ reports: DEMO_REPORTS, isLive: false });

startApp({ listReports });
```

That is the shape of everything you are about to write. Replacing this one function with a real read is step 01, and the badge flipping to **Live** is your proof it worked.

## 1.2 Where your project is

These identifiers point to the shared workshop project. Once you have built your own, replace all three here:

```jsx
const WORKSPACE_ID_OR_ALIAS = "demo-workspace";
const PROJECT_ID_OR_ALIAS = "foss4g-workshop";
const MODEL_ID_OR_KEY = "hazard_reports";
```

Each of the three takes **either** an id or an alias — which is why they are named the way they are. In practice:

- **Workspace** — a personal workspace has no alias, only an id. Paste the id.
- **Project** — you gave it an alias when you created it. Use that.
- **Model** — you gave it a key. Use that.

To find your personal workspace's id, open the workspace dropdown at the top left of the navbar and choose your workspace under **Personal Account**. The id is then in the URL — `https://cms.reearth.io/workspace/<workspace_id>`.

If you would rather paste ids for all three, that works too. Nothing downstream cares which form you used.

Just below those you will find `TARGET_URL` — the CMS host. Leave it alone; it already points at the right place, and you will meet it again in step 03 as the one setting the backend shares with you.

Add below it:

```jsx
const PUBLIC_ITEMS_URL = `${TARGET_URL}/api/p/${WORKSPACE_ID_OR_ALIAS}/${PROJECT_ID_OR_ALIAS}/${MODEL_ID_OR_KEY}`;
```

The `/p/` is what makes this the **public** endpoint. It needs **no** authentication, which is why the browser can call the CMS directly and no backend has to be running yet.

None of these three values is a secret. They end up in the browser either way, and the public API is public by design.

In Re:Earth CMS, click any Public API endpoint. You should see JSON with data in it.

## 1.3 Fetching

**Add a `Talking to the CMS` section:**

```jsx
const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};
```

`fetch` does **not** throw on a `404` or a `500`. It resolves quite happily with `response.ok === false`, and you get the error body parsed as if it were your data — which then fails somewhere far away and confusingly. Checking `ok` here means every caller gets real data or an exception, and nothing in between.

**Add below it:**

```jsx
const listReports = async () => {
  const data = await request(PUBLIC_ITEMS_URL, {
    headers: { Accept: "application/json" },
  });
  return data;
};
```

**And replace the `startApp(...)` call at the bottom with:**

```jsx
listReports()
  .then(showRaw)
  .catch((error) => showRaw({ error: error.message }));
```

**Then fix the imports at the top** — you want `showRaw` instead of `startApp` for this one step:

```jsx
import { showRaw } from "../common/app.js";
```

`showRaw` is a given helper that dumps a value on screen. You are not wiring the app up yet, because the CMS's idea of a report and the app's idea of a report are not the same thing — reconciling them is step 02. First, look at what you actually got.

## Checkpoint

A dark panel in the bottom-right corner shows JSON: your reports, from your project. Read it properly, because step 02 is written against what you see there.

Three things to find, because step 02 is written against exactly these:

- The items are wrapped in **`results`**, alongside a `totalCount`.
- Each field you defined — `title`, `category`, `status`, `location` — is a **plain top-level property** on the item.
- The timestamps are **`$createdAt`** and `$updatedAt`, with a dollar sign, because the CMS adds them itself and prefixes them so they cannot collide with a field you named.

## If it does not work

| Symptom                 | Cause                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `HTTP 404` in the panel | Public API not enabled on the project, items not published, or a typo in an identifier |
| `HTTP 401`              | You used the private endpoint — check the `/p/` is in `PUBLIC_ITEMS_URL`               |
| `Failed to fetch`       | No network, or the host in `TARGET_URL` is wrong                                       |
| `[]`                    | The read worked, but the project has no published items in it                          |

# Step 02 — Turning the response into reports

**Time** 25 minutes · **Folder** `frontend/steps/02-normalize`

**Goal** — convert the CMS's shape into the app's shape. The markers appear.

The CMS describes an item its own way. The app wants a flat object with a `title`, a `category` and a `latitude`/`longitude`. One function stands between them, and after it nothing downstream has to know the CMS exists.

## 2.1 Imports

**Your import block should end up reading:**

```jsx
import { startApp } from "../common/app.js";
import { DEMO_REPORTS } from "../common/demo-reports.js";
```

`startApp` replaces `showRaw` — you are about to have something worth drawing.

## 2.2 Falling back when the read fails

**Replace `listReports` with:**

```jsx
const listReports = async () => {
  try {
    const data = await request(PUBLIC_ITEMS_URL, {
      headers: { Accept: "application/json" },
    });
    return { reports: normalizeResponse(data), isLive: true };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};
```

Two changes. It now returns `{ reports, isLive }` — the shape `startApp` expects — and anything that goes wrong lands in the `catch`: a wrong identifier, no network, the CMS down. You get the demo reports and an honest **Demo mode** badge instead of a blank screen, and the console warning tells you what actually failed.

That fallback is why the rest of this workshop still works if the venue Wi-Fi gives out.

## 2.3 Normalising

Here is what the API actually returned in step 01, trimmed to one item:

```json
{
  "results": [
    {
      "$createdAt": "2026-08-21T09:08:46.504Z",
      "$createdBy": "01k1vxapknp90eeeeysx5ejpg2",
      "$updatedAt": "2026-08-26T07:34:05.542Z",
      "$updatedBy": "01k1vxapknp90eeeeysx5ejpg2",
      "category": "other",
      "description": "this is a description",
      "id": "01m0hs8ws86ztw90d7f7k7stkr",
      "location": { "coordinates": [132.4573, 34.3922], "type": "Point" },
      "photos": [
        {
          "type": "asset",
          "id": "01m0yfv0xd004jadgt39t2ztyp",
          "url": "https://assets.cms.reearth.io/assets/60/94963a-…/broken-pavement.webp"
        }
      ],
      "status": "pending",
      "title": "test"
    }
  ],
  "totalCount": 1
}
```

Four things to notice, because they are the whole of this step:

- The items are wrapped in **`results`**, alongside a `totalCount`.
- Each field you defined in the model — `title`, `category`, `description`, `status`, `location` — is a **plain top-level property**. There is no nesting to dig through.
- The timestamps are **`$createdAt`** and `$updatedAt`, with a dollar sign. The CMS adds those itself, and prefixes them so they cannot collide with a field you named.
- **`location` and `photos` are structured, not plain values.** `location` is a GeoJSON Point; `photos` is a list of asset objects, each with a `url`. And when an item has no photos the key is absent altogether, rather than being an empty list.

So the conversion is mostly a rename. **Add below `listReports`:**

```jsx
const normalizeResponse = (data) => data.results.map(normalizeItem);
```

**And then the one function that matters:**

```jsx
const normalizeItem = (item) => ({
  id: item.id,
  title: item.title,
  category: item.category,
  description: item.description,
  status: item.status,
  latitude: item.location?.coordinates[1],
  longitude: item.location?.coordinates[0],
  photos: item.photos?.map((photo) => photo.url) ?? [],
  createdAt: item.$createdAt,
});
```

Ten lines, and after them nothing else in the app knows the CMS exists. That is the point of having one function like this: if the CMS response ever changes, exactly one place needs editing.

**The coordinate order is the thing to get right.** GeoJSON writes a point as `[longitude, latitude]` — longitude first. Leaflet takes `[latitude, longitude]`. So `coordinates[1]` is the latitude and `coordinates[0]` is the longitude, which reads backwards until you remember why. Swap them and your reports appear in the sea off West Africa, because Hiroshima's `[132.4, 34.4]` becomes latitude 132 — which does not exist — and the marker ends up somewhere near `[34, 132]` read the other way.

**Photos need one step of translation.** The API gives you asset objects; the detail panel wants URLs, so `.map()` pulls out the `url` of each. The `?.` and the `?? []` are there because the key is missing entirely on an item with no photos.

**And `location` gets a `?.` for the same kind of reason.** It is an optional field, so an item somebody saved without clicking the map would throw on `coordinates` and take the whole map down with it. With the optional chain the coordinates come out `undefined`, and such items are quietly left off the map instead.

## 2.4 Hand it to the app

**Replace the `showRaw` block at the bottom with:**

```jsx
startApp({ listReports });
```

And drop `showRaw` from your imports.

## Checkpoint

This is the step where it all arrives at once — the list, the filters, the stats and the detail panel were waiting for data the whole time.

- Your reports appear as coloured circles with an emoji, in the right places.
- The header badge reads **Live**.
- The **List** tab shows a card per report; the stats row shows real counts.
- The filter chips narrow both the list and the markers.
- Clicking a marker opens the detail panel; clicking a list card opens it *and* pans the map.

## If it does not work

| Symptom                                | Cause                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Every marker grey with a 📍             | Your `category` values do not match `road` / `facility` / `disaster` / `other`                |
| Dates all show `—`                     | You read `createdAt` instead of `$createdAt`                                                  |
| List has rows, map has no markers      | Those items have no `location` set — add one in the CMS, or check `coordinates` is being read |
| Markers in the sea off Africa          | Latitude and longitude swapped — coordinates near `[0, 0]`                                    |
| Titles are blank                       | Your title field is not keyed `title`                                                         |
| **Demo mode** when you expect **Live** | The read threw — the console warning says why                                                 |

# Step 03 — The token, and the proxy that holds it

**Time** 20 minutes · **Folder** `frontend/steps/03-token`

**Goal** — understand why writing is different from reading, and get the proxy running. Almost no code in this step; the work is reading.

## 3.1 Why a proxy at all

Reading was public, so the browser called the CMS directly. Writing needs your integration token — and **anything the browser holds, the user holds**. Open the developer tools on any website and you can read every value the page has. There is no such thing as a secret in frontend code.

So the token goes on a small server on your own machine, and the browser asks that server to make the write for it.

## 3.2 Set it up

Execute the command below in your terminal: **(navigate to the root directory of the project folder first)**

```bash
cp env.example .env
```

Or you can create a new file `.env` and copy-paste all content from `env.example` into it.

Open `.env` at the repo root and fill in one value:

- `AUTH_HEADER_VALUE` — `Bearer` followed by your integration token.

`TARGET_URL` is already correct, and you only ever set it once: **the frontend reads that same variable**. The host you read from and the host you write to cannot disagree, because there is only one of them.

```diff
PORT=8080
TARGET_URL=https://api.cms.reearth.io
AUTH_HEADER_NAME=Authorization
- AUTH_HEADER_VALUE="Bearer your-token-here"
+ AUTH_HEADER_VALUE="Bearer my-powerful-token"
```

<aside>
💡

Keep a space between `Bearer` and your token: `Bearer your-token-here`

</aside>

`.env` is gitignored, so your token is never committed.

### Wait — the token is in a file the frontend reads?

Good catch, and it is worth stopping on, because it looks like it contradicts everything §3.1 just said.

Both sides read this one file: the proxy takes `AUTH_HEADER_VALUE` and `TARGET_URL`, the frontend takes `TARGET_URL` for its public read. But `vite.config.js` sets `envPrefix: "TARGET_"`, and that is a whitelist — **only** variables whose names start with `TARGET_` are ever put into the browser bundle. `AUTH_HEADER_VALUE` does not match, so it is not excluded or masked or scrubbed. It is simply never there.

Do not take that on trust. With the dev server running, open <http://localhost:5173/main.js> and search the page:

- `api.cms.reearth.io` — there, because you asked for it.
- your token — not there, and no amount of digging in the browser will find it.

That is §3.1 from the other direction. The browser gets exactly what you deliberately hand it, and nothing else in the file comes along for the ride.

**In a second terminal**, leaving the first one running:

```bash
npm run dev:api   # http://localhost:8080
```

## 3.3 Read the server

Open `backend/server.js`. It is under 60 lines and there is no trick in it. The part that matters:

```jsx
// line 42
proxyReq: (req) => {
    req.setHeader(AUTH_HEADER_NAME, AUTH_HEADER_VALUE);
},
```

That is the whole idea. Every request the browser sends to `localhost:8080` is forwarded to the CMS with the auth header attached on the way out. The server has no routes of its own, does not know what a hazard report is, and rewrites nothing. **It adds one header.**

Two other details in that file are worth knowing, because they are the kind of thing that costs an afternoon:

- It forces `Access-Control-Allow-Origin: *` onto the response. Your page is served from port 5173 and the proxy is on 8080, which the browser treats as different origins.
- It answers `OPTIONS` requests itself. Posting JSON makes the browser send a preflight `OPTIONS` first, and the CMS does not answer those in a way the browser accepts.

## 3.4 The write address

**Add to your `Your project` section, below `PUBLIC_ITEMS_URL`:**

```jsx
const PROXY_BASE_URL = "http://localhost:8080";

const ITEMS_PATH = `/api/${WORKSPACE_ID_OR_ALIAS}/projects/${PROJECT_ID_OR_ALIAS}/models/${MODEL_ID_OR_KEY}/items`;
```

Same three identifiers, different endpoint — and note there is **no `/p/`** this time. This is the authenticated API, which is exactly why it has to go through the proxy.

## Checkpoint

- `npm run dev:api` is running and has not exited with an error. It exits immediately if `TARGET_URL` or `AUTH_HEADER_VALUE` is missing, and says which.
- You can explain, out loud, why `PUBLIC_ITEMS_URL` goes straight to the CMS and `ITEMS_PATH` will not.
- The app still works exactly as it did in step 02 — nothing you added is used yet.

## If it does not work

| Symptom                                   | Cause                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| The proxy exits at once                   | `TARGET_URL` or `AUTH_HEADER_VALUE` missing from `.env`                           |
| `EADDRINUSE`                              | Something else is on port 8080 — set `PORT` in `.env` and update `PROXY_BASE_URL` |
| It reads `.env` but the token looks wrong | `AUTH_HEADER_VALUE` needs the `Bearer` prefix, inside the quotes                  |

---

# Step 04 — Sending a report back

**Time** 35 minutes · **Folder** `frontend/steps/04-write`

**Goal** — click the map, fill in the form, and file a new report into your CMS.

`normalizeItem` turned the CMS's shape into the app's. This step does the reverse.

## 4.1 The write

**Add to your `Talking to the CMS` section:**

```jsx
const createItem = (draft) =>
  request(`${PROXY_BASE_URL}${ITEMS_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ fields: toApiFields(draft) }),
  });
```

Look at what is **not** there: no token, no `Authorization` header, no credentials of any kind. The browser cannot leak what it never had. The proxy adds them.

## 4.2 Back into the CMS's shape

**Add below it:**

```jsx
const toApiFields = (draft) => [
  { key: "title", type: "text", value: draft.title },
  { key: "category", type: "select", value: draft.category },
  { key: "description", type: "textArea", value: draft.description },
  {
    key: "location",
    type: "geometryObject",
    value: JSON.stringify({
      type: "Point",
      coordinates: [draft.longitude, draft.latitude],
    }),
  },
  { key: "status", type: "select", value: "pending" },
];
```

The CMS wants a list of `{ key, type, value }`, and the keys and types must match the model you built. This is the mirror image of `normalizeItem`.

**The coordinate order is here again**, and this time you are writing it by hand: GeoJSON is `[longitude, latitude]`. Get it backwards and your report lands off the coast of Somalia. Every new report starts as `pending`.

## 4.3 Wire it in

**Change the last line:**

```jsx
startApp({ listReports, createItem });
```

That is all. `startApp` already knows how to run the form — pick a location, validate, show the spinner, re-read the list afterwards. It was just missing somewhere to send it.

## Checkpoint

The round trip, end to end:

1. Click somewhere on the map — a pulsing blue circle appears, and the panel shows the coordinates.
2. Pick a category and type a title. **Submit** enables only when title, category and location are all set.
3. Submit. A spinner, then *Report sent to the CMS.*
4. Go back to the CMS, open the content list page, and publish the item you just created.
5. Go back to the app and click the reload button on the map. **Your new report is on the map** — it came back from the CMS, it was not faked locally.
6. Open your project in the CMS and find the item, with `status: pending` and the coordinates you clicked.

That last check is the one that matters. The report is not just on your screen; it is in the CMS, and it got there without the browser ever holding the token.

## If it does not work

| Symptom                                         | Cause                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `HTTP 401`                                      | No token in `.env`, or the proxy was not restarted after editing it         |
| `Failed to fetch`                               | The backend is not running — `npm run dev:api` in the second terminal       |
| The report stays on screen with a warning toast | Deliberate: the write failed and your typing was kept. The console says why |
| `400` about fields                              | A key or type in `toApiFields` does not match your model                    |
| The pin lands in the wrong hemisphere           | `coordinates` is `[longitude, latitude]`, not the other way round           |
| Submit stays greyed out                         | One of the three requirements is missing — most often the map click         |

# Bonus — Photos

If you finish early, add photo upload. The model already has a `photos` field of type `asset`, the form already has a file picker, and there are sample images in `images/`.

**Add an assets path** beside `ITEMS_PATH`:

```jsx
const ASSETS_PATH = `/api/${WORKSPACE_ID_OR_ALIAS}/projects/${PROJECT_ID_OR_ALIAS}/assets`;
```

**Add an upload function.** Note it sends `FormData`, not JSON, and it goes through the proxy because it needs the token too:

```jsx
const uploadAsset = async (file) => {
  const body = new FormData();
  body.append("file", file);
  body.append("skipDecompression", "true");

  const asset = await request(`${PROXY_BASE_URL}${ASSETS_PATH}`, {
    method: "POST",
    body,
  });
  return asset.id;
};
```

**Then take the asset ids in `createItem` and `toApiFields`**, adding the `photos` field only when there is at least one — an empty asset array is rejected:

```jsx
  if (assetIds.length > 0) {
    fields.push({ key: "photos", type: "asset", value: assetIds });
  }
```

**And hand it over:**

```jsx
startApp({ listReports, createItem, uploadAsset });
```

`startApp` uploads every photo first and passes you the ids, because the item references its assets by id — they have to exist before the item is created.

Reading them back needs nothing extra — `normalizeItem` already pulls the `url` out of
each asset object, which is what the response in §2.3 showed.

The finished version is in `frontend/steps/final`:

```bash
npm run step:web -- frontend/steps/final
```

# Appendix

## Demo mode

Any failed read falls back to the demo reports and flips the header badge. That is deliberate: the workshop keeps working on a bad network, and every step can be completed offline. You just will not see your own data.

If you see **Demo mode** when you expect **Live**, check the browser console — the warning from `listReports` names the real cause.

## Running the reference code

Each step has a finished copy. Running one does not touch your own work:

```bash
npm run step:web -- frontend/steps/01-connect
npm run step:web -- frontend/steps/02-normalize
npm run step:web -- frontend/steps/03-token
npm run step:web -- frontend/steps/04-write
npm run step:web -- frontend/steps/final
```
