<script lang="ts">
  import "../app.css";
  import { pwaInfo } from "virtual:pwa-info";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";
  import { ModeWatcher } from "mode-watcher";

  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
  let webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "");
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
