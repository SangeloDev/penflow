/**
 * Hotkey Context
 *
 * Provides hotkey management through Svelte's context API.
 * This replaces the global hotkey store with a proper context-based approach.
 */

import { getContext, setContext } from 'svelte';
import type { EditorView } from '@codemirror/view';
import type { EditorMode } from './EditorContext.svelte';

const HOTKEY_CONTEXT_KEY = Symbol('hotkey');

/**
 * Hotkey handler function type
 */
export type HotkeyHandler = (e: KeyboardEvent) => void;

/**
 * Hotkey configuration
 */
export interface HotkeyConfig {
  [key: string]: HotkeyHandler;
}

/**
 * Hotkey context operations
 */
export interface HotkeyContextOperations {
  setSettingsModalVisibility: (visible: boolean) => void;
  setShortcutModalVisibility: (visible: boolean) => void;
  getMode: () => EditorMode;
  cycleEditMode: (forward?: boolean) => void;
  saveFile: () => void | Promise<void>;
  exportFile: () => void | Promise<void>;
  openFile: (view: EditorView | undefined) => void;
  newFile: (view: EditorView | undefined, onNewFile: () => void) => void;
  getContent: () => string;
  getActiveFilename: () => string | undefined;
  getDirtyness: () => boolean;
  view?: EditorView;
  onNewFile?: () => void;
}

/**
 * Hotkey context state and operations
 */
export class HotkeyContext {
  private operations = $state<HotkeyContextOperations | null>(null);
  private cleanup: (() => void) | null = null;

  /**
   * Set the operations that hotkeys will call
   */
  setOperations(operations: HotkeyContextOperations): void {
    this.operations = operations;
  }

  /**
   * Get the current operations
   */
  getOperations(): HotkeyContextOperations | null {
    return this.operations;
  }

  /**
   * Create a keydown event handler for hotkeys
   */
  private createHotkeyHandler(config: HotkeyConfig): (e: KeyboardEvent) => void {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

    return (e: KeyboardEvent) => {
      const keys: string[] = [];

      // Normalize Ctrl/Meta key based on OS
      if (isMac ? e.metaKey : e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');

      // Use e.code to get the physical key
      let code = e.code.toLowerCase();

      // Normalize the code for consistency
      if (code.startsWith('key')) {
        code = code.substring(3);
      } else if (code.startsWith('digit')) {
        code = code.substring(5);
      }

      keys.push(code);

      const combo = keys.join('+');

      if (config[combo]) {
        e.preventDefault();
        config[combo](e);
      }
    };
  }

  /**
   * Attach global hotkey listeners
   */
  attachGlobalHotkeys(config: HotkeyConfig): void {
    if (typeof window === 'undefined') return;

    // Clean up previous listeners if any
    this.detachGlobalHotkeys();

    const handler = this.createHotkeyHandler(config);
    window.addEventListener('keydown', handler);

    this.cleanup = () => {
      window.removeEventListener('keydown', handler);
    };
  }

  /**
   * Detach global hotkey listeners
   */
  detachGlobalHotkeys(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  /**
   * Create global hotkeys configuration based on operations
   */
  createGlobalHotkeysConfig(): HotkeyConfig {
    if (!this.operations) {
      return {};
    }

    const ops = this.operations;

    return {
      'ctrl+comma': () => ops.setSettingsModalVisibility(true),
      'ctrl+alt+slash': () => ops.setShortcutModalVisibility(true),
      'ctrl+e': () => ops.cycleEditMode(true),
      'ctrl+shift+e': () => ops.cycleEditMode(false),
      'ctrl+s': () => ops.saveFile(),
      'ctrl+shift+s': () => ops.exportFile(),
      'ctrl+o': () => ops.openFile(ops.view),
      'ctrl+shift+o': () => {
        if (ops.onNewFile) {
          ops.newFile(ops.view, ops.onNewFile);
        }
      },
    };
  }

  /**
   * Destroy the hotkey context and clean up
   */
  destroy(): void {
    this.detachGlobalHotkeys();
    this.operations = null;
  }
}

/**
 * Set the hotkey context
 */
export function setHotkeyContext(): HotkeyContext {
  const context = new HotkeyContext();
  setContext(HOTKEY_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the hotkey context
 */
export function getHotkeyContext(): HotkeyContext {
  const context = getContext<HotkeyContext>(HOTKEY_CONTEXT_KEY);
  if (!context) {
    throw new Error('HotkeyContext not found. Make sure to call setHotkeyContext() in a parent component.');
  }
  return context;
}
