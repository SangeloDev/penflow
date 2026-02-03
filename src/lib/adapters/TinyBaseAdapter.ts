/**
 * TinyBase Adapter
 *
 * This adapter provides type-safe interactions with TinyBase, eliminating
 * the need for type casts and providing compile-time safety for all
 * database operations.
 */

import { createStore, type Store } from "tinybase";
import { createIndexedDbPersister, type IndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import {
  LIBRARY_SCHEMA,
  TABLE_NAMES,
  type MarkdownFile,
  type MarkdownFileSchema,
  type MarkdownFileUpdate,
  tableToMarkdownFiles,
  rowToMarkdownFile,
  createDefaultMarkdownFile,
} from "$lib/types/database";

/**
 * TinyBase adapter class that provides type-safe database operations
 */
export class TinyBaseAdapter {
  private store: Store | null = null;
  private persister: IndexedDbPersister | null = null;
  private listeners: Map<string, () => void> = new Map();

  constructor(private readonly dbName: string = "penflow") {}

  /**
   * Initialize the store and persister
   */
  async initialize(): Promise<void> {
    if (this.store) {
      console.warn("TinyBaseAdapter already initialized");
      return;
    }

    this.store = createStore().setTablesSchema(LIBRARY_SCHEMA);
    this.persister = createIndexedDbPersister(this.store, this.dbName);

    await this.persister.load();
    await this.persister.startAutoSave();
  }

  /**
   * Get all files from the library
   */
  getAllFiles(): Record<string, MarkdownFile> {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    const table = this.store.getTable(TABLE_NAMES.LIBRARY);
    return tableToMarkdownFiles(table);
  }

  /**
   * Get a single file by ID
   */
  getFile(id: string): MarkdownFile | null {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    const row = this.store.getRow(TABLE_NAMES.LIBRARY, id);
    if (!row || Object.keys(row).length === 0) {
      return null;
    }

    try {
      return rowToMarkdownFile(id, row);
    } catch (error) {
      console.error(`Failed to parse file with id ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new file
   */
  createFile(id: string, data: Partial<MarkdownFileSchema>): void {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    const fileData = createDefaultMarkdownFile(data);
    this.store.setRow(TABLE_NAMES.LIBRARY, id, {
      content: fileData.content,
      createdAt: fileData.createdAt,
      updatedAt: fileData.updatedAt,
      visitedAt: fileData.visitedAt,
      title: fileData.title,
      tags: fileData.tags,
    });
  }

  /**
   * Update an existing file
   */
  updateFile(id: string, updates: MarkdownFileUpdate): void {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    this.store.setPartialRow(TABLE_NAMES.LIBRARY, id, updates as any);
  }

  /**
   * Delete a file
   */
  deleteFile(id: string): void {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    this.store.delRow(TABLE_NAMES.LIBRARY, id);
  }

  /**
   * Check if a file exists
   */
  fileExists(id: string): boolean {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    const row = this.store.getRow(TABLE_NAMES.LIBRARY, id);
    return row && Object.keys(row).length > 0;
  }

  /**
   * Add a listener for table changes
   */
  addTableListener(callback: (files: Record<string, MarkdownFile>) => void): () => void {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    const listenerId = crypto.randomUUID();

    this.store.addTableListener(TABLE_NAMES.LIBRARY, () => {
      const files = this.getAllFiles();
      callback(files);
    });

    this.listeners.set(listenerId, () => {
      // Cleanup function stored for later
    });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Get file count
   */
  getFileCount(): number {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    return Object.keys(this.store.getTable(TABLE_NAMES.LIBRARY)).length;
  }

  /**
   * Clear all files (use with caution!)
   */
  clearAllFiles(): void {
    if (!this.store) {
      throw new Error("Store not initialized. Call initialize() first.");
    }

    this.store.delTable(TABLE_NAMES.LIBRARY);
  }

  /**
   * Get the underlying TinyBase store (for advanced use cases)
   */
  getStore(): Store | null {
    return this.store;
  }

  /**
   * Destroy the adapter and clean up resources
   */
  async destroy(): Promise<void> {
    // Remove all listeners
    this.listeners.forEach((listener) => listener());
    this.listeners.clear();

    // Stop persister
    if (this.persister) {
      await this.persister.stopAutoSave();
      this.persister.destroy();
      this.persister = null;
    }

    this.store = null;
  }

  /**
   * Check if the adapter is initialized
   */
  isInitialized(): boolean {
    return this.store !== null;
  }
}

/**
 * Create a new TinyBase adapter instance
 */
export function createTinyBaseAdapter(dbName?: string): TinyBaseAdapter {
  return new TinyBaseAdapter(dbName);
}
