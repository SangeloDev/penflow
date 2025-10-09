<script lang="ts">
  import "../app.css";
  import { pwaInfo } from "virtual:pwa-info";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";
  import { ModeWatcher } from "mode-watcher";
  import { onMount } from "svelte";
  import { globalHotkey, constructedGlobalHotkeys, createGlobalHotkeys } from "$lib/utils/hotkeys";
  import { hotkeyContext } from "$lib/store/hotkeys";
  import {
    setSettingsModalVisibility,
    setShortcutModalVisibility,
  } from "$lib/components/Editor.svelte.ts";

  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
  let webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "");

  onMount(() => {
    let cleanup: { destroy: () => void } | undefined;

    const unsubscribe = hotkeyContext.subscribe((context) => {
      // If there's an existing hotkey listener, destroy it before creating a new one.
      if (cleanup) {
        cleanup.destroy();
      }

      const hotkeys = createGlobalHotkeys(
        context || {
          setSettingsModalVisibility: setSettingsModalVisibility,
          setShortcutModalVisibility: setShortcutModalVisibility,
          getMode: () => undefined,
          cycleEditMode: () => {},
          saveFile: () => {},
          exportFile: () => {},
          openFile: () => {},
          newFile: () => {},
          content: "",
          activeFilename: undefined,
          view: undefined,
          getDirtyness: () => false,
          onNewFile: () => {},
        }
      );
      const globalHotkeys = constructedGlobalHotkeys(hotkeys);
      cleanup = globalHotkey(globalHotkeys);
    });

    return () => {
      // When the component is destroyed, unsubscribe from the store and clean up the last listener.
      unsubscribe();
      if (cleanup) {
        cleanup.destroy();
      }
    };
  });
</script>

<svelte:head>
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link (link.href)}
    <link {...link} />
  {/each}
  {@html webManifest}
</svelte:head>

<ModeWatcher />

<div class="flex min-h-svh flex-col">
  <main>
    {@render children?.()}
  </main>

  {#await import('$lib/PWABadge.svelte') then { default: PWABadge }}
    <PWABadge />
  {/await}
</div>
