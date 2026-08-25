// Fallback for when the CMS is unreachable — the venue Wi-Fi answer. listReports()
// returns these with isLive: false, and the header badge flips to "Demo mode".
export const DEMO_REPORTS = [
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
