import type { Locale } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";
import langs from "$lib/data/langs.json";

/**
 * Special case mappings for language tags that don't have a base form in date-fns.
 * Only includes cases where the plain language code doesn't exist in date-fns.
 *
 * Regional fallbacks (e.g., de-ch to de) are handled automatically by the
 * base language fallback strategy and don't need to be listed here.
 */
const SPECIAL_CASES: Record<string, string> = {
  en: "enUS",
  no: "nb",
  zh: "zhCN",
  fa: "faIR",
};

/**
 * Converts a language tag to camelCase format used by date-fns.
 */
function toCamelCase(tag: string): string {
  const parts = tag.split("-");
  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }

  const [language, ...regions] = parts;
  const capitalizedRegions = regions.map((r) => r.toUpperCase()).join("");
  return language.toLowerCase() + capitalizedRegions;
}

/**
 * Attempts to find a matching date-fns locale for the given language tag.
 */
function findDateFnsLocale(languageTag: string): Locale {
  const locales = dateFnsLocales as Record<string, Locale>;
  const lowerTag = languageTag.toLowerCase();

  // check special cases
  if (SPECIAL_CASES[lowerTag]) {
    const specialKey = SPECIAL_CASES[lowerTag];
    if (locales[specialKey]) {
      return locales[specialKey];
    }
  }

  // try exact match (lowercase)
  if (locales[lowerTag]) {
    return locales[lowerTag];
  }

  // try camel case conversion
  const camelCaseKey = toCamelCase(lowerTag);
  if (locales[camelCaseKey]) {
    return locales[camelCaseKey];
  }

  // try base language (de from de-CH)
  const baseLanguage = lowerTag.split("-")[0];
  if (baseLanguage !== lowerTag && locales[baseLanguage]) {
    return locales[baseLanguage];
  }

  // fall back to english
  console.warn(
    `Date locale not found for "${languageTag}". ` +
      `Tried: ${[lowerTag, camelCaseKey, baseLanguage].filter((k, i, arr) => arr.indexOf(k) === i).join(", ")}. ` +
      `Falling back to English. See: https://date-fns.org/docs/I18n`
  );
  return locales.enUS;
}

/**
 * Dynamically creates a map of language tags to date-fns Locale objects.
 * This reads from langs.json to determine which locales are available in the app.
 */
function createDateLocaleMap(): Record<string, Locale> {
  const map: Record<string, Locale> = {};
  const availableLanguages = Object.keys(langs);

  for (const languageTag of availableLanguages) {
    map[languageTag] = findDateFnsLocale(languageTag);
  }

  return map;
}

/**
 * Pre-generated locale map for better performance.
 * This is created once when the module is imported.
 *
 * Usage:
 * ```typescript
 * import { dateLocaleMap } from "$lib/i18n/dateLocales";
 * import { getLocale } from "$paraglide/runtime";
 *
 * const dateLocale = $derived(dateLocaleMap[getLocale()] || dateLocaleMap["en"]);
 * ```
 */
export const dateLocaleMap = createDateLocaleMap();

/**
 * Gets the date-fns locale for a given language tag.
 * Falls back to English (US) if the locale is not found.
 *
 * @param languageTag - The language tag (e.g., "en", "de-ch")
 * @returns The corresponding date-fns Locale object
 */
export function getDateLocale(languageTag: string): Locale {
  return dateLocaleMap[languageTag] || findDateFnsLocale(languageTag);
}
