<script lang="ts">
  // import EditorWindow from "$lib/components/EditorWindow.svelte";
  import Editor from "$lib/components/Editor.svelte";

  const items = [
    { id: 0, enabled: true },
    { id: 9, enabled: false },
  ];
</script>

<!-- <EditorWindow /> -->
<Editor autosaveDelay={2000} placeholder="Let your mind flow..." fullscreen={true} toolbarItems={items} />
