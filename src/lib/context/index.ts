/**
 * Context Module Index
 *
 * Re-exports all context modules for convenient importing.
 */

// New split editor contexts (recommended)
export {
  EditorStateContext,
  setEditorStateContext,
  getEditorStateContext,
  type EditorMode,
} from "./EditorStateContext.svelte.ts";

export {
  EditorOperationsContext,
  setEditorOperationsContext,
  getEditorOperationsContext,
} from "./EditorOperationsContext.svelte.ts";

// Legacy editor context (deprecated - use split contexts above)
/** @deprecated Use EditorStateContext and EditorOperationsContext instead */
export { EditorContext, setEditorContext, getEditorContext } from "./EditorContext.svelte.ts";

export { LibraryContext, setLibraryContext, getLibraryContext } from "./LibraryContext.svelte.ts";

export { ModalContext, setModalContext, getModalContext, type ModalType } from "./ModalContext.svelte.ts";

export { SettingsContext, setSettingsContext, getSettingsContext } from "./SettingsContext.svelte.ts";

export {
  HotkeyContext,
  setHotkeyContext,
  getHotkeyContext,
  type HotkeyConfig,
  type HotkeyHandler,
  type HotkeyContextOperations,
} from "./HotkeyContext.svelte.ts";

// Re-export error classes for context usage
export { ContextNotFoundError } from "$lib/errors";
