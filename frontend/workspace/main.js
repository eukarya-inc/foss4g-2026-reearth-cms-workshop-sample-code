// Your workspace. Everything you write during the workshop goes in this file.
//
// The map, the side panel, the list, the filters and every button are already
// built — they live in frontend/common and you never have to touch them. What
// you write is the part that talks to the Re:Earth CMS: where your project is,
// how to read reports out of it, and how to send a new one back.
//
// Getting started, from the repo root:
//
//   node -v            22 or newer
//   npm install        once, and it covers the backend too
//   npm run dev:web    then open http://localhost:5173
//
// If you fall behind, every step has a finished copy you can run instead:
//   npm run step:web -- frontend/steps/01-connect

import { startApp } from "../common/app.js";
import { DEMO_REPORTS } from "../common/demo-reports.js";

// ---------------------------------------------------------------------------
// Your project
// ---------------------------------------------------------------------------

// TODO (step 01): the ids or aliases from your own CMS project. A personal
// workspace only has an id; a project usually has an alias.
const WORKSPACE_ID_OR_ALIAS = "your-workspace-id-or-alias";
const PROJECT_ID_OR_ALIAS = "your-project-id-or-alias";
const MODEL_ID_OR_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

// TODO (step 01): build the public read URL from the three identifiers above.

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// Given. fetch does not throw on 404 or 500 — it resolves with ok === false and
// you get the error body parsed as if it were your data. Checking here means
// every caller gets real data or an exception, and nothing in between.
const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// The app calls this to get reports. Right now it returns the demo ones, which
// is why the badge in the header says "Demo mode".
//
// The try/catch is given: anything that goes wrong — a bad alias, no network,
// the CMS down — lands in the same catch, and you get the demo reports and an
// honest badge instead of a blank screen.
const listReports = async () => {
  try {
    // TODO (step 01): read the public URL and log what comes back.
    // TODO (step 02): return { reports: normalizeResponse(data), isLive: true }.
    return { reports: DEMO_REPORTS, isLive: false };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};

// TODO (step 03): put your token on the server and start the proxy.
// TODO (step 04): send a new report back to the CMS.

startApp({ listReports });
