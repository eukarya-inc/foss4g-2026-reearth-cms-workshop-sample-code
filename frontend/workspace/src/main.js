// Your workspace. You build the Hiroshima citizen hazard-report map here, one
// step at a time, and everything you write goes in this one file.
//
// The parts you never have to write are imported from frontend/common: the
// markup, the rendering, the category list and the offline demo data. Run
// `npm run dev:web` from the repo root and open http://localhost:5173.
//
// If you fall behind, every step has a finished copy you can run instead:
//   npm run step:web -- frontend/steps/02-map

import LAYOUT from "../../common/layout.html?raw";
import * as ui from "../../common/ui.js";

// The markup has to be in the DOM before anything looks an element up, so this
// runs before everything else.
document.getElementById("app").innerHTML = LAYOUT;

// The parts of the panel that need no data can be drawn straight away. The two
// callbacks stay empty until step 05, when the form starts using them.
ui.renderCategoryOptions(() => {});
ui.renderFilterChips(() => {});
ui.markFilter("all");
ui.renderLegend();
ui.resetLocation();
ui.showTab("report");

// No CMS data yet, so the header badge says so.
ui.setConnection(false);

// TODO (step 02): build the Leaflet map — centre, zoom and tile layer.
// TODO (step 03): read the reports out of your own CMS project.
// TODO (step 04): turn those reports into markers on the map.
// TODO (step 05): send a new report back to the CMS through the proxy.

ui.showToast("Workspace is running. Start with step 02.", "👋");
