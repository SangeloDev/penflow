<script lang="ts">
  let { children } = $props();
</script>

<div class="flex flex-col gap-8 lg:grid-cols-2">
  {@render children?.()}
</div>
