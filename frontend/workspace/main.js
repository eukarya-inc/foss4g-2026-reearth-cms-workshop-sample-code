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

// TODO (step 01): the aliases and model key from your own CMS project.
const WORKSPACE_ALIAS = "your-workspace-alias";
const PROJECT_ALIAS = "your-project-alias";
const MODEL_KEY = "hazard_reports";

// The CMS host. `TARGET_URL` in the repo-root .env overrides it, so the host
// you read from is always the host the proxy writes to.
const TARGET_URL = import.meta.env.TARGET_URL ?? "https://api.cms.reearth.io";

// ---------------------------------------------------------------------------
// Talking to the CMS
// ---------------------------------------------------------------------------

// TODO (step 01): build the public read URL and fetch it.
// TODO (step 02): turn the response into the shape the app expects.
// TODO (step 03): put your token on the server and start the proxy.
// TODO (step 04): send a new report back to the CMS.

// Until you write the read, the app runs on the demo reports — which is why the
// badge in the header says "Demo mode".
const listReports = async () => ({ reports: DEMO_REPORTS, isLive: false });

startApp({ listReports });
