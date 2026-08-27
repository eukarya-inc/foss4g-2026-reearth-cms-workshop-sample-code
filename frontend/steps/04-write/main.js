// Step 04 — sending a report back to the CMS.
//
// The last piece. normalizeItem turned the CMS's shape into the app's; this
// step does the reverse, and posts it through the proxy you started in step 03.
//
// Click the map to pick a spot, fill in the form, submit — and the new item
// comes back from the CMS on the next read.

import { startApp } from "../../common/app.js";
import { DEMO_REPORTS } from "../../common/demo-reports.js";

// ---------------------------------------------------------------------------
// Your project
// ---------------------------------------------------------------------------

// The aliases you gave the workspace and the project, and the key you gave the
// model. None of this is a secret: the public API is public, and these end up
// in the browser either way.
const WORKSPACE_ALIAS = "demo-workspace";
const PROJECT_ALIAS = "foss4g-workshop";
const MODEL_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

const PUBLIC_ITEMS_URL = `${TARGET_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

// Write path — the proxy on your machine, which attaches the token on the way
// out. Same three identifiers, and note there is no `/p/` this time: this is
// the authenticated API.
const PROXY_BASE_URL = "http://localhost:8080";

const ITEMS_PATH = `/api/${WORKSPACE_ALIAS}/projects/${PROJECT_ALIAS}/models/${MODEL_KEY}/items`;

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Anything that goes wrong — a bad alias, no network, the CMS down — lands in
// the same catch, and you get the demo reports and an honest "Demo mode" badge
// instead of a blank screen. The console warning says what actually failed.
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

// This one needs the token, so it goes to the proxy instead of the CMS. Notice
// what is not here: no token, no Authorization header, no credentials of any
// kind. The browser cannot leak what it never had.
const createItem = (draft) =>
  request(`${PROXY_BASE_URL}${ITEMS_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ fields: toApiFields(draft) }),
  });

// The mirror image of normalizeItem. Keys and types have to match the model you
// built in the CMS — if yours differs, this is the only place to change.
const toApiFields = (draft) => [
  { key: "title", type: "text", value: draft.title },
  { key: "category", type: "select", value: draft.category },
  { key: "description", type: "textArea", value: draft.description },
  {
    key: "location",
    type: "geometryObject",
    // GeoJSON order is [longitude, latitude] — the opposite of Leaflet's. Get
    // this backwards and your report lands off the coast of Somalia.
    value: JSON.stringify({
      type: "Point",
      coordinates: [draft.longitude, draft.latitude],
    }),
  },
  { key: "status", type: "select", value: "pending" },
];

// The public API wraps the items in `results`.
const normalizeResponse = (data) => data.results.map(normalizeItem);

// The one place in the app that knows what the CMS response looks like. After
// this, everything downstream works on plain reports.
//
// The CMS returns each field as a top-level property, so most of this is a
// rename. Two things are not:
const normalizeItem = (item) => ({
  id: item.id,
  title: item.title,
  category: item.category,
  description: item.description,
  status: item.status,
  // GeoJSON is [longitude, latitude] — the opposite of Leaflet's order.
  // `location` is optional in the model, and an item saved without one would
  // otherwise throw here and take the whole map down with it. Undefined
  // coordinates are filtered out when the markers are drawn.
  latitude: item.location?.coordinates[1],
  longitude: item.location?.coordinates[0],
  // An asset field comes back as objects, and is absent entirely when the item
  // has none. The panel wants plain URLs.
  photos: item.photos?.map((photo) => photo.url) ?? [],
  // Timestamps come back prefixed, unlike the fields you defined yourself.
  createdAt: item.$createdAt,
});

// Hand the client to the app. It draws the markers, the list, the filters and
// the stats, and calls createItem when the form is submitted.
startApp({ listReports, createItem });
