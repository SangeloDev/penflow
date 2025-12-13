/**
 * Add localStorage-backed SettingsStorage abstraction
 *
 * This module provides a simple storage interface and a localStorage-based implementation.
 * It is environment-aware: on the server it becomes a no-op.
 */

import { browser } from "$app/environment";

const STORAGE_KEY = "penflow.settings";

export interface SettingsStorage {
  /**
   * Read the raw settings JSON string from storage.
   * Returns null if nothing is stored or when running on the server.
   */
  read(): string | null;

  /**
   * Write the raw settings JSON string to storage.
   * No-ops when running on the server.
   */
  write(value: string): void;

  /**
   * Remove the stored settings.
   * No-ops when running on the server.
   */
  remove(): void;
}

/**
 * LocalStorage-based implementation of SettingsStorage.
 * Safely handles non-browser environments by acting as a no-op.
 */
export class LocalStorageStorage implements SettingsStorage {
  private key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  read(): string | null {
    if (!browser) return null;
    try {
      return window.localStorage.getItem(this.key);
    } catch {
      // localStorage may be unavailable (privacy mode or disabled), fail gracefully
      return null;
    }
  }

  write(value: string): void {
    if (!browser) return;
    try {
      window.localStorage.setItem(this.key, value);
    } catch {
      // localStorage may be unavailable or full; fail gracefully
    }
  }

  remove(): void {
    if (!browser) return;
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      // localStorage may be unavailable; fail gracefully
    }
  }
}

/**
 * Export the default storage key to keep it consistent across the app.
 */
export { STORAGE_KEY };
