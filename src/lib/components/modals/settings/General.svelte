<script lang="ts">
  import { settings, setS3Endpoint, setS3Bucket, setS3Credentials } from "../Settings.svelte.ts";
  import SettingsItem from "./SettingsItem.svelte";

  // Reactive values from settings
  let endpoint = $derived(settings.general.s3.endpoint);
  let bucket = $derived(settings.general.s3.bucket);
  let accessKey = $derived(settings.general.s3.accessKey);
  let secretKey = $derived(settings.general.s3.secretKey);
  let region = $derived(settings.general.s3.region);

  // Local state for testing
  let testResult: null | { success: boolean; message: string } = $state(null);
  let loadingTest = $state(false);

  // Keep local fields in sync with settings
  $effect(() => {
    endpoint = settings.general.s3.endpoint;
    bucket = settings.general.s3.bucket;
    accessKey = settings.general.s3.accessKey;
    secretKey = settings.general.s3.secretKey;
    region = settings.general.s3.region;
  });

  // Clear test results when endpoint changes
  $effect(() => {
    if (endpoint) {
      testResult = null;
    }
  });

  async function testS3Connection() {
    if (!endpoint || !endpoint.trim()) {
      testResult = { success: false, message: "Endpoint URL is required" };
      return;
    }

    loadingTest = true;
    testResult = null;
    try {
      const testUrl = new URL(endpoint);
      const _r = await fetch(testUrl.origin, {
        method: "HEAD",
        mode: "no-cors",
      });
      testResult = {
        success: true,
        message: "✓ Endpoint is reachable",
      };
    } catch (error) {
      console.error("S3 connection test failed:", error);
      testResult = {
        success: false,
        message: `✗ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    } finally {
      loadingTest = false;
    }
  }

  function onEndpointInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Endpoint(value);
  }

  function onBucketInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Bucket(value);
  }

  function onAccessKeyInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Credentials(value, secretKey || "", region || "");
  }

  function onSecretKeyInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Credentials(accessKey || "", value, region || "");
  }

  function onRegionInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setS3Credentials(accessKey || "", secretKey || "", value);
  }
</script>

<SettingsItem>
  {#snippet title()}
    S3 Attachment Configuration
  {/snippet}
  {#snippet description()}
    Configure S3-compatible storage for drag-and-dropped images. Bucket name is optional.
  {/snippet}
  <div class="w-full max-w-sm min-w-[200px] space-y-4">
    <!-- Endpoint Input -->
    <div class="relative">
      <input
        id="s3-endpoint"
        type="text"
        value={endpoint || ""}
        oninput={onEndpointInput}
        placeholder="https://s3.amazonaws.com"
        class="input peer ease" />
      <label for="s3-endpoint" class="label">Endpoint URL</label>
    </div>

    <!-- Show all fields when endpoint is provided -->
    {#if endpoint}
      <!-- Bucket Name Input - Now always shown when endpoint exists -->
      <div class="relative">
        <input
          id="s3-bucket"
          type="text"
          value={bucket || ""}
          oninput={onBucketInput}
          placeholder="my-bucket-name (optional)"
          class="input peer ease" />
        <label for="s3-bucket" class="label">Bucket Name (Optional)</label>
      </div>

      <!-- Authentication Fields -->
      <div class="grid grid-cols-2 gap-2">
        <div class="relative">
          <input
            id="s3-access-key"
            type="text"
            value={accessKey || ""}
            oninput={onAccessKeyInput}
            placeholder="AKIA..."
            class="input peer ease" />
          <label for="s3-access-key" class="label">Access Key ID</label>
        </div>
        <div class="relative">
          <input
            id="s3-secret-key"
            type="password"
            value={secretKey || ""}
            oninput={onSecretKeyInput}
            placeholder="Secret access key"
            class="input peer ease" />
          <label for="s3-secret-key" class="label">Secret Access Key</label>
        </div>
      </div>
      <div class="relative">
        <input
          id="s3-region"
          type="text"
          value={region || ""}
          oninput={onRegionInput}
          placeholder="us-east-1"
          class="input peer ease" />
        <label for="s3-region" class="label">Region</label>
      </div>
    {/if}

    <!-- Status/Help Text - Updated to show endpoint always -->
    {#if endpoint}
      <div class="text-xs text-black/65 dark:text-white/65">
        Images will be uploaded to: <code class="bg-base-300 rounded px-1">
          {endpoint}{bucket ? `/${bucket}` : ""}
        </code>
      </div>
    {/if}
  </div>

  {#if endpoint}
    <div class="flex items-center space-x-3">
      <button type="button" onclick={testS3Connection} disabled={loadingTest} class="btn btn-primary">
        {#if loadingTest}
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white">
          </div>
          <span>Testing...</span>
        {:else}
          <span>Test Connection</span>
        {/if}
      </button>
      {#if testResult}
        <div
          class={`text-sm font-medium ${testResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {testResult.message}
        </div>
      {/if}
    </div>
  {/if}
</SettingsItem>
