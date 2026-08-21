// Everything an attendee has to change to point the sample at their own CMS
// project lives in this file.

// The backend proxy. It forwards every request to the Re:Earth CMS and attaches
// the integration token on the way out, so nothing in this file is a secret.
export const API_BASE_URL = "http://localhost:8080";

// Read path — the CMS public API needs no auth.
// Shape: /api/p/<workspace alias>/<project alias>/<model key>
export const PUBLIC_ITEMS_PATH = "/api/p/eukarya/kobe-demo/hazard_reports";

// Write path — the integration API wants ids, not aliases. Read them off the
// CMS admin URL:
// https://cms.reearth.io/workspace/<workspaceId>/project/<projectId>/content/<modelId>
export const WORKSPACE_ID = "YOUR_WORKSPACE_ID";
export const PROJECT_ID = "YOUR_PROJECT_ID";
export const MODEL_ID = "YOUR_MODEL_ID";

export const ASSETS_PATH = `/api/${WORKSPACE_ID}/projects/${PROJECT_ID}/assets`;
export const ITEMS_PATH = `/api/${WORKSPACE_ID}/projects/${PROJECT_ID}/models/${MODEL_ID}/items`;

// Map defaults — central Kobe.
export const MAP_CENTER = [34.6901, 135.1956];
export const MAP_ZOOM = 13;
export const TILE_URL =
  "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Japan</a>';

// One entry per category. The picker, the markers, the legend and the list all
// read from here, so a new category only has to be added once.
export const CATEGORIES = [
  { key: "road", label: "Road damage", icon: "🚧", color: "#ef4444" },
  { key: "facility", label: "Facility fault", icon: "🏗️", color: "#f59e0b" },
  { key: "disaster", label: "Disaster risk", icon: "⚠️", color: "#8b4513" },
  { key: "other", label: "Other", icon: "📍", color: "#64748b" },
];

export const STATUS_LABELS = {
  pending: "Under review",
  approved: "In progress",
  public: "Published",
  resolved: "Resolved",
};

export const MAX_PHOTOS = 4;

export const categoryOf = (key) =>
  CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);
