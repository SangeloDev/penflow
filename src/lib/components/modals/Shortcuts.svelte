<script lang="ts">
  let { children } = $props();
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
  {@render children?.()}
</div>
