/**
 * useFileSystem Composable
 *
 * Provides file system operations as a composable.
 * Handles file reading, writing, and export operations.
 */

/**
 * File system composable for handling file I/O operations
 */
export function useFileSystem() {
  /**
   * Read a file from the file system using a file input
   */
  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Open a file using the browser's file picker
   */
  async function openFile(onFileLoaded: (filename: string, content: string) => void): Promise<void> {
    // Create a temporary file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        const content = await readFile(file);
        onFileLoaded(file.name, content);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    input.click();
  }

  /**
   * Export content as a file download
   */
  function exportAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Save content to a file (browser download)
   */
  function saveToFile(content: string, filename?: string): void {
    const finalFilename = filename || generateFilename(content);
    exportAsFile(content, finalFilename);
  }

  /**
   * Generate a filename from markdown content
   */
  function generateFilename(content: string): string {
    const headingMatch = content.match(/^# (.*)/m);
    let baseName = "note";

    if (headingMatch && headingMatch[1]) {
      baseName = headingMatch[1].trim();
    }

    const sanitizedName = baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return (sanitizedName || "note") + ".md";
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }

  /**
   * Read text from clipboard
   */
  async function readFromClipboard(): Promise<string | null> {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      console.error("Failed to read from clipboard:", error);
      return null;
    }
  }

  /**
   * Check if a filename has a markdown extension
   */
  function isMarkdownFile(filename: string): boolean {
    const ext = filename.toLowerCase().split(".").pop();
    return ext === "md" || ext === "markdown" || ext === "txt";
  }

  /**
   * Sanitize a filename by removing invalid characters
   */
  function sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Get file extension from filename
   */
  function getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()! : "";
  }

  /**
   * Get filename without extension
   */
  function getFilenameWithoutExtension(filename: string): string {
    const parts = filename.split(".");
    if (parts.length > 1) {
      parts.pop();
    }
    return parts.join(".");
  }

  return {
    // File I/O
    readFile,
    openFile,
    exportAsFile,
    saveToFile,

    // Clipboard
    copyToClipboard,
    readFromClipboard,

    // Utilities
    generateFilename,
    isMarkdownFile,
    sanitizeFilename,
    getFileExtension,
    getFilenameWithoutExtension,
  };
}
