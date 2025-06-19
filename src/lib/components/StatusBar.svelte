<script lang="ts">
  import CircleHelp from "lucide-svelte/icons/circle-help";
  import Settings from "lucide-svelte/icons/settings";

  let {
    content,
    shortcutModalVisible = $bindable(),
  }: {
    content: string;
    shortcutModalVisible: boolean | undefined;
  } = $props();

  let lines = $derived(content.split("\n").length);
  let words = $derived(content.trim().split(/\s+/).filter(Boolean).length);
  let chars = $derived(content.length);
</script>

<div class="text-aside fixed right-0 bottom-0 flex justify-end gap-2 px-[10px] py-2 text-xs">
  <span>{lines} lines</span>
  <span>{words} words</span>
  <span>{chars} chars</span>
  <a class="cursor-pointer" href="/" title="Settings">
    <Settings size={16} />
  </a>
  <button class="cursor-pointer" onclick={() => (shortcutModalVisible = true)} title="Help">
    <CircleHelp size={16} />
  </button>
</div>
