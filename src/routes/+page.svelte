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
    setEditorContext,
    setLibraryContext,
    setModalContext,
    setSettingsContext,
    setHotkeyContext,
    type HotkeyConfig,
  } from "$lib/context";
  import { createTinyBaseAdapter } from "$lib/adapters/TinyBaseAdapter";
  import { m } from "$paraglide/messages";

  // Initialize contexts
  const editor = setEditorContext();
  const library = setLibraryContext();
  const modal = setModalContext();
  const settings = setSettingsContext();
  const hotkey = setHotkeyContext();

  // Reactive state derived from contexts
  let settingsModalTitle = $derived("");
  let helpModalTitle = $derived("");

  // App state
  let isEditorVisible = $state(false);
  let frontmatter = $state<{ [key: string]: any }>({});

  // Initialize database
  const adapter = createTinyBaseAdapter("penflow");

  function showEditor(fileId: string | null) {
    editor.setActiveFileId(fileId);
    if (fileId) {
      // Load file
      const file = library.getFile(fileId);
      if (file) {
        editor.setContent(file.content);
        frontmatter = {
          title: file.title,
          tags: [...new Set(file.tags.split(", ").filter(Boolean))],
        };
        library.markFileVisited(fileId);
      }
    } else {
      // New file
      editor.setContent("");
      frontmatter = {};
    }
    isEditorVisible = true;
  }

  function showLibrary() {
    isEditorVisible = false;
    editor.setActiveFileId(null);
  }

  async function handleSave(content: string) {
    const fileId = editor.getActiveFileId();
    const { title, tags } = frontmatter;

    if (fileId) {
      library.updateFile(fileId, {
        content,
        title: title || "",
        tags: Array.isArray(tags) ? tags.join(", ") : "",
      });
    } else {
      // Create new file
      const newFileId = crypto.randomUUID();
      library.createFile(newFileId, content, title || "", Array.isArray(tags) ? tags.join(", ") : "");
      editor.setActiveFileId(newFileId);
    }
  }

  function handleDelete(fileId: string) {
    library.deleteFile(fileId);
  }

  $effect(() => {
    library.initialize(adapter);

    const isFirstVisit = settings.getFirstVisit() === false;
    if (isFirstVisit) {
      modal.showWelcome();
    }

    return () => {
      library.destroy();
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
    const hotkeyConfig: HotkeyConfig = {
      "ctrl+comma": () => editor.setSettingsModalVisibility(true),
      "ctrl+alt+slash": () => editor.setShortcutModalVisibility(true),
    };

    // Add library-specific hotkeys when in library view
    if (!isEditorVisible) {
      hotkeyConfig["ctrl+shift+o"] = () => showEditor(null);
    }

    hotkey.attachGlobalHotkeys(hotkeyConfig);

    return () => {
      hotkey.detachGlobalHotkeys();
    };
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
    bind:shortcutModalVisible={editor.shortcutModalVisible}
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
  bind:show={editor.settingsModalVisible}
  onclose={() => editor.setSettingsModalVisibility(false)}
  className="w-full"
>
  {#snippet header()}
    <SettingsIcon size={18} /> {settingsModalTitle}
  {/snippet}
  <Settings />
</Modal>

<Modal bind:show={editor.shortcutModalVisible} onclose={() => editor.setShortcutModalVisibility(false)}>
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
