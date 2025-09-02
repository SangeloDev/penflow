<script lang="ts">
  import { settings, setS3Endpoint } from "../Settings.svelte.ts";
  import SettingsItem from "./SettingsItem.svelte";
  let endpoint = $derived(settings.general.s3AttachmentEndpoint);

  // Keep local field in sync if settings loaded later (e.g., after client hydrate)
  $effect(() => {
    endpoint = settings.general.s3AttachmentEndpoint;
  });

  function onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Endpoint(value); // updates shared settings
    // Keep local mirror consistent to avoid cursor jumps in some edge cases
    endpoint = value;
  }
</script>

<SettingsItem>
  {#snippet title()}
    S3 Attachment Endpoint
  {/snippet}
  {#snippet description()}
    Upload drag-and-dropped images to specified S3 bucket URL.
  {/snippet}
  <div class="w-full max-w-sm min-w-[200px]">
    <div class="relative">
      <input
        id="s3-endpoint"
        type="text"
        value={endpoint}
        oninput={onInput}
        placeholder="https://bucket1.example.com"
        class="input peer ease" />
      <label for="s3-endpoint" class="label">Endpoint URL</label>
    </div>
  </div>
</SettingsItem>
