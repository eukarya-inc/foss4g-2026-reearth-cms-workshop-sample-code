// Step 02 — reading from the CMS.
//
// The public API needs no auth, so the browser calls the CMS directly: no
// backend, no token, nothing to start. This step puts the raw response on
// screen so you can see the shape the CMS actually returns — step 03 turns it
// into markers.

import LAYOUT from "../../common/layout.html?raw";
import { DEMO_REPORTS } from "../../common/demo-reports.js";
import * as ui from "../../common/ui.js";

// The markup has to be in the DOM before anything looks an element up, so this
// runs before everything else.
document.getElementById("app").innerHTML = LAYOUT;

// ---------------------------------------------------------------------------
// Configuration — the identifiers from the CMS project you set up
// ---------------------------------------------------------------------------

// The aliases you gave the workspace and the project, and the key you gave the
// model. None of this is a secret: the public API is public, and these end up
// in the browser either way.
const WORKSPACE_ALIAS = "your-workspace-alias";
const PROJECT_ALIAS = "your-project-alias";
const MODEL_KEY = "hazard_reports";

// Read path — the CMS public API needs no auth, so the browser calls the CMS
// directly and the backend is not involved at all.
const CMS_BASE_URL = "https://api.cms.test.reearth.dev";

const PUBLIC_ITEMS_URL = `${CMS_BASE_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

// Map defaults — central Hiroshima. Zoom 12 keeps the hillside wards in the
// north and the port in the south on screen together.
const MAP_CENTER = [34.3853, 132.4553];
const MAP_ZOOM = 12;
const TILE_URL = "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Japan</a>';

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------

// Leaflet is loaded from the CDN in index.html, so it is a global.
const { L } = window;

let map = null;

const initMap = () => {
  const container = document.getElementById("map");

  map = L.map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
  });

  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);

  // The markup is injected at runtime, so Tailwind styles it a moment after
  // this file runs — after Leaflet has already measured the container. Leaflet
  // caches that first measurement and only lays tiles over it, which leaves the
  // rest of the map grey once the container grows to its real height.
  // Re-measuring on every size change fixes that, and covers window resizes.
  new ResizeObserver(() => map.invalidateSize()).observe(container);
};

// Leaflet's own zoom control is disabled in the map options above, because its
// buttons cannot be restyled to match the rest of the control column without a
// stylesheet. These drive the same behaviour from our own buttons.
const zoomIn = () => {
  map.zoomIn();
};

const zoomOut = () => {
  map.zoomOut();
};

const locateMe = (onError) => {
  if (!navigator.geolocation) {
    onError();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) =>
      map.setView([position.coords.latitude, position.coords.longitude], 16),
    onError,
  );
};

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// The caller passes a full URL, because later on the two halves of the app talk
// to two different origins: reads go to the CMS itself, writes go to the proxy.
const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Straight to the CMS — no backend, no token. If the read fails for any reason,
// including the venue Wi-Fi giving out, fall back to the demo reports so the
// rest of the workshop still works.
const listReports = async () => {
  try {
    const data = await request(PUBLIC_ITEMS_URL, {
      headers: { Accept: "application/json" },
    });
    return { data, isLive: true };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { data: DEMO_REPORTS, isLive: false };
  }
};

const load = async () => {
  const { data, isLive } = await listReports();

  ui.setConnection(isLive);
  showRaw(data);
};

// Scaffolding for this step only. Seeing the real response is the point here —
// notice how the fields come back, and how the location is encoded. Step 03
// deletes this and draws markers instead.
const showRaw = (data) => {
  // Refreshing calls this again, so replace the previous dump rather than
  // stacking a second one on top of it.
  document.getElementById("raw-response")?.remove();

  const pre = document.createElement("pre");
  pre.id = "raw-response";
  pre.className =
    "fixed bottom-4 right-4 z-[3000] max-h-[60vh] w-[420px] overflow-auto " +
    "rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-emerald-300 shadow-lg";
  pre.textContent = JSON.stringify(data, null, 2);
  document.body.append(pre);
};

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

// The parts of the panel that need no data. The two callbacks stay empty until
// step 04, when the form starts using them.
ui.renderCategoryOptions(() => {});
ui.renderFilterChips(() => {});
ui.markFilter("all");
ui.renderLegend();
ui.resetLocation();
ui.showTab("report");

initMap();

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => ui.showTab(button.dataset.tab));
});

document.getElementById("zoom-in").addEventListener("click", zoomIn);
document.getElementById("zoom-out").addEventListener("click", zoomOut);

document.getElementById("locate").addEventListener("click", () => {
  locateMe(() => ui.showToast("Could not get your location.", "⚠️"));
});

document.getElementById("refresh").addEventListener("click", () => {
  ui.showToast("Refreshing…", "🔄");
  load();
});

// The panel is an overlay, so folding it never resizes the map — nothing to
// tell Leaflet about.
let sidebarOpen = true;
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  sidebarOpen = !sidebarOpen;
  ui.setSidebar(sidebarOpen);
});

load();

// TODO (step 03): turn those reports into markers on the map.
// TODO (step 04): send a new report back to the CMS through the proxy.
