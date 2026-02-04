<script lang="ts">
  import Editor from "$lib/components/Editor.svelte";
  import Library from "$lib/components/Library.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import Settings from "$lib/components/modals/Settings.svelte";
  import Shortcuts from "$lib/components/modals/Shortcuts.svelte";
  import WelcomeModal from "$lib/components/modals/WelcomeModal.svelte";
  import { CircleHelp, Notebook, SettingsIcon } from "lucide-svelte";
  import { createGlobalHotkeys as hotkeys, createEditorHotkeys } from "$lib/hotkeys";
  import {
    setEditorStateContext,
    setEditorOperationsContext,
    setLibraryContext,
    setModalContext,
    setSettingsContext,
    setHotkeyContext,
    type HotkeyConfig,
  } from "$lib/context";
  import { useLibrary, useEditor } from "$lib/composables";
  import { getFileService } from "$lib/services";
  import { createTinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
  import { m } from "$paraglide/messages";
  import { untrack } from "svelte";

  // Initialize contexts
  setEditorStateContext();
  setEditorOperationsContext();
  const libraryContext = setLibraryContext();
  const modal = setModalContext();
  const settings = setSettingsContext();
  const hotkey = setHotkeyContext();

  // Use composables for cleaner API
  const library = useLibrary();
  const editor = useEditor();
  const fileService = getFileService();

  // Reactive state derived from contexts
  let settingsModalTitle = $derived("");
  let helpModalTitle = $derived("");

  // App state
  let isEditorVisible = $state(false);
  let frontmatter = $state<{ [key: string]: any }>({});

  // Initialize database adapter
  const adapter = createTinyBaseAdapter("penflow");

  function showEditor(fileId: string | null) {
    editor.state.activeFileId = fileId;
    if (fileId) {
      // Load file
      const file = library.getFile(fileId);
      if (file) {
        editor.content = file.content;
        // Clear activeFilename so export generates fresh filename from content
        editor.state.activeFilename = undefined;

        // Parse frontmatter from content if present
        const { frontmatter: parsed } = fileService.parseMarkdownFrontmatter(file.content);
        frontmatter = {
          title: file.title || parsed.title || "",
          tags: file.tags ? file.tags.split(", ").filter(Boolean) : parsed.tags || [],
        };

        library.markFileVisited(fileId);
      }
    } else {
      // New file
      editor.content = "";
      editor.state.activeFilename = undefined;
      frontmatter = {};
    }
    isEditorVisible = true;
  }

  function showLibrary() {
    isEditorVisible = false;
    editor.state.activeFileId = null;
  }

  async function handleSave(content: string) {
    const fileId = editor.activeFileId;

    // Generate title from content if not provided
    const title = frontmatter.title || fileService.generateTitleFromContent(content);
    const tags = fileService.formatTags(Array.isArray(frontmatter.tags) ? frontmatter.tags : []);

    if (fileId) {
      library.updateFile(fileId, {
        content,
        title,
        tags,
      });
    } else {
      // Create new file
      const newFileId = crypto.randomUUID();
      library.createFile(newFileId, content, title, tags);
      editor.state.activeFileId = newFileId;
    }

    editor.isDirty = false;
  }

  function handleDelete(fileId: string) {
    library.deleteFile(fileId);
  }

  $effect(() => {
    // Initialize library with adapter
    libraryContext.initialize(adapter);

    const isFirstVisit = untrack(() => settings.getFirstVisit() === false);
    if (isFirstVisit) {
      modal.showWelcome();
    }

    return () => {
      libraryContext.destroy();
    };
  });

  $effect(() => {
    settingsModalTitle = m.settings();
    helpModalTitle = m.help();
  });

  function handleWelcomeFinish() {
    modal.hideWelcome();
    settings.setFirstVisit(true);
  }

  // Set up global hotkeys based on current view
  $effect(() => {
    // Only attach page-level hotkeys when in library view
    // The Editor component manages its own hotkeys when visible
    if (!isEditorVisible) {
      const hotkeyConfig: HotkeyConfig = {
        "ctrl+comma": () => (editor.state.settingsModalVisible = true),
        "ctrl+alt+slash": () => (editor.state.shortcutModalVisible = true),
        "ctrl+shift+o": () => showEditor(null),
      };

      hotkey.attachGlobalHotkeys(hotkeyConfig);
    }
  });
</script>

<svelte:head>
  <title>Penflow – A distraction-free Markdown editor.</title>
  <meta name="title" content="Penflow – A distraction-free Markdown editor." />
  <meta
    name="description"
    content="A simple, clean, distraction-free and open-source Markdown Editor webapp that works offline."
  />
</svelte:head>

{#if isEditorVisible}
  <Editor
    placeholder={m.editor_placeholder()}
    fullscreen={true}
    bind:shortcutModalVisible={editor.state.shortcutModalVisible}
    onNewFile={() => showEditor(null)}
    onSave={(content) => handleSave(content)}
    onBack={showLibrary}
    onFrontmatterChange={(data) => (frontmatter = data)}
  />
{:else}
  <Library
    files={library.files}
    onNewFile={() => showEditor(null)}
    onOpenFile={showEditor}
    onDeleteFile={handleDelete}
    isLoading={library.isLoading}
  />
{/if}

<WelcomeModal show={modal.isVisible("welcome")} onclose={() => handleWelcomeFinish()} />

<Modal
  bind:show={editor.state.settingsModalVisible}
  onclose={() => (editor.state.settingsModalVisible = false)}
  className="w-full"
>
  {#snippet header()}
    <SettingsIcon size={18} /> {settingsModalTitle}
  {/snippet}
  <Settings />
</Modal>

<Modal bind:show={editor.state.shortcutModalVisible} onclose={() => (editor.state.shortcutModalVisible = false)}>
  {#snippet header()}
    <CircleHelp size={18} /> {helpModalTitle}
  {/snippet}
  <Shortcuts>
    <div>
      <h1 class="mb-2 font-semibold">{m.help_hotkeys()}</h1>
      <ul>
        {#each hotkeys(undefined) as s (s.id)}
          {#if !s.hidden}
            <li class="mb-1 grid grid-cols-2">
              <span>{s.desc}</span>
              <span class="dark:bg-base-400 bg-base-200 place-self-end rounded px-2 py-[0.15rem] font-mono">
                {s.shortcut}
              </span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
    <div>
      <h1 class="mb-2 font-semibold">{m.help_editorHotkeys()}</h1>
      <ul>
        {#each createEditorHotkeys() as s (s.id)}
          {#if !s.hidden}
            <li class="mb-1 grid grid-cols-2">
              <span>{s.desc}</span>
              <span class="dark:bg-base-400 bg-base-200 place-self-end rounded px-2 py-[0.15rem] font-mono">
                {s.shortcut}
              </span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
  </Shortcuts>
  {#snippet footer()}
    <a
      class="flex items-center gap-2 hover:[&>span]:underline"
      href="https://www.markdownguide.org/basic-syntax/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Notebook size={18} />
      <span class="text-link">{m.help_markdown()}</span>
    </a>
  {/snippet}
</Modal>
