/**
 * Hand-drawn category glyphs — the "fine line" family.
 *
 * Drawn on a 24×24 box as an outline (`d`) plus an optional detail path
 * (`d2`), stroked at 1.5 with round caps and joins. Chosen over the stock
 * lucide set for the categories that carry most of the app's spend; anything
 * not listed here still falls back to lucide, rendered at the same 1.5 stroke
 * so the two families sit together without a visible weight change.
 *
 * Keys are the stored `categories.icon` values, including the legacy ones, so
 * rows already in the database resolve without a migration.
 */

export type CategoryGlyphPaths = { d: string; d2?: string };

const RESTAURANTS: CategoryGlyphPaths = {
  d: "M6.6 2.8v5.4a2.4 2.4 0 0 0 4.8 0V2.8",
  d2: "M9 8.6V21.2M16.4 2.8c-1.3 1.7-1.9 3.8-1.9 5.8s.8 3.2 1.9 3.2v9.4",
};

const GROCERIES: CategoryGlyphPaths = {
  d: "M3.2 4.2h2.4l2.3 9.4h9.3l1.9-6.6H6.4",
  d2: "M9.2 16.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 1 0 0-3.2M17.2 16.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 1 0 0-3.2",
};

const HOUSING: CategoryGlyphPaths = {
  d: "M2.6 11.2 12 3.4l9.4 7.8v9.2a1.2 1.2 0 0 1-1.2 1.2H3.8a1.2 1.2 0 0 1-1.2-1.2z",
  d2: "M9.6 21.6v-6.4h4.8v6.4",
};

const UTILITIES: CategoryGlyphPaths = {
  d: "M13.4 2.4 4.6 13.8h5.6l-1 7.8 8.8-11.4h-5.6z",
};

const TRANSPORT: CategoryGlyphPaths = {
  d: "M3.4 13.4 5 8.6a2.2 2.2 0 0 1 2.1-1.5h9.8a2.2 2.2 0 0 1 2.1 1.5l1.6 4.8v4.6h-2.9v-2.2H6.3v2.2H3.4z",
  d2: "M6.8 13.2h10.4",
};

const ENTERTAINMENT: CategoryGlyphPaths = {
  d: "M2.8 9h18.4v10.8a1.5 1.5 0 0 1-1.5 1.5H4.3a1.5 1.5 0 0 1-1.5-1.5z",
  d2: "M3.2 9 4.6 4.2l15.8 2.5L19.6 9M8.8 4.9 7.2 8.8M14.2 5.7l-1.6 3.9",
};

const SUBSCRIPTIONS: CategoryGlyphPaths = {
  d: "M3.2 5h17.6a1.2 1.2 0 0 1 1.2 1.2v9.4a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 15.6V6.2A1.2 1.2 0 0 1 3.2 5z",
  d2: "M8.5 20.4h7",
};

const SHOPPING: CategoryGlyphPaths = {
  d: "M4.8 7.8h14.4l-1.1 12.2a1.3 1.3 0 0 1-1.3 1.2H7.2a1.3 1.3 0 0 1-1.3-1.2z",
  d2: "M8.6 7.6V6a3.4 3.4 0 0 1 6.8 0v1.6",
};

const HEALTH: CategoryGlyphPaths = {
  d: "M9.4 2.6h5.2v6.2h6.2v5.2h-6.2v6.2H9.4v-6.2H3.2V8.8h6.2z",
};

const TRAVEL: CategoryGlyphPaths = {
  d: "M2.4 12.6 21.6 5 14 21.6l-2.8-6.6z",
  d2: "M11.2 15 21.6 5",
};

const EDUCATION: CategoryGlyphPaths = {
  d: "M2.2 8.6 12 4.4l9.8 4.2L12 12.8z",
  d2: "M6.4 10.8v4.6c0 1.6 2.5 2.8 5.6 2.8s5.6-1.2 5.6-2.8v-4.6M21.8 8.6v5.4",
};

const TITHE: CategoryGlyphPaths = {
  d: "M5.6 11.6 12 6.6l6.4 5v9.8a1 1 0 0 1-1 1H6.6a1 1 0 0 1-1-1z",
  d2: "M12 2.4v4.4M10 4.2h4M10.4 22.4v-4.2a1.6 1.6 0 0 1 3.2 0v4.2",
};

const LOAN: CategoryGlyphPaths = {
  d: "M2.6 6.4h18.8a1 1 0 0 1 1 1v9.2a1 1 0 0 1-1 1H2.6a1 1 0 0 1-1-1V7.4a1 1 0 0 1 1-1z",
  d2: "M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 1 0 0-5.2",
};

const OTHER: CategoryGlyphPaths = {
  d: "M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 1 0 0-18.8",
  d2: "M8 12h.01M12 12h.01M16 12h.01",
};

/** Stored `icon` key → glyph. Legacy keys point at the same drawing. */
export const CATEGORY_GLYPHS: Record<string, CategoryGlyphPaths> = {
  "utensils-crossed": RESTAURANTS,
  utensils: RESTAURANTS,
  "shopping-cart": GROCERIES,
  home: HOUSING,
  house: HOUSING,
  zap: UTILITIES,
  "car-front": TRANSPORT,
  car: TRANSPORT,
  clapperboard: ENTERTAINMENT,
  film: ENTERTAINMENT,
  "monitor-play": SUBSCRIPTIONS,
  repeat: SUBSCRIPTIONS,
  "shopping-bag": SHOPPING,
  stethoscope: HEALTH,
  "heart-pulse": HEALTH,
  "plane-takeoff": TRAVEL,
  plane: TRAVEL,
  "graduation-cap": EDUCATION,
  church: TITHE,
  banknote: LOAN,
  "circle-ellipsis": OTHER,
  "more-horizontal": OTHER,
};

/** Category name (EN + ES, lowercased) → glyph, for rows with no usable key. */
export const CATEGORY_GLYPHS_BY_NAME: Record<string, CategoryGlyphPaths> = {
  "food & dining": RESTAURANTS,
  "alimentación y restaurantes": RESTAURANTS,
  restaurants: RESTAURANTS,
  groceries: GROCERIES,
  supermercado: GROCERIES,
  housing: HOUSING,
  vivienda: HOUSING,
  utilities: UTILITIES,
  servicios: UTILITIES,
  transportation: TRANSPORT,
  transporte: TRANSPORT,
  entertainment: ENTERTAINMENT,
  entretenimiento: ENTERTAINMENT,
  subscriptions: SUBSCRIPTIONS,
  suscripciones: SUBSCRIPTIONS,
  shopping: SHOPPING,
  compras: SHOPPING,
  healthcare: HEALTH,
  salud: HEALTH,
  travel: TRAVEL,
  viajes: TRAVEL,
  education: EDUCATION,
  educación: EDUCATION,
  tithe: TITHE,
  diezmo: TITHE,
  loan: LOAN,
  préstamo: LOAN,
  other: OTHER,
  otros: OTHER,
};
