// src/utils/firstLoadFlag.js
//
// A plain module-level variable is a real singleton for the life of one
// page load: it's set once when the JS module first evaluates, and stays
// that way across every client-side route change (since React Router
// never re-imports this module) — but resets to its initial value on an
// actual browser reload, since that re-evaluates all modules from scratch.
// Exactly the "shown once per real visit, not once per navigation to
// Home" behavior the home-page nudge needs.

let homeNudgeShown = false;

export function shouldShowHomeNudge() {
  if (homeNudgeShown) return false;
  homeNudgeShown = true;
  return true;
}
