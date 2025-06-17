// src/lib/utils/formattingActions.ts

import { insertAtCursor, redo, toggleBlock, toggleLinePrefix, toggleWrap, undo } from "$lib/utils/formatting.js";

export function toggleBold(textarea: HTMLTextAreaElement | undefined) {
  toggleWrap("**", textarea);
}

export function toggleItalic(textarea: HTMLTextAreaElement | undefined) {
  toggleWrap("*", textarea);
}

export function toggleHeading(level = 1, textarea: HTMLTextAreaElement | undefined) {
  toggleLinePrefix("#".repeat(level) + " ", textarea);
}

export function toggleQuote(textarea: HTMLTextAreaElement | undefined) {
  toggleLinePrefix("> ", textarea);
}

export function toggleInlineCode(textarea: HTMLTextAreaElement | undefined) {
  toggleWrap("`", textarea);
}

export function toggleCodeBlock(textarea: HTMLTextAreaElement | undefined) {
  toggleBlock("```", "```", textarea);
}

export function toggleList(textarea: HTMLTextAreaElement | undefined) {
  toggleLinePrefix("- ", textarea);
}

export function toggleOrderedList(textarea: HTMLTextAreaElement | undefined) {
  toggleLinePrefix("1. ", textarea);
}

export function insertLink(textarea: HTMLTextAreaElement | undefined) {
  insertAtCursor("[Link text](https://example.com)", textarea);
}

export function insertImage(textarea: HTMLTextAreaElement | undefined) {
  insertAtCursor("![Alt text](https://example.com/image.png)", textarea);
}

export function insertTable(textarea: HTMLTextAreaElement | undefined) {
  insertAtCursor("| Header 1 | Header 2 |\n| -------- | -------- |\n|  Cell 1  |  Cell 2  |\n", textarea);
}

export { undo, redo };
