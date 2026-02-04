/**
 * useLibrary Composable
 *
 * Simplified composable that provides direct access to library context.
 * Provides convenient component usage without unnecessary abstraction layers.
 */

import { getLibraryContext } from "$lib/context";

/**
 * Library composable - provides direct access to library context
 *
 * @example
 * ```typescript
 * const library = useLibrary();
 *
 * // Access context directly
 * const files = library.files;
 * library.createFile(content, title, tags);
 * library.deleteFile(fileId);
 *
 * // All reactive state and operations are available directly
 * ```
 */
export function useLibrary() {
  const library = getLibraryContext();

  return library;
}
