/**
 * Settings Context
 *
 * Provides settings state management through Svelte's context API.
 * Manages application settings and preferences.
 */

import { getContext, setContext } from "svelte";
import { ContextNotFoundError } from "$lib/errors";
import {
  settings,
  getFirstVisit,
  setFirstVisit,
  getLineWrappingEnabled,
  setLineWrappingEnabled,
  getToolbarItems,
  getEnabledToolbarItems,
  toggleToolbarItem,
  updateToolbarItemOrder,
  resetToolbarItems,
  getLanguage,
  setLanguage,
  getDeveloperMode,
  setDeveloperMode,
} from "$lib/settings/index.svelte";
import type { ToolbarItem } from "$lib/types";
import type { Options } from "$lib/types/settings";

const SETTINGS_CONTEXT_KEY = Symbol("settings");

/**
 * Settings context state and operations
 */
export class SettingsContext {
  /**
   * Get the raw settings object (reactive)
   */
  getSettings(): Options {
    return settings;
  }

  /**
   * Get first visit status
   */
  getFirstVisit(): boolean {
    return getFirstVisit();
  }

  /**
   * Set first visit status
   */
  setFirstVisit(value: boolean): void {
    setFirstVisit(value);
  }

  /**
   * Get line wrapping enabled status
   */
  getLineWrappingEnabled(): boolean {
    return getLineWrappingEnabled();
  }

  /**
   * Set line wrapping enabled status
   */
  setLineWrappingEnabled(value: boolean): void {
    setLineWrappingEnabled(value);
  }

  /**
   * Get all toolbar items
   */
  getToolbarItems(): ToolbarItem[] {
    return getToolbarItems();
  }

  /**
   * Get enabled toolbar items
   */
  getEnabledToolbarItems(): ToolbarItem[] {
    return getEnabledToolbarItems();
  }

  /**
   * Toggle toolbar item visibility
   */
  toggleToolbarItem(itemId: string, enabled: boolean): void {
    toggleToolbarItem(itemId, enabled);
  }

  /**
   * Update toolbar item order
   */
  updateToolbarItemOrder(itemId: string, order: number): void {
    updateToolbarItemOrder(itemId, order);
  }

  /**
   * Reset toolbar items to defaults
   */
  resetToolbarItems(): void {
    resetToolbarItems();
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return getLanguage();
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    setLanguage(language);
  }

  /**
   * Get developer mode status
   */
  getDeveloperMode(): boolean {
    return getDeveloperMode();
  }

  /**
   * Set developer mode status
   */
  setDeveloperMode(value: boolean): void {
    setDeveloperMode(value);
  }

  /**
   * Get sort configuration
   */
  getSortConfig() {
    return settings.general.library.sort;
  }

  /**
   * Set sort configuration
   */
  setSortConfig(by: "createdAt" | "updatedAt" | "visitedAt" | "name", order: "asc" | "desc"): void {
    settings.general.library.sort.by = by;
    settings.general.library.sort.order = order;
  }
}

/**
 * Set the settings context
 */
export function setSettingsContext(): SettingsContext {
  const context = new SettingsContext();
  setContext(SETTINGS_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the settings context
 */
export function getSettingsContext(): SettingsContext {
  const context = getContext<SettingsContext>(SETTINGS_CONTEXT_KEY);
  if (!context) {
    throw new ContextNotFoundError("SettingsContext");
  }
  return context;
}
