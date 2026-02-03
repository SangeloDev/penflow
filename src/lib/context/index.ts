/**
 * Context Module Index
 *
 * Re-exports all context modules for convenient importing.
 */

export { EditorContext, setEditorContext, getEditorContext, type EditorMode } from "./EditorContext.svelte.ts";

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
