<script module>
  import emojiList from "../data/emoji.json";
</script>

<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import StatusBar from "./StatusBar.svelte";
  import Preview from "./Preview.svelte";
  import { Splitpanes, Pane } from "svelte-splitpanes";
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
    getSettingsModalVisibility,
    setSettingsModalVisibility,
    getActiveFilename,
    setActiveFileHandle,
    getActiveFileHandle,
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
  import { welcome } from "../data/welcome";

  // codemirror imports
  import {
    EditorView,
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
    placeholder as placeholderExtension,
    keymap,
  } from "@codemirror/view";
  import { Prec, EditorState, Compartment } from "@codemirror/state";
  import { languages } from "@codemirror/language-data";
  import { markdown as markdownExt, markdownLanguage } from "@codemirror/lang-markdown";
  import { defaultKeymap, history } from "@codemirror/commands";
  import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { closeBrackets, autocompletion, CompletionContext } from "@codemirror/autocomplete";
  import { highlightSelectionMatches } from "@codemirror/search";
  import twemoji from "@twemoji/api";
  import { darkThemes, lightThemes } from "$lib/codemirror/themes.ts";
  import { mode as uiTheme } from "mode-watcher";
  import "../../styles/codemirror.css";
  import "../../styles/splitpanes.css";
  import { getFirstVisit, setFirstVisit } from "./modals/Settings.svelte.ts";

  let {
    autosaveId = "my-markdown-editor",
    autosaveDelay = 10000,
    autofocus = true,
    fullscreen = false,
    defaultMode = "side-by-side",
    placeholder = "Write your markdown here...",
    toolbarItems = [],
    shortcutModalVisible = $bindable(getShortcutModalVisibility()),
    settingsModalVisible = $bindable(getSettingsModalVisibility()),
  }: {
    autosaveId?: string;
    autosaveDelay?: number;
    autofocus?: boolean;
    fullscreen?: boolean;
    defaultMode?: EditorMode;
    placeholder?: string;
    toolbarItems?: Array<ToolbarItem>;
    shortcutModalVisible?: boolean;
    settingsModalVisible?: boolean;
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
  let isWelcomeMessageActive = $state(false);
  let firstVisit = getFirstVisit();

  // codemirror
  let editorView: EditorView | undefined = $state();
  let editorContainer: HTMLDivElement | undefined = $state();
  const historyCompartment = new Compartment();
  const themeCompartment = new Compartment();

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
    setSettingsModalVisibility,
    setShortcutModalVisibility,
    getMode,
    cycleEditMode: cycleEditMode,
    saveFile: () => saveFile(content, getActiveFilename(), getActiveFileHandle()),
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

  // check if this is the first visit or not
  const isFirstVisit = typeof window !== "undefined" && firstVisit === "false";
  if (isFirstVisit) {
    // first time user content.
    setContent(welcome.text);
    // set flag in localStorage to ensure this block only runs once.
    setFirstVisit("true");
    isWelcomeMessageActive = true;
  }

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
            // activate message saving on edit
            if (isWelcomeMessageActive) {
              isWelcomeMessageActive = false;
            }
          }
        }),
        themeCompartment.of(lightThemes),
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

  // codemirror theme effect
  $effect(() => {
    if (!editorView) return; // Ensure the editor view is initialized

    const isDark = uiTheme.current === "dark";
    editorView.dispatch({
      effects: themeCompartment.reconfigure(isDark ? darkThemes : lightThemes),
    });
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
        if (isDirty && !isWelcomeMessageActive) {
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
        setActiveFileHandle(fileHandle);
        const file = await fileHandle.getFile();
        const newContent = await file.text();
        loadFileContent(view, oldContent, activeFilename, file.name, newContent, historyCompartment);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error opening file:", err);
        }
      }
    } else {
      // no need to store file handle in fallback mode
      setActiveFileHandle(undefined);
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
    if (!isFirstVisit) {
      loadFromLocalStorage();
    }

    globalHotkeyCleanup = globalHotkey(globalHotkeys);

    // observe the body tag for class attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          break; // No need to check other mutations
        }
      }
    });
    observer.observe(document.body, { attributes: true });

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
  {#if isWelcomeMessageActive}
    <title>Welcome to Penflow!</title>
  {:else}
    <title>{documentTitle()} - Penflow</title>
  {/if}
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
    ${isFullscreen ? "absolute inset-0 z-50 m-0 min-h-full max-w-full shadow-none" : "mx-auto max-h-fit max-w-3xl shadow"}
  `}>
  <Toolbar {mode} onModeChange={setMode} toolbarItems={finalToolbarItems()} />

  {#if mode === "edit"}
    <div class="min-h-[300px] w-full flex-1" bind:this={editorContainer}></div>
  {:else if mode === "preview"}
    <div class="bg-base-150 flex flex-1 justify-center overflow-y-auto p-4">
      <div class="w-full md:w-[90ch] lg:w-[90ch]">
        <Preview {content} onContentChange={updateEditorContent} />
      </div>
    </div>
  {:else if mode === "side-by-side"}
    <div class="flex flex-1 overflow-hidden">
      <Splitpanes
        class="default-theme"
        theme={uiTheme.current === "dark" ? "dark-theme" : "default-theme"}
        dblClickSplitter={false}
        on:splitter-click={handleSplitterClick}>
        <Pane bind:size={editorPaneSize} minSize={20}>
          <div class="h-full w-full" bind:this={editorContainer}></div>
        </Pane>
        <Pane minSize={20}>
          <div
            class="bg-base-150 h-full w-full overflow-y-auto p-4"
            bind:this={previewElement}
            onscroll={() => syncScroll("preview")}>
            <Preview {content} onContentChange={updateEditorContent} />
          </div>
        </Pane>
      </Splitpanes>
    </div>
  {/if}

  <StatusBar {content} bind:shortcutModalVisible bind:settingsModalVisible />
</div>
