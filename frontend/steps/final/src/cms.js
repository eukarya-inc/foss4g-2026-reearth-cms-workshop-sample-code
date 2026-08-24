import {
  ASSETS_PATH,
  ITEMS_PATH,
  PROXY_BASE_URL,
  PUBLIC_ITEMS_URL,
} from "./config.js";

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
export const listReports = async () => {
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
export const uploadAsset = async (file) => {
  const body = new FormData();
  body.append("file", file);
  body.append("skipDecompression", "true");

  const asset = await request(`${PROXY_BASE_URL}${ASSETS_PATH}`, {
    method: "POST",
    body,
  });
  return asset.id;
};

export const createItem = (draft, assetIds) =>
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
    title: "Cracked pavement in the Hondori arcade",
    category: "road",
    description:
      "A wide crack across the walkway. Easy to trip over, and it catches the wheels of a pushchair.",
    status: "approved",
    latitude: 34.3922,
    longitude: 132.4573,
    photos: [],
    createdAt: "2026-01-15T09:30:00Z",
  },
  {
    id: "demo-2",
    title: "Street light out near Yokogawa Station",
    category: "facility",
    description:
      "This street light no longer comes on at night, which makes the walk to the station feel unsafe.",
    status: "pending",
    latitude: 34.4052,
    longitude: 132.4487,
    photos: [],
    createdAt: "2026-01-18T14:20:00Z",
  },
  {
    id: "demo-3",
    title: "Loose slope above a residential street in Asaminami",
    category: "disaster",
    description:
      "Soil and small rocks have come down onto the road after the last heavy rain. The slope above it still looks unstable.",
    status: "approved",
    latitude: 34.4571,
    longitude: 132.4667,
    photos: [],
    createdAt: "2026-01-10T11:45:00Z",
  },
  {
    id: "demo-4",
    title: "Abandoned bicycles outside Hiroshima Station",
    category: "other",
    description:
      "Bicycles are piling up across the pavement and blocking wheelchair access to the south exit.",
    status: "resolved",
    latitude: 34.3977,
    longitude: 132.4753,
    photos: [],
    createdAt: "2026-01-05T16:00:00Z",
  },
  {
    id: "demo-5",
    title: "Worn road surface on the Ujina port road",
    category: "road",
    description:
      "The surface has peeled away in places, which is dangerous on a bicycle in the wet.",
    status: "pending",
    latitude: 34.3583,
    longitude: 132.4611,
    photos: [],
    createdAt: "2026-01-20T08:15:00Z",
  },
  {
    id: "demo-6",
    title: "Leaning tree in Hijiyama Park",
    category: "disaster",
    description:
      "A large tree beside the path is leaning badly and could come down in a strong wind.",
    status: "approved",
    latitude: 34.3839,
    longitude: 132.4744,
    photos: [],
    createdAt: "2026-01-17T10:30:00Z",
  },
  {
    id: "demo-7",
    title: "Damaged handrail on the Shukkei-en riverside steps",
    category: "facility",
    description:
      "The handrail on the steps down to the river has come loose and needs repair before someone leans on it.",
    status: "pending",
    latitude: 34.4004,
    longitude: 132.4645,
    photos: [],
    createdAt: "2026-01-19T13:45:00Z",
  },
];
