// Step 03 — the token, and the proxy that holds it.
//
// Reading was public, so the browser called the CMS directly. Writing needs
// your integration token — and anything the browser holds, the user holds.
//
// So the token goes on a small server on your own machine, and the browser asks
// that server to make the write for it. This step is mostly not JavaScript:
//
//   cp backend/env.example backend/.env    then put your token in it
//   npm run dev:api                        in a second terminal
//
// Then read backend/server.js. It is under 60 lines, it has no routes of its
// own, and all it does is forward every request upstream with one header added.
//
// The only code here is the address of that server, ready for step 04.

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

const CMS_BASE_URL = "https://api.cms.reearth.io";

const PUBLIC_ITEMS_URL = `${CMS_BASE_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

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
// the stats from whatever listReports returns.
startApp({ listReports });

// TODO (step 04): send a new report back to the CMS.
