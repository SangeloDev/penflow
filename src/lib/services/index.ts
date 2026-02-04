/**
 * Services Module Index
 *
 * Provides singleton instances of all services to avoid duplicate instances.
 * Services are lazily initialized on first access.
 */

import { StorageService, type IStorageService } from "./StorageService";
import { FileService, type IFileService } from "./FileService";
import { ExportService, type IExportService, type ExportFormat, type ExportOptions } from "./ExportService";

// Singleton instances
let fileServiceInstance: FileService | null = null;
let storageServiceInstance: StorageService | null = null;
let exportServiceInstance: ExportService | null = null;

/**
 * Get or create the FileService singleton instance
 */
export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}

/**
 * Get or create the StorageService singleton instance
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}

/**
 * Get or create the ExportService singleton instance
 */
export function getExportService(): ExportService {
  if (!exportServiceInstance) {
    exportServiceInstance = new ExportService();
  }
  return exportServiceInstance;
}

/**
 * Reset all service instances (useful for testing)
 */
export function resetServices(): void {
  fileServiceInstance = null;
  storageServiceInstance = null;
  exportServiceInstance = null;
}

// Re-export types and classes
export { StorageService, FileService, ExportService };
export type { IStorageService, IFileService, IExportService, ExportFormat, ExportOptions };

// Legacy compatibility - mark as deprecated
/** @deprecated Use getFileService() instead */
export const createFileService = getFileService;
/** @deprecated Use getStorageService() instead */
export const createStorageService = getStorageService;
/** @deprecated Use getExportService() instead */
export const createExportService = getExportService;
