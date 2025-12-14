<script lang="ts">
  import { version } from "$app/environment";
  import commitHash from "virtual:commit-hash";
  import { m } from "$paraglide/messages";
  import SettingsItem from "./SettingsItem.svelte";
  import IconExternalLink from "lucide-svelte/icons/external-link";
  import IconSource from "lucide-svelte/icons/git-pull-request-arrow";
</script>

<SettingsItem>
  {#snippet title()}{m.settings_about_title()}{/snippet}
  <div class="mb-2 flex items-center gap-2">
    <img class="size-20 select-none" src="/assets/icon/hd_hi.ico" alt="Penflow Logo" draggable="false" />
    <div class="flex flex-col gap-1">
      <p class="text-3xl font-black">{m.settings_about_project_name()}</p>
      <p>{m.settings_about_project_slogan()}</p>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <a class="btn max-w-fit" target="_blank" rel="noopener noreferrer" href="https://github.com/SangeloDev/penflow">
      <IconExternalLink size={16} />
      {m.settings_about_sourceCode()}
    </a>
    <button class="btn max-w-fit">
      <IconSource size={16} />
      {m.settings_about_version()}: {version}{#if commitHash}+{commitHash.slice(0, 7)}{/if}
    </button>
  </div>
</SettingsItem>
