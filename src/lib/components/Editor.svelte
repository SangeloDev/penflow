<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import StatusBar from "./StatusBar.svelte";
  import Preview from "./Preview.svelte";
  import { Splitpanes, Pane } from "svelte-splitpanes";
  // import { marked } from "marked";
  // import DOMPurify from "dompurify";
  import { undo, redo, initHistory, saveToHistory } from "$lib/utils/formatting.js";
  import * as f from "$lib/utils/formattingActions";
  import { toggleHeadingCycle } from "$lib/utils/formatting.js";
  import { hotkey, globalHotkey } from "$lib/utils/hotkeys";
  import { onDestroy, onMount } from "svelte";
  import type { ToolbarItem } from "$lib/types";
  import { Bold, Code, Italic, Link, List, ListOrdered, Quote, Image, Heading, Table } from "lucide-svelte";

  let {
    autosaveId = "my-markdown-editor",
    autosaveDelay = 10000,
    autofocus = true,
    fullscreen = false,
    defaultMode = "edit",
    placeholder = "Write your markdown here...",
    toolbarItems = [],
  }: {
    autosaveId?: string;
    autosaveDelay?: number;
    autofocus?: boolean;
    fullscreen?: boolean;
    defaultMode?: "edit" | "preview" | "side-by-side";
    placeholder?: string;
    toolbarItems?: Array<ToolbarItem>;
  } = $props();

  // States
  let content = $state("");
  let mode = $state<"edit" | "preview" | "side-by-side">(defaultMode);
  let autosaveTimer: number | null = null;
  let isFullscreen = $state(fullscreen);
  let isDirty = $state(false);
  let activeFilename: string | null = $state(null);
  let fileInput: HTMLInputElement;
  let editorPaneSize = $state(50);

  let textareaElement: HTMLTextAreaElement | undefined = $state();
  let previewElement: HTMLDivElement | undefined = $state();
  let ignoreEditorScroll = false;
  let ignorePreviewScroll = false;
  let selectionStart = 0;
  let selectionEnd = 0;
  let lastSplitterClick = 0;

  const doubleClickThreshold = 300; // in ms since last click
  const defaultItems = [
    { id: 0, title: "Bold", icon: Bold, action: () => f.toggleBold(textareaElement) },
    { id: 1, title: "Italic", icon: Italic, action: () => f.toggleItalic(textareaElement) },
    { id: 2, title: "Heading", icon: Heading, action: () => toggleHeadingCycle(textareaElement) },
    { id: 3, title: "List", icon: List, action: () => f.toggleList(textareaElement) },
    { id: 4, title: "Ordered List", icon: ListOrdered, action: () => f.toggleOrderedList(textareaElement) },
    { id: 5, title: "Quote", icon: Quote, action: () => f.toggleQuote(textareaElement) },
    { id: 6, title: "Code", icon: Code, action: () => f.toggleCodeBlock(textareaElement) },
    { id: 7, title: "Link", icon: Link, action: () => f.insertLink(textareaElement) },
    { id: 8, title: "Image", icon: Image, action: () => f.insertImage(textareaElement) },
    { id: 9, title: "Table", icon: Table, action: () => f.insertImage(textareaElement) },
  ];

  const finalToolbarItems = $derived(() => {
    const overridesMap = new Map(toolbarItems.map((item) => [item.id, item]));

    return defaultItems
      .map((defaultItem) => {
        const override = overridesMap.get(defaultItem.id);
        const mergedItem = { ...defaultItem, enabled: true, ...override };
        return mergedItem as ToolbarItem;
      })
      .filter((item) => item.enabled); // filter out items where `enabled` is explicitly `false`.
  });

  // hotkeys
  const globalHotkeys = {
    // "ctrl+shift+f": () => toggleFullscreen(),
    "ctrl+e": () => cycleEditMode(mode),
    "ctrl+shift+e": () => cycleEditMode(mode, false),
    "ctrl+o": () => openFile(),
    "ctrl+s": () => saveFile(),
  };

  const editorHotkeys = {
    "ctrl+z": () => undo(textareaElement),
    "ctrl+y": () => redo(textareaElement),
    "ctrl+shift+z": () => redo(textareaElement),
    "ctrl+b": () => f.toggleBold(textareaElement),
    "ctrl+i": () => f.toggleItalic(textareaElement),
    "ctrl+shift+h": () => toggleHeadingCycle(textareaElement),
    "ctrl+alt+1": () => f.toggleHeading(1, textareaElement),
    "ctrl+alt+2": () => f.toggleHeading(2, textareaElement),
    "ctrl+alt+3": () => f.toggleHeading(3, textareaElement),
    "ctrl+alt+4": () => f.toggleHeading(4, textareaElement),
    "ctrl+alt+5": () => f.toggleHeading(5, textareaElement),
    "ctrl+alt+6": () => f.toggleHeading(6, textareaElement),
    "ctrl+shift+b": () => f.toggleQuote(textareaElement),
    "ctrl+shift+c": () => f.toggleCodeBlock(textareaElement),
    "ctrl+alt+c": () => f.toggleInlineCode(textareaElement),
    "ctrl+l": () => f.toggleList(textareaElement),
    "ctrl+shift+l": () => f.toggleOrderedList(textareaElement),
    "ctrl+k": () => f.insertLink(textareaElement),
    "ctrl+shift+k": () => f.insertImage(textareaElement),
    "ctrl+shift+t": () => f.insertTable(textareaElement),
  };

  // Autosave logic
  $effect(() => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      localStorage.setItem(autosaveId, content);
    }, autosaveDelay);
  });

  // On mount, load autosave
  $effect(() => {
    if (textareaElement) {
      textareaElement.selectionStart = selectionStart;
      textareaElement.selectionEnd = selectionEnd;
      textareaElement.focus();
    }
  });

  $effect(() => {
    if (textareaElement) {
      requestAnimationFrame(() => {
        if (!textareaElement) return;
        const cursorY = getCursorYPosition(textareaElement, selectionStart);
        const desiredScrollTop = cursorY - textareaElement.clientHeight / 2;

        textareaElement.scrollTop = desiredScrollTop;
        textareaElement.selectionStart = selectionStart;
        textareaElement.selectionEnd = selectionEnd;
        textareaElement.focus();
      });
    }
  });

  let documentTitle = $derived(() => {
    const dirtyIndicator = isDirty ? "* " : "";
    let fileName = activeFilename;

    if (!fileName) {
      const generated = generateFilename(content);
      fileName = generated !== "note.md" ? generated : "Untitled";
    }

    return `${dirtyIndicator}${fileName}`;
  });

  /**
   * Creates a sanitized filename from the first H1 heading in the content.
   * Falls back to "note.md" if no heading is found.
   */
  function generateFilename(markdownContent: string): string {
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
  function saveFile() {
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
    isDirty = false;
  }

  /**
   * Updates the editor and state with new file content.
   */
  function loadFileContent(fileContent: string, fileName: string) {
    content = fileContent;
    activeFilename = fileName;
    isDirty = false;
    // After loading new content, re-initialize the history
    if (textareaElement) {
      initHistory(textareaElement);
    }
  }

  /**
   * Handles file selection from the hidden input (fallback method).
   */
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newContent = e.target?.result as string;
      loadFileContent(newContent, file.name);
    };
    reader.readAsText(file);
    input.value = "";
  }

  /**
   * Opens a file dialog using the best available browser API.
   */
  async function openFile() {
    if (isDirty && !confirm("You have unsaved changes. Discard them and open a new file?")) {
      return;
    }

    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown"] } }],
        });
        const file = await fileHandle.getFile();
        const newContent = await file.text();
        loadFileContent(newContent, file.name);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error opening file:", err);
        }
      }
    } else {
      try {
        fileInput.click();
      } catch {
        console.error("Failed to open picker, please interact with the document and try again.");
      }
    }
  }

  // Mode switching
  function setMode(newMode: "edit" | "preview" | "side-by-side") {
    // if the editor is visible, save its cursor/selection state
    if (textareaElement) {
      selectionStart = textareaElement.selectionStart;
      selectionEnd = textareaElement.selectionEnd;
    }
    mode = newMode;
  }

  // function toggleFullscreen() {
  //   isFullscreen = !isFullscreen;
  // }

  function cycleEditMode(currentMode: "edit" | "preview" | "side-by-side", forward = true) {
    if (forward) {
      switch (currentMode) {
        case "edit":
          setMode("side-by-side");
          break;
        case "side-by-side":
          setMode("preview");
          break;
        case "preview":
        default:
          setMode("edit");
          break;
      }
    } else {
      switch (currentMode) {
        case "edit":
          setMode("preview");
          break;
        case "preview":
          setMode("side-by-side");
          break;
        case "side-by-side":
        default:
          setMode("edit");
          break;
      }
    }
  }

  let globalHotkeyCleanup: { destroy: () => void };

  function handleInput() {
    saveToHistory(textareaElement);
  }

  // Autoscroll
  function syncScroll(source: "editor" | "preview") {
    if (!textareaElement || !previewElement) return;

    if (source === "editor") {
      if (ignoreEditorScroll) {
        ignoreEditorScroll = false; // reset and exit
        return;
      }
      ignorePreviewScroll = true;
    } else {
      if (ignorePreviewScroll) {
        ignorePreviewScroll = false; // reset and exit
        return;
      }
      ignoreEditorScroll = true;
    }

    // determine source and target elements based on the argument
    const sourceEl = source === "editor" ? textareaElement : previewElement;
    const targetEl = source === "editor" ? previewElement : textareaElement;

    const sourceScrollableDist = sourceEl.scrollHeight - sourceEl.clientHeight;
    const targetScrollableDist = targetEl.scrollHeight - targetEl.clientHeight;

    if (sourceScrollableDist <= 0) return;

    const scrollRatio = sourceEl.scrollTop / sourceScrollableDist;
    targetEl.scrollTop = scrollRatio * targetScrollableDist;
  }

  /**
   * Calculates the Y-coordinate (in pixels) of the cursor within a textarea.
   * It does this by creating a hidden "mirror" div with the same styles and content.
   */
  function getCursorYPosition(element: HTMLTextAreaElement, cursorPosition: number): number {
    // create a mirror div
    const mirror = document.createElement("div");
    const style = window.getComputedStyle(element);

    // sync all the important styles from the textarea to the mirror
    [
      "font",
      "lineHeight",
      "padding",
      "width",
      "border",
      "letterSpacing",
      "wordSpacing",
      "whiteSpace",
      "wordWrap",
    ].forEach((prop) => {
      mirror.style[prop as any] = style[prop as any];
    });

    // make the mirror invisible and position it off-screen
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "0";
    mirror.style.visibility = "hidden";

    // set the mirror's content to the text before the cursor
    mirror.textContent = element.value.substring(0, cursorPosition);

    // create a marker span to measure its position
    const marker = document.createElement("span");
    // use a zero-width space to ensure the span has height
    marker.textContent = "\u200B";
    mirror.appendChild(marker);

    // append the mirror to the dom to perform the measurement
    document.body.appendChild(mirror);

    // the marker's offsettop is the cursor's y-position
    const cursorY = marker.offsetTop;

    // clean up by removing the mirror from the dom
    document.body.removeChild(mirror);

    return cursorY;
  }

  /**
   * Resets the side-by-side panes to a 50/50 split.
   */
  function resetPanes() {
    editorPaneSize = 50;
  }

  /**
   * Detects a double-click on the splitter and resets the panes.
   */
  function handleSplitterClick() {
    const now = Date.now();
    if (now - lastSplitterClick < doubleClickThreshold) {
      resetPanes();
    }
    lastSplitterClick = now;
  }

  onMount(() => {
    initHistory(textareaElement);
    globalHotkeyCleanup = globalHotkey(globalHotkeys);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Cleanup all listeners
      globalHotkeyCleanup?.destroy();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });
  onDestroy(() => {
    globalHotkeyCleanup?.destroy();
  });
