export type AppLocale = "en" | "es";

function getDocumentLocale() {
  if (typeof document === "undefined") return null;
  return document.documentElement.lang || null;
}

export function resolveAppLocale(locale?: string | null): AppLocale {
  const candidate = (locale ?? getDocumentLocale() ?? "en").toLowerCase();
  return candidate.startsWith("es") ? "es" : "en";
}

export function localeFromDeviceLanguages(
  languages: readonly string[] | string | null | undefined
): AppLocale {
  const list = Array.isArray(languages)
    ? languages
    : languages
      ? [languages]
      : [];
  return resolveAppLocale(list[0] ?? null);
}

export function getIntlLocale(locale?: string | null) {
  return resolveAppLocale(locale) === "es" ? "es-ES" : "en-US";
}
