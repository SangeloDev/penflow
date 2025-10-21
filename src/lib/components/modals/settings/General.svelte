<script lang="ts">
  import type { ToolbarItem } from "$lib/types";
  import { getIcon } from "$lib/editor/toolbarIcons.ts";
  import { RotateCcw } from "lucide-svelte";
  import {
    toggleToolbarItem,
    getToolbarItems,
    updateToolbarItemOrder,
    resetToolbarItems,
  } from "$lib/settings.svelte.ts";
  import SettingsItem from "./SettingsItem.svelte";
  import { draggable, droppable, type DragDropState } from "@thisux/sveltednd";
  import { onMount } from "svelte";
  import { m } from "$paraglide/messages";

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  let toolbarItems: ToolbarItem[] = $derived.by(() => {
    if (!mounted) return [];
    return getToolbarItems();
  });

  function handleToggle(itemId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    toggleToolbarItem(itemId, target.checked);
  }

  // Simplified drop handling for reordering
  function handleDrop(state: DragDropState<ToolbarItem>) {
    const { draggedItem, targetContainer } = state;
    const dragIndex = toolbarItems.findIndex((item: ToolbarItem) => item.id === draggedItem.id);
    const dropIndex = parseInt(targetContainer ?? "0");

    if (dragIndex !== -1 && !isNaN(dropIndex)) {
      const [item] = toolbarItems.splice(dragIndex, 1);
      toolbarItems.splice(dropIndex, 0, item);

      toolbarItems.forEach((item, index) => {
        updateToolbarItemOrder(item.id, index);
      });
    }
  }
</script>

<SettingsItem>
  {#snippet title()}{m.settings_general_toolbarItemsItem_name()}{/snippet}
  {#snippet description()}{m.settings_general_toolbarItemsItem_description()}{/snippet}

  <div class="space-y-3">
    <!-- Single droppable container -->
    <div class="flex flex-wrap gap-4">
      {#each toolbarItems as item, index (item.id)}
        <label
          title={item.title}
          class="btn btn-square size-10 {item.enabled
            ? 'btn-primary'
            : 'btn-outline'} cursor-grab active:cursor-grabbing"
          use:draggable={{ container: index.toString(), dragData: item }}
          use:droppable={{
            container: index.toString(),
            callbacks: { onDrop: handleDrop },
          }}
        >
          <input type="checkbox" class="hidden" checked={item.enabled} onchange={(e) => handleToggle(item.id, e)} />

          {#if item}
            {@const IconComponent = getIcon(item.id)}
            <IconComponent size={16} class="pointer-events-none" />
          {/if}
        </label>
      {/each}
    </div>
  </div>
  <button class="btn flex w-fit items-center gap-1 select-none" onclick={resetToolbarItems}>
    <RotateCcw size={16} />
    {m.settings_general_toolbarItemsItem_resetButton()}
  </button>
</SettingsItem>
