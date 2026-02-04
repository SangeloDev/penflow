/**
 * Editor Context
 *
 * Provides editor state and operations through Svelte's context API.
 * This replaces global state with a proper provider/consumer pattern.
 */

import { getContext, setContext } from "svelte";
import { history } from "@codemirror/commands";
import type { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { createFileService } from "$lib/services/FileService";
import { createExportService } from "$lib/services/ExportService";
import type { MarkdownFile } from "$lib/types/database";

const EDITOR_CONTEXT_KEY = Symbol("editor");

/**
 * The EditorMode type. Can be either `edit`, `side-by-side` or `preview`
 */
export type EditorMode = "edit" | "side-by-side" | "preview";

/**
 * Editor context state and operations
 */
export class EditorContext {
  mode = $state<EditorMode>("edit");
  content = $state<string>("");
  activeFilename = $state<string | undefined>(undefined);
  activeFileId = $state<string | null | undefined>(undefined);
  isDirty = $state<boolean>(false);
  shortcutModalVisible = $state<boolean>(false);
  settingsModalVisible = $state<boolean>(false);

  // Services
  private fileService = createFileService();
  private exportService = createExportService();

  /**
   * Set the editor mode to either `edit`, `side-by-side` or `preview`.
   */
  setMode(newMode: EditorMode): void {
    this.mode = newMode;
  }

  /**
   * Gets the current editor mode.
   */
  getMode(): EditorMode {
    return this.mode;
  }

  /**
   * Gets the visibility of the shortcut modal.
   */
  getShortcutModalVisibility(): boolean {
    return this.shortcutModalVisible;
  }

  /**
   * Sets whether the shortcut modal is visible or not.
   */
  setShortcutModalVisibility(visible: boolean): void {
    this.shortcutModalVisible = visible;
  }

  /**
   * Gets the visibility of the settings modal.
   */
  getSettingsModalVisibility(): boolean {
    return this.settingsModalVisible;
  }

  /**
   * Sets whether the settings modal is visible or not.
   */
  setSettingsModalVisibility(visible: boolean): void {
    this.settingsModalVisible = visible;
  }

  /**
   * Get the current editor content.
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Set the editor content.
   */
  setContent(newContent: string): void {
    this.content = newContent;
  }

  /**
   * Get the active filename
   */
  getActiveFilename(): string | undefined {
    return this.activeFilename;
  }

  /**
   * Set the active filename
   */
  setActiveFilename(filename: string | undefined): void {
    this.activeFilename = filename;
  }

  /**
   * Get the active file ID
   */
  getActiveFileId(): string | null | undefined {
    return this.activeFileId;
  }

  /**
   * Set the active file ID
   */
  setActiveFileId(fileId: string | null | undefined): void {
    this.activeFileId = fileId;
  }

  /**
   * Set the dirty state of the editor
   */
  setDirty(dirtyness: boolean): void {
    this.isDirty = dirtyness;
  }

  /**
   * Get the dirty state of the editor
   */
  getDirtyness(): boolean {
    return this.isDirty;
  }

  /**
   * Cycles the edit mode forwards or backwards, depending on the forward boolean.
   */
  cycleEditMode(forward = true): void {
    if (forward) {
      switch (this.mode) {
        case "edit":
          this.setMode("side-by-side");
          break;
        case "side-by-side":
          this.setMode("preview");
          break;
        case "preview":
        default:
          this.setMode("edit");
          break;
      }
    } else {
      switch (this.mode) {
        case "edit":
          this.setMode("preview");
          break;
        case "preview":
          this.setMode("side-by-side");
          break;
        case "side-by-side":
        default:
          this.setMode("edit");
          break;
      }
    }
  }

  /**
   * Resets the undo history to the current content.
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
      this.setDirty(false);
    };
    reader.readAsText(file);
    input.value = "";
  }

  /**
   * Updates the editor and state with new file content.
   * This now directly dispatches changes to CodeMirror.
   */
  loadFileContent(
    view: EditorView | undefined,
    fileName: string,
    fileContent: string,
    fileId: string | null | undefined,
    historyCompartment: Compartment
  ): void {
    // update svelte state for preview and other ui elements
    this.setContent(fileContent);
    this.setActiveFilename(fileName);
    this.setActiveFileId(fileId);
    this.setDirty(false);

    // directly update the editor view if it exists
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: this.getContent() },
      });

      this.resetUndoHistory(view, historyCompartment);
    }
  }

  /**
   * Clears the editor view content and creates a new document.
   */
  newFile(view: EditorView | undefined, onNewFile: () => void): void {
    if (this.isDirty && !confirm("You have unsaved changes. Discard them and create a new file?")) {
      return;
    }

    // reset editor
    onNewFile();
    this.setActiveFilename(undefined);
    this.setActiveFileId(undefined);
    this.setDirty(false);

    // clear the editor view if it exists
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: "" },
      });
    }
  }

  /**
   * Reads a Markdown string until it finds an h1 heading. Then it transforms it into a valid filename.
   */
  generateFilename(markdownContent: string): string {
    return this.fileService.generateFilenameFromContent(markdownContent);
  }

  /**
   * Reads a Markdown string until it finds an h1 heading. Then it transforms it into a title.
   */
  generateDocumentTitle(markdownContent: string, defaultTitle = "Untitled"): string {
    return this.fileService.generateTitleFromContent(markdownContent, defaultTitle);
  }

  /**
   * Saves the file.
   */
  async saveFile(onSave: (content: string) => Promise<void>): Promise<void> {
    if (!this.content) return;
    await onSave(this.content);
    this.setDirty(false);
  }

  /**
   * Exports the file.
   */
  async exportFile(): Promise<void> {
    if (!this.content && !this.activeFilename) return; // Don't save empty, untitled files

    // Determine title: check frontmatter first, then H1 heading, then "Untitled"
    let title: string;
    if (this.activeFilename) {
      title = this.fileService.getFilenameWithoutExtension(this.activeFilename);
    } else {
      // Parse frontmatter to check for title
      const { frontmatter } = this.fileService.parseMarkdownFrontmatter(this.content);
      title = frontmatter.title || this.fileService.generateTitleFromContent(this.content);
    }

    // Create a temporary file object for export
    const tempFile: MarkdownFile = {
      id: this.activeFileId || "temp",
      content: this.content,
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
    const baseFilename = this.activeFilename ?? this.exportService.generateExportFilename(tempFile, "markdown");

    // Download the file
    this.exportService.downloadFile(blob, baseFilename);

    this.setActiveFilename(baseFilename);
    this.setDirty(false);
  }
}

/**
 * Set the editor context
 */
export function setEditorContext(): EditorContext {
  const context = new EditorContext();
  setContext(EDITOR_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the editor context
 */
export function getEditorContext(): EditorContext {
  const context = getContext<EditorContext>(EDITOR_CONTEXT_KEY);
  if (!context) {
    throw new Error("EditorContext not found. Make sure to call setEditorContext() in a parent component.");
  }
  return context;
}
