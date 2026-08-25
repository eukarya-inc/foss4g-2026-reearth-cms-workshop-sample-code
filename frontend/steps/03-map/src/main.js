// Step 03 — the map.
//
// Leaflet, the GSI pale tiles and the control buttons. No CMS yet: this step is
// only about getting something on screen you can navigate.

import LAYOUT from "../../../common/layout.html?raw";
import * as ui from "../../../common/ui.js";

// The markup has to be in the DOM before anything looks an element up, so this
// runs before everything else.
document.getElementById("app").innerHTML = LAYOUT;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

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
// Wiring
// ---------------------------------------------------------------------------

// The parts of the panel that need no data. The two callbacks stay empty until
// step 07, when the form starts using them.
ui.renderCategoryOptions(() => {});
ui.renderFilterChips(() => {});
ui.markFilter("all");
ui.renderLegend();
ui.resetLocation();
ui.showTab("report");

// No CMS data yet, so the header badge says so.
ui.setConnection(false);

initMap();

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => ui.showTab(button.dataset.tab));
});

document.getElementById("zoom-in").addEventListener("click", zoomIn);
document.getElementById("zoom-out").addEventListener("click", zoomOut);

document.getElementById("locate").addEventListener("click", () => {
  locateMe(() => ui.showToast("Could not get your location.", "⚠️"));
});

// The panel is an overlay, so folding it never resizes the map — nothing to
// tell Leaflet about.
let sidebarOpen = true;
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  sidebarOpen = !sidebarOpen;
  ui.setSidebar(sidebarOpen);
});

// TODO (step 04): read the reports out of your own CMS project.
// TODO (step 05): turn those reports into markers on the map.
// TODO (step 07): send a new report back to the CMS through the proxy.
