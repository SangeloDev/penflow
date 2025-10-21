<script lang="ts">
  import { setMode, mode, type SystemModeValue } from "mode-watcher";
  import { getLineWrappingEnabled, setLineWrappingEnabled } from "$lib/settings.svelte.ts";
  import { Sun, Moon, RotateCcw } from "lucide-svelte";
  import SettingsItem from "./SettingsItem.svelte";
  import ToggleSwitch from "$lib/components/ui/ToggleSwitch.svelte";
  import { m } from "$paraglide/messages";

  let selectedTheme: SystemModeValue | "system" = $state(mode.current);
  let lastTheme: SystemModeValue | "system" = $state(undefined);
  let lineWrapping: boolean = $derived(getLineWrappingEnabled());

  $effect(() => {
    if (selectedTheme !== lastTheme) {
      if (selectedTheme) {
        setMode(selectedTheme);
        console.debug(selectedTheme + " " + mode.current); // TODO: why do I need this to not break switching?!
      }
    }
    lastTheme = selectedTheme;
  });
</script>

<SettingsItem>
  {#snippet title()}{m.settings_appearance_themeItem_title()}{/snippet}
  {#snippet description()}{m.settings_appearance_themeItem_description()}{/snippet}
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <input
        class="peer/light hidden"
        type="radio"
        id="light-theme"
        name="theme"
        value="light"
        bind:group={selectedTheme}
      />
      <label
        for="light-theme"
        class="peer-checked/light:border-primary border-base-500 flex size-10 cursor-pointer items-center justify-center rounded-full border bg-white text-black peer-checked/light:border-2"
        title={m.settings_appearance_themeItem_lightMode()}
      >
        <Sun class="size-6" />
        <span class="sr-only">{m.settings_appearance_themeItem_lightMode()}</span>
      </label>

      <input
        class="peer/dark hidden"
        type="radio"
        id="dark-theme"
        name="theme"
        value="dark"
        bind:group={selectedTheme}
      />
      <label
        for="dark-theme"
        class="peer-checked/dark:border-primary border-base-500 flex size-10 cursor-pointer items-center justify-center rounded-full border bg-gray-800 text-white peer-checked/dark:border-2"
        title={m.settings_appearance_themeItem_darkMode()}
      >
        <Moon class="size-6" />
        <span class="sr-only">{m.settings_appearance_themeItem_darkMode()}</span>
      </label>
    </div>

    <input
      class="peer/system hidden"
      type="radio"
      id="system-theme"
      name="theme"
      value="system"
      disabled={selectedTheme === "system" || !selectedTheme}
      bind:group={selectedTheme}
    />
    <label
      for="system-theme"
      class="btn flex w-fit items-center gap-1 select-none"
      aria-disabled={selectedTheme === "system" || !selectedTheme}
    >
      <RotateCcw size={16} />
      {m.settings_appearance_themeItem_resetButton()}
    </label>
  </div>
</SettingsItem>

<SettingsItem>
  {#snippet title()}{m.settings_appearance_editorItem_title()}{/snippet}
  {#snippet description()}{m.settings_appearance_editorItem_description()}{/snippet}

  <div class="flex items-center gap-4">
    <ToggleSwitch id="line-wrapping" checked={lineWrapping} onchange={() => setLineWrappingEnabled(!lineWrapping)} />

    <div class="flex flex-col justify-center gap-0">
      <label class="font-medium" for="line-wrapping">{m.settings_appearance_editorItem_lineWrapping_title()}</label>
      <label for="line-wrapping">{m.settings_appearance_editorItem_lineWrapping_description()}</label>
    </div>
  </div>
</SettingsItem>
