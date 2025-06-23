<script lang="ts">
  import { X } from "lucide-svelte";

  let { show = $bindable(), header, footer, children, onclose } = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (show && dialog) dialog.showModal();
  });
</script>

<dialog
  class="
    bg-base
    open:backdrop:animate-fade
    open:animate-zoom
    absolute
    top-1/2
    left-1/2
    min-h-[15rem]
    max-w-[50rem]
    min-w-[25rem]
    -translate-1/2
    rounded-sm
    border
    border-gray-400/30
    p-0 backdrop:bg-black backdrop:opacity-25
  "
  bind:this={dialog}
  onclose={() => onclose()}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}>
  <div class="p-4">
    <button onclick={() => dialog?.close()} class="btn absolute top-0 right-0"><X size={16} /></button>
    <div>
      {@render header?.()}
      <hr class="my-4 text-gray-200" />
      {@render children?.()}
      <hr class="my-4 text-gray-200" />
      {@render footer?.()}
    </div>
  </div>
</dialog>
