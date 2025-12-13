<script lang="ts">
  // icons
  import Pencil from "lucide-svelte/icons/pencil";
  import Eye from "lucide-svelte/icons/eye";
  import Columns from "lucide-svelte/icons/columns-2";
  import Library from "lucide-svelte/icons/library";
  import type { ToolbarItem } from "$lib/types";
  import { getIcon } from "$lib/editor/toolbarIcons";
  import { m } from "$paraglide/messages";

  const getTranslatedTitle = $derived((titleKey: string | undefined): string => {
    if (titleKey && m[titleKey as keyof typeof m] && typeof m[titleKey as keyof typeof m] === "function") {
      console.log(m[titleKey as keyof typeof m]({ count: {}, item: {} }));
      return m[titleKey as keyof typeof m]({ count: {}, item: {} });
    }
    return titleKey || "";
  });

  // exports
  let {
    mode,
    onModeChange,
    toolbarItems,
    onBack,
  }: {
    mode: "edit" | "preview" | "side-by-side";
    onModeChange: any;
    toolbarItems: Array<ToolbarItem>;
    onBack: () => void;
  } = $props();
</script>

<div class="border-base-400 bg-base-200 flex items-center gap-2 border-b p-2">
  <button class="btn btn-square" onclick={onBack} title="Back to Library">
    <Library size={20} />
  </button>

  {#each toolbarItems as item (item.id)}
    {#if item}
      {@const Component = getIcon(item.id)}
      <button
        disabled={mode === "preview"}
        class="btn btn-square"
        onclick={item.action as () => void}
        title={getTranslatedTitle(item.title)}
      >
        <Component size={20} />
      </button>
    {/if}
  {/each}

  <div class="flex-1"></div>
  <button
    class="btn btn-square"
    onclick={() => onModeChange("edit")}
    aria-pressed={mode === "edit"}
    title={m.editor_toolbar_mode_edit()}
  >
    <Pencil size={20} />
  </button>
  <button
    class="btn btn-square"
    onclick={() => onModeChange("side-by-side")}
    aria-pressed={mode === "side-by-side"}
    title={m.editor_toolbar_mode_sideBySide()}
  >
    <Columns size={20} />
  </button>
  <button
    class="btn btn-square"
    onclick={() => onModeChange("preview")}
    aria-pressed={mode === "preview"}
    title={m.editor_toolbar_mode_preview()}
  >
    <Eye size={20} />
  </button>
</div>
