<script lang="ts">
  import { version } from "$app/environment";
  import commitHash from "virtual:commit-hash";
  import SettingsItem from "./SettingsItem.svelte";
</script>

<SettingsItem>
  {#snippet title()}
    About Penflow
  {/snippet}
  <div class="mb-2 flex items-center gap-2">
    <img class="size-20 select-none" src="/assets/icon/hd_hi.ico" alt="Penflow Logo" draggable="false" />
    <div class="flex flex-col gap-1">
      <p class="text-3xl font-black">penflow.app</p>
      <p>A simple Markdown Editor.</p>
    </div>
  </div>
  <span>
    Version: {version}{#if commitHash}+{commitHash.slice(0, 7)}{/if}
  </span>
  <span>
    Source code: <a
      class="text-link"
      target="_blank"
      rel="noopener noreferrer"
      href="https://github.com/SangeloDev/penflow">
      GitHub
    </a>
  </span>
</SettingsItem>
