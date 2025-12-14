import type { ToolbarItem } from "$lib/types";
import type { Options, SortBy, SortOrder } from "$lib/types/settings";
import { locales } from "$paraglide/runtime";

const LOCALE_MAP: Record<string, string> = {
  // Bulgarian
  bg: "bg",
  "bg-bg": "bg",
  // English variants
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  "en-au": "en",
  "en-ca": "en",
  "en-nz": "en",
  // German variants
  de: "de-ch",
  "de-de": "de-ch",
  "de-at": "de-ch",
  "de-ch": "de-ch",
  // Spanish variants
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  "es-ar": "es",
  "es-co": "es",
};

/**
 * Defensive utilities
 */
function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function asBoolean(v: unknown, def: boolean): boolean {
  if (isBoolean(v)) return v;
  if (isString(v)) {
    const lowered = v.toLowerCase().trim();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return def;
}
function asSortBy(v: unknown, def: SortBy): SortBy {
  const allowed: SortBy[] = ["createdAt", "updatedAt", "visitedAt", "name"];
  return isString(v) && (allowed as string[]).includes(v) ? (v as SortBy) : def;
}
function asSortOrder(v: unknown, def: SortOrder): SortOrder {
  const allowed: SortOrder[] = ["asc", "desc"];
  return isString(v) && (allowed as string[]).includes(v) ? (v as SortOrder) : def;
}
function coerceToolbarItem(candidate: Partial<ToolbarItem>, def: ToolbarItem): ToolbarItem {
  const id = isString(candidate.id) ? candidate.id : def.id;
  const title = isString(candidate.title) ? candidate.title : def.title;
  const enabled = asBoolean(candidate.enabled, def.enabled);
  const order = isNumber(candidate.order) ? candidate.order : def.order;
  return { id, title, enabled, order };
}

/**
 * Merge toolbar items while preserving user preferences and filling defaults.
 * - Overlay user items onto defaults (by id)
 * - Include default items that user doesn't have
 * - Include unknown user items (appended to the end) to avoid data loss
 * - Normalize order to contiguous indices to avoid gaps/collisions
 */
export function mergeToolbarItems(defaultItems: ToolbarItem[], userItems: Partial<ToolbarItem>[]): ToolbarItem[] {
  const userMap = new Map<string, Partial<ToolbarItem>>();
  for (const u of userItems) {
    if (u?.id && isString(u.id)) {
      userMap.set(u.id, u);
    }
  }

  const merged: ToolbarItem[] = [];
  for (const def of defaultItems) {
    const u = userMap.get(def.id);
    if (u) {
      merged.push(coerceToolbarItem(u, def));
    } else {
      merged.push({ ...def });
    }
  }

  // Include unknown user items (not present in defaults) to avoid losing data
  for (const [id, u] of userMap.entries()) {
    const exists = merged.find((m) => m.id === id);
    if (!exists) {
      const basicDefault: ToolbarItem = {
        id,
        title: isString(u.title) ? u.title : id,
        enabled: asBoolean(u.enabled, true),
        order: isNumber(u.order) ? u.order : defaultItems.length,
      };
      merged.push(coerceToolbarItem(u, basicDefault));
    }
  }

  // Normalize order to contiguous indices
  merged
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((item, idx) => {
      item.order = idx;
    });

  return merged;
}

/**
 * Validate and repair an OptionsV1-like object using provided v1 defaults.
 * This is the final validation/normalization step; it returns a v1-compatible shape.
 */
export function validateOptionsV1(candidate: unknown, defaults: Options): Options {
  const c = (candidate ?? {}) as Record<string, unknown>;

  // visited: normalize to boolean; persist as boolean in v1
  const visitedBool = asBoolean((c.general as any)?.visited, defaults.general.visited);

  const sortBy = asSortBy((c.general as any)?.library?.sort?.by, defaults.general.library.sort.by);
  const sortOrder = asSortOrder((c.general as any)?.library?.sort?.order, defaults.general.library.sort.order);

  const userToolbarItems = Array.isArray((c.general as any)?.editor?.toolbarItems)
    ? ((c.general as any)?.editor?.toolbarItems as Partial<ToolbarItem>[])
    : [];

  const mergedToolbar = mergeToolbarItems(defaults.general.editor.toolbarItems, userToolbarItems);

  const wrapping = asBoolean((c.appearance as any)?.editor?.wrapping, defaults.appearance.editor.wrapping);

  const rawLang = isString((c.i18n as any)?.language) ? (c.i18n as any).language : defaults.i18n.language;
  const normalize = (l: string): string => {
    const lower = l.toLowerCase();

    // try explicit mapping table
    const mapped = LOCALE_MAP[lower];
    if (mapped && (locales as unknown as string[]).includes(mapped)) return mapped;

    // exact match against supported locales
    if ((locales as unknown as string[]).includes(lower)) return lower;

    // try base language before dash (e.g. en-US -> en, de-CH -> de-ch via mapping)
    const base = lower.split("-")[0];
    const baseMapped = LOCALE_MAP[base];
    if (baseMapped && (locales as unknown as string[]).includes(baseMapped)) return baseMapped;
    if ((locales as unknown as string[]).includes(base)) return base;

    // fallback to a supported locale
    const supported = locales as unknown as string[];
    const defLower = defaults.i18n.language.toLowerCase();
    const defMapped = LOCALE_MAP[defLower] ?? defLower;
    // prefer mapped/default if available
    if (supported.includes(defMapped)) return defMapped;
    // prefer english if available otherwise
    if (supported.includes("en")) return "en";
    // finally fallback to the first supported locale or english
    return supported[0] ?? "en";
  };
  const language = normalize(rawLang);

  const result: Options = {
    version: 1,
    general: {
      visited: visitedBool,
      editor: {
        toolbarItems: mergedToolbar,
      },
      library: {
        sort: {
          by: sortBy,
          order: sortOrder,
        },
      },
    },
    appearance: {
      editor: {
        wrapping,
      },
    },
    i18n: {
      language,
    },
  };

  return result;
}

/**
 * Load settings from raw JSON and validate/repair to v1 schema without changing the version.
 *
 * Parameters:
 * - rawJson: the raw string read from storage (or null if missing)
 * - defaultsV1: canonical defaults for v1 (supplied by the caller)
 *
 * Behavior:
 * - If JSON is missing or invalid: returns defaults.
 * - If version is missing or any shape deviates: repairs with defaults and returns v1-compatible object.
 */
export function loadSettings(rawJson: string | null, defaultsV1: Options): Options {
  if (!rawJson) {
    return validateOptionsV1(defaultsV1, defaultsV1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return validateOptionsV1(defaultsV1, defaultsV1);
  }

  // Regardless of provided version, we validate/repair and enforce v1 result
  return validateOptionsV1(parsed, defaultsV1);
}
