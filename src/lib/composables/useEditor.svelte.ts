/**
 * useEditor Composable
 *
 * Simplified composable that provides direct access to editor contexts.
 * Combines state and operations for convenient component usage.
 */

import { getEditorStateContext, getEditorOperationsContext } from "$lib/context";

/**
 * Editor composable - provides combined access to editor state and operations
 *
 * @example
 * ```typescript
 * const editor = useEditor();
 *
 * // Access state directly
 * console.log(editor.state.mode);
 * editor.state.content = "New content";
 *
 * // Call operations
 * await editor.operations.saveFile(onSave);
 * editor.operations.loadFileContent(view, fileName, content, fileId, historyCompartment);
 * ```
 */
export function useEditor() {
  const state = getEditorStateContext();
  const operations = getEditorOperationsContext();

  return {
    state,
    operations,

    // Convenience shortcuts for common state access
    get mode() {
      return state.mode;
    },
    set mode(value) {
      state.mode = value;
    },
    get content() {
      return state.content;
    },
    set content(value) {
      state.content = value;
    },
    get isDirty() {
      return state.isDirty;
    },
    set isDirty(value) {
      state.isDirty = value;
    },
    get activeFilename() {
      return state.activeFilename;
    },
    get activeFileId() {
      return state.activeFileId;
    },

    // Convenience shortcuts for common operations
    cycleMode: (forward = true) => state.cycleMode(forward),
    saveFile: (onSave: (content: string) => Promise<void>) => operations.saveFile(onSave),
    exportFile: () => operations.exportFile(),
    newFile: (view: any, onNewFile: () => void) => operations.newFile(view, onNewFile),
    loadFileContent: (
      view: any,
      fileName: string,
      fileContent: string,
      fileId: string | null | undefined,
      historyCompartment: any
    ) => operations.loadFileContent(view, fileName, fileContent, fileId, historyCompartment),
    generateFilename: (content: string) => operations.generateFilename(content),
    generateDocumentTitle: (content: string, defaultTitle?: string) =>
      operations.generateDocumentTitle(content, defaultTitle),
  };
}
