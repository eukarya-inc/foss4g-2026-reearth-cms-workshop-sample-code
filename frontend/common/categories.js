// The report taxonomy, shared by every step.
//
// These four keys are also the options of the `category` select field in the
// CMS model, and the four statuses are the options of `status`. If they drift
// apart, items come back from the CMS with a category no marker knows about, so
// they are pinned here rather than retyped in each step.

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

// Falls back to the last entry — "Other" — so an unknown category still renders.
export const categoryOf = (key) => CATEGORIES.find((category) => category.key === key) ?? CATEGORIES.at(-1);
