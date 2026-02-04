/**
 * Editor Operations Context
 *
 * Provides editor business logic and file operations.
 * This context focuses on operations that manipulate editor state.
 */

import { getContext, setContext } from "svelte";
import type { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { getEditorStateContext } from "./EditorStateContext.svelte";
import { getFileService, getExportService } from "$lib/services";
import type { MarkdownFile } from "$lib/types/database";
import { ContextNotFoundError, FileOperationError } from "$lib/errors";

const EDITOR_OPERATIONS_CONTEXT_KEY = Symbol("editorOperations");

/**
 * Editor operations context - business logic for file operations
 */
export class EditorOperationsContext {
  private state = getEditorStateContext();
  private fileService = getFileService();
  private exportService = getExportService();

  /**
   * Reset the undo history to the current content.
   */
  resetUndoHistory(view: EditorView | undefined, historyCompartment: Compartment): void {
    if (!view) return;
    view.dispatch({ effects: historyCompartment.reconfigure([]) }); // Remove history
    view.dispatch({ effects: historyCompartment.reconfigure([history()]) }); // Re-add history
  }

  /**
   * Handle file selection to load content into editor.
   */
  handleFileSelect(event: Event | undefined, view: EditorView | undefined, historyCompartment: Compartment): void {
    if (!event) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newContent = e.target?.result as string;
      this.loadFileContent(view, file.name, newContent, undefined, historyCompartment);
      if (view) this.resetUndoHistory(view, historyCompartment);
      this.state.isDirty = false;
    };
    reader.readAsText(file);
    input.value = "";
  }

  /**
   * Updates the editor and state with new file content.
   * This directly dispatches changes to CodeMirror.
   */
  loadFileContent(
    view: EditorView | undefined,
    fileName: string,
    fileContent: string,
    fileId: string | null | undefined,
    historyCompartment: Compartment
  ): void {
    // Update state
    this.state.content = fileContent;
    this.state.activeFilename = fileName;
    this.state.activeFileId = fileId;
    this.state.isDirty = false;

    // Directly update the editor view if it exists
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: fileContent },
      });

      this.resetUndoHistory(view, historyCompartment);
    }
  }

  /**
   * Clears the editor view content and creates a new document.
   */
  newFile(view: EditorView | undefined, onNewFile: () => void): void {
    if (this.state.isDirty && !confirm("You have unsaved changes. Discard them and create a new file?")) {
      return;
    }

    // Reset editor state
    onNewFile();
    this.state.activeFilename = undefined;
    this.state.activeFileId = undefined;
    this.state.isDirty = false;

    // Clear the editor view if it exists
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: "" },
      });
    }
  }

  /**
   * Generate a filename from markdown content
   */
  generateFilename(markdownContent: string): string {
    return this.fileService.generateFilenameFromContent(markdownContent);
  }

  /**
   * Generate a document title from markdown content
   */
  generateDocumentTitle(markdownContent: string, defaultTitle = "Untitled"): string {
    return this.fileService.generateTitleFromContent(markdownContent, defaultTitle);
  }

  /**
   * Save the file using provided callback
   */
  async saveFile(onSave: (content: string) => Promise<void>): Promise<void> {
    if (!this.state.content) return;

    try {
      await onSave(this.state.content);
      this.state.isDirty = false;
    } catch (error) {
      throw new FileOperationError("save", this.state.activeFileId || null, error as Error);
    }
  }

  /**
   * Export the current file
   */
  async exportFile(): Promise<void> {
    if (!this.state.content && !this.state.activeFilename) return;

    try {
      // Determine title: check frontmatter first, then H1 heading, then "Untitled"
      let title: string;
      if (this.state.activeFilename) {
        title = this.fileService.getFilenameWithoutExtension(this.state.activeFilename);
      } else {
        const { frontmatter } = this.fileService.parseMarkdownFrontmatter(this.state.content);
        title = frontmatter.title || this.fileService.generateTitleFromContent(this.state.content);
      }

      // Create a temporary file object for export
      const tempFile: MarkdownFile = {
        id: this.state.activeFileId || "temp",
        content: this.state.content,
        title,
        tags: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        visitedAt: Date.now(),
      };

      // Use ExportService to create the blob
      const blob = this.exportService.exportFile(tempFile, {
        format: "markdown",
        includeMetadata: false,
      });

      // Generate filename using ExportService
      const baseFilename = this.state.activeFilename ?? this.exportService.generateExportFilename(tempFile, "markdown");

      // Download the file
      this.exportService.downloadFile(blob, baseFilename);

      this.state.activeFilename = baseFilename;
      this.state.isDirty = false;
    } catch (error) {
      throw new FileOperationError("export", this.state.activeFileId || null, error as Error);
    }
  }
}

/**
 * Set the editor operations context
 */
export function setEditorOperationsContext(): EditorOperationsContext {
  const context = new EditorOperationsContext();
  setContext(EDITOR_OPERATIONS_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the editor operations context
 */
export function getEditorOperationsContext(): EditorOperationsContext {
  const context = getContext<EditorOperationsContext>(EDITOR_OPERATIONS_CONTEXT_KEY);
  if (!context) {
    throw new ContextNotFoundError("EditorOperationsContext");
  }
  return context;
}
