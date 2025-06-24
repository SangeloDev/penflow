<script module>
  import emojiList from "../json/emoji.json";
</script>

<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import StatusBar from "./StatusBar.svelte";
  import Preview from "./Preview.svelte";
  import { Splitpanes, Pane } from "svelte-splitpanes";
  // import { marked } from "marked";
  // import DOMPurify from "dompurify";
  // import { undo, redo, initHistory, saveToHistory } from "$lib/utils/formatting.js";
  import * as f from "$lib/utils/formattingActions";
  import { toggleHeadingCycle } from "$lib/utils/formatting.js";
  import {
    globalHotkey,
    editorKeymap,
    constructedGlobalHotkeys,
    createGlobalHotkeys,
    type HotkeyContext,
  } from "$lib/utils/hotkeys";
  import {
    type EditorMode,
    getDirtyness,
    getMode,
    setDirty,
    setMode,
    loadFileContent,
    generateFilename,
    handleFileSelect,
    cycleEditMode,
    saveFile,
    newFile,
    getContent,
    setContent,
    getShortcutModalVisibility,
    setShortcutModalVisibility,
    getActiveFilename,
  } from "./Editor.svelte.ts";
  import { onDestroy, onMount, untrack } from "svelte";
  import type { ToolbarItem } from "$lib/types";
  import {
    Bold,
    Code,
    Italic,
    Link,
    List,
    ListOrdered,
    Quote,
    Image,
    Heading,
    Table,
    CheckSquare,
  } from "lucide-svelte";

  // codemirror imports
  import {
    EditorView,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    placeholder as placeholderExtension,
    keymap,
  } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { Prec } from "@codemirror/state";
  import { languages } from "@codemirror/language-data";
  import { markdown as markdownExt, markdownLanguage } from "@codemirror/lang-markdown";
  import { defaultKeymap, history } from "@codemirror/commands";
  import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { closeBrackets, autocompletion, CompletionContext } from "@codemirror/autocomplete";
  import { highlightSelectionMatches } from "@codemirror/search";
  import { tags as t } from "@lezer/highlight";
  import twemoji from "@twemoji/api";
  import { createTheme, tomorrow } from "thememirror";
  import "../../styles/codemirror.css";

  let {
    autosaveId = "my-markdown-editor",
    autosaveDelay = 10000,
    autofocus = true,
    fullscreen = false,
    defaultMode = "side-by-side",
    placeholder = "Write your markdown here...",
    toolbarItems = [],
    shortcutModalVisible = $bindable(getShortcutModalVisibility()),
  }: {
    autosaveId?: string;
    autosaveDelay?: number;
    autofocus?: boolean;
    fullscreen?: boolean;
    defaultMode?: EditorMode;
    placeholder?: string;
    toolbarItems?: Array<ToolbarItem>;
    shortcutModalVisible?: boolean;
  } = $props();

  // States
  let content = $derived(getContent());
  let mode = $derived(getMode());
  let autosaveTimer: number | null = null;
  let isFullscreen = $state(fullscreen);
  let isDirty = $derived(getDirtyness());
  let activeFilename: string | undefined = $state(getActiveFilename());
  let fileInput: HTMLInputElement;
  let editorPaneSize = $state(50);

  // codemirror
  let editorView: EditorView | undefined = $state();
  let editorContainer: HTMLDivElement | undefined = $state();
  const historyCompartment = new Compartment();

  // panes
  let previewElement: HTMLDivElement | undefined = $state();
  let ignoreEditorScroll = false;
  let ignorePreviewScroll = false;
  let lastSplitterClick = 0;

  const doubleClickThreshold = 300; // in ms since last click
  const defaultItems = [
    { id: 0, title: "Bold", icon: Bold, action: () => f.toggleBold(editorView) },
    { id: 1, title: "Italic", icon: Italic, action: () => f.toggleItalic(editorView) },
    { id: 2, title: "Heading", icon: Heading, action: () => toggleHeadingCycle(editorView) },
    { id: 3, title: "List", icon: List, action: () => f.toggleList(editorView) },
    { id: 4, title: "Ordered List", icon: ListOrdered, action: () => f.toggleOrderedList(editorView) },
    { id: 10, title: "Checklist", icon: CheckSquare, action: () => f.toggleCheckList(editorView) },
    { id: 5, title: "Quote", icon: Quote, action: () => f.toggleQuote(editorView) },
    { id: 6, title: "Code", icon: Code, action: () => f.toggleCodeBlock(editorView) },
    { id: 7, title: "Link", icon: Link, action: () => f.wrapLink(editorView) },
    { id: 8, title: "Image", icon: Image, action: () => f.wrapImage(editorView) },
    { id: 9, title: "Table", icon: Table, action: () => f.insertTable(editorView) },
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

  const getView = () => {
    return editorView;
  };

  // hotkeys
  const hotkeyContext: HotkeyContext = {
    setShortcutModalVisibility,
    getMode,
    cycleEditMode: cycleEditMode,
    saveFile: () => saveFile(content, getActiveFilename()),
    openFile: () => openFile(editorView, isDirty, content, documentTitle(), historyCompartment),
    newFile: () => newFile(editorView, content, autosaveId, getActiveFilename(), getDirtyness()),
    content: getContent(),
    activeFilename: getActiveFilename(),
    autosaveId,
    view: getView(),
    getDirtyness,
  };

  const hotkeys = createGlobalHotkeys(hotkeyContext);
  const globalHotkeys = constructedGlobalHotkeys(hotkeys);

  const tomorrowMarkdown = createTheme({
    variant: "light",
    settings: {
      background: "#FFFFFF",
      foreground: "#4D4D4C",
      caret: "#AEAFAD",
      selection: "#D6D6D6",
      gutterBackground: "#FFFFFF",
      gutterForeground: "#4D4D4C80",
      lineHighlight: "#EFEFEF",
    },
    styles: [
      { tag: t.heading1, color: "#4271AE", fontWeight: "bold" },
      { tag: t.heading2, color: "#4271AE", fontWeight: "bold" },
      { tag: t.heading3, color: "#4271AE", fontWeight: "bold" },
      { tag: t.heading4, color: "#4271AE", fontWeight: "bold" },
      { tag: t.heading5, color: "#4271AE", fontWeight: "bold" },
      { tag: t.heading6, color: "#4271AE", fontWeight: "bold" },
      { tag: t.emphasis, fontStyle: "italic" },
      { tag: t.strong, fontWeight: "bold" },
      { tag: t.strikethrough, textDecoration: "line-through" },
      { tag: t.quote, fontStyle: "italic" },
      { tag: t.link, color: "#4271AE" },
    ],
  });

  function updateEditorContent(newContent: string) {
    if (!editorView) return;

    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newContent,
      },
    });

    setContent(newContent);
    setDirty(true);
  }

  // set the default mode
  setMode(defaultMode);

  // codemirror setup effect
  $effect(() => {
    if (!editorContainer) return;

    const state = EditorState.create({
      doc: untrack(() => content),
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        historyCompartment.of(history()),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        markdownExt({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        placeholderExtension(placeholder),
        autocompletion({ override: [emojiCompletionSource] }),
        Prec.highest(editorKeymap),
        Prec.default(keymap.of(defaultKeymap)),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setContent(update.state.doc.toString());
            setDirty(true);
          }
        }),
        tomorrow,
        tomorrowMarkdown,
        EditorView.theme({}, { dark: false }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainer,
    });

    editorView = view;

    // add class if in side-by-side mode
    if (mode === "side-by-side") {
      view.scrollDOM.classList.add("side-by-side");
    }

    // ensure autofocus
    if (autofocus) {
      view.focus();
    }

    return () => {
      view.destroy();
      editorView = undefined;
    };
  });

  // sync scroll listener
  $effect(() => {
    if (editorView && mode === "side-by-side") {
      const listener = () => syncScroll("editor");
      editorView.scrollDOM.addEventListener("scroll", listener, { passive: true });
      return () => editorView?.scrollDOM.removeEventListener("scroll", listener);
    }
  });

  // timer for autosave
  $effect(() => {
    if (autosaveTimer) {
      // clean up any previous timer
      clearInterval(autosaveTimer);
    }
    if (autosaveDelay > 0) {
      autosaveTimer = setInterval(() => {
        if (isDirty) {
          saveToLocalStorage();
        }
      }, autosaveDelay);
    }
    return () => {
      if (autosaveTimer) clearInterval(autosaveTimer);
    };
  });

  function emojiCompletionSource(context: CompletionContext) {
    // match a ':' followed by at least two word characters
    let word = context.matchBefore(/:\w+$/);
    if (!word || (word.from == word.to && !context.explicit)) return null;

    // Filter emoji list by shortcode or name
    let query = word.text; //.slice(1); // Remove ':'

    let options = emojiList.emojis
      .filter((e) => e.shortname.startsWith(query))
      .map((e) => ({
        label: `${e.shortname}`,
        type: "emoji",
        detail: e.emoji,
        render: (element: HTMLElement) => {
          element.innerHTML = twemoji.parse(e.emoji);
          element.appendChild(document.createTextNode(` ${e.shortname}`));
        },
        apply: e.shortname,
      }));

    return {
      from: word.from,
      options,
    };
  }

  async function openFile(
    view: EditorView | undefined,
    dirtyness: boolean,
    oldContent: string,
    activeFilename: string | undefined,
    historyCompartment: Compartment
  ) {
    if (dirtyness && !confirm("You have unsaved changes. Discard them and open a new file?")) {
      return;
    }

    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{ description: "Markdown", accept: { "text/markdown": [".md", ".markdown"] } }],
        });
        const file = await fileHandle.getFile();
        const newContent = await file.text();
        loadFileContent(view, oldContent, activeFilename, file.name, newContent, historyCompartment);
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

  // autosave
  function saveToLocalStorage() {
    if (!autosaveId) return;
    localStorage.setItem(
      autosaveId,
      JSON.stringify({
        content,
        activeFilename,
        timestamp: Date.now(),
      })
    );
  }

  // load content from localStorage (optional, e.g. on mount)
  function loadFromLocalStorage() {
    if (!autosaveId) return;
    const data = localStorage.getItem(autosaveId);
    if (data) {
      try {
        const { content: savedContent, activeFilename: savedFilename } = JSON.parse(data);
        loadFileContent(
          editorView,
          content,
          activeFilename,
          savedFilename ?? documentTitle(),
          savedContent,
          historyCompartment
        );
      } catch (err) {
        console.error("error loading file content from localStorage: ", err);
      }
    }
  }

  let documentTitle = $derived(() => {
    const dirtyIndicator = isDirty ? "• " : "";
    let fileName = getActiveFilename();

    if (!fileName) {
      const generated = generateFilename(content);
      fileName = generated !== "note.md" ? generated : "Untitled";
    }

    return `${dirtyIndicator}${fileName}`;
  });

  let globalHotkeyCleanup: { destroy: () => void };

  // Autoscroll
  function syncScroll(source: "editor" | "preview") {
    if (!editorView || !previewElement) return;

    const sourceEl = source === "editor" ? editorView.scrollDOM : previewElement;
    const targetEl = source === "editor" ? previewElement : editorView.scrollDOM;

    if (source === "editor") {
      if (ignoreEditorScroll) {
        ignoreEditorScroll = false;
        return;
      }
      ignorePreviewScroll = true;
    } else {
      if (ignorePreviewScroll) {
        ignorePreviewScroll = false;
        return;
      }
      ignoreEditorScroll = true;
    }

    const sourceScrollableDist = sourceEl.scrollHeight - sourceEl.clientHeight;
    const targetScrollableDist = targetEl.scrollHeight - targetEl.clientHeight;

    if (sourceScrollableDist <= 0) return;

    const scrollRatio = sourceEl.scrollTop / sourceScrollableDist;
    targetEl.scrollTop = scrollRatio * targetScrollableDist;
  }

  function resetPanes() {
    editorPaneSize = 50;
  }

  function handleSplitterClick() {
    const now = Date.now();
    if (now - lastSplitterClick < doubleClickThreshold) {
      resetPanes();
    }
    lastSplitterClick = now;
  }

  onMount(() => {
    loadFromLocalStorage(); // load from local storage

    globalHotkeyCleanup = globalHotkey(globalHotkeys);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      globalHotkeyCleanup?.destroy();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  onDestroy(() => {
    globalHotkeyCleanup?.destroy();
    editorView?.destroy();
  });
</script>

<svelte:head>
  <title>{documentTitle()} - Penflow</title>
</svelte:head>

<input
  type="file"
  bind:this={fileInput}
  onchange={() => handleFileSelect(event, editorView, activeFilename, content, historyCompartment)}
  style="display: none;"
  accept=".md, .markdown, text/markdown" />

<div
  class:fullscreen={isFullscreen}
  class={`
    flex w-full flex-col rounded-lg bg-white
    ${isFullscreen ? "absolute inset-0 z-50 m-0 min-h-full max-w-full bg-gray-900 shadow-none" : "mx-auto max-h-fit max-w-3xl shadow"}
  `}>
  <Toolbar {mode} onModeChange={setMode} toolbarItems={finalToolbarItems()} />

  {#if mode === "edit"}
    <div class="bg-base min-h-[300px] w-full flex-1" bind:this={editorContainer}></div>
  {:else if mode === "preview"}
    <div class="flex flex-1 justify-center overflow-y-auto bg-gray-50 p-4">
      <div class="w-full md:w-[90ch] lg:w-[90ch]">
        <Preview {content} onContentChange={updateEditorContent} />
      </div>
    </div>
  {:else if mode === "side-by-side"}
    <div class="flex flex-1 overflow-hidden">
      <Splitpanes class="default-theme" dblClickSplitter={false} on:splitter-click={handleSplitterClick}>
        <Pane bind:size={editorPaneSize} minSize={20}>
          <div class="bg-base h-full w-full" bind:this={editorContainer}></div>
        </Pane>
        <Pane minSize={20}>
          <div
            class="h-full w-full overflow-y-auto bg-gray-50 p-4"
            bind:this={previewElement}
            onscroll={() => syncScroll("preview")}>
            <Preview {content} onContentChange={updateEditorContent} />
          </div>
        </Pane>
      </Splitpanes>
    </div>
  {/if}

  <StatusBar {content} bind:shortcutModalVisible />
</div>
