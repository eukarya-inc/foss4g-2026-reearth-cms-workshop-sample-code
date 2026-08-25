// The finished sample — the Hiroshima citizen hazard-report map.
//
// Everything the app does lives in this one file, in the order the workshop
// builds it: configuration, the map, reading from the CMS, writing back to it,
// then the wiring that ties them together. The parts an attendee never edits —
// the markup, the rendering, the parsing helpers and the demo data — come from
// frontend/common.

import LAYOUT from "../../common/layout.html?raw";
import { categoryOf, MAX_PHOTOS } from "../../common/categories.js";
import { DEMO_REPORTS } from "../../common/demo-reports.js";
import { readPoint, toPhotoUrls } from "../../common/parse.js";
import * as ui from "../../common/ui.js";

// The markup has to be in the DOM before anything looks an element up, so this
// runs before everything else.
document.getElementById("app").innerHTML = LAYOUT;

// ---------------------------------------------------------------------------
// Configuration — everything you change to point this at your own CMS project
// ---------------------------------------------------------------------------

// Which project and model to use. Both APIs take the aliases you gave the
// workspace and the project and the key you gave the model, so there is one set
// of identifiers here, not one per path. None of this is a secret.
const WORKSPACE_ALIAS = "aaaaa-yhwlvy";
const PROJECT_ALIAS = "workshop";
const MODEL_KEY = "hazard_reports";

// Read path — the CMS public API needs no auth, so the browser calls the CMS
// directly and the backend is not involved at all.
const CMS_BASE_URL = "https://api.cms.test.reearth.dev";

const PUBLIC_ITEMS_URL = `${CMS_BASE_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

// Write path — the integration API needs the token, so it goes through the
// backend proxy, which attaches it on the way out.
const PROXY_BASE_URL = "http://localhost:8080";

const ASSETS_PATH = `/api/${WORKSPACE_ALIAS}/projects/${PROJECT_ALIAS}/assets`;
const ITEMS_PATH = `/api/${WORKSPACE_ALIAS}/projects/${PROJECT_ALIAS}/models/${MODEL_KEY}/items`;

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
// do in the markup. Named here to keep the divIcon calls below readable.
const MARKER_CLASS =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full " +
  "border-4 border-white text-base shadow-lg shadow-black/30 " +
  "transition-transform hover:scale-125";

const PICK_MARKER_CLASS =
  "h-10 w-10 animate-ping rounded-full border-4 border-sky-800 bg-sky-800/30";

let map = null;
let markers = [];
let pickMarker = null;

const initMap = (onPick) => {
  const container = document.getElementById("map");

  map = L.map(container, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
  });

  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);

  // The markup is injected at runtime, so Tailwind styles it a moment after
  // Leaflet has already measured this container. Leaflet caches that first
  // measurement and only lays tiles over it, which leaves the rest of the map
  // grey once the container grows to its real height. Re-measuring on every
  // size change fixes that, and covers window resizes too.
  new ResizeObserver(() => map.invalidateSize()).observe(container);

  map.on("click", (event) => {
    showPickMarker(event.latlng);
    onPick(event.latlng);
  });
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

// Leaflet's own zoom control is disabled in the map options above, because its
// buttons cannot be restyled to match the rest of the control column without a
// stylesheet. These drive the same behaviour from our own buttons.
const zoomIn = () => {
  map.zoomIn();
};

const zoomOut = () => {
  map.zoomOut();
};

const clearPickMarker = () => {
  pickMarker?.remove();
  pickMarker = null;
};

// The pinging marker that shows which point the form will submit.
const showPickMarker = (latlng) => {
  clearPickMarker();

  pickMarker = L.marker(latlng, {
    icon: L.divIcon({
      html: `<div class="${PICK_MARKER_CLASS}"></div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }),
  }).addTo(map);
};

const hasPosition = (report) =>
  Number.isFinite(report.latitude) && Number.isFinite(report.longitude);

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// Each caller passes a full URL, because the two halves of the app talk to two
// different origins: reads go to the CMS itself, writes go to the proxy.
const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// The public API needs no auth, so this goes straight to the CMS — no backend,
// no token. Reading falls back to demo data, so the sample still runs with no
// network.
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

// Writes need the integration token, so they go through the proxy — it is the
// only place that holds it. One POST per photo: the proxy has no routes of its
// own, so there is no batch upload endpoint to call.
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

