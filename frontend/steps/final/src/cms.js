import {
  API_BASE_URL,
  ASSETS_PATH,
  ITEMS_PATH,
  PUBLIC_ITEMS_PATH,
} from "./config.js";

// Every call goes to the backend proxy, never to the CMS directly: the proxy is
// what holds the integration token.
const request = async (path, options) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Reading falls back to demo data, so the sample still runs with no network.
export const listReports = async () => {
  try {
    const data = await request(PUBLIC_ITEMS_PATH, {
      headers: { Accept: "application/json" },
    });
    return { reports: normalizeResponse(data), isLive: true };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};

// One POST per photo. The proxy has no routes of its own, so there is no batch
// upload endpoint to call.
export const uploadAsset = async (file) => {
  const body = new FormData();
  body.append("file", file);
  body.append("skipDecompression", "true");

  const asset = await request(ASSETS_PATH, { method: "POST", body });
  return asset.id;
};

export const createItem = (draft, assetIds) =>
  request(ITEMS_PATH, {
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
// properties, and geometry either as GeoJSON or as a JSON string. Accept all of
// them so a model whose schema does not match exactly still renders.
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

const readPoint = (location) => {
  if (!location) return null;

  const geometry = typeof location === "string" ? safeParse(location) : location;
  if (Array.isArray(geometry?.coordinates)) return geometry.coordinates;

  const longitude = geometry?.lng ?? geometry?.longitude;
  const latitude = geometry?.lat ?? geometry?.latitude;
  if (longitude === undefined || latitude === undefined) return null;

  return [Number(longitude), Number(latitude)];
};

const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toPhotoUrls = (photos) =>
  (Array.isArray(photos) ? photos : [])
    .map((photo) => (typeof photo === "string" ? photo : photo?.url))
    .filter(Boolean);

// Fallback for when the CMS is unreachable — the venue Wi-Fi answer.
const DEMO_REPORTS = [
  {
    id: "demo-1",
    title: "Cracked pavement outside Rokkomichi station",
    category: "road",
    description:
      "A wide crack in the walkway. Easy to trip over, and slippery when it rains.",
    status: "approved",
    latitude: 34.7144,
    longitude: 135.2328,
    photos: [],
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "demo-2",
    title: "Broken street light in Nada ward",
    category: "facility",
    description:
      "This street light no longer comes on at night, which makes the street feel unsafe.",
    status: "pending",
    latitude: 34.7098,
    longitude: 135.2456,
    photos: [],
    createdAt: "2026-01-18T14:20:00Z",
  },
  {
    id: "demo-3",
    title: "Landslide scar below Mount Maya",
    category: "disaster",
    description:
      "Soil washed out here during the last heavy rain. It could give way again.",
    status: "approved",
    latitude: 34.7234,
    longitude: 135.2123,
    photos: [],
    createdAt: "2026-01-10T11:45:00Z",
  },
  {
    id: "demo-4",
    title: "Abandoned bicycles around Sannomiya station",
    category: "other",
    description:
      "Bicycles are piling up across the pavement and blocking wheelchair access.",
    status: "resolved",
    latitude: 34.6951,
    longitude: 135.1979,
    photos: [],
    createdAt: "2026-01-05T16:00:00Z",
  },
  {
    id: "demo-5",
    title: "Worn road surface on Port Island bridge",
    category: "road",
    description:
      "The surface has peeled away in places, which is dangerous on a bicycle.",
    status: "pending",
    latitude: 34.6654,
    longitude: 135.2156,
    photos: [],
    createdAt: "2026-01-20T08:15:00Z",
  },
  {
    id: "demo-6",
    title: "Leaning tree in Higashinada ward",
    category: "disaster",
    description:
      "A large park tree is leaning badly and could come down in a strong wind.",
    status: "approved",
    latitude: 34.7289,
    longitude: 135.2678,
    photos: [],
    createdAt: "2026-01-17T10:30:00Z",
  },
  {
    id: "demo-7",
    title: "Damaged steps at Suma beach",
    category: "facility",
    description:
      "The handrail on the steps down to the beach has come off and needs repair.",
    status: "pending",
    latitude: 34.6398,
    longitude: 135.1123,
    photos: [],
    createdAt: "2026-01-19T13:45:00Z",
  },
];
