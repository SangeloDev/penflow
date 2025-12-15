<script lang="ts">
  import { version } from "$app/environment";
  import commitHash from "virtual:commit-hash";
  import { m } from "$paraglide/messages";
  import SettingsItem from "./SettingsItem.svelte";
  import IconExternalLink from "lucide-svelte/icons/external-link";
  import IconSource from "lucide-svelte/icons/git-pull-request-arrow";
  import IconCheck from "lucide-svelte/icons/check";
  import IconCopy from "lucide-svelte/icons/copy";
  import { getDeveloperMode, setDeveloperMode } from "$lib/settings/index.svelte";

  let showSuccess = $state(false);
  let showCopied = $state(false);
  let developerMode = $derived(getDeveloperMode());
  let clickCount = $state(0);
  let clickTimer: number | undefined;

  async function handleVersionClick() {
    // Copy version to clipboard (always works)
    const versionText = `${version}${commitHash ? `+${commitHash.slice(0, 7)}` : ""}`;
    try {
      await navigator.clipboard.writeText(versionText);
      showCopied = true;
      setTimeout(() => {
        showCopied = false;
      }, 1500);
    } catch (err) {
      console.error("Failed to copy version:", err);
    }

    // Stop here if developer mode is already enabled
    if (developerMode) return;

    clickCount++;

    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Reset counter after 1 second of inactivity
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 1000) as unknown as number;

    if (clickCount >= 8 && getDeveloperMode() !== true) {
      // Clear the reset timer
      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      setDeveloperMode(true);
      developerMode = true;
      showSuccess = true;
      clickCount = 0;

      setTimeout(() => {
        showSuccess = false;
      }, 2000);
    }
  }

  $effect(() => {
    developerMode = getDeveloperMode();
  });
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
    <button
      class="btn max-w-fit {showSuccess ? 'bg-green-600 text-white hover:bg-green-700' : ''}"
      onclick={handleVersionClick}
    >
      <!-- disabled={developerMode} -->
      {#if showSuccess}
        <IconCheck size={16} />
        {m.settings_about_developerMode_enabled()}
      {:else if showCopied}
        <IconCopy size={16} />
        {m.copied_to_clipboard()}
      {:else}
        <IconSource size={16} />
        {m.settings_about_version()}: {version}{#if commitHash}+{commitHash.slice(0, 7)}{/if}
      {/if}
    </button>
  </div>
</SettingsItem>
