<script lang="ts">
  // icons
  import Pencil from "lucide-svelte/icons/pencil";
  import Eye from "lucide-svelte/icons/eye";
  import Columns from "lucide-svelte/icons/columns-2";
  import type { ToolbarItem } from "$lib/types";

  // exports
  let {
    mode,
    onModeChange,
    toolbarItems,
  }: {
    mode: "edit" | "preview" | "side-by-side";
    onModeChange: any;
    toolbarItems: Array<ToolbarItem>;
  } = $props();
</script>

<div class="flex items-center gap-2 border-b border-gray-300 bg-gray-100 p-2">
  {#each toolbarItems as item (item.id)}
    {#if item}
      {@const Component = item.icon}
      <button
        disabled={mode === "preview"}
        class="btn btn-square"
        onclick={item.action as () => void}
        title={item.title}>
        <Component size={20} />
      </button>
    {/if}
  {/each}

  <div class="flex-1"></div>
  <button class="btn btn-square" onclick={() => onModeChange("edit")} aria-pressed={mode === "edit"} title="Edit">
    <Pencil size={20} />
  </button>
  <button
    class="btn btn-square"
    onclick={() => onModeChange("side-by-side")}
    aria-pressed={mode === "side-by-side"}
    title="Side by Side">
    <Columns size={20} />
  </button>
  <button
    class="btn btn-square"
    onclick={() => onModeChange("preview")}
    aria-pressed={mode === "preview"}
    title="Preview">
    <Eye size={20} />
  </button>
  <!-- <button class="btn" onclick={onFullscreenToggle}>
    {#if isFullscreen}
      <Minimize size={20} />
    {:else}
      <Maximize size={20} />
    {/if}
  </button> -->
</div>
