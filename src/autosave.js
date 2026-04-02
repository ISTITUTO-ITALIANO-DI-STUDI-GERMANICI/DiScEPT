/**
 * Minimal localStorage-based auto-save for DiScEPT.
 * Serialises the Data singleton into a single JSON key and restores it on demand.
 */

import data from "./Data.js";

// this is another variable in localStorage and won't affect existing exist-db variables.
const STORAGE_KEY = "discept-autosave";

/* Serialise the whole Data singleton to localStorage. */
export function save(changedAt) {
  try {
    const tei = data.generateTEI();

    // Sanity check: do not overwrite a good snapshot with an empty one
    if (!tei || tei.length < 50) {
      console.warn("[autosave] Generated TEI seems empty — skipping save.");
      return;
    }

    const snapshot = {
      changedAt: changedAt || new Date().toISOString(), // Timestamp of the edit, not the write
      tei,                                               // Full TEI XML string
      project: data.project,                             // Plain JS object
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("[autosave] Could not save to localStorage:", e);
  }
}

/**
 * Load the last snapshot from localStorage and push it into Data.
 * Returns true on success, false if no snapshot exists or parsing fails.
 */
export function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.warn("[autosave] No snapshot found in localStorage.");
      return false;
    }

    const snapshot = JSON.parse(raw);

    if (!snapshot.tei) {
      console.warn("[autosave] Snapshot has no TEI content.");
      return false;
    }

    // Log the TEI being restored for debugging
    console.log("[autosave] Restoring snapshot from:", snapshot.changedAt);
    console.log("[autosave] TEI length:", snapshot.tei.length);

    // readFromString handles both documents and alignments
    data.readFromString(snapshot.tei);

    // Restore project metadata on top (readFromString already parses teiHeader,
    // but the full project object may have fields not yet round-tripped through TEI)
    if (snapshot.project) {
      data.project = snapshot.project;
    }

    console.log("[autosave] Restore complete. Languages:", data.getDocumentLanguages());
    return true;
  } catch (e) {
    console.error("[autosave] Could not restore from localStorage:", e);
    return false;
  }
}

/** Returns true when a snapshot is present in localStorage. */
export function hasSaved() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Returns the ISO timestamp of the last edit that triggered a save, or null.
 * This is NOT the time of the write operation.
 */
export function savedAt() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).changedAt || null;
  } catch {
    return null;
  }
}

/** Remove the snapshot (like, after a successful export or deliberate reset). */
export function clear() {
  localStorage.removeItem(STORAGE_KEY);
}