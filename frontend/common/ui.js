import { CATEGORIES, categoryOf, STATUS_LABELS } from "./categories.js";

const $ = (id) => document.getElementById(id);

// Class lists that change with state. Kept here as named constants so the
// toggling code below stays readable.
const TAB_ACTIVE = ["bg-white", "text-sky-800", "shadow-[inset_0_-3px_0_#075985]"];
const TAB_IDLE = ["text-slate-500"];
const OPTION_SELECTED = ["border-sky-800", "bg-sky-50"];
const OPTION_IDLE = ["border-slate-200", "bg-white"];
const CHIP_ACTIVE = ["bg-sky-800", "border-sky-800", "text-white"];
const CHIP_IDLE = ["bg-white", "border-slate-200", "text-slate-500"];
// Folds by exactly the panel's width, so the toggle riding beside it ends up
// flush against the left edge rather than sliding off with it.
const SIDEBAR_FOLDED = "-translate-x-[420px]";
const PICKER_BASE =
  "cursor-pointer rounded-xl border-2 p-4 text-center transition";

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  public: "bg-emerald-100 text-emerald-700",
  resolved: "bg-slate-100 text-slate-600",
};

// Any CMS text that ends up in innerHTML goes through this first.
export const escapeHtml = (text) => {
  const element = document.createElement("div");
  element.textContent = text ?? "";
  return element.innerHTML;
};

export const showTab = (name) => {
  ["report", "list"].forEach((tab) => {
    const isActive = tab === name;
    $(`tab-${tab}`).classList.toggle("hidden", !isActive);

    const button = $(`tab-${tab}-btn`);
    button.classList.remove(...(isActive ? TAB_IDLE : TAB_ACTIVE));
    button.classList.add(...(isActive ? TAB_ACTIVE : TAB_IDLE));
  });
};

export const setSidebar = (isOpen) => {
  $("sidebar").classList.toggle(SIDEBAR_FOLDED, !isOpen);

  const toggle = $("sidebar-toggle");
  toggle.textContent = isOpen ? "‹" : "›";
  toggle.title = isOpen ? "Hide the panel" : "Show the panel";
};

export const renderCategoryOptions = (onSelect) => {
  const grid = $("category-grid");

  grid.innerHTML = CATEGORIES.map(
    (category) => `
      <button
        type="button"
        data-category="${category.key}"
        class="rounded-lg border-2 px-3 py-3.5 text-center transition ${OPTION_IDLE.join(" ")} hover:border-sky-400"
      >
        <div class="text-2xl">${category.icon}</div>
        <div class="mt-1.5 text-xs font-semibold">${category.label}</div>
      </button>`,
  ).join("");

  grid.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => onSelect(button.dataset.category));
  });
};

export const markCategory = (key) => {
  $("category-grid")
    .querySelectorAll("[data-category]")
    .forEach((button) => {
      const isSelected = button.dataset.category === key;
      button.classList.remove(...(isSelected ? OPTION_IDLE : OPTION_SELECTED));
      button.classList.add(...(isSelected ? OPTION_SELECTED : OPTION_IDLE));
    });
};

export const renderFilterChips = (onFilter) => {
  const bar = $("filter-bar");
  const filters = [{ key: "all", label: "All", icon: "" }, ...CATEGORIES];

  bar.innerHTML = filters
    .map(
      (filter) => `
      <button
        type="button"
        data-filter="${filter.key}"
        class="rounded-full border px-3.5 py-2 text-xs font-medium transition ${CHIP_IDLE.join(" ")}"
      >${filter.icon} ${filter.label}</button>`,
    )
    .join("");

  bar.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => onFilter(button.dataset.filter));
  });
};

export const markFilter = (key) => {
  $("filter-bar")
    .querySelectorAll("[data-filter]")
    .forEach((button) => {
      const isActive = button.dataset.filter === key;
      button.classList.remove(...(isActive ? CHIP_IDLE : CHIP_ACTIVE));
      button.classList.add(...(isActive ? CHIP_ACTIVE : CHIP_IDLE));
    });
};

export const renderLegend = () => {
  $("legend-items").innerHTML = CATEGORIES.map(
    (category) => `
      <div class="flex items-center gap-2.5">
        <span
          class="flex h-6 w-6 items-center justify-center rounded-full text-xs"
          style="background:${category.color}"
        >${category.icon}</span>
        <span class="text-xs">${category.label}</span>
      </div>`,
  ).join("");
};

export const renderList = (reports, onSelect) => {
  const container = $("reports-list");

  if (reports.length === 0) {
    container.innerHTML = `
      <div class="py-10 text-center text-slate-500">
        <div class="mb-4 text-5xl">📭</div>
        <p class="text-sm">No reports match this filter.</p>
      </div>`;
    return;
  }

  container.innerHTML = reports.map(cardHtml).join("");
  container.querySelectorAll("[data-id]").forEach((card) => {
    card.addEventListener("click", () => onSelect(card.dataset.id));
  });
};

export const renderStats = (reports) => {
  $("stat-total").textContent = reports.length;
  $("stat-pending").textContent = countByStatus(reports, "pending");
  $("stat-resolved").textContent = countByStatus(reports, "resolved");
};

