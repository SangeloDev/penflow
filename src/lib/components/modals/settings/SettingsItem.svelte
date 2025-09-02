<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    description,
    children,
  }: {
    title?: Snippet;
    description?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="flex flex-col gap-4">
  {#if title || description}
    <div>
      {#if title}
        <h1 class="mb-1 font-medium">
          {@render title?.()}
        </h1>
      {/if}
      {#if description}
        <p class="text-muted-foreground">
          {@render description?.()}
        </p>
      {/if}
    </div>
  {/if}
  {#if children}
    {@render children?.()}
  {/if}
</div>
