<script lang="ts">
  import CircleHelp from "lucide-svelte/icons/circle-help";
  import Settings from "lucide-svelte/icons/settings";
  import { getEditorStateContext } from "$lib/context";
  import { m } from "$paraglide/messages.js";

  const editorState = getEditorStateContext();

  let {
    content,
    shortcutModalVisible = $bindable(),
    settingsModalVisible = $bindable(),
  }: {
    content: string;
    shortcutModalVisible: boolean | undefined;
    settingsModalVisible: boolean | undefined;
  } = $props();

  let lines = $derived(content.split("\n").length);
  let words = $derived(content.trim().split(/\s+/).filter(Boolean).length);
  let chars = $derived(content.length);
</script>

<div class="text-aside fixed right-0 bottom-0 flex justify-end gap-2 px-[10px] py-2 text-xs">
  <span>{m.editor_statusBar_lineCount({ count: lines })}</span>
  <span>{m.editor_statusBar_wordCount({ count: words })}</span>
  <span>{m.editor_statusBar_charCount({ count: chars })}</span>
  <button class="cursor-pointer" onclick={() => (editorState.settingsModalVisible = true)} title={m.settings()}>
    <Settings size={16} />
  </button>
  <button class="cursor-pointer" onclick={() => (editorState.shortcutModalVisible = true)} title={m.help()}>
    <CircleHelp size={16} />
  </button>
</div>
