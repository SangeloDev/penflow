/**
 * usePersistence Composable
 *
 * Provides database persistence operations as a composable.
 * Manages TinyBase adapter initialization and database operations.
 */

import { TinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
import type { MarkdownFile } from "$lib/types/database";

/**
 * Persistence composable for managing database operations
 */
export function usePersistence() {
  let adapter: TinyBaseAdapter | null = null;
  let isInitialized = $state(false);
  let isLoading = $state(false);

  /**
   * Initialize the persistence layer with a database adapter
   */
  async function initialize(dbName = "penflow"): Promise<TinyBaseAdapter> {
    if (adapter && isInitialized) {
      console.warn("Persistence already initialized");
      return adapter;
    }

    isLoading = true;

    try {
      adapter = new TinyBaseAdapter(dbName);
      await adapter.initialize();
      isInitialized = true;
      return adapter;
    } catch (error) {
      console.error("Failed to initialize persistence:", error);
      throw error;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Get the current adapter instance
   */
  function getAdapter(): TinyBaseAdapter | null {
    return adapter;
  }

  /**
   * Check if persistence is initialized
   */
  function getIsInitialized(): boolean {
    return isInitialized;
  }

  /**
   * Check if persistence is currently loading
   */
  function getIsLoading(): boolean {
    return isLoading;
  }

  /**
   * Save a file to the database
   */
  async function saveFile(
    id: string,
    content: string,
    title?: string,
    tags?: string
  ): Promise<void> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    const now = Date.now();

    if (adapter.fileExists(id)) {
      // Update existing file
      adapter.updateFile(id, {
        content,
        title: title || "",
        tags: tags || "",
        updatedAt: now,
      });
    } else {
      // Create new file
      adapter.createFile(id, {
        content,
        title: title || "",
        tags: tags || "",
        createdAt: now,
        updatedAt: now,
        visitedAt: now,
      });
    }
  }

  /**
   * Load a file from the database
   */
  async function loadFile(id: string): Promise<MarkdownFile | null> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    return adapter.getFile(id);
  }

  /**
   * Delete a file from the database
   */
  async function deleteFile(id: string): Promise<void> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    adapter.deleteFile(id);
  }

  /**
   * Load all files from the database
   */
  async function loadAllFiles(): Promise<Record<string, MarkdownFile>> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    return adapter.getAllFiles();
  }

  /**
   * Check if a file exists in the database
   */
  async function fileExists(id: string): Promise<boolean> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    return adapter.fileExists(id);
  }

  /**
   * Get the total number of files in the database
   */
  async function getFileCount(): Promise<number> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    return adapter.getFileCount();
  }

  /**
   * Clear all files from the database (with confirmation)
   */
  async function clearAllFiles(): Promise<void> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    if (confirm("Are you sure you want to delete all files? This cannot be undone.")) {
      adapter.clearAllFiles();
    }
  }

  /**
   * Export the entire database as JSON
   */
  async function exportDatabase(): Promise<string> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    const files = adapter.getAllFiles();
    return JSON.stringify(files, null, 2);
  }

  /**
   * Import files from JSON data
   */
  async function importDatabase(jsonData: string): Promise<void> {
    if (!adapter) {
      throw new Error("Persistence not initialized");
    }

    try {
      const files = JSON.parse(jsonData) as Record<string, MarkdownFile>;

      // Validate and import each file
      for (const [id, file] of Object.entries(files)) {
        if (file && typeof file === "object") {
          adapter.createFile(id, {
            content: file.content || "",
            title: file.title || "",
            tags: file.tags || "",
            createdAt: file.createdAt || Date.now(),
            updatedAt: file.updatedAt || Date.now(),
            visitedAt: file.visitedAt || Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to import database:", error);
      throw new Error("Invalid database format");
    }
  }

  /**
   * Destroy the persistence layer and clean up resources
   */
  async function destroy(): Promise<void> {
    if (adapter) {
      await adapter.destroy();
      adapter = null;
      isInitialized = false;
    }
  }

  return {
    // Initialization
    initialize,
    destroy,

    // State
    getAdapter,
    getIsInitialized,
    getIsLoading,

    // File operations
    saveFile,
    loadFile,
    deleteFile,
    loadAllFiles,
    fileExists,
    getFileCount,

    // Bulk operations
    clearAllFiles,
    exportDatabase,
    importDatabase,

    // Reactive state access
    get initialized() {
      return isInitialized;
    },
    get loading() {
      return isLoading;
    },
  };
}
