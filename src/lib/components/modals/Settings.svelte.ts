import { browser } from "$app/environment";
import type { ToolbarItem } from "$lib/types";
import type { Options } from "$lib/types/settings";

const STORAGE_KEY = "penflow.settings";

const defaults: Options = {
  version: 1,
  general: {
    visited: "false",
    editor: {
      toolbarItems: [
        { id: "bold", title: "Bold", enabled: true, order: 1 },
        { id: "italic", title: "Italic", enabled: true, order: 2 },
        { id: "heading", title: "Heading", enabled: true, order: 3 },
        { id: "orderedList", title: "Ordered List", enabled: true, order: 4 },
        { id: "list", title: "List", enabled: true, order: 5 },
        { id: "checklist", title: "Checklist", enabled: true, order: 6 },
        { id: "link", title: "Link", enabled: true, order: 7 },
        { id: "quote", title: "Quote", enabled: true, order: 8 },
        { id: "table", title: "Table", enabled: true, order: 9 },
        { id: "image", title: "Image", enabled: true, order: 10 },
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
};

// Helper function to merge toolbar items while preserving user preferences
function mergeToolbarItems(defaultItems: ToolbarItem[], userItems: ToolbarItem[]): ToolbarItem[] {
  const userItemsMap = new Map(userItems.map((item) => [item.id, item]));
  const defaultItemsMap = new Map(defaultItems.map((item) => [item.id, item]));

  const result = userItems.map((userItem) => {
    const defaultItem = defaultItemsMap.get(userItem.id);
    return defaultItem ? { ...defaultItem, ...userItem } : userItem;
  });

  defaultItems.forEach((defaultItem) => {
    if (!userItemsMap.has(defaultItem.id)) {
      result.push(defaultItem);
    }
  });

  return result;
}

// Reactive shared state for the whole app
export const settings = $state<Options>(structuredClone(defaults));

// Load from localStorage on client only
if (browser) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<Options>;
      // shallow merge onto defaults to keep new keys sane
      Object.assign(settings, {
        ...defaults,
        ...parsed,
        general: {
          ...defaults.general,
          ...parsed.general,
          editor: {
            toolbarItems: mergeToolbarItems(
              defaults.general.editor.toolbarItems,
              parsed.general?.editor?.toolbarItems || []
            ),
          },
          library: {
            ...defaults.general.library,
            ...(parsed.general?.library || {}),
            sort: {
              ...defaults.general.library.sort,
              ...(parsed.general?.library?.sort || {}),
            },
          },
        },
        appearance: {
          ...defaults.appearance,
          ...parsed.appearance,
        },
      });
    } catch {
      // ignore bad JSON; keep defaults
    }
  }
}

// Optional helper updaters for ergonomics

export function getFirstVisit() {
  return settings.general.visited;
}
export function setFirstVisit(value: typeof settings.general.visited) {
  settings.general.visited = value;
}

export function getLineWrappingEnabled() {
  return settings.appearance.editor.wrapping;
}

export function setLineWrappingEnabled(value: typeof settings.appearance.editor.wrapping) {
  settings.appearance.editor.wrapping = value;
}

// Helper functions for toolbar management
export function getToolbarItems() {
  return settings.general.editor.toolbarItems;
}

export function getEnabledToolbarItems(): ToolbarItem[] {
  return settings.general.editor.toolbarItems
    .filter((item) => item.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function toggleToolbarItem(itemId: string, enabled: boolean) {
  const item = settings.general.editor.toolbarItems.find((item) => item.id === itemId);
  if (item) {
    item.enabled = enabled;
  }
}

export function updateToolbarItemOrder(itemId: string, order: number) {
  const item = settings.general.editor.toolbarItems.find((item) => item.id === itemId);
  if (item) {
    item.order = order;
  }
}

export function resetToolbarItems() {
  settings.general.editor.toolbarItems = defaults.general.editor.toolbarItems;
}
