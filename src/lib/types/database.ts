/**
 * Database Types for Penflow
 *
 * This file contains strict TypeScript types for the TinyBase database schema
 * and related database operations. It eliminates the need for type casts and
 * provides compile-time safety for all database interactions.
 */

/**
 * Schema definition for a Markdown file stored in the library table
 */
export interface MarkdownFileSchema {
  content: string;
  createdAt: number;
  updatedAt: number;
  visitedAt: number;
  title: string;
  tags: string;
}

/**
 * Runtime representation of a Markdown file with its ID
 */
export interface MarkdownFile extends MarkdownFileSchema {
  id: string;
}

/**
 * Partial update type for Markdown files
 */
export type MarkdownFileUpdate = Partial<MarkdownFileSchema>;

/**
 * Table names in the database
 */
export const TABLE_NAMES = {
  LIBRARY: "library",
} as const;

export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];

/**
 * TinyBase schema definition
 */
export const LIBRARY_SCHEMA = {
  library: {
    content: { type: "string", default: "" },
    createdAt: { type: "number", default: 0 },
    updatedAt: { type: "number", default: 0 },
    visitedAt: { type: "number", default: 0 },
    title: { type: "string", default: "" },
    tags: { type: "string", default: "" },
  },
} as const;

/**
 * Type guard to check if an object is a valid MarkdownFileSchema
 */
export function isMarkdownFileSchema(obj: unknown): obj is MarkdownFileSchema {
  if (!obj || typeof obj !== "object") return false;

  const file = obj as Record<string, unknown>;

  return (
    typeof file.content === "string" &&
    typeof file.createdAt === "number" &&
    typeof file.updatedAt === "number" &&
    typeof file.visitedAt === "number" &&
    typeof file.title === "string" &&
    typeof file.tags === "string"
  );
}

/**
 * Type guard to check if an object is a valid MarkdownFile
 */
export function isMarkdownFile(obj: unknown): obj is MarkdownFile {
  if (!obj || typeof obj !== "object") return false;

  const file = obj as Record<string, unknown>;

  return typeof file.id === "string" && isMarkdownFileSchema(file);
}

/**
 * Validates and converts a raw object to MarkdownFileSchema
 * @throws Error if validation fails
 */
export function validateMarkdownFileSchema(obj: unknown): MarkdownFileSchema {
  if (!isMarkdownFileSchema(obj)) {
    throw new Error("Invalid MarkdownFileSchema object");
  }
  return obj;
}

/**
 * Converts a TinyBase row to a MarkdownFile with proper typing
 */
export function rowToMarkdownFile(id: string, row: unknown): MarkdownFile {
  const schema = validateMarkdownFileSchema(row);
  return { id, ...schema };
}

/**
 * Converts a TinyBase table to a Record of MarkdownFiles
 */
export function tableToMarkdownFiles(table: Record<string, unknown>): Record<string, MarkdownFile> {
  const files: Record<string, MarkdownFile> = {};

  for (const [id, row] of Object.entries(table)) {
    try {
      files[id] = rowToMarkdownFile(id, row);
    } catch (error) {
      console.warn(`Failed to parse markdown file with id ${id}:`, error);
    }
  }

  return files;
}

/**
 * Sort order options
 */
export type SortOrder = "asc" | "desc";

/**
 * Sortable fields for MarkdownFile
 */
export type SortableField = keyof Pick<MarkdownFile, "createdAt" | "updatedAt" | "visitedAt" | "title">;

/**
 * Sort configuration
 */
export interface SortConfig {
  by: SortableField;
  order: SortOrder;
}

/**
 * Default values for creating a new Markdown file
 */
export function createDefaultMarkdownFile(overrides?: Partial<MarkdownFileSchema>): MarkdownFileSchema {
  const now = Date.now();

  return {
    content: "",
    createdAt: now,
    updatedAt: now,
    visitedAt: now,
    title: "",
    tags: "",
    ...overrides,
  };
}
