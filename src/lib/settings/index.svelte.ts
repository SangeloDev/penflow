import { browser } from "$app/environment";
import type { ToolbarItem } from "$lib/types";
import type { Options } from "$lib/types/settings";
import { LocalStorageStorage, STORAGE_KEY } from "./storage";
import { loadSettings, mergeToolbarItems } from "./loader";

// Canonical defaults for v1 (built from current defaults)
const v1Defaults: Options = {
  version: 1,
  general: {
    visited: false,
    editor: {
      toolbarItems: [
        { id: "bold", enabled: true, order: 1 },
        { id: "italic", enabled: true, order: 2 },
        { id: "heading", enabled: true, order: 3 },
        { id: "orderedList", enabled: true, order: 4 },
        { id: "list", enabled: true, order: 5 },
        { id: "checklist", enabled: true, order: 6 },
        { id: "link", enabled: true, order: 7 },
        { id: "quote", enabled: true, order: 8 },
        { id: "table", enabled: true, order: 9 },
        { id: "image", enabled: true, order: 10 },
      ],
    },
    library: {
      sort: {
        by: "visitedAt",
        order: "desc",
      },
    },
  },
  appearance: {
    editor: {
      wrapping: true,
    },
  },
  i18n: {
    language: navigator.language,
  },
};

// Convert to the local canonical v1 type used by the loader
const CANONICAL_DEFAULTS: Options = {
  version: 1,
  general: {
    visited: false,
    editor: {
      toolbarItems: v1Defaults.general.editor.toolbarItems.map((i: ToolbarItem) => ({
        id: i.id,
        enabled: i.enabled ?? true,
        order: i.order ?? 0,
      })),
    },
    library: {
      sort: {
        by: v1Defaults.general.library.sort.by,
        order: v1Defaults.general.library.sort.order,
      },
    },
  },
  appearance: {
    editor: {
      wrapping: v1Defaults.appearance.editor.wrapping,
    },
  },
  i18n: {
    language: v1Defaults.i18n.language,
  },
};

// Reactive settings state using Svelte 5 runes
const storage = new LocalStorageStorage(STORAGE_KEY);
const initialRaw = browser ? storage.read() : null;
const initialSettings = loadSettings(initialRaw, CANONICAL_DEFAULTS);

// Shared reactive state (runes) adhering to v1 schema
const _settings = $state<Options>(structuredClone(initialSettings));

// Auto-persist changes with debouncing (browser only)
let _persistTimer: number | undefined;

function persist() {
  if (!browser) return;
  try {
    const payload = JSON.stringify(settings);
    storage.write(payload);
  } catch {
    // Fail gracefully if serialization or storage fails
  }
}

function schedulePersist() {
  if (!browser) return;
  if (_persistTimer) {
    clearTimeout(_persistTimer);
  }
  // Small debounce to batch rapid changes
  _persistTimer = setTimeout(persist, 200) as unknown as number;
}

// Track changes to settings via a rune effect
function makePersistingProxy<T extends object>(target: T): T {
  const wrap = (obj: any): any => {
    if (obj === null || typeof obj !== "object") return obj;

    return new Proxy(obj, {
      get(o, prop, receiver) {
        const value = Reflect.get(o, prop, receiver);
        // Wrap nested objects/arrays so deep mutations also persist
        if (value && typeof value === "object") {
          return wrap(value);
        }
        return value;
      },
      set(o, prop, value, receiver) {
        const result = Reflect.set(o, prop, value, receiver);
        // Schedule persist on any mutation
        schedulePersist();
        return result;
      },
      deleteProperty(o, prop) {
        const result = Reflect.deleteProperty(o, prop);
        schedulePersist();
        return result;
      },
    });
  };

  return wrap(target);
}

// Wrap the settings state in a persisting proxy so any mutation triggers persistence
// Note: keep the original $state to preserve Svelte reactivity; proxy forwards reads/writes.
export const settings = makePersistingProxy(_settings);

// ---------------------------------------------------------------------------
// Public API (compatible surface)
// ---------------------------------------------------------------------------

export function getFirstVisit() {
  return settings.general.visited;
}

export function setFirstVisit(value: boolean) {
  settings.general.visited = Boolean(value);
}

export function getLineWrappingEnabled() {
  return settings.appearance.editor.wrapping;
}

export function setLineWrappingEnabled(value: boolean) {
  settings.appearance.editor.wrapping = Boolean(value);
}

/**
 * Return all toolbar items
 */
export function getToolbarItems() {
  // Cast to the app's public ToolbarItem type
  return settings.general.editor.toolbarItems as unknown as ToolbarItem[];
}

/**
 * Returns the enabled toolbar items
 */
export function getEnabledToolbarItems(): ToolbarItem[] {
  const items = settings.general.editor.toolbarItems.slice();
  return items
    .filter((item: ToolbarItem) => item.enabled)
    .sort((a: ToolbarItem, b: ToolbarItem) => (a.order ?? 0) - (b.order ?? 0)) as unknown as ToolbarItem[];
}

/**
 * Toggle the visibility of a toolbar item.
 */
export function toggleToolbarItem(itemId: string, enabled: boolean) {
  const item = settings.general.editor.toolbarItems.find((i) => i.id === itemId);
  if (item) {
    item.enabled = Boolean(enabled);
  }
}

/**
 * Update specific toolbar item order using its ID and the order as parameters.
 */
export function updateToolbarItemOrder(itemId: string, order: number) {
  const item = settings.general.editor.toolbarItems.find((i) => i.id === itemId);
  if (item) {
    item.order = Number.isFinite(order) ? order : item.order;
  }
}

/**
 * Reset toolbar items to default settings.
 * This merges defaults with current to avoid losing unknown user items.
 */
export function resetToolbarItems() {
  const merged = mergeToolbarItems(
    CANONICAL_DEFAULTS.general.editor.toolbarItems,
    settings.general.editor.toolbarItems
  );
  settings.general.editor.toolbarItems = merged;
}

/**
 * Get the current language setting.
 */
export function getLanguage(): string {
  return settings.i18n.language;
}

/**
 * Set the current language setting.
 */
export function setLanguage(language: string) {
  settings.i18n.language = language;
}
