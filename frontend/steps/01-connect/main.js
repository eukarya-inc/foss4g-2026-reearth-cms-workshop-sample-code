// Step 01 — connecting to your CMS project.
//
// Start here. From the repo root:
//
//   node -v            22 or newer
//   npm install        once, and it covers the backend too
//   npm run dev:web    then open http://localhost:5173
//
// The map, the panel and every button are given — they live in
// frontend/common. What you write, in this file, is the part that talks to the
// CMS. This step gets the response into the console so you can see its shape;
// the map is still on demo data until step 02 turns that response into reports.

import { startApp } from "../../common/app.js";
import { DEMO_REPORTS } from "../../common/demo-reports.js";

// ---------------------------------------------------------------------------
// Your project
// ---------------------------------------------------------------------------

// Where your project lives. Each of the three takes an id or an alias — a
// personal workspace only has an id, a project usually has an alias. None of
// this is a secret: the public API is public, and these end up in the browser
// either way. The token is the secret, and it turns up in step 03 — on the
// server, never here.
const WORKSPACE_ID_OR_ALIAS = "demo-workspace";
const PROJECT_ID_OR_ALIAS = "foss4g-workshop";
const MODEL_ID_OR_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

// The public read endpoint. The `/p/` is what makes it the public one — it
// needs no auth, so the browser can call the CMS directly and no backend has to
// be running.
const PUBLIC_ITEMS_URL = `${TARGET_URL}/api/p/${WORKSPACE_ID_OR_ALIAS}/${PROJECT_ID_OR_ALIAS}/${MODEL_ID_OR_KEY}`;

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

// The try/catch is given: anything that goes wrong — a bad alias, no network,
// the CMS down — lands in the same catch, and you get the demo reports and an
// honest "Demo mode" badge instead of a blank screen.
const listReports = async () => {
  try {
    const data = await request(PUBLIC_ITEMS_URL);
    // Open the devtools console and look at what came back: how the fields
    // arrive, and how `location` is encoded. Step 02 turns this into something
    // the map can draw, and this line goes away.
    console.log("[cms] raw response:", data);
    return { reports: DEMO_REPORTS, isLive: false };
  } catch (error) {
    console.warn("[cms] read failed, using demo data:", error.message);
    return { reports: DEMO_REPORTS, isLive: false };
  }
};

// TODO (step 02): turn the response into the shape the app expects.
// TODO (step 03): put your token on the server and start the proxy.
// TODO (step 04): send a new report back to the CMS.

startApp({ listReports });
