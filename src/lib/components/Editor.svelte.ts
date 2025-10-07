import { history } from "@codemirror/commands";
import type { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * The EditorMode type. Can be either `edit`, `side-by-side` or `preview`
 */
export type EditorMode = "edit" | "side-by-side" | "preview";

let mode: EditorMode = $state("edit");
let content: string = $state("");
let shortcutModalVisible = $state(false);
let settingsModalVisible = $state(false);
let activeFilename: string | undefined = $state(undefined);
let isDirty = $state(false);

/**
 * Set the editor mode to either `edit`, `side-by-side` or `preview`.
 * @param newMode - the new editor mode
 */
export async function setMode(newMode: EditorMode) {
  mode = newMode;
}

/**
 * Gets the current editor mode.
 * @returns mode: EditorMode
 */
export function getMode() {
  return mode;
}

/**
 * Sets the active filename
 * @param filename - new filename
 */
export const setActiveFilename = (filename: string | undefined) => {
  activeFilename = filename;
};

/**
 * Gets the current active filename
 * @returns activeFilename
 */
export const getActiveFilename = () => {
  return activeFilename;
};

/**
 * Gets the visibility of the shortcut modal.
 * @returns visible: boolean
 */
export function getShortcutModalVisibility() {
  return shortcutModalVisible;
}

/**
 * Sets whether the modal is visible or not.
 * @param visible: boolean
 */
export function setShortcutModalVisibility(visible: boolean) {
  shortcutModalVisible = visible;
}

/**
 * Gets the visibility of the shortcut modal.
 * @returns visible: boolean
 */
export function getSettingsModalVisibility() {
  return settingsModalVisible;
}

/**
 * Sets whether the modal is visible or not.
 * @param visible: boolean
 */
export function setSettingsModalVisibility(visible: boolean) {
  settingsModalVisible = visible;
}

/**
 * Get the current editor content.
 * @returns string
 */
export function getContent() {
  return content;
}

/**
 * Set the editor content.
 * @param newContent - the new editor content
 */
export function setContent(newContent: string) {
  content = newContent;
}

/**
 * Cycles the edit mode forwards or backwards, depending on the forward boolean.
 * @param currentMode
 * @param forward
 */
export function cycleEditMode(currentMode: EditorMode | undefined, forward = true) {
  if (!currentMode) return;
  if (forward) {
    switch (currentMode) {
      case "edit":
        setMode("side-by-side");
        break;
      case "side-by-side":
        setMode("preview");
        break;
      case "preview":
      default:
        setMode("edit");
        break;
    }
  } else {
    switch (currentMode) {
      case "edit":
        setMode("preview");
        break;
      case "preview":
        setMode("side-by-side");
        break;
      case "side-by-side":
      default:
        setMode("edit");
        break;
    }
  }
}

export function setDirty(dirtyness: boolean) {
  isDirty = dirtyness;
}

export function getDirtyness() {
  return isDirty;
}

/**
 * Resets the undo history to the current content.
 * @param view
 */
export function resetUndoHistory(view: EditorView | undefined, historyCompartment: Compartment) {
  if (!view) return;
  view.dispatch({ effects: historyCompartment.reconfigure([]) }); // Remove history
  view.dispatch({ effects: historyCompartment.reconfigure([history()]) }); // Re-add history
}

/**
 * Handle file selection to load content into editor.
 * @param event
 */
export function handleFileSelect(
  event: Event | undefined,
  view: EditorView | undefined,
  activeFilename: string | undefined,
  oldContent: string,
  historyCompartment: Compartment
) {
  if (!event) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const newContent = e.target?.result as string;
    loadFileContent(view, oldContent, activeFilename, file.name, newContent, historyCompartment);
    if (view) resetUndoHistory(view, historyCompartment);
    setDirty(false);
  };
  reader.readAsText(file);
  input.value = "";
}

/**
 * Updates the editor and state with new file content.
 * This now directly dispatches changes to CodeMirror.
 * @param view
 * @param content
 * @param activeFilename
 * @param fileName
 * @param fileContent
 * @param historyCompartment
 */
export function loadFileContent(
  view: EditorView | undefined,
  content: string,
  activeFilename: string | undefined,
  fileName: string,
  fileContent: string,
  historyCompartment: Compartment
) {
  // update svelte state for preview and other ui elements
  setContent(fileContent);
  setActiveFilename(fileName);
  setDirty(false);

  // directly update the editor view if it exists
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: getContent() },
    });

    resetUndoHistory(view, historyCompartment);
  }
}

/**
 * Clears the editor view content and creates a new document.
 */
export function newFile(view: EditorView | undefined | undefined, onNewFile: () => void, isDirty: boolean) {
  if (isDirty && !confirm("You have unsaved changes. Discard them and create a new file?")) {
    return;
  }

  // reset editor
  onNewFile();
  setActiveFilename(undefined);
  isDirty = false;

  // clear the editor view if it exists
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: "" },
    });
  }
}

/**
 * Reads a Markdown string until it finds an h1 heading. Then it transforms it into a valid filename.
 * @param markdownContent
 * @returns string
 */
export function generateFilename(markdownContent: string): string {
  const headingMatch = markdownContent.match(/^# (.*)/m);
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
 * Reads a Markdown string until it finds an h1 heading. Then it transforms it into a title.
 * @param markdownContent
 * @returns string
 */
export function generateDocumentTitle(markdownContent: string): string {
  const headingMatch = markdownContent.match(/^# (.*)/m);
  let baseName = "Untitled";

  if (headingMatch && headingMatch[1]) {
    baseName = headingMatch[1].trim();
  }

  const sanitizedName = baseName.replace(/\s+/g, " ").replace(/^-+|-+$/g, "");

  return sanitizedName || "Untitled";
}

/**
 * Saves the file.
 */
export async function saveFile(onSave: (content: string) => void, content: string) {
  if (!content) return;
  onSave(content);
  setDirty(false);
}

/**
 * Exports the file.
 */
export async function exportFile(content: string, activeFilename: string | undefined) {
  if (!content && !activeFilename) return; // Don't save empty, untitled files

  // save as
  const baseFilename = activeFilename ?? generateFilename(content);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = baseFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  setActiveFilename(baseFilename);
  setDirty(false);
}