</script>

<svelte:head>
  <title>{documentTitle()} - Penflow</title>
</svelte:head>

<!-- Hidden file input for browsers that don't support the File System Access API -->
<input
  type="file"
  bind:this={fileInput}
  onchange={handleFileSelect}
  style="display: none;"
  accept=".md, .markdown, text/markdown" />

<div
  class:fullscreen={isFullscreen}
  class={`
    flex w-full flex-col rounded-lg bg-white
    ${isFullscreen ? "absolute inset-0 z-50 m-0 min-h-full max-w-full bg-gray-900 shadow-none [&_textarea]:resize-none" : "mx-auto max-h-fit max-w-3xl shadow"}
  `}>
  <Toolbar {mode} onModeChange={setMode} toolbarItems={finalToolbarItems()} />
  <!-- {isFullscreen} -->
  <!-- onFullscreenToggle={toggleFullscreen} -->

  {#if mode === "edit"}
    <!-- svelte-ignore a11y_autofocus -->
    <textarea
      class="min-h-[300px] w-full flex-1 resize-y border-none p-4 font-mono text-sm focus:outline-0"
      bind:value={content}
      use:hotkey={editorHotkeys}
      oninput={handleInput}
      onblur={() => saveToHistory(textareaElement, true)}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") saveToHistory(textareaElement, true);
      }}
      spellcheck="true"
      {placeholder}
      {autofocus}
      bind:this={textareaElement}>
    </textarea>
  {:else if mode === "preview"}
    <div class="flex-1 overflow-auto bg-gray-50 p-4">
      <Preview {content} />
    </div>
  {:else if mode === "side-by-side"}
    <div class="flex flex-1 overflow-hidden">
      <Splitpanes class="default-theme" dblClickSplitter={false} on:splitter-click={handleSplitterClick}>
        <Pane bind:size={editorPaneSize} minSize={20}>
          <!-- svelte-ignore a11y_autofocus -->
          <textarea
            class="bg-base h-full w-full overflow-y-auto border-r border-gray-200 p-4 font-mono text-sm focus:outline-0"
            bind:value={content}
            use:hotkey={editorHotkeys}
            oninput={handleInput}
            onblur={() => saveToHistory(textareaElement, true)}
            spellcheck="true"
            {placeholder}
            {autofocus}
            bind:this={textareaElement}
            onscroll={() => syncScroll("editor")}>
          </textarea>
        </Pane>
        <Pane minSize={20}>
          <div
            class="h-full w-full overflow-y-auto bg-gray-50 p-4"
            bind:this={previewElement}
            onscroll={() => syncScroll("preview")}>
            <Preview {content} />
          </div>
        </Pane>
      </Splitpanes>
    </div>
  {/if}

  <StatusBar {content} />
</div>
