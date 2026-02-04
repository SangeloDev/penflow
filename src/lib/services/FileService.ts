/**
 * File Service
 *
 * Provides business logic for file operations.
 * Handles file naming, validation, transformation, and utility operations
 * independent of storage and UI concerns.
 */

import type { MarkdownFile } from "$lib/types/database";

/**
 * File service interface
 */
export interface IFileService {
  generateFilenameFromContent(content: string): string;
  generateTitleFromContent(content: string, defaultTitle?: string): string;
  sanitizeFilename(filename: string): string;
  validateFilename(filename: string): boolean;
  isMarkdownFile(filename: string): boolean;
  getFileExtension(filename: string): string;
  addMarkdownExtension(filename: string): string;
  parseMarkdownFrontmatter(content: string): { frontmatter: Record<string, any>; content: string };
  serializeMarkdownFrontmatter(frontmatter: Record<string, any>, content: string): string;
  extractTags(content: string): string[];
  formatTags(tags: string[]): string;
}

/**
 * File service implementation
 */
export class FileService implements IFileService {
  /**
   * Generate a filename from markdown content
   * Extracts the first H1 heading and converts it to a filename
   */
  generateFilenameFromContent(content: string): string {
    const headingMatch = content.match(/^# (.*)/m);
    let baseName = "note";

    if (headingMatch && headingMatch[1]) {
      baseName = headingMatch[1].trim();
    }

    const sanitized = this.sanitizeFilename(baseName);
    return this.addMarkdownExtension(sanitized || "note");
  }

  /**
   * Generate a title from markdown content
   * Extracts the first H1 heading as a title
   */
  generateTitleFromContent(content: string, defaultTitle = "Untitled"): string {
    const headingMatch = content.match(/^# (.*)/m);

    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim().replace(/\s+/g, " ") || defaultTitle;
    }

    return defaultTitle;
  }

  /**
   * Sanitize a filename by removing invalid characters
   */
  sanitizeFilename(filename: string): string {
    // Remove file extension if present
    const nameWithoutExt = filename.replace(/\.(md|markdown|txt)$/i, "");

    return nameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters except hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Validate a filename
   */
  validateFilename(filename: string): boolean {
    if (!filename || filename.trim().length === 0) {
      return false;
    }

    // Check for invalid characters (OS-specific)
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(filename)) {
      return false;
    }

    // Check length (most filesystems support 255 characters)
    if (filename.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * Check if a filename has a markdown extension
   */
  isMarkdownFile(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return ext === "md" || ext === "markdown" || ext === "txt";
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()! : "";
  }

  /**
   * Add .md extension to filename if not present
   */
  addMarkdownExtension(filename: string): string {
    if (this.isMarkdownFile(filename)) {
      return filename;
    }

    return `${filename}.md`;
  }

  /**
   * Parse YAML frontmatter from markdown content
   */
  parseMarkdownFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, content };
    }

    const [, frontmatterText, bodyContent] = match;
    const frontmatter: Record<string, any> = {};

    // Simple YAML parser for basic key-value pairs
    const lines = frontmatterText.split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim();
      let value: any = line.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Parse arrays (simple comma-separated values)
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((v: string) => v.trim().replace(/^["']|["']$/g, ""));
      }

      frontmatter[key] = value;
    }

    return { frontmatter, content: bodyContent };
  }

  /**
   * Serialize frontmatter and content into markdown with YAML frontmatter
   */
  serializeMarkdownFrontmatter(frontmatter: Record<string, any>, content: string): string {
    const keys = Object.keys(frontmatter);

    if (keys.length === 0) {
      return content;
    }

    let yaml = "---\n";

    for (const key of keys) {
      const value = frontmatter[key];

      if (Array.isArray(value)) {
        // Format as YAML array
        yaml += `${key}: [${value.map((v: any) => `"${v}"`).join(", ")}]\n`;
      } else if (typeof value === "string") {
        // Quote strings if they contain special characters
        const needsQuotes = /[:#[\]{}]/.test(value);
        yaml += needsQuotes ? `${key}: "${value}"\n` : `${key}: ${value}\n`;
      } else {
        yaml += `${key}: ${value}\n`;
      }
    }

    yaml += "---\n";

    return yaml + content;
  }

  /**
   * Extract tags from content
   * Looks for tags in various formats: #tag, [[tag]], or in frontmatter
   */
  extractTags(content: string): string[] {
    const tags = new Set<string>();

    // Extract hashtags
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.add(match[1]);
    }

    // Extract from frontmatter
    const { frontmatter } = this.parseMarkdownFrontmatter(content);
    if (frontmatter.tags) {
      if (Array.isArray(frontmatter.tags)) {
        frontmatter.tags.forEach((tag: string) => tags.add(tag));
      } else if (typeof frontmatter.tags === "string") {
        frontmatter.tags.split(",").forEach((tag: string) => tags.add(tag.trim()));
      }
    }

    return Array.from(tags);
  }

  /**
   * Format tags array as comma-separated string
   */
  formatTags(tags: string[]): string {
    return tags
      .filter((tag) => tag && tag.trim().length > 0)
      .map((tag) => tag.trim())
      .join(", ");
  }

  /**
   * Calculate word count from markdown content
   */
  getWordCount(content: string): number {
    // Remove code blocks
    const withoutCode = content.replace(/```[\s\S]*?```/g, "");

    // Remove inline code
    const withoutInlineCode = withoutCode.replace(/`[^`]*`/g, "");

    // Remove markdown syntax
    const cleaned = withoutInlineCode
      .replace(/#{1,6}\s/g, "") // Headers
      .replace(/[*_~`]/g, "") // Emphasis
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Images
      .trim();

    // Count words
    const words = cleaned.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }

  /**
   * Calculate reading time in minutes
   */
  getReadingTime(content: string, wordsPerMinute = 200): number {
    const wordCount = this.getWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Get filename without extension
   */
  getFilenameWithoutExtension(filename: string): string {
    const parts = filename.split(".");
    if (parts.length > 1) {
      parts.pop();
    }
    return parts.join(".");
  }

  /**
   * Compare two markdown files for equality
   */
  filesEqual(file1: MarkdownFile, file2: MarkdownFile): boolean {
    return file1.content === file2.content && file1.title === file2.title && file1.tags === file2.tags;
  }
}

/**
 * Create a new file service instance
 */
export function createFileService(): FileService {
  return new FileService();
}
