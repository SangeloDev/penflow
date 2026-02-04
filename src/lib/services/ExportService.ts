/**
 * Export Service
 *
 * Provides business logic for exporting files in various formats.
 * Handles file export operations independent of storage and UI concerns.
 */

import type { MarkdownFile } from "$lib/types/database";

/**
 * Export format options
 */
export type ExportFormat = "markdown" | "html" | "json" | "txt";

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  filename?: string;
}

/**
 * Export service interface
 */
export interface IExportService {
  exportFile(file: MarkdownFile, options: ExportOptions): Blob;
  exportFiles(files: MarkdownFile[], options: ExportOptions): Blob;
  downloadFile(blob: Blob, filename: string): void;
  exportAsMarkdown(file: MarkdownFile, includeMetadata?: boolean): string;
  exportAsHtml(file: MarkdownFile): string;
  exportAsJson(file: MarkdownFile): string;
  exportAsText(file: MarkdownFile): string;
  generateExportFilename(file: MarkdownFile, format: ExportFormat): string;
}

/**
 * Export service implementation
 */
export class ExportService implements IExportService {
  /**
   * Export a single file
   */
  exportFile(file: MarkdownFile, options: ExportOptions): Blob {
    let content: string;

    switch (options.format) {
      case "markdown":
        content = this.exportAsMarkdown(file, options.includeMetadata);
        return new Blob([content], { type: "text/markdown;charset=utf-8" });

      case "html":
        content = this.exportAsHtml(file);
        return new Blob([content], { type: "text/html;charset=utf-8" });

      case "json":
        content = this.exportAsJson(file);
        return new Blob([content], { type: "application/json;charset=utf-8" });

      case "txt":
        content = this.exportAsText(file);
        return new Blob([content], { type: "text/plain;charset=utf-8" });

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export multiple files as a single archive
   */
  exportFiles(files: MarkdownFile[], options: ExportOptions): Blob {
    const exportData: Record<string, any> = {};

    if (options.format === "json") {
      // Export as JSON object containing all files
      files.forEach((file) => {
        exportData[file.id] = {
          id: file.id,
          title: file.title,
          content: file.content,
          tags: file.tags,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          visitedAt: file.visitedAt,
        };
      });

      return new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
    }

    // For other formats, concatenate all files
    const contents = files.map((file, index) => {
      let fileContent = "";

      if (files.length > 1) {
        fileContent += `\n\n${"=".repeat(80)}\n`;
        fileContent += `File ${index + 1}: ${file.title || "Untitled"}\n`;
        fileContent += `${"=".repeat(80)}\n\n`;
      }

      switch (options.format) {
        case "markdown":
          fileContent += this.exportAsMarkdown(file, options.includeMetadata);
          break;
        case "html":
          fileContent += this.exportAsHtml(file);
          break;
        case "txt":
          fileContent += this.exportAsText(file);
          break;
      }

      return fileContent;
    });

    const combinedContent = contents.join("\n\n");
    const mimeType = this.getMimeType(options.format);

    return new Blob([combinedContent], { type: mimeType });
  }

  /**
   * Trigger a file download in the browser
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  /**
   * Export as Markdown format
   */
  exportAsMarkdown(file: MarkdownFile, includeMetadata = false): string {
    let output = "";

    if (includeMetadata && (file.title || file.tags)) {
      output += "---\n";

      if (file.title) {
        output += `title: "${file.title}"\n`;
      }

      if (file.tags) {
        const tagsArray = file.tags.split(",").map((t) => t.trim());
        output += `tags: [${tagsArray.map((t) => `"${t}"`).join(", ")}]\n`;
      }

      output += `created: ${new Date(file.createdAt).toISOString()}\n`;
      output += `updated: ${new Date(file.updatedAt).toISOString()}\n`;
      output += "---\n\n";
    }

    output += file.content;

    return output;
  }

  /**
   * Export as HTML format
   */
  exportAsHtml(file: MarkdownFile): string {
    // Basic markdown to HTML conversion
    // Note: In a real implementation, you'd use a proper markdown parser
    let html = file.content;

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = `<p>${html}</p>`;

    // Wrap in full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.title || "Untitled"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3 { margin-top: 1.5rem; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

    return fullHtml;
  }

  /**
   * Export as JSON format
   */
  exportAsJson(file: MarkdownFile): string {
    const exportData = {
      id: file.id,
      title: file.title,
      content: file.content,
      tags: file.tags,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      visitedAt: file.visitedAt,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export as plain text format
   */
  exportAsText(file: MarkdownFile): string {
    // Remove markdown syntax for plain text
    let text = file.content;

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, "");

    // Remove inline code
    text = text.replace(/`[^`]*`/g, "");

    // Remove markdown syntax
    text = text
      .replace(/#{1,6}\s/g, "") // Headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Bold
      .replace(/__([^_]+)__/g, "$1") // Bold
      .replace(/\*([^*]+)\*/g, "$1") // Italic
      .replace(/_([^_]+)_/g, "$1") // Italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Images
      .replace(/^[>-]\s/gm, "") // Blockquotes and lists
      .trim();

    return text;
  }

  /**
   * Generate an appropriate filename for export
   */
  generateExportFilename(file: MarkdownFile, format: ExportFormat): string {
    let baseName = file.title || "untitled";

    // Sanitize filename
    baseName = baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!baseName) {
      baseName = "untitled";
    }

    // Add appropriate extension
    const extensions: Record<ExportFormat, string> = {
      markdown: "md",
      html: "html",
      json: "json",
      txt: "txt",
    };

    return `${baseName}.${extensions[format]}`;
  }

  /**
   * Get MIME type for export format
   */
  private getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      markdown: "text/markdown;charset=utf-8",
      html: "text/html;charset=utf-8",
      json: "application/json;charset=utf-8",
      txt: "text/plain;charset=utf-8",
    };

    return mimeTypes[format] || "text/plain;charset=utf-8";
  }

  /**
   * Export entire library as a database dump
   */
  exportDatabase(files: Record<string, MarkdownFile>): Blob {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      fileCount: Object.keys(files).length,
      files: files,
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
  }

  /**
   * Import database from JSON
   */
  importDatabase(jsonData: string): Record<string, MarkdownFile> {
    try {
      const data = JSON.parse(jsonData);

      // Handle different import formats
      if (data.files && typeof data.files === "object") {
        return data.files;
      }

      if (typeof data === "object" && !Array.isArray(data)) {
        return data as Record<string, MarkdownFile>;
      }

      throw new Error("Invalid database format");
    } catch (error) {
      throw new Error(`Failed to import database: ${error}`);
    }
  }
}

/**
 * Create a new export service instance
 */
export function createExportService(): ExportService {
  return new ExportService();
}
