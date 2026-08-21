import {
  categoryOf,
  MAP_CENTER,
  MAP_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from "./config.js";

// Leaflet is loaded from the CDN in index.html, so it is a global.
const { L } = window;

// Leaflet builds its marker HTML in JavaScript, but Tailwind's browser build
// watches the DOM for new classes, so utility classes work here as well as they
// do in index.html. Named here to keep the divIcon calls below readable.
const MARKER_CLASS =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full " +
  "border-4 border-white text-base shadow-lg shadow-black/30 " +
  "transition-transform hover:scale-125";

const PICK_MARKER_CLASS =
  "h-10 w-10 animate-ping rounded-full border-4 border-sky-800 bg-sky-800/30";

let map = null;
let markers = [];
let pickMarker = null;

export const initMap = (onPick) => {
  map = L.map("map", {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
  });

  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
  map.on("click", (event) => {
    showPickMarker(event.latlng);
    onPick(event.latlng);
  });
};

export const renderMarkers = (reports, onSelect) => {
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
export const panToReport = (report) => {
  if (!hasPosition(report)) return;
  map.panTo([report.latitude, report.longitude]);
};

export const locateMe = (onError) => {
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
export const zoomIn = () => {
  map.zoomIn();
};

export const zoomOut = () => {
  map.zoomOut();
};

export const clearPickMarker = () => {
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
