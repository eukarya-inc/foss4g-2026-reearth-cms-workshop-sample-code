// The app around your CMS client. Given code — it holds the state, draws the
// panel and wires up every button, so the file you write can be entirely about
// talking to the CMS.
//
// You hand it a client:
//
//   startApp({ listReports, createItem, uploadAsset })
//
// `listReports` is required. `createItem` is optional until you write it, and
// `uploadAsset` is only needed for the photo bonus. Anything you leave out just
// disables the part of the UI that needs it.

import LAYOUT from "./layout.html?raw";
import { MAX_PHOTOS } from "./categories.js";
import {
  clearPickMarker,
  initMap,
  locateMe,
  panToReport,
  renderMarkers,
  zoomIn,
  zoomOut,
} from "./map.js";
import * as ui from "./ui.js";

// The markup has to be in the DOM before anything looks an element up, so this
// runs as soon as the module is imported.
document.getElementById("app").innerHTML = LAYOUT;

// Put a value on screen so you can see what the CMS actually returned. Used by
// the first step, before there is anything to draw a marker from.
export const showRaw = (data) => {
  // Calling this again replaces the previous dump rather than stacking a second
  // one on top of it.
  document.getElementById("raw-response")?.remove();

  const pre = document.createElement("pre");
  pre.id = "raw-response";
  pre.className =
    "fixed bottom-4 right-4 z-[3000] max-h-[60vh] w-[420px] overflow-auto " +
    "rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-emerald-300 shadow-lg";
  pre.textContent = JSON.stringify(data, null, 2);
  document.body.append(pre);
};

export const startApp = ({ listReports, createItem, uploadAsset }) => {
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

  // The submit button stays disabled until there is something worth sending.
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
      // Photos go up first: the item references its assets by id, so they have
      // to exist before the item is created.
      const assetIds = [];
      if (uploadAsset) {
        for (const photo of state.photos) {
          assetIds.push(await uploadAsset(photo.file));
        }
      }

      await createItem(draft, assetIds);
      const note = assetIds.length > 0 ? ` with ${assetIds.length} photo(s)` : "";
      ui.showToast(`Report sent to the CMS${note}.`);

      resetForm(form);
      await load();
    } catch (error) {
      console.error("[app] submit failed:", error);
      ui.showToast(`Could not reach the CMS: ${error.message}`, "⚠️");

      // Keep the report on screen so your input is not lost — most likely the
      // backend is not running, or .env has no token in it yet.
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

  // --- Wiring --------------------------------------------------------------

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

  ui.markFilter(state.filter);
  ui.renderLegend();
  ui.resetLocation();
  ui.showTab("report");

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

    // Until you write createItem there is nothing to submit to.
    if (!createItem) {
      ui.showToast("No createItem yet — that is the last step.", "⚠️");
      return;
    }
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
};
