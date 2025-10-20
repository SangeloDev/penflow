<script lang="ts">
  import Editor from "$lib/components/Editor.svelte";
  import Library from "$lib/components/Library.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import Settings from "$lib/components/modals/Settings.svelte";
  import Shortcuts from "$lib/components/modals/Shortcuts.svelte";
  import WelcomeModal from "$lib/components/modals/WelcomeModal.svelte";
  import { CircleHelp, Notebook, SettingsIcon } from "lucide-svelte";
  import { createGlobalHotkeys as hotkeys, editorHotkeys } from "$lib/utils/hotkeys";
  import {
    getShortcutModalVisibility,
    setShortcutModalVisibility,
    getSettingsModalVisibility,
    setSettingsModalVisibility,
    setContent,
    activeFileId,
  } from "$lib/components/Editor.svelte.ts";
  import { getFirstVisit, setFirstVisit } from "$lib/components/modals/Settings.svelte.ts";
  import { createStore, type Store } from "tinybase";
  import { get } from "svelte/store";
  import { createIndexedDbPersister, type IndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
  import type { MarkdownFile } from "$lib/types";

  let shortcutModalVisible = $derived(getShortcutModalVisibility());
  let settingsModalVisible = $derived(getSettingsModalVisibility());
  let welcomeModalVisible = $state(false);

  // App state
  let isEditorVisible = $state(false);

  // TinyBase state
  let store = $state<Store | null>(null);
  let persister = $state<IndexedDbPersister | null>(null);
  let library = $state<Record<string, MarkdownFile>>({});
  let isLoading = $state(true);

  const librarySchema = {
    library: {
      content: { type: "string", default: "" },
      createdAt: { type: "number", default: 0 },
      updatedAt: { type: "number", default: 0 },
      visitedAt: { type: "number", default: 0 },
      title: { type: "string", default: "" },
      tags: { type: "string", default: "" },
    },
  } as const;

  let frontmatter = $state<{ [key: string]: any }>({});

  async function initStore() {
    const newStore = createStore().setTablesSchema(librarySchema);
    const newPersister = createIndexedDbPersister(newStore, "penflow");

    await newPersister.load();
    await newPersister.startAutoSave();

    newStore.addTableListener("library", () => {
      library = newStore.getTable("library") as unknown as Record<string, MarkdownFile>;
    });

    library = newStore.getTable("library") as unknown as Record<string, MarkdownFile>;

    store = newStore;
    persister = newPersister;
    isLoading = false;
  }

  function showEditor(fileId: string | null) {
    activeFileId.set(fileId);
    if (fileId && store) {
      // Load file
      const file = store.getRow("library", fileId);
      setContent(file.content as string);
      frontmatter = {
        title: file.title.toString(),
        tags: [...new Set((file.tags as string).split(", "))],
      };
      store.setPartialRow("library", fileId, { visitedAt: Date.now() });
    } else {
      // New file
      setContent("");
      frontmatter = {};
    }
    isEditorVisible = true;
  }

  function showLibrary() {
    isEditorVisible = false;
    activeFileId.set(null);
  }

  async function handleSave(content: string) {
    if (!store) return;

    const fileId = get(activeFileId);
    const { title, tags } = frontmatter;

    if (fileId) {
      store.setPartialRow("library", fileId, {
        content,
        updatedAt: Date.now(),
        visitedAt: Date.now(),
        title,
        tags: tags?.join(", ") || "",
      });
    } else {
      // Create new file
      const newFileId = crypto.randomUUID();
      store.setRow("library", newFileId, {
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        visitedAt: Date.now(),
        title,
        tags: tags?.join(", ") || "",
      });
      activeFileId.set(newFileId);
    }
  }

  function handleDelete(fileId: string) {
    if (!store) return;
    store.delRow("library", fileId);
  }

  $effect(() => {
    initStore();

    const isFirstVisit = getFirstVisit() === "false";
    if (isFirstVisit) {
      welcomeModalVisible = true;
    }

    return () => {
      persister?.destroy();
    };
  });

  function handleWelcomeFinish() {
    welcomeModalVisible = false;
    setFirstVisit("true");
  }
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
    placeholder="Let your mind flow..."
    fullscreen={true}
    bind:shortcutModalVisible
    onNewFile={() => showEditor(null)}
    onSave={(content) => handleSave(content)}
    onBack={showLibrary}
    onFrontmatterChange={(data) => (frontmatter = data)}
  />
{:else}
  <Library
    files={library}
    onNewFile={() => showEditor(null)}
    onOpenFile={showEditor}
    onDeleteFile={handleDelete}
    {isLoading}
  />
{/if}

<WelcomeModal show={welcomeModalVisible} onclose={() => handleWelcomeFinish()} />

<Modal bind:show={settingsModalVisible} onclose={() => setSettingsModalVisibility(false)} className="w-full">
  {#snippet header()}
    <SettingsIcon size={18} /> Settings
  {/snippet}
  <Settings />
</Modal>

<Modal bind:show={shortcutModalVisible} onclose={() => setShortcutModalVisibility(false)}>
  {#snippet header()}
    <CircleHelp size={18} /> Help
  {/snippet}
  <Shortcuts>
    <div>
      <h1 class="mb-2 font-semibold">Hotkeys</h1>
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
      <h1 class="mb-2 font-semibold">Editor Hotkeys</h1>
      <ul>
        {#each editorHotkeys as s (s.id)}
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
      <span class="text-link">Need help with Markdown?</span>
    </a>
  {/snippet}
</Modal>
