// Step 02 — turning the response into reports.
//
// The raw dump goes away. The CMS describes an item its own way; the app wants
// a flat object with a title, a category and a latitude/longitude. Converting
// between the two is this step, and it is the only place in the app that knows
// what the CMS response looks like.

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

// TODO (step 03): put your token on the server and start the proxy.
// TODO (step 04): send a new report back to the CMS.
