<script lang="ts">
  let { content }: { content: string } = $props();

  let lines = $derived(content.split("\n").length);
  let words = $derived(content.trim().split(/\s+/).filter(Boolean).length);
  let chars = $derived(content.length);
</script>

<div class="text-aside fixed bottom-0 left-0 px-[10px] py-2 text-xs">
  <span class="mr-2 inline-block">&copy; penflow 2025</span>
  <span class="mr-2 inline-block select-none">
    <a href="/">about</a>
    //
    <a href="/">settings</a>
  </span>
</div>

<div class="text-aside fixed right-0 bottom-0 flex justify-end gap-4 px-[10px] py-2 text-xs">
  <span>{lines} lines</span>
  <span>{words} words</span>
  <span>{chars} chars</span>
</div>
