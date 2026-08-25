// Helpers for reading values out of a CMS response.
//
// A field can come back in more than one shape depending on how the model was
// built, so these accept all of them rather than assuming one. They are plumbing
// rather than lesson: normalizeItem() in your own file is where the interesting
// part happens — this is just what it leans on.

// A geometryObject field arrives either as GeoJSON, as a JSON string holding
// GeoJSON, or as a plain object with lng/lat or longitude/latitude on it.
// Returns [longitude, latitude] — GeoJSON's order, which is the opposite of
// Leaflet's — or null if there is no usable point in there.
export const readPoint = (location) => {
  if (!location) return null;

  const geometry = typeof location === "string" ? safeParse(location) : location;
  if (Array.isArray(geometry?.coordinates)) return geometry.coordinates;

  const longitude = geometry?.lng ?? geometry?.longitude;
  const latitude = geometry?.lat ?? geometry?.latitude;
  if (longitude === undefined || latitude === undefined) return null;

  return [Number(longitude), Number(latitude)];
};

// An asset field is a list of either URLs or objects carrying one. Anything
// else is dropped rather than rendered as a broken image.
export const toPhotoUrls = (photos) =>
  (Array.isArray(photos) ? photos : [])
    .map((photo) => (typeof photo === "string" ? photo : photo?.url))
    .filter(Boolean);

// JSON.parse that returns null instead of throwing, so one malformed field
// cannot take down the whole list.
const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
