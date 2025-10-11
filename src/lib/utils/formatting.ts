// src/lib/utils/formatting.ts

import type { EditorView } from "@codemirror/view";
import type { ChangeSpec, TransactionSpec } from "@codemirror/state";
import { undo, redo } from "@codemirror/commands";

/**
 * A wrapper function to apply formatting actions to a CodeMirror view.
 * It handles the transaction dispatch and focuses the editor.
 * @param view The CodeMirror EditorView instance.
 * @param action A function that returns the changes to be applied.
 */
function executeFormatAction(view: EditorView, action: (view: EditorView) => ChangeSpec | { changes: ChangeSpec }) {
  const changes = action(view);
  if (changes) {
    view.dispatch(view.state.update(changes as TransactionSpec));
  }
  view.focus();
}

/**
 * Inserts text at the current cursor position or over the current selection.
 * @param text The text to insert.
 * @param view The CodeMirror EditorView instance.
 */
export function insertAtCursor(text: string, view: EditorView) {
  view.dispatch(view.state.replaceSelection(text));
}

/**
 * Toggles wrapping the selected text with a given marker (e.g., "**" for bold).
 * If the text is already wrapped, it unwraps it.
 * @param wrapper The string to wrap the selection with (e.g., "*", "**", "`").
 * @param view The CodeMirror EditorView instance.
 */
export function toggleWrap(view: EditorView, wrapper: string, endWrapper?: string) {
  executeFormatAction(view, () => {
    return view.state.changeByRange((range) => {
      const text = view.state.sliceDoc(range.from, range.to);
      const isWrapped = text.startsWith(wrapper) && text.endsWith(wrapper);

      if (isWrapped) {
        // unwrap the text
        const newText = text.slice(wrapper.length, text.length - wrapper.length);
        return {
          changes: { from: range.from, to: range.to, insert: newText },
          range: range.extend(range.from, range.to - 2 * wrapper.length),
        };
      } else {
        // wrap the text
        const newText = `${wrapper}${text}${endWrapper || wrapper}`;
        return {
          changes: { from: range.from, to: range.to, insert: newText },
          range: range.extend(range.from, range.to + 2 * wrapper.length),
        };
      }
    });
  });
}

/**
 * Toggles a multi-line block with start and end markers (e.g., "```").
 * @param startMarker The starting marker for the block.
 * @param endMarker The ending marker for the block.
 * @param view The CodeMirror EditorView instance.
 */
export function toggleBlock(startMarker: string, endMarker: string, view: EditorView) {
  const blockStart = startMarker + "\n";
  const blockEnd = "\n" + endMarker;
  toggleWrap(view, blockStart, blockEnd); // a simplified approach using toggleWrap
}

/**
 * Adds or removes a prefix for each line in the selection.
 * @param prefix The prefix to toggle (e.g., "> ", "- ").
 * @param view The CodeMirror EditorView instance.
 */
export function toggleLinePrefix(prefix: string, view: EditorView) {
  executeFormatAction(view, () => {
    const changes: ChangeSpec[] = [];
    const { from, to } = view.state.selection.main;
    const startLine = view.state.doc.lineAt(from);
    const endLine = view.state.doc.lineAt(to);

    const lines: string[] = [];
    for (let i = startLine.number; i <= endLine.number; i++) {
      lines.push(view.state.doc.line(i).text);
    }

    const allHavePrefix = lines.every((line) => line.startsWith(prefix) || line.length === 0);

    for (let i = startLine.number; i <= endLine.number; i++) {
      const line = view.state.doc.line(i);
      if (line.length === 0) continue;

      if (allHavePrefix) {
        changes.push({
          from: line.from,
          to: line.from + prefix.length,
          insert: "",
        });
      } else if (!line.text.startsWith(prefix)) {
        changes.push({ from: line.from, insert: prefix });
      }
    }
    return { changes };
  });
}

/**
 * Cycles the heading level of the current line from H1 to H6 and then to plain text.
 * @param view The CodeMirror EditorView instance.
 */
export function toggleHeadingCycle(view: EditorView | undefined) {
  if (!view) return;
  executeFormatAction(view, () => {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const headingRegex = /^(#{1,6})\s/;
    const match = line.text.match(headingRegex);

    let currentLevel = 0;
    let contentWithoutPrefix = line.text;

    if (match) {
      currentLevel = match[1].length;
      contentWithoutPrefix = line.text.substring(match[0].length);
    }

    const nextLevel = (currentLevel + 1) % 7;
    let newLine;

    if (nextLevel === 0) {
      newLine = contentWithoutPrefix;
    } else {
      const newPrefix = "#".repeat(nextLevel) + " ";
      newLine = newPrefix + contentWithoutPrefix;
    }

    return {
      changes: { from: line.from, to: line.to, insert: newLine },
    };
  });
}

// re-export codemirror's history commands
export { undo, redo };
