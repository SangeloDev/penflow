<script lang="ts">
  import Editor from "$lib/components/Editor.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import Shortcuts from "$lib/components/modals/Shortcuts.svelte";
  import type { ToolbarItem } from "$lib/types";
  import { CircleHelp, Notebook } from "lucide-svelte";
  import { createGlobalHotkeys as hotkeys, editorHotkeys } from "$lib/utils/hotkeys";
  import { getShortcutModalVisibility, setShortcutModalVisibility } from "$lib/components/Editor.svelte.ts";

  const items: ToolbarItem[] = [
    { id: 0, enabled: true },
    { id: 9, enabled: false },
  ];

  let shortcutModalVisible = $derived(getShortcutModalVisibility());
</script>

<svelte:head>
  <title>Penflow – A distraction-free Markdown editor.</title>
  <meta name="title" content="Penflow – A distraction-free Markdown editor." />
  <meta
    name="description"
    content="A simple, clean, distraction-free and open-source Markdown Editor webapp that works offline." />
</svelte:head>

<Editor
  placeholder="Let your mind flow..."
  fullscreen={true}
  toolbarItems={items}
  autosaveDelay={2000}
  autosaveId="penflow-app-website"
  bind:shortcutModalVisible />

<Modal bind:show={shortcutModalVisible} onclose={() => setShortcutModalVisibility(false)}>
  {#snippet header()}
    <h1 class="flex items-center gap-2 font-semibold"><CircleHelp size={18} /> Help</h1>
  {/snippet}
  <Shortcuts>
    <div>
      <h1 class="mb-2 font-semibold">Hotkeys</h1>
      <ul>
        {#each hotkeys(undefined) as s (s.id)}
          {#if !s.hidden}
            <li class="mb-1 grid grid-cols-2">
              <span>{s.desc}</span>
              <span class="place-self-end rounded bg-gray-100 px-2 py-[0.15rem] font-mono">{s.shortcut}</span>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
    <div>
      <h1 class="mb-2 font-semibold">Editing Hotkeys</h1>
      <ul>
        {#each editorHotkeys as s (s.id)}
          {#if !s.hidden}
            <li class="mb-1 grid grid-cols-2">
              <span>{s.desc}</span>
              <span class="place-self-end rounded bg-gray-100 px-2 py-[0.15rem] font-mono">{s.shortcut}</span>
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
      rel="noopener noreferrer">
      <Notebook size={18} />
      <span class="text-link">Need help with Markdown?</span>
    </a>
  {/snippet}
</Modal>
