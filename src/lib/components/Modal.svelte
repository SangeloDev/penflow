<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Snippet } from "svelte";

  let {
    show = $bindable(),
    header,
    footer,
    children,
    onclose,
    className,
  }: {
    show: boolean;
    header?: Snippet;
    footer?: Snippet;
    children?: Snippet;
    onclose: () => void;
    className?: string;
  } = $props();

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
    min-h-full
    max-w-[64rem]
    min-w-full
    -translate-1/2
    rounded-sm
    border
    border-gray-400/30
    p-0
    backdrop:bg-black
    backdrop:opacity-25 md:min-h-[16rem] md:min-w-[24rem]
    {className}
  "
  bind:this={dialog}
  onclose={() => onclose()}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}>
  <button onclick={() => dialog?.close()} class="btn btn-square absolute top-0 right-0"><X size={16} /></button>
  <div class="p-4">
    {#if header}
      <h1 class="flex items-center gap-2 font-semibold">{@render header?.()}</h1>
      <hr class="my-4 text-gray-200" />
    {/if}
    {@render children?.()}
    {#if footer}
      <hr class="my-4 text-gray-200" />
    {/if}
    {@render footer?.()}
  </div>
</dialog>
