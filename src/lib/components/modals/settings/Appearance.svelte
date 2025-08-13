<script lang="ts">
  import { setMode, mode, type SystemModeValue } from "mode-watcher";
  import { Sun, Moon, RotateCcw } from "lucide-svelte";

  let selectedTheme: SystemModeValue | "system" = $state(mode.current);
  let lastTheme: SystemModeValue | "system" = $state(undefined);

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

<div class="flex flex-col gap-2">
  <div class="flex gap-2">
    <!-- Light Theme -->
    <input
      class="peer/light hidden"
      type="radio"
      id="light-theme"
      name="theme"
      value="light"
      bind:group={selectedTheme} />
    <label
      for="light-theme"
      class="peer-checked/light:border-primary border-base-500 flex size-10 cursor-pointer items-center justify-center rounded-full border bg-white text-black peer-checked/light:border-2">
      <Sun class="size-6" />
      <span class="sr-only">Light</span>
    </label>

    <!-- Dark Theme -->
    <input class="peer/dark hidden" type="radio" id="dark-theme" name="theme" value="dark" bind:group={selectedTheme} />
    <label
      for="dark-theme"
      class="peer-checked/dark:border-primary border-base-500 flex size-10 cursor-pointer items-center justify-center rounded-full border bg-gray-800 text-white peer-checked/dark:border-2">
      <Moon class="size-6" />
      <span class="sr-only">Dark</span>
    </label>
  </div>

  <input
    class="peer/system hidden"
    type="radio"
    id="system-theme"
    name="theme"
    value="system"
    disabled={selectedTheme === "system" || !selectedTheme}
    bind:group={selectedTheme} />
  <label
    for="system-theme"
    class="btn flex w-fit items-center gap-1 select-none"
    aria-disabled={selectedTheme === "system" || !selectedTheme}>
    <RotateCcw size={16} />
    Reset to system preferences
  </label>
</div>
