/**
 * Smart defaults for quick capture: last-used category and currency persist
 * in localStorage so a repeat expense is amount + submit.
 */

const STORAGE_KEY = "quick-add-defaults";

export interface CaptureDefaults {
  categoryId?: string;
  currency?: string;
}

export function readCaptureDefaults(): CaptureDefaults {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CaptureDefaults) : {};
  } catch {
    return {};
  }
}

export function writeCaptureDefaults(defaults: CaptureDefaults) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readCaptureDefaults(), ...defaults })
    );
  } catch {
    // Storage full/blocked — quick add still works without defaults
  }
}
