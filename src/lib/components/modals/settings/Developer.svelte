<script>
  import { setDeveloperMode } from "$lib/settings/index.svelte";
  import SettingsItem from "./SettingsItem.svelte";
</script>

<span class="bg-red-500">
  <strong>WARNING:</strong>
  If you do not know what you're doing, please do not use this page. It can lead to data loss and irrecoverable damage.
  <br />
  Please only use this settings page if you know what you're doing.
</span>

<SettingsItem>
  {#snippet title()}
    localStorage
  {/snippet}
  {#snippet description()}
    Reset, clear and modify localStorage.
  {/snippet}
  <div class="flex gap-2">
    <button class="btn btn-primary max-w-fit" onclick={() => localStorage.removeItem("penflow.settings")}>
      Reset settings
    </button>
    <button class="btn btn-outline btn-primary max-w-fit" onclick={() => localStorage.clear()}>
      Reset localStorage
    </button>
  </div>
</SettingsItem>

<SettingsItem>
  {#snippet title()}
    Disable developer options
  {/snippet}
  {#snippet description()}
    Disables this area.
  {/snippet}
  <div class="flex gap-2">
    <button class="btn btn-danger max-w-fit" onclick={() => setDeveloperMode(false)}>Disable</button>
  </div>
</SettingsItem>