const createItem = (draft, assetIds) =>
  request(`${PROXY_BASE_URL}${ITEMS_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ fields: toApiFields(draft, assetIds) }),
  });

// Keys and types have to match the CMS model schema. If your model differs,
// this is the only place to change.
const toApiFields = (draft, assetIds) => {
  const fields = [
    { key: "title", type: "text", value: draft.title },
    { key: "category", type: "select", value: draft.category },
    { key: "description", type: "textArea", value: draft.description },
    {
      key: "location",
      type: "geometryObject",
      // GeoJSON order is [longitude, latitude] — the opposite of Leaflet's.
      value: JSON.stringify({
        type: "Point",
        coordinates: [draft.longitude, draft.latitude],
      }),
    },
    { key: "status", type: "select", value: "pending" },
  ];

  if (assetIds.length > 0) {
    fields.push({ key: "photos", type: "asset", value: assetIds });
  }

  return fields;
};

const normalizeResponse = (data) => {
  const items = Array.isArray(data) ? data : data.results ?? data.items ?? [];
  return items.map(normalizeItem);
};

// The CMS returns fields either as an array of {key, value} pairs or as plain
// properties, so accept both. readPoint() and toPhotoUrls() in common/parse.js
// do the same for the location and the photos.
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
  category: null,
  location: null,
  photos: [],
  sidebarOpen: true,
};

let lastPhotoId = 0;

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

const addPhotos = (files) => {
  Array.from(files)
    .filter((file) => file.type.startsWith("image/"))
    .slice(0, MAX_PHOTOS - state.photos.length)
    .forEach((file) => {
      lastPhotoId += 1;
      state.photos.push({
        id: String(lastPhotoId),
        file,
        url: URL.createObjectURL(file),
      });
    });

  ui.renderPhotos(state.photos, removePhoto);
};

const removePhoto = (id) => {
  const index = state.photos.findIndex((photo) => photo.id === id);

  URL.revokeObjectURL(state.photos[index].url);
  state.photos.splice(index, 1);
  ui.renderPhotos(state.photos, removePhoto);
};

const clearLocation = () => {
  state.location = null;
  ui.resetLocation();
  clearPickMarker();
};

const validate = () => {
  const hasTitle = document.getElementById("title").value.trim().length > 0;
  ui.setSubmitEnabled(hasTitle && !!state.category && !!state.location);
};

const submit = async (form) => {
  ui.setLoading(true);

  const draft = {
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    category: state.category,
    latitude: state.location.lat,
    longitude: state.location.lng,
  };

  try {
    // Photos go up first: the item references its assets by id, so they have to
    // exist before the item is created.
    const assetIds = [];
    for (const photo of state.photos) {
      assetIds.push(await uploadAsset(photo.file));
    }

    await createItem(draft, assetIds);
    const photoNote = assetIds.length > 0 ? ` with ${assetIds.length} photo(s)` : "";
    ui.showToast(`Report sent to the CMS${photoNote}.`);

    resetForm(form);
    await load();
  } catch (error) {
    console.error("[app] submit failed:", error);
    ui.showToast(`Could not reach the CMS: ${error.message}`, "⚠️");

    // Keep the report on screen so the attendee's input is not lost. Its photo
    // URLs are the local blob URLs, hence keepPhotoUrls below.
    state.reports.unshift({
      id: `local-${Date.now()}`,
      ...draft,
      status: "pending",
      photos: state.photos.map((photo) => photo.url),
      createdAt: new Date().toISOString(),
    });

    resetForm(form, { keepPhotoUrls: true });
    render();
  } finally {
    ui.setLoading(false);
  }
};

const resetForm = (form, { keepPhotoUrls = false } = {}) => {
  form.reset();

  if (!keepPhotoUrls) {
    state.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
  }

  state.category = null;
  state.photos = [];

  ui.markCategory(null);
  ui.renderPhotos(state.photos, removePhoto);
  ui.setSubmitEnabled(false);
  clearLocation();
};

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

ui.renderCategoryOptions((key) => {
  state.category = key;
  ui.markCategory(key);
  validate();
});

ui.renderFilterChips((filter) => {
  state.filter = filter;
  ui.markFilter(filter);
  render();
});

ui.renderLegend();
ui.resetLocation();
ui.showTab("report");
ui.markFilter(state.filter);

initMap((latlng) => {
  state.location = latlng;
  ui.setLocation(latlng, () => {
    clearLocation();
    validate();
  });
  validate();
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => ui.showTab(button.dataset.tab));
});

document.getElementById("title").addEventListener("input", validate);

const form = document.getElementById("report-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  submit(form);
});

document.getElementById("photo-input").addEventListener("change", (event) => {
  addPhotos(event.target.files);
  // Clear it so picking the same file twice still fires a change event.
  event.target.value = "";
});

document.getElementById("modal-close").addEventListener("click", ui.closeDetail);
document.getElementById("modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) ui.closeDetail();
});

document.getElementById("refresh").addEventListener("click", () => {
  ui.showToast("Refreshing…", "🔄");
  load();
});

document.getElementById("zoom-in").addEventListener("click", zoomIn);
document.getElementById("zoom-out").addEventListener("click", zoomOut);

document.getElementById("locate").addEventListener("click", () => {
  locateMe(() => ui.showToast("Could not get your location.", "⚠️"));
});

// The panel is an overlay, so folding it never resizes the map — nothing to
// tell Leaflet about.
document.getElementById("sidebar-toggle").addEventListener("click", () => {
  state.sidebarOpen = !state.sidebarOpen;
  ui.setSidebar(state.sidebarOpen);
});

load();
