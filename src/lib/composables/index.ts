/**
 * Composables Module Index
 *
 * Composables provide convenient access to contexts for component usage.
 *
 * These are simplified wrappers that primarily expose context instances directly,
 * avoiding unnecessary abstraction layers. They exist to:
 * 1. Provide a familiar composable API pattern
 * 2. Combine related contexts for convenience
 * 3. Offer helpful shortcuts for common operations
 *
 * @example
 * ```typescript
 * // In a component
 * const editor = useEditor();
 *
 * // Access state directly
 * editor.state.mode = "preview";
 * editor.state.content = "Hello";
 *
 * // Call operations
 * await editor.operations.saveFile(onSave);
 *
 * // Or use convenience shortcuts
 * await editor.saveFile(onSave);
 * ```
 *
 * Note: You can also use contexts directly if you prefer:
 * ```typescript
 * import { getEditorStateContext } from "$lib/context";
 * const state = getEditorStateContext();
 * ```
 */

export { useLibrary } from "./useLibrary.svelte";
export { useEditor } from "./useEditor.svelte";
export { useFileSystem } from "./useFileSystem.svelte";
export { usePersistence } from "./usePersistence.svelte";
