/** Sorting types retained from v1 */
export type SortBy = "createdAt" | "updatedAt" | "visitedAt" | "name";
export type SortOrder = "asc" | "desc";

/** Toolbar item shape (compatible with current usage) */
export interface ToolbarItem {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

/** Canonical v1 settings shape (visited is a string to preserve schema) */
export interface OptionsV1 {
  version: 1;
  general: {
    /** v1 now uses a boolean to indicate first-boot initialization */
    visited: boolean;
    editor: {
      toolbarItems: ToolbarItem[];
    };
    library: {
      sort: {
        by: SortBy;
        order: SortOrder;
      };
    };
  };
  appearance: {
    editor: {
      wrapping: boolean;
    };
  };
}

/** Permissive shape for incoming payloads read from storage */
export interface OptionsV1Like {
  version?: number;
  general?: {
    visited?: boolean | string | null;
    editor?: {
      toolbarItems?: Partial<ToolbarItem>[] | undefined;
    };
    library?: {
      sort?: {
        by?: SortBy;
        order?: SortOrder;
      };
    };
  };
  appearance?: {
    editor?: {
      wrapping?: boolean;
    };
  };
}

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
export function validateOptionsV1(candidate: unknown, defaults: OptionsV1): OptionsV1 {
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

  const result: OptionsV1 = {
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
 * - Does NOT introduce or require i18n fields.
 */
export function loadSettings(rawJson: string | null, defaultsV1: OptionsV1): OptionsV1 {
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
