import { history } from "@codemirror/commands";
import type { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * The EditorMode type. Can be either `edit`, `side-by-side` or `preview`
 */
export type EditorMode = "edit" | "side-by-side" | "preview";

let mode: EditorMode = $state("edit");
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
  content = fileContent;
  activeFilename = fileName;
  setDirty(false);

  // directly update the editor view if it exists
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: fileContent },
    });

    resetUndoHistory(view, historyCompartment);
  }
}

/**
 * Clears the editor view and removes autosaved
 * content. Essentially, this creates a new document.
 */
export function newFile(
  view: EditorView | undefined | undefined,
  content: string,
  autosaveId: string,
  activeFilename: string | undefined | null,
  isDirty: boolean
) {
  if (isDirty && !confirm("You have unsaved changes. Discard them and create a new file?")) {
    return;
  }

  // remove from localStorage if autosaveId is set
  if (autosaveId) {
    localStorage.removeItem(autosaveId);
  }

  // reset editor
  content = "";
  activeFilename = null;
  isDirty = false;

  // clear the editor view if it exists
  if (view) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: "" },
    });
  }

  setMode("edit");
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
 * Prompts the user to download the current editor content.
 */
export function saveFile(content: string, activeFilename: string | undefined) {
  if (!content && !activeFilename) return; // Don't save empty, untitled files
  const filename = activeFilename ?? generateFilename(content);
  const blob = new Blob([content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  activeFilename = filename;
  setDirty(false);
}
