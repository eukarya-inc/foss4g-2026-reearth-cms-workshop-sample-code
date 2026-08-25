// Step 04 — reports on the map.
//
// The raw dump from step 03 goes away. Instead the response is normalised into
// one plain shape the rest of the app can use, and every report becomes a
// marker. The list, the filter chips, the stats and the detail panel come from
// frontend/common/ui.js and start working as soon as they are given data.

import LAYOUT from "../../common/layout.html?raw";
import { categoryOf } from "../../common/categories.js";
import { DEMO_REPORTS } from "../../common/demo-reports.js";
import { readPoint, toPhotoUrls } from "../../common/parse.js";
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

// Leaflet builds its marker HTML in JavaScript, but Tailwind's browser build
// watches the DOM for new classes, so utility classes work here as well as they
// do in the markup. Named here to keep the divIcon call below readable.
const MARKER_CLASS =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full " +
  "border-4 border-white text-base shadow-lg shadow-black/30 " +
  "transition-transform hover:scale-125";

let map = null;
let markers = [];

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

const renderMarkers = (reports, onSelect) => {
  markers.forEach((marker) => marker.remove());

  markers = reports.filter(hasPosition).map((report) => {
    const category = categoryOf(report.category);
    const icon = L.divIcon({
      html: `<div class="${MARKER_CLASS}" style="background:${category.color}">${category.icon}</div>`,
      className: "",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    return L.marker([report.latitude, report.longitude], { icon })
      .addTo(map)
      .on("click", () => onSelect(report));
  });
};

// Pan only — never change the zoom. Whatever level the attendee is on is the
// one they chose.
const panToReport = (report) => {
  if (!hasPosition(report)) return;
  map.panTo([report.latitude, report.longitude]);
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

const hasPosition = (report) =>
  Number.isFinite(report.latitude) && Number.isFinite(report.longitude);

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
    return { reports: normalizeResponse(data), isLive: true };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};

const normalizeResponse = (data) => {
  const items = Array.isArray(data) ? data : data.results ?? data.items ?? [];
  return items.map(normalizeItem);
};

// The CMS returns fields either as an array of {key, value} pairs or as plain
// properties, so accept both. readPoint() and toPhotoUrls() in common/parse.js
// do the same for the location and the photos. Being tolerant here is what
// stops a small difference in your model from producing an empty map.
const normalizeItem = (item) => {
  const fields = Array.isArray(item.fields)
    ? Object.fromEntries(item.fields.map((f) => [f.key ?? f.id, f.value]))
    : { ...item };

  const [longitude, latitude] = readPoint(fields.location) ?? [
    Number(fields.longitude),
    Number(fields.latitude),
  ];

  return {
    id: item.id ?? crypto.randomUUID(),
    title: fields.title ?? "Untitled",
    category: fields.category ?? "other",
    description: fields.description ?? "",
    status: fields.status ?? "public",
    latitude,
    longitude,
    photos: toPhotoUrls(fields.photos),
    createdAt: item.createdAt ?? fields.createdAt ?? null,
  };
};

// ---------------------------------------------------------------------------
// State and behaviour
// ---------------------------------------------------------------------------

const state = {
  reports: [],
  filter: "all",
  sidebarOpen: true,
};

const visibleReports = () =>
  state.filter === "all"
    ? state.reports
    : state.reports.filter((report) => report.category === state.filter);

const render = () => {
  const reports = visibleReports();

  renderMarkers(reports, openDetail);
  ui.renderList(reports, (id) => openDetail(findReport(id), { pan: true }));
  ui.renderStats(state.reports);
};

const findReport = (id) => state.reports.find((report) => report.id === id);

// Clicking a marker only opens the panel: you can already see where it is, so
// moving the map under the modal is just disorienting. A list click pans,
// because that report may well be off screen.
const openDetail = (report, { pan = false } = {}) => {
  if (!report) return;

  ui.showDetail(report);
  if (pan) panToReport(report);
};

const load = async () => {
  const { reports, isLive } = await listReports();

  state.reports = reports;
  ui.setConnection(isLive);
  render();
};

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

// The category picker stays inert until step 05, when the form starts using it.
ui.renderCategoryOptions(() => {});

ui.renderFilterChips((filter) => {
  state.filter = filter;
  ui.markFilter(filter);
  render();
});

ui.markFilter(state.filter);
ui.renderLegend();
ui.resetLocation();
ui.showTab("report");

initMap();

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => ui.showTab(button.dataset.tab));
});

document.getElementById("modal-close").addEventListener("click", ui.closeDetail);
document.getElementById("modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) ui.closeDetail();
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
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  state.sidebarOpen = !state.sidebarOpen;
  ui.setSidebar(state.sidebarOpen);
});

load();

// TODO (step 05): send a new report back to the CMS through the proxy.
