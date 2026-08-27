// Both sides read the same .env at the repo root, so the host the frontend
// reads from and the host the proxy writes to cannot drift apart.
//
// envDir has to be absolute: Vite resolves it against the Vite root, and the
// roots sit at different depths (frontend/workspace vs frontend/steps/NN-name).
//
// envPrefix is what makes it safe to keep the token in that same file: only
// TARGET_* is injected into the bundle, so AUTH_HEADER_VALUE never reaches the
// browser.
export default {
  envDir: import.meta.dirname,
  envPrefix: "TARGET_",
};
