<script lang="ts">
  import "../app.css";
  import { pwaInfo } from "virtual:pwa-info";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";
  import { ModeWatcher } from "mode-watcher";
  import { defineCustomClientStrategy } from "$paraglide/runtime";
  import { setSettingsContext } from "$lib/context";

  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
  let webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "");

  // Initialize settings context at the root level
  const settings = setSettingsContext();

  defineCustomClientStrategy("custom-localStorage", {
    getLocale: () => {
      return settings.getLanguage() ?? undefined;
    },
    setLocale: (locale) => {
      settings.setLanguage(locale);
    },
  });

  // Global hotkeys are now managed per-page context, not globally in layout
  // This ensures hotkeys are properly scoped and cleaned up
</script>

<svelte:head>
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link (link.href)}
    <link {...link} />
  {/each}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
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