export const setConnection = (isLive) => {
  const badge = $("connection");
  const tone = isLive
    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
    : "border-red-500/40 bg-red-500/20 text-red-300";

  badge.className = `flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${tone}`;
  badge.innerHTML = `
    <span class="h-2 w-2 rounded-full ${isLive ? "animate-pulse bg-emerald-400" : "bg-red-400"}"></span>
    <span>${isLive ? "Connected to CMS" : "Demo mode"}</span>`;
};

export const setLocation = ({ lat, lng }, onClear) => {
  const picker = $("location-picker");

  picker.className = `${PICKER_BASE} border-solid border-emerald-600 bg-emerald-50`;
  picker.innerHTML = `
    <div class="text-3xl">✓</div>
    <div class="text-[13px] text-slate-500">Location selected</div>
    <div class="mt-2 inline-block rounded bg-emerald-100 px-3 py-1.5 font-mono text-[11px] text-emerald-700">
      ${lat.toFixed(6)}, ${lng.toFixed(6)}
    </div>
    <div>
      <button
        type="button"
        data-clear-location
        class="mt-2 text-[11px] font-medium text-slate-500 underline underline-offset-2 hover:text-red-600"
      >Clear location</button>
    </div>`;

  picker
    .querySelector("[data-clear-location]")
    .addEventListener("click", onClear);
};

export const resetLocation = () => {
  const picker = $("location-picker");

  picker.className = `${PICKER_BASE} border-dashed border-slate-300 bg-slate-50 hover:border-sky-800`;
  picker.innerHTML = `
    <div class="text-3xl">🗺️</div>
    <div class="text-[13px] text-slate-500">Click the map to pick a location</div>`;
};

export const renderPhotos = (photos, onRemove) => {
  const container = $("photo-previews");

  // Blob URLs, not CMS text — but the whole strip is re-rendered from state on
  // every change, which keeps the previews and the state in step.
  container.innerHTML = photos
    .map(
      (photo) => `
      <div class="relative h-20 w-20 overflow-hidden rounded-lg">
        <img src="${photo.url}" alt="" class="h-full w-full object-cover" />
        <button
          type="button"
          data-photo="${photo.id}"
          class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
        >✕</button>
      </div>`,
    )
    .join("");

  container.querySelectorAll("[data-photo]").forEach((button) => {
    button.addEventListener("click", () => onRemove(button.dataset.photo));
  });
};

export const showDetail = (report) => {
  const category = categoryOf(report.category);

  const icon = $("modal-icon");
  icon.textContent = category.icon;
  icon.style.background = `${category.color}22`;

  $("modal-title").textContent = report.title;
  $("modal-subtitle").textContent = category.label;

  $("modal-body").innerHTML = `
    <p class="text-sm leading-relaxed text-slate-600">${escapeHtml(report.description || "No description")}</p>
    ${report.photos
      .map(
        (url) =>
          `<img src="${escapeHtml(url)}" alt="" class="mt-4 w-full rounded-lg" />`,
      )
      .join("")}`;

  $("modal-meta").innerHTML = `
    <div class="flex items-center gap-2"><span>📅</span><span>${formatDateTime(report.createdAt)}</span></div>
    <div class="flex items-center gap-2"><span>📍</span><span class="font-mono text-[11px]">${formatPosition(report)}</span></div>
    <div>${statusBadge(report.status)}</div>
    <div class="flex items-center gap-2"><span>🆔</span><span class="font-mono text-[10px]">${escapeHtml(report.id)}</span></div>`;

  $("modal").classList.remove("hidden");
  $("modal").classList.add("flex");
};

export const closeDetail = () => {
  $("modal").classList.add("hidden");
  $("modal").classList.remove("flex");
};

let toastTimer = null;

export const showToast = (message, icon = "✓") => {
  const toast = $("toast");

  $("toast-icon").textContent = icon;
  $("toast-message").textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("flex");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 3000);
};

export const setLoading = (isLoading) => {
  $("loading").classList.toggle("hidden", !isLoading);
  $("loading").classList.toggle("flex", isLoading);
};

export const setSubmitEnabled = (isEnabled) => {
  $("submit").disabled = !isEnabled;
};

const cardHtml = (report) => {
  const category = categoryOf(report.category);

  return `
    <article
      data-id="${escapeHtml(report.id)}"
      class="mb-3 cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-800 hover:shadow-sm"
    >
      <div class="mb-3 flex items-start gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
          style="background:${category.color}22"
        >${category.icon}</span>
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-sm font-semibold">${escapeHtml(report.title)}</h3>
          <p class="text-[11px] text-slate-500">${category.label} · ${formatDate(report.createdAt)}</p>
        </div>
        ${statusBadge(report.status)}
      </div>
      <p class="line-clamp-2 text-[13px] text-slate-500">${escapeHtml(report.description || "No description")}</p>
    </article>`;
};

const statusBadge = (status) => `
  <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${STATUS_BADGE[status] ?? STATUS_BADGE.resolved}">
    ${escapeHtml(STATUS_LABELS[status] ?? status)}
  </span>`;

const countByStatus = (reports, status) =>
  reports.filter((report) => report.status === status).length;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US") : "—";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-US") : "—";

const formatPosition = (report) =>
  Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
    ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
    : "—";
