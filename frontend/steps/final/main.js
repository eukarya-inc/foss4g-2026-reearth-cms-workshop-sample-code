// The finished sample — the Hiroshima citizen hazard-report map.
//
// This is step 04 plus the photo bonus. Everything here is the CMS client: the
// identifiers, the read, the asset upload and the write. The map, the panel and
// the wiring are in frontend/common.

import { startApp } from "../../common/app.js";
import { DEMO_REPORTS } from "../../common/demo-reports.js";

// ---------------------------------------------------------------------------
// Your project
// ---------------------------------------------------------------------------

// Where your project lives. Each of the three takes an id or an alias — a
// personal workspace only has an id, a project usually has an alias. None of
// this is a secret: the public API is public, and these end up in the browser
// either way.
const WORKSPACE_ID_OR_ALIAS = "demo-workspace";
const PROJECT_ID_OR_ALIAS = "foss4g-workshop";
const MODEL_ID_OR_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

const PUBLIC_ITEMS_URL = `${TARGET_URL}/api/p/${WORKSPACE_ID_OR_ALIAS}/${PROJECT_ID_OR_ALIAS}/${MODEL_ID_OR_KEY}`;

// Write path — the proxy on your machine, which attaches the token on the way
// out. Same three identifiers, and note there is no `/p/` this time: this is
// the authenticated API.
const PROXY_BASE_URL = "http://localhost:8080";

const ASSETS_PATH = `/api/${WORKSPACE_ID_OR_ALIAS}/projects/${PROJECT_ID_OR_ALIAS}/assets`;
const ITEMS_PATH = `/api/${WORKSPACE_ID_OR_ALIAS}/projects/${PROJECT_ID_OR_ALIAS}/models/${MODEL_ID_OR_KEY}/items`;

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// Given — fetch does not throw on 404 or 500, so this is where a bad response
// becomes an exception instead of data.
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
    const data = await request(PUBLIC_ITEMS_URL);
    return { reports: normalizeResponse(data), isLive: true };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};

// This one needs the token, so it goes to the proxy instead of the CMS. Notice
// what is not here: no token, no Authorization header, no credentials of any
// kind. The browser cannot leak what it never had.
const createItem = (draft, assetIds) =>
  request(`${PROXY_BASE_URL}${ITEMS_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toApiFields(draft, assetIds) }),
  });

// One POST per photo. The proxy has no routes of its own, so there is no batch
// endpoint to call — and this needs the token too, so it goes the same way.
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

// The mirror image of normalizeItem. Keys and types have to match the model you
// built in the CMS — if yours differs, this is the only place to change.
const toApiFields = (draft, assetIds) => {
  const fields = [
    { key: "title", value: draft.title },
    { key: "category", value: draft.category },
    { key: "description", value: draft.description },
    {
      key: "location",
      // GeoJSON order is [longitude, latitude] — the opposite of Leaflet's.
      value: JSON.stringify({
        type: "Point",
        coordinates: [draft.longitude, draft.latitude],
      }),
    },
    { key: "status", value: "pending" },
  ];

  // An empty asset array is rejected, so only send the field when there is
  // something in it.
  if (assetIds.length > 0) {
    fields.push({ key: "photos", value: assetIds });
  }

  return fields;
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
// the stats, uploads each photo, then calls createItem with the asset ids.
startApp({ listReports, createItem, uploadAsset });
