import { defaultKeymap, historyKeymap, indentWithTab, selectParentSyntax } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { closeBracketsKeymap } from "@codemirror/autocomplete";
import * as f from "$lib/utils/formattingActions";
import { toggleHeadingCycle } from "$lib/utils/formatting.js";
import { keymap } from "@codemirror/view";

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

export const globalHotkeys = [
  {
    id: 0,
    desc: "Settings",
    shortcut: "Ctrl+,",
    action: console.log("hello world") /*() => cycleEditMode(mode, false)*/,
  },
  {
    id: 2,
    desc: "Help",
    shortcut: "Ctrl+Alt+/",
    action: console.log("hello world") /*() => cycleEditMode(mode, false)*/,
  },
];

// export const globalEditorHotkeys = {
//   "ctrl+e": () => cycleModeForward(),
//   "ctrl+shift+e": () => cycleModeBackward(),
//   "ctrl+s": () => saveFile(),
//   "ctrl+o": () => openFile(),
//   "ctrl+shift+o": () => newFile(),
//   "ctrl+alt+/": () => (shortcutModalVisible = true),
// };
// "ctrl+shift+f": () => toggleFullscreen(),

export const editorKeymap = keymap.of([
  ...closeBracketsKeymap,
  ...searchKeymap,
  ...historyKeymap,
  indentWithTab,
  {
    key: "Mod-b",
    run: (view) => {
      f.toggleBold(view);
      return true;
    },
  },
  {
    key: "Mod-i",
    run: (view) => {
      f.toggleItalic(view);
      return true;
    },
  },
  {
    key: "Mod-Shift-h",
    run: (view) => {
      toggleHeadingCycle(view);
      return true;
    },
  },
  {
    key: "Mod-Alt-1",
    run: (view) => {
      f.toggleHeading(1, view);
      return true;
    },
  },
  {
    key: "Mod-Alt-2",
    run: (view) => {
      f.toggleHeading(2, view);
      return true;
    },
  },
  {
    key: "Mod-Alt-3",
    run: (view) => {
      f.toggleHeading(3, view);
      return true;
    },
  },
  {
    key: "Mod-Alt-4",
    run: (view) => {
      f.toggleHeading(4, view);
      return true;
    },
  },
  {
    key: "Mod-Alt-5",
    run: (view) => {
      f.toggleHeading(5, view);
      return true;
    },
  },
  {
    key: "Mod-Alt-6",
    run: (view) => {
      f.toggleHeading(6, view);
      return true;
    },
  },
  {
    key: "Mod-Shift-b",
    run: (view) => {
      f.toggleQuote(view);
      return true;
    },
  },
  {
    key: "Mod-Shift-c",
    run: (view) => {
      f.toggleCodeBlock(view);
      return true;
    },
  },
  {
    key: "Mod-Alt-c",
    run: (view) => {
      f.toggleInlineCode(view);
      return true;
    },
  },
  {
    key: "Mod-l",
    run: (view) => {
      f.toggleList(view);
      return true;
    },
  },
  {
    key: "Mod-Shift-l",
    run: (view) => {
      f.toggleOrderedList(view);
      return true;
    },
  },
  {
    key: "Mod-k",
    run: (view) => {
      f.wrapLink(view);
      return true;
    },
  },
  {
    key: "Mod-Shift-k",
    run: (view) => {
      f.wrapImage(view);
      return true;
    },
  },
  {
    key: "Mod-Shift-t",
    run: (view) => {
      f.insertTable(view);
      return true;
    },
  },
]);
