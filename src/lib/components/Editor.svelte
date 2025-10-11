<!-- Editor.svelte -->
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
  import { editorKeymap, type HotkeyContext } from "$lib/utils/hotkeys";
  import { hotkeyContext } from "$lib/store/hotkeys";
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
    activeFilename as activeFilenameStore,
    activeFileId as activeFileIdStore,
    exportFile,
    generateDocumentTitle,
  } from "./Editor.svelte.ts";
  import { get } from "svelte/store";
  import { onDestroy, onMount, untrack } from "svelte";
  import { welcome } from "../data/welcome";
  import { getEnabledToolbarItems, getLineWrappingEnabled } from "./modals/Settings.svelte.ts";
  import { debounce } from "$lib/utils/debounce";

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
  import type { ToolbarItem } from "$lib/types/index.ts";

  let {
    autofocus = true,
    fullscreen = false,
    defaultMode = "side-by-side",
    placeholder = "Write your markdown here...",
    shortcutModalVisible = $bindable(getShortcutModalVisibility()),
    settingsModalVisible = $bindable(getSettingsModalVisibility()),
    onNewFile,
    onSave,
    onBack,
  } = $props<{
    autofocus?: boolean;
    fullscreen?: boolean;
    defaultMode?: EditorMode;
    placeholder?: string;
    shortcutModalVisible?: boolean;
    settingsModalVisible?: boolean;
    onNewFile: () => void;
    onSave: (content: string) => void;
    onBack: () => void;
  }>();

  function handleBack() {
    debouncedSave.cancel();
    onSave(content);
    onBack();
  }

  // States
  let content = $derived(getContent());
  let mode = $derived(getMode());
  let isFullscreen = $state(fullscreen);
  let isDirty = $derived(getDirtyness());

  let fileInput: HTMLInputElement;
  let editorPaneSize = $state(50);
  let isWelcomeMessageActive = $state(false);
  let firstVisit = getFirstVisit();

  // codemirror
  let editorView: EditorView | undefined = $state();
  let editorContainer: HTMLDivElement | undefined = $state();
  const historyCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const lineWrappingCompartment = new Compartment();

  // panes
  let previewElement: HTMLDivElement | undefined = $state();
  let ignoreEditorScroll = false;
  let ignorePreviewScroll = false;
  let lastSplitterClick = 0;

  const doubleClickThreshold = 300; // in ms since last click

  const debouncedSave = $derived(debounce((content: string) => onSave(content), 1000));

  // Define toolbar actions map - this maps string IDs to their corresponding actions and icons
  const toolbarActionsMap = {
    bold: {
      action: () => f.toggleBold(editorView),
    },
    italic: {
      action: () => f.toggleItalic(editorView),
    },
    heading: {
      action: () => toggleHeadingCycle(editorView),
    },
    orderedList: {
      action: () => f.toggleOrderedList(editorView),
    },
    list: {
      action: () => f.toggleList(editorView),
    },
    checklist: {
      action: () => f.toggleCheckList(editorView),
    },
    link: {
      action: () => f.wrapLink(editorView),
    },
    quote: {
      action: () => f.toggleQuote(editorView),
    },
    table: {
      action: () => f.insertTable(editorView),
    },
    image: {
      action: () => f.wrapImage(editorView),
    },
  };

  // check if we're mounted
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  // Get enabled toolbar items from settings and map them to the toolbar format
  let finalToolbarItems = $derived(() => {
    if (!mounted) return []; // do not render icons until we're mounted

    const enabledSettings = getEnabledToolbarItems();

    return enabledSettings
      .map((settingItem: ToolbarItem) => {
        const actionConfig = toolbarActionsMap[settingItem.id as keyof typeof toolbarActionsMap];
        if (!actionConfig) {
          console.warn(`No action found for toolbar item: ${settingItem.id}`);
          return null;
        }

        return {
          id: settingItem.id,
          title: settingItem.title,
          // icon: actionConfig.icon as unknown as Component | undefined,
          action: actionConfig.action,
          enabled: settingItem.enabled,
          order: settingItem.order,
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  const getView = () => {
    return editorView;
  };

  // hotkeys
  const hotkeyContextValue: HotkeyContext = {
    setSettingsModalVisibility,
    setShortcutModalVisibility,
    getMode,
    cycleEditMode: cycleEditMode,
    saveFile: () => saveFile((content: string) => onSave(content), content),
    exportFile: () => exportFile(content),
    openFile: () => openFile(editorView, isDirty, content, documentTitle(), historyCompartment),
    newFile: () => newFile(editorView, onNewFile, getDirtyness()),
    content: getContent(),
    activeFilename: $activeFilenameStore,
    view: getView(),
    getDirtyness,
    onNewFile,
  };

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
        lineWrappingCompartment.of(getLineWrappingEnabled() ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setContent(newContent);
            setDirty(true);
            debouncedSave(newContent);
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

  // line wrapping effect
  $effect(() => {
    if (!editorView) return;

    const wrappingEnabled = getLineWrappingEnabled();
    editorView.dispatch({
      effects: lineWrappingCompartment.reconfigure(wrappingEnabled ? EditorView.lineWrapping : []),
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
        loadFileContent(view, oldContent, file.name, newContent, file.name, historyCompartment);
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

  let documentTitle = $derived(() => {
    const dirtyIndicator = isDirty ? "• " : "";
    let fileName = $activeFilenameStore;

    if (!fileName) {
      const generated = generateFilename(content);
      fileName = generated !== "note.md" ? generated : "Untitled";
    }

    return `${dirtyIndicator}${fileName}`;
  });

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
    hotkeyContext.set(hotkeyContextValue);

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
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  onDestroy(() => {
    hotkeyContext.set(undefined);
    editorView?.destroy();
  });
</script>

<svelte:head>
  {#if isWelcomeMessageActive}
    <title>Welcome to Penflow!</title>
  {:else}
    <title>{generateDocumentTitle(content)} - Penflow</title>
  {/if}
</svelte:head>

<input
  type="file"
  bind:this={fileInput}
  onchange={(event) => handleFileSelect(event, editorView, content, get(activeFileIdStore), historyCompartment)}
  style="display: none;"
  accept=".md, .markdown, text/markdown"
/>

<div
  class:fullscreen={isFullscreen}
  class={`
    flex w-full flex-col rounded-lg bg-white
    ${isFullscreen ? "absolute inset-0 z-50 m-0 min-h-full max-w-full shadow-none" : "mx-auto max-h-fit max-w-3xl shadow"}
  `}
>
  <Toolbar {mode} onModeChange={setMode} toolbarItems={finalToolbarItems()} onBack={handleBack} />

  {#if mode === "edit"}
    <div class="min-h-[300px] w-full flex-1" bind:this={editorContainer}></div>
  {:else if mode === "side-by-side"}
    <div class="flex flex-1 overflow-hidden">
      <Splitpanes
        class="default-theme"
        theme={uiTheme.current === "dark" ? "dark-theme" : "default-theme"}
        dblClickSplitter={false}
        on:splitter-click={handleSplitterClick}
      >
        <Pane bind:size={editorPaneSize} minSize={20}>
          <div class="h-full w-full" bind:this={editorContainer}></div>
        </Pane>
        <Pane minSize={20}>
          <div
            class="bg-base-150 h-full w-full overflow-y-auto p-4"
            bind:this={previewElement}
            onscroll={() => syncScroll("preview")}
          >
            <Preview {content} onContentChange={updateEditorContent} />
          </div>
        </Pane>
      </Splitpanes>
    </div>
  {:else if mode === "preview"}
    <div class="bg-base-150 flex flex-1 justify-center overflow-y-auto p-4">
      <div class="w-full md:w-[90ch] lg:w-[90ch]">
        <Preview {content} onContentChange={updateEditorContent} />
      </div>
    </div>
  {/if}

  <StatusBar {content} bind:shortcutModalVisible bind:settingsModalVisible />
</div>
