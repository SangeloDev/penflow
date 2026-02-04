/**
 * useEditor Composable
 *
 * Provides editor state and operations as a composable.
 * Encapsulates all editor-related business logic in a reusable way.
 */

import { getEditorContext } from "$lib/context";
import type { EditorMode } from "$lib/context";
import type { EditorView } from "@codemirror/view";
import type { Compartment } from "@codemirror/state";

/**
 * Editor composable for managing editor state and operations
 */
export function useEditor() {
  const editor = getEditorContext();

  /**
   * Get the current editor mode
   */
  function getMode(): EditorMode {
    return editor.getMode();
  }

  /**
   * Set the editor mode
   */
  function setMode(mode: EditorMode): void {
    editor.setMode(mode);
  }

  /**
   * Cycle the editor mode forward or backward
   */
  function cycleMode(forward = true): void {
    editor.cycleEditMode(forward);
  }

  /**
   * Get the current editor content
   */
  function getContent(): string {
    return editor.getContent();
  }

  /**
   * Set the editor content
   */
  function setContent(content: string): void {
    editor.setContent(content);
  }

  /**
   * Get the active filename
   */
  function getActiveFilename(): string | undefined {
    return editor.getActiveFilename();
  }

  /**
   * Set the active filename
   */
  function setActiveFilename(filename: string | undefined): void {
    editor.setActiveFilename(filename);
  }

  /**
   * Get the active file ID
   */
  function getActiveFileId(): string | null | undefined {
    return editor.getActiveFileId();
  }

  /**
   * Set the active file ID
   */
  function setActiveFileId(fileId: string | null | undefined): void {
    editor.setActiveFileId(fileId);
  }

  /**
   * Check if the editor has unsaved changes
   */
  function isDirty(): boolean {
    return editor.getDirtyness();
  }

  /**
   * Set the dirty state
   */
  function setDirty(dirty: boolean): void {
    editor.setDirty(dirty);
  }

  /**
   * Load file content into the editor
   */
  function loadFileContent(
    view: EditorView | undefined,
    fileName: string,
    fileContent: string,
    fileId: string | null | undefined,
    historyCompartment: Compartment
  ): void {
    editor.loadFileContent(view, fileName, fileContent, fileId, historyCompartment);
  }

  /**
   * Create a new file (clears editor)
   */
  function newFile(view: EditorView | undefined, onNewFile: () => void): void {
    editor.newFile(view, onNewFile);
  }

  /**
   * Handle file selection from file input
   */
  function handleFileSelect(
    event: Event | undefined,
    view: EditorView | undefined,
    historyCompartment: Compartment
  ): void {
    editor.handleFileSelect(event, view, historyCompartment);
  }

  /**
   * Save the current file
   */
  async function saveFile(onSave: (content: string) => Promise<void>): Promise<void> {
    await editor.saveFile(onSave);
  }

  /**
   * Export the current file
   */
  async function exportFile(): Promise<void> {
    await editor.exportFile();
  }

  /**
   * Generate a filename from markdown content
   */
  function generateFilename(content: string): string {
    return editor.generateFilename(content);
  }

  /**
   * Generate a document title from markdown content
   */
  function generateDocumentTitle(content: string, defaultTitle = "Untitled"): string {
    return editor.generateDocumentTitle(content, defaultTitle);
  }

  /**
   * Reset the undo history
   */
  function resetUndoHistory(view: EditorView | undefined, historyCompartment: Compartment): void {
    editor.resetUndoHistory(view, historyCompartment);
  }

  /**
   * Get shortcuts modal visibility
   */
  function getShortcutModalVisibility(): boolean {
    return editor.getShortcutModalVisibility();
  }

  /**
   * Set shortcuts modal visibility
   */
  function setShortcutModalVisibility(visible: boolean): void {
    editor.setShortcutModalVisibility(visible);
  }

  /**
   * Get settings modal visibility
   */
  function getSettingsModalVisibility(): boolean {
    return editor.getSettingsModalVisibility();
  }

  /**
   * Set settings modal visibility
   */
  function setSettingsModalVisibility(visible: boolean): void {
    editor.setSettingsModalVisibility(visible);
  }

  return {
    // Mode management
    getMode,
    setMode,
    cycleMode,

    // Content management
    getContent,
    setContent,

    // File management
    getActiveFilename,
    setActiveFilename,
    getActiveFileId,
    setActiveFileId,
    loadFileContent,
    newFile,
    handleFileSelect,

    // Dirty state
    isDirty,
    setDirty,

    // File operations
    saveFile,
    exportFile,

    // Utilities
    generateFilename,
    generateDocumentTitle,
    resetUndoHistory,

    // Modal management
    getShortcutModalVisibility,
    setShortcutModalVisibility,
    getSettingsModalVisibility,
    setSettingsModalVisibility,

    // Direct access to reactive state (for binding in components)
    get mode() {
      return editor.mode;
    },
    get content() {
      return editor.content;
    },
    get activeFilename() {
      return editor.activeFilename;
    },
    get activeFileId() {
      return editor.activeFileId;
    },
    get dirty() {
      return editor.isDirty;
    },
    get shortcutModalVisible() {
      return editor.shortcutModalVisible;
    },
    set shortcutModalVisible(value: boolean) {
      editor.shortcutModalVisible = value;
    },
    get settingsModalVisible() {
      return editor.settingsModalVisible;
    },
    set settingsModalVisible(value: boolean) {
      editor.settingsModalVisible = value;
    },
  };
}
