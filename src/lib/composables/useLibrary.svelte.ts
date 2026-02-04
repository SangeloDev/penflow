/**
 * useLibrary Composable
 *
 * Provides library management functionality as a composable.
 * Encapsulates all library-related business logic in a reusable way.
 */

import { getLibraryContext } from "$lib/context";
import type { MarkdownFile, SortConfig } from "$lib/types/database";

/**
 * Library composable for managing the markdown file collection
 */
export function useLibrary() {
  const library = getLibraryContext();

  /**
   * Get all files as an array
   */
  function getFiles(): MarkdownFile[] {
    return library.getFilesArray();
  }

  /**
   * Get a single file by ID
   */
  function getFile(id: string): MarkdownFile | null {
    return library.getFile(id);
  }

  /**
   * Get sorted files based on current sort configuration
   */
  function getSortedFiles(): MarkdownFile[] {
    return library.getSortedFiles();
  }

  /**
   * Create a new file
   */
  function createFile(content: string, title?: string, tags?: string): string {
    const id = crypto.randomUUID();
    library.createFile(id, content, title, tags);
    return id;
  }

  /**
   * Update an existing file
   */
  function updateFile(id: string, updates: Partial<MarkdownFile>): void {
    library.updateFile(id, updates);
  }

  /**
   * Delete a file
   */
  function deleteFile(id: string): void {
    library.deleteFile(id);
  }

  /**
   * Mark a file as visited (updates visitedAt timestamp)
   */
  function markFileVisited(id: string): void {
    library.markFileVisited(id);
  }

  /**
   * Check if a file exists
   */
  function fileExists(id: string): boolean {
    return library.fileExists(id);
  }

  /**
   * Get the total number of files
   */
  function getFileCount(): number {
    return library.getFileCount();
  }

  /**
   * Search files by query (searches title, content, and tags)
   */
  function searchFiles(query: string): MarkdownFile[] {
    return library.searchFiles(query);
  }

  /**
   * Filter files by tag
   */
  function filterByTag(tag: string): MarkdownFile[] {
    return library.filterByTag(tag);
  }

  /**
   * Get all unique tags across all files
   */
  function getAllTags(): string[] {
    return library.getAllTags();
  }

  /**
   * Set the sort configuration
   */
  function setSortConfig(config: SortConfig): void {
    library.setSortConfig(config);
  }

  /**
   * Get the current sort configuration
   */
  function getSortConfig(): SortConfig {
    return library.sortConfig;
  }

  /**
   * Get the loading state
   */
  function isLoading(): boolean {
    return library.getIsLoading();
  }

  /**
   * Clear all files (with confirmation)
   */
  function clearAllFiles(): void {
    library.clearAllFiles();
  }

  return {
    // Getters
    getFiles,
    getFile,
    getSortedFiles,
    getFileCount,
    isLoading,
    getSortConfig,

    // File operations
    createFile,
    updateFile,
    deleteFile,
    markFileVisited,
    fileExists,

    // Search and filter
    searchFiles,
    filterByTag,
    getAllTags,

    // Configuration
    setSortConfig,

    // Utilities
    clearAllFiles,

    // Direct access to reactive state (for binding in components)
    get files() {
      return library.files;
    },
    get loading() {
      return library.isLoading;
    },
  };
}
