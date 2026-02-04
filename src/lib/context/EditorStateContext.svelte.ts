/**
 * Editor State Context
 *
 * Manages editor UI state including mode, content, and file tracking.
 * This context focuses solely on state management without business logic.
 */

import { getContext, setContext } from "svelte";
import { ContextNotFoundError } from "$lib/errors";

const EDITOR_STATE_CONTEXT_KEY = Symbol("editorState");

/**
 * The EditorMode type. Can be either `edit`, `side-by-side` or `preview`
 */
export type EditorMode = "edit" | "side-by-side" | "preview";

/**
 * Editor state context - purely reactive state
 */
export class EditorStateContext {
  // Editor mode and content
  mode = $state<EditorMode>("edit");
  content = $state<string>("");

  // Active file tracking
  activeFilename = $state<string | undefined>(undefined);
  activeFileId = $state<string | null | undefined>(undefined);

  // Editor state flags
  isDirty = $state<boolean>(false);

  // Modal visibility
  shortcutModalVisible = $state<boolean>(false);
  settingsModalVisible = $state<boolean>(false);

  /**
   * Cycle the edit mode forwards or backwards
   */
  cycleMode(forward = true): void {
    if (forward) {
      switch (this.mode) {
        case "edit":
          this.mode = "side-by-side";
          break;
        case "side-by-side":
          this.mode = "preview";
          break;
        case "preview":
        default:
          this.mode = "edit";
          break;
      }
    } else {
      switch (this.mode) {
        case "edit":
          this.mode = "preview";
          break;
        case "preview":
          this.mode = "side-by-side";
          break;
        case "side-by-side":
        default:
          this.mode = "edit";
          break;
      }
    }
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    this.mode = "edit";
    this.content = "";
    this.activeFilename = undefined;
    this.activeFileId = undefined;
    this.isDirty = false;
    this.shortcutModalVisible = false;
    this.settingsModalVisible = false;
  }
}

/**
 * Set the editor state context
 */
export function setEditorStateContext(): EditorStateContext {
  const context = new EditorStateContext();
  setContext(EDITOR_STATE_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the editor state context
 */
export function getEditorStateContext(): EditorStateContext {
  const context = getContext<EditorStateContext>(EDITOR_STATE_CONTEXT_KEY);
  if (!context) {
    throw new ContextNotFoundError("EditorStateContext");
  }
  return context;
}
