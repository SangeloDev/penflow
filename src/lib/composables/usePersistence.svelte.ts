/**
 * usePersistence Composable
 *
 * Simplified composable that provides direct access to persistence functionality.
 * This is a thin wrapper that adds convenience methods but primarily exposes
 * the TinyBaseAdapter directly for maximum flexibility.
 */

import { TinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
import { NotInitializedError, DatabaseError } from "$lib/errors";

/**
 * Persistence composable - manages database operations with TinyBase
 *
 * @example
 * ```typescript
 * const persistence = usePersistence();
 *
 * // Initialize
 * const adapter = await persistence.initialize("penflow");
 *
 * // Use adapter directly for full control
 * adapter.createFile(id, data);
 * const file = adapter.getFile(id);
 *
 * // Or use convenience methods
 * await persistence.saveFile(id, content, title, tags);
 * ```
 */
export function usePersistence() {
  let adapter: TinyBaseAdapter | null = $state(null);
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
      throw new DatabaseError("initialization", error as Error);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Get the adapter instance (throws if not initialized)
   */
  function getAdapter(): TinyBaseAdapter {
    if (!adapter) {
      throw new NotInitializedError("Persistence");
    }
    return adapter;
  }

  /**
   * Save or update a file in the database (convenience method)
   */
  async function saveFile(id: string, content: string, title?: string, tags?: string): Promise<void> {
    const db = getAdapter();
    const now = Date.now();

    try {
      if (db.fileExists(id)) {
        db.updateFile(id, {
          content,
          title: title || "",
          tags: tags || "",
          updatedAt: now,
        });
      } else {
        db.createFile(id, {
          content,
          title: title || "",
          tags: tags || "",
          createdAt: now,
          updatedAt: now,
          visitedAt: now,
        });
      }
    } catch (error) {
      throw new DatabaseError("save file", error as Error);
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
    // Core methods
    initialize,
    destroy,

    // Adapter access
    get adapter() {
      return adapter;
    },
    getAdapter,

    // State
    get initialized() {
      return isInitialized;
    },
    get loading() {
      return isLoading;
    },

    // Convenience methods
    saveFile,
  };
}
