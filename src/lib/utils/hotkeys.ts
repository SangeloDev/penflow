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
