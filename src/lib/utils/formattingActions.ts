// src/lib/utils/formattingActions.ts

import type { EditorView } from "@codemirror/view";
import {
  insertAtCursor,
  toggleBlock,
  toggleLinePrefix,
  toggleWrap,
  undo as cmUndo,
  redo as cmRedo,
} from "$lib/utils/formatting";

// a helper to ensure the view exists before running an action
function run(view: EditorView | undefined, action: (v: EditorView) => void) {
  if (view) {
    action(view);
  }
}

export function toggleBold(view: EditorView | undefined) {
  run(view, (v) => toggleWrap(v, "**"));
}

export function toggleItalic(view: EditorView | undefined) {
  run(view, (v) => toggleWrap(v, "*"));
}

export function toggleHeading(level = 1, view: EditorView | undefined) {
  run(view, (v) => toggleLinePrefix("#".repeat(level) + " ", v));
}

export function toggleQuote(view: EditorView | undefined) {
  run(view, (v) => toggleLinePrefix("> ", v));
}

export function toggleInlineCode(view: EditorView | undefined) {
  run(view, (v) => toggleWrap(v, "`"));
}

export function toggleCodeBlock(view: EditorView | undefined) {
  run(view, (v) => toggleBlock("```", "```", v));
}

export function toggleList(view: EditorView | undefined) {
  run(view, (v) => toggleLinePrefix("- ", v));
}

export function toggleOrderedList(view: EditorView | undefined) {
  run(view, (v) => toggleLinePrefix("1.", v));
}

export function toggleCheckList(view: EditorView | undefined) {
  run(view, (v) => toggleLinePrefix("- [ ] ", v));
}

export function wrapLink(view: EditorView | undefined) {
  run(view, (v) => toggleWrap(v, "[", "](https://)"));
}

export function wrapImage(view: EditorView | undefined) {
  run(view, (v) => toggleWrap(v, "![", "](https://)"));
}

export function insertTable(view: EditorView | undefined) {
  run(view, (v) => insertAtCursor("| Header 1 | Header 2 |\n| -------- | -------- |\n|  Cell 1  |  Cell 2  |\n", v));
}

// wrappers for codemirror's history commands
export function undo(view: EditorView | undefined) {
  if (view) cmUndo(view);
}

export function redo(view: EditorView | undefined) {
  if (view) cmRedo(view);
}