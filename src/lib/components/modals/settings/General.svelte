<script lang="ts">
  import type { ToolbarItem } from "$lib/types";
  import { settings, toggleToolbarItem } from "../Settings.svelte.ts";
  import SettingsItem from "./SettingsItem.svelte";
  import {
    Bold,
    Code,
    Italic,
    Link,
    List,
    ListOrdered,
    Quote,
    Image,
    Heading,
    Table,
    CheckSquare,
  } from "lucide-svelte";

  let toolbarItems: ToolbarItem[] = $derived(settings.general.editor.toolbarItems);

  // Create the same icon mapping as in the editor
  const iconMap: Record<string, any> = {
    bold: Bold,
    italic: Italic,
    heading: Heading,
    orderedList: ListOrdered,
    list: List,
    checklist: CheckSquare,
    link: Link,
    quote: Quote,
    table: Table,
    image: Image,
    code: Code,
  };

  function handleToggle(itemId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    toggleToolbarItem(itemId, target.checked);
  }

  function getIcon(itemId: string): any | undefined {
    return iconMap[itemId];
  }
</script>

<SettingsItem>
  {#snippet title()}Toolbar Items{/snippet}
  {#snippet description()}Configure the items in your toolbar{/snippet}

  <div class="space-y-3">
    <div class="flex gap-4">
      {#each toolbarItems as item (item.id)}
        <label title={item.title} class="btn btn-square {item.enabled ? 'btn-primary' : 'btn-outline'}">
          <input type="checkbox" class="hidden" checked={item.enabled} onchange={(e) => handleToggle(item.id, e)} />

          {#if getIcon(item.id)}
            {@const IconComponent = getIcon(item.id)}
            <IconComponent size={16} class="text-base-600 dark:text-base-400" />
          {/if}
        </label>
      {/each}
    </div>
  </div>
</SettingsItem>
