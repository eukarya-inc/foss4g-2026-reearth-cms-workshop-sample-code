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
// CMS. This step gets the response on screen so you can see its shape.

import { showRaw } from "../../common/app.js";

// ---------------------------------------------------------------------------
// Your project
// ---------------------------------------------------------------------------

// The aliases you gave the workspace and the project, and the key you gave the
// model. None of this is a secret: the public API is public, and these end up
// in the browser either way. The token is the secret, and it turns up in step
// 03 — on the server, never here.
const WORKSPACE_ALIAS = "demo-workspace";
const PROJECT_ALIAS = "foss4g-workshop";
const MODEL_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

// The public read endpoint. The `/p/` is what makes it the public one — it
// needs no auth, so the browser can call the CMS directly and no backend has to
// be running.
const PUBLIC_ITEMS_URL = `${TARGET_URL}/api/p/${WORKSPACE_ALIAS}/${PROJECT_ALIAS}/${MODEL_KEY}`;

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// fetch does not throw on 404 or 500 — it resolves with ok === false and you
// get the error body parsed as if it were your data. Checking here means every
// caller gets real data or an exception, and nothing in between.
const request = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const listReports = async () => {
  const data = await request(PUBLIC_ITEMS_URL, {
    headers: { Accept: "application/json" },
  });
  return data;
};

// Look at what comes back: how the fields arrive, and how `location` is
// encoded. Step 02 turns this into something the map can draw.
listReports()
  .then(showRaw)
  .catch((error) => showRaw({ error: error.message }));

// TODO (step 02): turn the response into the shape the app expects.
// TODO (step 03): put your token on the server and start the proxy.
// TODO (step 04): send a new report back to the CMS.
