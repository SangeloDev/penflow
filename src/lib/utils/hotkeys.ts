import { historyKeymap, indentWithTab } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { closeBracketsKeymap } from "@codemirror/autocomplete";
import * as f from "$lib/utils/formattingActions";
import { toggleHeadingCycle } from "$lib/utils/formatting.js";
import { EditorView, keymap, type KeyBinding } from "@codemirror/view";
import { type EditorMode } from "$lib/components/Editor.svelte.ts";
import type { Hotkey } from "$lib/types";
import * as prettier from "prettier";
import markdown from "prettier/plugins/markdown";

/**
 * Formats the editor content using Prettier.
 * @param view The EditorView instance.
 */
async function formatDocument(view: EditorView) {
  const content = view.state.doc.toString();
  const formattedContent = await prettier.format(content, {
    parser: "markdown",
    plugins: [markdown],
  });
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: formattedContent },
  });
}

/**
 * Creates a reusable keydown event handler for hotkeys.
 * This function is not exported and serves as a helper.
 * @param params - An object mapping a hotkey combination to a callback function.
 * @returns A keydown event handler function.
 */
function createHotkeyHandler(params: { [key: string]: (e: KeyboardEvent) => void }) {
  // Check for macOS once.
  const isMac = navigator.platform.toUpperCase().includes("MAC");

  return function handler(e: KeyboardEvent) {
    const keys = [];

    // Normalize Ctrl/Meta key based on OS
    if (isMac ? e.metaKey : e.ctrlKey) keys.push("ctrl");
    if (e.altKey) keys.push("alt");
    if (e.shiftKey) keys.push("shift");

    // Use `e.code` to get the physical key, ignoring layout and special characters.
    // This is the key fix for the Alt key on macOS.
    let code = e.code.toLowerCase();

    // Normalize the code for consistency (e.g., "KeyA" -> "a", "Digit1" -> "1")
    if (code.startsWith("key")) {
      code = code.substring(3);
    } else if (code.startsWith("digit")) {
      code = code.substring(5);
    }

    keys.push(code);

    const combo = keys.join("+");

    if (params[combo]) {
      // Prevent default browser actions for the hotkey (e.g., Ctrl+S saving the page)
      e.preventDefault();
      params[combo](e);
    }
  };
}

/**
 * Attaches a hotkey listener to a specific DOM node.
 * Useful for Svelte actions or component-specific shortcuts.
 */
export function hotkey(node: HTMLElement, params: { [key: string]: (e: KeyboardEvent) => void }) {
  const handler = createHotkeyHandler(params);

  node.addEventListener("keydown", handler);

  return {
    destroy() {
      node.removeEventListener("keydown", handler);
    },
    // Allows updating the params dynamically if you're using this in a framework like Svelte
    update(newParams: { [key: string]: (e: KeyboardEvent) => void }) {
      params = newParams;
    },
  };
}

/**
 * Attaches a global hotkey listener to the window.
 */
export function globalHotkey(params: { [key: string]: (e: KeyboardEvent) => void }) {
  const handler = createHotkeyHandler(params);

  window.addEventListener("keydown", handler);

  return {
    destroy() {
      window.removeEventListener("keydown", handler);
    },
  };
}

// export const globalEditorHotkeys = {
//   "ctrl+e": () => cycleModeForward(),
//   "ctrl+shift+e": () => cycleModeBackward(),
//   "ctrl+s": () => saveFile(),
//   "ctrl+o": () => openFile(),
//   "ctrl+shift+o": () => newFile(),
//   "ctrl+alt+/": () => (shortcutModalVisible = true),
// };

// Define a type for the context for better type safety
export type HotkeyContext = {
  setSettingsModalVisibility: (arg0: boolean) => void;
  setShortcutModalVisibility: (arg0: boolean) => void;
  getMode: () => EditorMode | undefined;
  cycleEditMode: (mode: EditorMode | undefined, reverse?: boolean) => void;
  saveFile: () => void;
  exportFile: (content: string, filename?: string) => void;
  openFile: (view: EditorView | undefined) => void;
  newFile: (view: EditorView | undefined | undefined, onNewFile: any, isDirty: boolean) => void;
  content: string;
  activeFilename?: string;
  view?: EditorView;
  getDirtyness: () => boolean;
  onNewFile: any;
};

export const createGlobalHotkeys = (context: HotkeyContext | undefined): Hotkey[] => [
  {
    id: 0,
    desc: "Settings",
    shortcut: "Ctrl+Comma",
    action: () => context?.setSettingsModalVisibility(true),
  },
  {
    id: 1,
    desc: "Help",
    shortcut: "Ctrl+Alt+Slash",
    action: () => context?.setShortcutModalVisibility(true),
  },
  {
    id: 2,
    desc: "Cycle Editing Mode",
    shortcut: "Ctrl+E",
    action: () => context?.cycleEditMode(context?.getMode()),
  },
  {
    id: 3,
    desc: null,
    hidden: true,
    shortcut: "Ctrl+Shift+E",
    action: () => context?.cycleEditMode(context?.getMode(), false),
  },
  {
    id: 4,
    desc: "Save File",
    shortcut: "Ctrl+S",
    action: () => context?.saveFile(),
  },
  {
    id: 5,
    desc: "Export File",
    shortcut: "Ctrl+Shift+S",
    action: () => context?.exportFile(context?.content, context?.activeFilename),
  },
  {
    id: 6,
    desc: "Open File",
    shortcut: "Ctrl+O",
    action: () => context?.openFile(context?.view),
  },
  {
    id: 7,
    desc: "New File",
    shortcut: "Ctrl+Shift+O",
    action: () => context?.newFile(context?.view, context?.onNewFile, context?.getDirtyness()),
  },
];

