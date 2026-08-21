import { createItem, listReports, uploadAsset } from "./cms.js";
import { MAX_PHOTOS } from "./config.js";
import {
  clearPickMarker,
  panToReport,
  initMap,
  locateMe,
  renderMarkers,
  zoomIn,
  zoomOut,
} from "./map.js";
import * as ui from "./ui.js";

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

// Module scripts are deferred, so the DOM is already parsed by the time this
// runs.
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
