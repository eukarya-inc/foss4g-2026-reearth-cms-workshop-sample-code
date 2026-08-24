// Everything an attendee has to change to point the sample at their own CMS
// project lives in this file.

// Read path — the CMS public API needs no auth, so the browser calls the CMS
// directly and the backend is not involved at all. It does want the aliases you
// gave the project and the model, not their ids.
export const CMS_BASE_URL = "https://api.cms.test.reearth.dev/";

export const WORKSPACE_ALIAS = "aaaaa-yhwlvy";
export const PROJECT_ALIAS = "workshop";
export const MODEL_KEY = "hazard_reports";

export const PUBLIC_ITEMS_URL = `${CMS_BASE_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

// Write path — the integration API needs the token, so it goes through the
// backend proxy, which attaches the token on the way out. Nothing in this file
// is a secret.
export const PROXY_BASE_URL = "http://localhost:8080";

// It wants ids, not aliases. Read them off the CMS admin URL:
// https://cms.reearth.io/workspace/<workspaceId>/project/<projectId>/content/<modelId>
export const WORKSPACE_ID = "aaaaa-yhwlvy";
export const PROJECT_ID = "workshop";
export const MODEL_ID = "hazard_reports";

export const ASSETS_PATH = `/api/${WORKSPACE_ID}/projects/${PROJECT_ID}/assets`;
export const ITEMS_PATH = `/api/${WORKSPACE_ID}/projects/${PROJECT_ID}/models/${MODEL_ID}/items`;

// Map defaults — central Hiroshima. Zoom 12 keeps the hillside wards in the
// north and the port in the south on screen together.
export const MAP_CENTER = [34.3853, 132.4553];
export const MAP_ZOOM = 12;
export const TILE_URL = "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '<a href="https://maps.gsi.go.jp/development/ichiran.html">GSI Japan</a>';

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

export const categoryOf = (key) => CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);