/**
 * Constructed hotkeys from globalHotkeys variable.
 * @param hotkeys
 * @returns
 */
export const constructedGlobalHotkeys = (hotkeys: Hotkey[]) => {
  return hotkeys.reduce((accumulator: { [key: string]: (arg0: any) => void }, hotkey) => {
    const { shortcut, action } = hotkey;

    // If a hotkey entry is missing a shortcut, skip it instead of crashing.
    if (!shortcut) {
      return accumulator;
    }

    // Add the key-value pair to our object.
    // We use .toLowerCase() to ensure consistency (e.g., "Ctrl+S" becomes "ctrl+s").
    accumulator[shortcut.toLowerCase()] = action;

    // Return the accumulator for the next iteration.
    return accumulator;
  }, {}); // The `{}` is the initial value – we start with an empty object.
};

export const editorHotkeys: Hotkey[] = [
  {
    id: 0,
    desc: "Bold",
    shortcut: "Ctrl+B",
    key: "Mod-b",
    action: (view: EditorView) => {
      f.toggleBold(view);
      return true;
    },
  },
  {
    id: 1,
    desc: "Italic",
    shortcut: "Ctrl+I",
    key: "Mod-i",
    action: (view: EditorView) => {
      f.toggleItalic(view);
      return true;
    },
  },
  {
    id: 2,
    desc: "Cycle Headings",
    shortcut: "Ctrl+Shift+H",
    key: "Mod-Shift-h",
    action: (view: EditorView) => {
      toggleHeadingCycle(view);
      return true;
    },
  },
  {
    id: 3,
    desc: "Headings",
    shortcut: "Ctrl+Alt+1 -> 6",
    key: "Mod-Alt-1",
    action: (view: EditorView) => {
      f.toggleHeading(1, view);
      return true;
    },
  },
  {
    id: 4,
    desc: null,
    key: "Mod-Alt-2",
    action: (view: EditorView) => {
      f.toggleHeading(2, view);
      return true;
    },
    hidden: true,
  },
  {
    id: 5,
    desc: null,
    key: "Mod-Alt-3",
    action: (view: EditorView) => {
      f.toggleHeading(3, view);
      return true;
    },
    hidden: true,
  },
  {
    id: 6,
    desc: null,
    key: "Mod-Alt-4",
    action: (view: EditorView) => {
      f.toggleHeading(4, view);
      return true;
    },
    hidden: true,
  },
  {
    id: 7,
    desc: null,
    key: "Mod-Alt-5",
    action: (view: EditorView) => {
      f.toggleHeading(5, view);
      return true;
    },
    hidden: true,
  },
  {
    id: 8,
    desc: null,
    key: "Mod-Alt-6",
    action: (view: EditorView) => {
      f.toggleHeading(6, view);
      return true;
    },
    hidden: true,
  },
  {
    id: 9,
    desc: "Blockquote",
    shortcut: "Ctrl+Shift+B",
    key: "Mod-Shift-b",
    action: (view: EditorView) => {
      f.toggleQuote(view);
      return true;
    },
  },
  {
    id: 10,
    desc: "Code Block",
    shortcut: "Ctrl+Shift+C",
    key: "Mod-Shift-c",
    action: (view: EditorView) => {
      f.toggleCodeBlock(view);
      return true;
    },
  },
  {
    id: 11,
    desc: "Inline Code",
    shortcut: "Ctrl+Alt+C",
    key: "Mod-Alt-c",
    action: (view: EditorView) => {
      f.toggleInlineCode(view);
      return true;
    },
  },
  {
    id: 12,
    desc: "Bulleted List",
    shortcut: "Ctrl+L",
    key: "Mod-l",
    action: (view: EditorView) => {
      f.toggleList(view);
      return true;
    },
  },
  {
    id: 13,
    desc: "Numbered List",
    shortcut: "Ctrl+Shift+L",
    key: "Mod-Shift-l",
    action: (view: EditorView) => {
      f.toggleOrderedList(view);
      return true;
    },
  },
  {
    id: 14,
    desc: "Insert Link",
    shortcut: "Ctrl+K",
    key: "Mod-k",
    action: (view: EditorView) => {
      f.wrapLink(view);
      return true;
    },
  },
  {
    id: 15,
    desc: "Insert Image",
    shortcut: "Ctrl+Shift+K",
    key: "Mod-Shift-k",
    action: (view: EditorView) => {
      f.wrapImage(view);
      return true;
    },
  },
  {
    id: 16,
    desc: "Insert Table",
    shortcut: "Ctrl+Shift+T",
    key: "Mod-Shift-t",
    action: (view: EditorView) => {
      f.insertTable(view);
      return true;
    },
  },
  {
    id: 17,
    desc: "Format Document",
    shortcut: "Ctrl+Shift+I",
    key: "Mod-Shift-i",
    action: (view: EditorView) => {
      formatDocument(view);
      return true;
    },
  },
];

const constructedEditorHotkeys = editorHotkeys.map(
  (hotkey) =>
    ({
      key: hotkey.key,
      run: hotkey.action,
    }) as KeyBinding
);

export const editorKeymap = keymap.of([
  ...closeBracketsKeymap,
  ...searchKeymap,
  ...historyKeymap,
  indentWithTab,
  ...constructedEditorHotkeys,
]);
