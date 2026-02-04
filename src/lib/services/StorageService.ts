/**
 * Storage Service
 *
 * Provides a clean abstraction over TinyBase operations.
 * This service separates business logic from the underlying storage implementation,
 * making it easier to test and potentially swap storage backends in the future.
 */

import type { TinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
import type { MarkdownFile, MarkdownFileSchema } from "$lib/types/database";

/**
 * Storage service interface for database operations
 */
export interface IStorageService {
  initialize(adapter: TinyBaseAdapter): Promise<void>;
  getAllFiles(): Record<string, MarkdownFile>;
  getFile(id: string): MarkdownFile | null;
  createFile(id: string, data: Partial<MarkdownFileSchema>): void;
  updateFile(id: string, updates: Partial<MarkdownFileSchema>): void;
  deleteFile(id: string): void;
  fileExists(id: string): boolean;
  getFileCount(): number;
  clearAllFiles(): void;
  addChangeListener(callback: (files: Record<string, MarkdownFile>) => void): () => void;
}

/**
 * Storage service implementation using TinyBase
 */
export class StorageService implements IStorageService {
  private adapter: TinyBaseAdapter | null = null;

  /**
   * Initialize the storage service with a TinyBase adapter
   */
  async initialize(adapter: TinyBaseAdapter): Promise<void> {
    if (this.adapter) {
      throw new Error("StorageService already initialized");
    }

    this.adapter = adapter;

    if (!adapter.isInitialized()) {
      await adapter.initialize();
    }
  }

  /**
   * Ensure the adapter is initialized
   */
  private ensureInitialized(): TinyBaseAdapter {
    if (!this.adapter) {
      throw new Error("StorageService not initialized. Call initialize() first.");
    }
    return this.adapter;
  }

  /**
   * Get all files from storage
   */
  getAllFiles(): Record<string, MarkdownFile> {
    const adapter = this.ensureInitialized();
    return adapter.getAllFiles();
  }

  /**
   * Get a single file by ID
   */
  getFile(id: string): MarkdownFile | null {
    const adapter = this.ensureInitialized();
    return adapter.getFile(id);
  }

  /**
   * Create a new file
   */
  createFile(id: string, data: Partial<MarkdownFileSchema>): void {
    const adapter = this.ensureInitialized();
    adapter.createFile(id, data);
  }

  /**
   * Update an existing file
   */
  updateFile(id: string, updates: Partial<MarkdownFileSchema>): void {
    const adapter = this.ensureInitialized();
    adapter.updateFile(id, updates);
  }

  /**
   * Delete a file
   */
  deleteFile(id: string): void {
    const adapter = this.ensureInitialized();
    adapter.deleteFile(id);
  }

  /**
   * Check if a file exists
   */
  fileExists(id: string): boolean {
    const adapter = this.ensureInitialized();
    return adapter.fileExists(id);
  }

  /**
   * Get the total number of files
   */
  getFileCount(): number {
    const adapter = this.ensureInitialized();
    return adapter.getFileCount();
  }

  /**
   * Clear all files from storage
   */
  clearAllFiles(): void {
    const adapter = this.ensureInitialized();
    adapter.clearAllFiles();
  }

  /**
   * Add a listener for file changes
   */
  addChangeListener(callback: (files: Record<string, MarkdownFile>) => void): () => void {
    const adapter = this.ensureInitialized();
    return adapter.addTableListener(callback);
  }

  /**
   * Get the underlying adapter (for advanced use cases)
   */
  getAdapter(): TinyBaseAdapter | null {
    return this.adapter;
  }

  /**
   * Destroy the storage service and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.adapter) {
      await this.adapter.destroy();
      this.adapter = null;
    }
  }
}

/**
 * Create a new storage service instance
 */
export function createStorageService(): StorageService {
  return new StorageService();
}
