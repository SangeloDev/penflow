<!-- Editor.svelte -->
<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import StatusBar from "./StatusBar.svelte";
  import Preview from "./Preview.svelte";
  import { Splitpanes, Pane } from "svelte-splitpanes";
  import * as f from "$lib/editor/formattingActions";
  import { toggleHeadingCycle } from "$lib/editor/formatting.js";
  import { createEditorKeymap, type HotkeyContext } from "$lib/hotkeys";
  import { getLocale } from "$paraglide/runtime";
  import { hotkeyContext } from "$lib/store/hotkeys";
  import {
    type EditorMode,
    getDirtyness,
    getMode,
    setDirty,
    setMode,
    loadFileContent,
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
  import { getEnabledToolbarItems, getLineWrappingEnabled } from "$lib/settings/index.svelte.ts";
  import { debounce } from "$lib/editor/debounce";

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
  import { yamlFrontmatter } from "@codemirror/lang-yaml";
  import { defaultKeymap, history } from "@codemirror/commands";
  import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { closeBrackets, autocompletion, CompletionContext } from "@codemirror/autocomplete";
  import { highlightSelectionMatches } from "@codemirror/search";
  import { darkThemes, lightThemes } from "$lib/codemirror/themes.ts";
  import { mode as uiTheme } from "mode-watcher";
  import "../../styles/codemirror.css";
  import "../../styles/splitpanes.css";
  import type { ToolbarItem } from "$lib/types/index.ts";
  import emojiList from "../data/emoji.json";
  import { EmojiExtension } from "$lib/codemirror/emojiHighlighting.ts";
  import { m } from "$paraglide/messages.js";

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
    onFrontmatterChange,
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
    onFrontmatterChange: (data: { [key: string]: any }) => void;
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
    openFile: () => openFile(editorView, isDirty, content, historyCompartment),
    newFile: () => newFile(editorView, onNewFile, getDirtyness()),
    content: getContent(),
    activeFilename: $activeFilenameStore,
    view: getView(),
    getDirtyness,
    onNewFile,
  };

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
        yamlFrontmatter({
          content: markdownExt({
            base: markdownLanguage,
            codeLanguages: languages,
            extensions: [EmojiExtension],
          }),
        }),
        markdownLanguage.data.of({
          closeBrackets: {
            brackets: [
              //default brackets
              "(",
              "[",
              "{",
              "'",
              '"',
              //markdown extras
              "`",
              "*",
              "_",
              "~",
              "<",
              "|",
            ],
          },
        }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        placeholderExtension(placeholder),
        autocompletion({ override: [emojiCompletionSource] }),
        Prec.highest(createEditorKeymap(getLocale)),
        Prec.default(keymap.of(defaultKeymap)),
        lineWrappingCompartment.of(getLineWrappingEnabled() ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setContent(newContent);
            setDirty(true);
            debouncedSave(newContent);
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

    // Filter emoji list by shortcode
    // let query = word.text.toLowerCase();
    let query = word.text.slice(1).toLowerCase();

    // Flatten metadata structure
    let flatEmojis = emojiList.flatMap((group) =>
      group.emoji.map((e) => ({
        emoji: String.fromCodePoint(...e.base),
        shortcodes: e.shortcodes || [],
        emoticons: e.emoticons || [],
      }))
    );

    let options = flatEmojis
      .flatMap((e) =>
        // Map each shortcode to a completion option
        e.shortcodes.map((shortcode) => ({
          emoji: e.emoji,
          shortcode: shortcode,
        }))
      )
      .filter((item) => {
        // Strip colons from the shortcode for comparison
        const cleanShortcode = item.shortcode.replace(/^:/, "").replace(/:$/, "");
        return cleanShortcode.startsWith(query);
      })
      .map((item) => ({
        label: item.shortcode,
        type: "emoji",
        detail: item.emoji,
        render: (element: HTMLElement) => {
          element.innerHTML = item.emoji;
          element.appendChild(document.createTextNode(` ${item.shortcode}`));
        },
        apply: item.shortcode,
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
    historyCompartment: Compartment
  ) {
    if (dirtyness && !confirm(m.editor_unsavedChanges())) {
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

  // Autoscroll
  function syncScroll(source: "editor" | "preview") {
    if (!editorView || !previewElement) return;

    const isEditor = source === "editor";

    const sourceEl = isEditor ? editorView.scrollDOM : previewElement;
    const targetEl = isEditor ? previewElement : editorView.scrollDOM;

    // Reset ignore flag if ignoring the current source
    if (isEditor ? ignoreEditorScroll : ignorePreviewScroll) {
      if (isEditor) ignoreEditorScroll = false;
      else ignorePreviewScroll = false;
      return;
    }

    // Lock to prevent echo on the other source
    if (isEditor) ignorePreviewScroll = true;
    else ignoreEditorScroll = true;

    // Snap to top
    if (sourceEl.scrollTop === 0) {
      targetEl.scrollTop = 0;
      return;
    }

    // Snap to bottom
    if (sourceEl.scrollTop + sourceEl.clientHeight >= sourceEl.scrollHeight) {
      targetEl.scrollTop = targetEl.scrollHeight;
      return;
    }

    // Return if scrolling from preview
    if (!isEditor) return;

    const topBlock = editorView.lineBlockAtHeight(sourceEl.scrollTop);
    const topLine = editorView.state.doc.lineAt(topBlock.from).number;

    // Find all preview lines
    const lines = previewElement.querySelectorAll<HTMLElement>("[data-source-line]");
    let anchor = null, nextAnchor = null;

    for (let i = 0; i < lines.length; i++) {
      const line = parseInt(lines[i].dataset.sourceLine || "0")

      if (line <= topLine) anchor = lines[i];

      if (line > topLine) {
        nextAnchor = lines[i];
        break;
      }
    }

    if (!anchor) return;

    const scrollOffset = sourceEl.scrollTop - topBlock.top;
    const scrollRatio = scrollOffset / topBlock.height;

    let targetTop = anchor.offsetTop + (anchor.offsetHeight * scrollRatio);

    // Smooth transition to next anchor
    if (nextAnchor && nextAnchor.offsetTop > anchor.offsetTop) {
      const sourceGap = editorView.lineBlockAt(editorView.state.doc.line(parseInt(nextAnchor.dataset.sourceLine!)).from).top - topBlock.top;
      const targetGap = nextAnchor.offsetTop - anchor.offsetTop;

      targetTop = anchor.offsetTop + (scrollOffset / sourceGap) * targetGap;
    }

    targetEl.scrollTop = targetTop;
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
  <title>{generateDocumentTitle(content)} - Penflow</title>
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
          <div class="bg-base-150 h-full w-full overflow-y-auto p-4" bind:this={previewElement}>
            <Preview {content} onContentChange={updateEditorContent} {onFrontmatterChange} />
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
