import { error } from "@sveltejs/kit";

export type HistoryEntry = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export let history: HistoryEntry[] = [];
export let historyIndex = -1;
export const historySaveDelay = 700;

let historySaveTimeout: ReturnType<typeof setTimeout> | null = null;

function _applyHistoryEntry(entry: HistoryEntry, textareaElement: HTMLTextAreaElement) {
  textareaElement.value = entry.value;
  textareaElement.selectionStart = entry.selectionStart;
  textareaElement.selectionEnd = entry.selectionEnd;
  textareaElement.focus();
  textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
}

function _pushToHistory(textareaElement: HTMLTextAreaElement | undefined) {
  if (!textareaElement) throw error(500, "textareaElement is undefined");

  const newEntry: HistoryEntry = {
    value: textareaElement.value,
    selectionStart: textareaElement.selectionStart,
    selectionEnd: textareaElement.selectionEnd,
  };

  const lastEntry = history[historyIndex];

  if (
    lastEntry &&
    lastEntry.value === newEntry.value &&
    lastEntry.selectionStart === newEntry.selectionStart &&
    lastEntry.selectionEnd === newEntry.selectionEnd
  ) {
    return;
  }

  history = history.slice(0, historyIndex + 1);
  history.push(newEntry);
  historyIndex++;
}

export function saveToHistory(textareaElement: HTMLTextAreaElement | undefined, immediate = false) {
  if (historySaveTimeout) {
    clearTimeout(historySaveTimeout);
    historySaveTimeout = null;
  }

  if (immediate) {
    _pushToHistory(textareaElement);
  } else {
    historySaveTimeout = setTimeout(() => {
      _pushToHistory(textareaElement);
    }, historySaveDelay);
  }
}

export function initHistory(textareaElement: HTMLTextAreaElement | undefined) {
  _pushToHistory(textareaElement);
}

export function undo(textareaElement: HTMLTextAreaElement | undefined) {
  if (!textareaElement) throw error(500, "textareaElement is undefined");

  if (historyIndex > 0) {
    historyIndex--;
    _applyHistoryEntry(history[historyIndex], textareaElement);
  }
}

export function redo(textareaElement: HTMLTextAreaElement | undefined) {
  if (!textareaElement) throw error(500, "textareaElement is undefined");

  if (historyIndex < history.length - 1) {
    historyIndex++;
    _applyHistoryEntry(history[historyIndex], textareaElement);
  }
}

// **Clean wrapper function that handles history and reactivity**
function executeFormatAction(
  textareaElement: HTMLTextAreaElement | undefined,
  action: (element: HTMLTextAreaElement) => void
) {
  if (!textareaElement) throw error(500, "textareaElement is undefined");

  // Save current state for undo
  saveToHistory(textareaElement, true);

  // Execute the formatting action
  action(textareaElement);

  // Trigger Svelte reactivity
  textareaElement.dispatchEvent(new Event("input", { bubbles: true }));
}

// **Simplified formatting functions - pure logic only**
export function insertAtCursor(text: string, textareaElement: HTMLTextAreaElement | undefined) {
  executeFormatAction(textareaElement, (element) => {
    const [start, end] = [element.selectionStart, element.selectionEnd];
    element.setRangeText(text, start, end, "end");
  });
}

export function toggleWrap(wrapper: string, textareaElement: HTMLTextAreaElement | undefined) {
  executeFormatAction(textareaElement, (element) => {
    const [start, end] = [element.selectionStart, element.selectionEnd];
    const selected = element.value.slice(start, end);

    let newText: string;
    let newStart = start,
      newEnd = end;

    if (selected.startsWith(wrapper) && selected.endsWith(wrapper) && selected.length >= 2 * wrapper.length) {
      newText = selected.slice(wrapper.length, -wrapper.length);
      newEnd = start + newText.length;
    } else {
      newText = wrapper + selected + wrapper;
      newStart = start + wrapper.length;
      newEnd = end + wrapper.length;
    }

    element.setRangeText(newText, start, end, "select");
    element.selectionStart = newStart;
    element.selectionEnd = newEnd;
  });
}

export function toggleBlock(startMarker: string, endMarker: string, textareaElement: HTMLTextAreaElement | undefined) {
  executeFormatAction(textareaElement, (element) => {
    const [start, end] = [element.selectionStart, element.selectionEnd];
    const selected = element.value.slice(start, end);

    const blockStart = startMarker + "\n";
    const blockEnd = "\n" + endMarker;

    let newText: string;
    let newStart = start,
      newEnd = end;

    if (selected.startsWith(blockStart) && selected.endsWith(blockEnd)) {
      newText = selected.slice(blockStart.length, -blockEnd.length);
      newEnd = start + newText.length;
    } else {
      newText = blockStart + selected + blockEnd;
      newStart = start + blockStart.length;
      newEnd = end + blockStart.length;
    }

    element.setRangeText(newText, start, end, "select");
    element.selectionStart = newStart;
    element.selectionEnd = newEnd;
    element.focus();
  });
}

export function toggleLinePrefix(prefix: string, textareaElement: HTMLTextAreaElement | undefined) {
  executeFormatAction(textareaElement, (element) => {
    const [start, end] = [element.selectionStart, element.selectionEnd];
    const value = element.value;
    const selection = value.slice(start, end);

    const lines = selection.split("\n");
    const allHavePrefix = lines.every((line) => line.startsWith(prefix));
    const newLines = allHavePrefix
      ? lines.map((line) => line.replace(new RegExp("^" + prefix), ""))
      : lines.map((line) => prefix + line);

    const newSelection = newLines.join("\n");
    element.setRangeText(newSelection, start, end, "select");
    element.selectionStart = start;
    element.selectionEnd = start + newSelection.length;
  });
}

export function toggleHeadingCycle(textareaElement: HTMLTextAreaElement | undefined) {
  executeFormatAction(textareaElement, (element) => {
    const { value, selectionStart } = element;

    const lineStartIndex = value.lastIndexOf("\n", selectionStart - 1) + 1;
    let lineEndIndex = value.indexOf("\n", selectionStart);
    if (lineEndIndex === -1) {
      lineEndIndex = value.length;
    }

    const currentLine = value.substring(lineStartIndex, lineEndIndex);

    // use a regex to find an existing heading prefix (e.g., "### ")
    const headingRegex = /^(#{1,6})\s/;
    const match = currentLine.match(headingRegex);

    let currentLevel = 0;
    let contentWithoutPrefix = currentLine;

    if (match) {
      currentLevel = match[1].length;
      contentWithoutPrefix = currentLine.substring(match[0].length);
    }

    // cycle to the next level: 0 -> 1 -> 2 -> ... -> 6 -> 0
    const nextLevel = (currentLevel + 1) % 7;

    let newLine: string;
    if (nextLevel === 0) {
      newLine = contentWithoutPrefix;
    } else {
      const newPrefix = "#".repeat(nextLevel) + " ";
      newLine = newPrefix + contentWithoutPrefix;
    }

    element.setRangeText(newLine, lineStartIndex, lineEndIndex, "select");
  });
}
