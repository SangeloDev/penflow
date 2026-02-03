/**
 * Library Context
 *
 * Provides library state and operations through Svelte's context API.
 * Manages the collection of markdown files and their operations.
 */

import { getContext, setContext } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import type { TinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
import type { MarkdownFile } from "$lib/types/database";
import type { SortConfig } from "$lib/types/database";

const LIBRARY_CONTEXT_KEY = Symbol("library");

/**
 * Library context state and operations
 */
export class LibraryContext {
  files = $state<Record<string, MarkdownFile>>({});
  isLoading = $state<boolean>(true);
  sortConfig = $state<SortConfig>({ by: "visitedAt", order: "desc" });
  private adapter: TinyBaseAdapter | null = null;
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize the library with a TinyBase adapter
   */
  async initialize(adapter: TinyBaseAdapter): Promise<void> {
    if (this.adapter) {
      console.warn("LibraryContext already initialized");
      return;
    }

    this.adapter = adapter;
    this.isLoading = true;

    try {
      // Initialize the adapter if not already done
      if (!adapter.isInitialized()) {
        await adapter.initialize();
      }

      // Load initial files
      this.files = adapter.getAllFiles();

      // Subscribe to changes
      this.unsubscribe = adapter.addTableListener((files) => {
        this.files = files;
      });

      this.isLoading = false;
    } catch (error) {
      console.error("Failed to initialize library:", error);
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Get all files as an array
   */
  getFilesArray(): MarkdownFile[] {
    return Object.values(this.files);
  }

  /**
   * Get a single file by ID
   */
  getFile(id: string): MarkdownFile | null {
    if (!this.adapter) {
      console.warn("Library adapter not initialized");
      return null;
    }

    return this.adapter.getFile(id);
  }

  /**
   * Create a new file
   */
  createFile(id: string, content: string, title?: string, tags?: string): void {
    if (!this.adapter) {
      throw new Error("Library adapter not initialized");
    }

    const now = Date.now();
    this.adapter.createFile(id, {
      content,
      title: title || "",
      tags: tags || "",
      createdAt: now,
      updatedAt: now,
      visitedAt: now,
    });
  }

  /**
   * Update an existing file
   */
  updateFile(id: string, updates: Partial<MarkdownFile>): void {
    if (!this.adapter) {
      throw new Error("Library adapter not initialized");
    }

    // Remove id from updates if present (it shouldn't be updated)
    const { id: _, ...fileUpdates } = updates;

    this.adapter.updateFile(id, {
      ...fileUpdates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Delete a file
   */
  deleteFile(id: string): void {
    if (!this.adapter) {
      throw new Error("Library adapter not initialized");
    }

    this.adapter.deleteFile(id);
  }

  /**
   * Mark a file as visited
   */
  markFileVisited(id: string): void {
    if (!this.adapter) {
      throw new Error("Library adapter not initialized");
    }

    this.adapter.updateFile(id, {
      visitedAt: Date.now(),
    });
  }

  /**
   * Check if a file exists
   */
  fileExists(id: string): boolean {
    if (!this.adapter) {
      return false;
    }

    return this.adapter.fileExists(id);
  }

  /**
   * Get file count
   */
  getFileCount(): number {
    return Object.keys(this.files).length;
  }

  /**
   * Get sorted files based on current sort configuration
   */
  getSortedFiles(): MarkdownFile[] {
    const filesArray = this.getFilesArray();
    const { by, order } = this.sortConfig;

    return filesArray.sort((a, b) => {
      const aValue = a[by];
      const bValue = b[by];

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return order === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        const comparison = aValue - bValue;
        return order === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  }

  /**
   * Set sort configuration
   */
  setSortConfig(config: SortConfig): void {
    this.sortConfig = config;
  }

  /**
   * Search files by title or content
   */
  searchFiles(query: string): MarkdownFile[] {
    if (!query.trim()) {
      return this.getSortedFiles();
    }

    const lowerQuery = query.toLowerCase();
    return this.getFilesArray().filter((file) => {
      return (
        file.title.toLowerCase().includes(lowerQuery) ||
        file.content.toLowerCase().includes(lowerQuery) ||
        file.tags.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Filter files by tag
   */
  filterByTag(tag: string): MarkdownFile[] {
    if (!tag.trim()) {
      return this.getSortedFiles();
    }

    const lowerTag = tag.toLowerCase();
    return this.getFilesArray().filter((file) => {
      const tags = file.tags.split(",").map((t) => t.trim().toLowerCase());
      return tags.includes(lowerTag);
    });
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const tagsSet = new SvelteSet<string>();

    this.getFilesArray().forEach((file) => {
      const tags = file.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }

  /**
   * Clear all files (use with caution!)
   */
  clearAllFiles(): void {
    if (!this.adapter) {
      throw new Error("Library adapter not initialized");
    }

    if (confirm("Are you sure you want to delete all files? This cannot be undone.")) {
      this.adapter.clearAllFiles();
    }
  }

  /**
   * Get loading state
   */
  getIsLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Destroy the library context and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.adapter) {
      await this.adapter.destroy();
      this.adapter = null;
    }

    this.files = {};
    this.isLoading = true;
  }
}

/**
 * Set the library context
 */
export function setLibraryContext(): LibraryContext {
  const context = new LibraryContext();
  setContext(LIBRARY_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the library context
 */
export function getLibraryContext(): LibraryContext {
  const context = getContext<LibraryContext>(LIBRARY_CONTEXT_KEY);
  if (!context) {
    throw new Error("LibraryContext not found. Make sure to call setLibraryContext() in a parent component.");
  }
  return context;
}
