// ─── STUDY MODE PREFERENCE ───────────────────────────────────────────────────
// Which study page the NOTES tab opens on this device:
//   "ink"  → ScribePage, the stylus page at #/study
//   "text" → the typed study page (Phase 4; for now the Discussion panel)
//
// This is an explicit user setting, stored per device and changeable from the
// settings menu in either the reading app or the study page. The only automatic
// behaviour is a one-time default written by index.js the first time a real
// stylus event is seen — after that the stored setting always wins.

export const STUDY_MODE_KEY = "study-mode";

export function getStudyMode() {
  try {
    return localStorage.getItem(STUDY_MODE_KEY) === "ink" ? "ink" : "text";
  } catch {
    return "text";
  }
}

export function setStudyMode(mode) {
  const next = mode === "ink" ? "ink" : "text";
  try { localStorage.setItem(STUDY_MODE_KEY, next); } catch {}
  return next;
}

export function isStylusMode() {
  return getStudyMode() === "ink";
}
