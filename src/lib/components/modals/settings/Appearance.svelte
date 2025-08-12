<script>
  import { Moon, RotateCcw, Sun } from "lucide-svelte";
  import SettingsItem from "./SettingsItem.svelte";
</script>

<SettingsItem>
  {#snippet title()}
    Theme
  {/snippet}
  {#snippet description()}
    Choose your preferred UI theme (currently does nothing).
  {/snippet}
  <div class="flex flex-col gap-2">
    <div class="flex gap-2">
      <input class="hidden" type="radio" id="light-theme" name="theme" value="light" checked />
      <label
        class="flex size-10 cursor-pointer items-center justify-center rounded-full border border-gray-500 bg-white"
        for="light-theme">
        <Sun class="size-6" />
        <span class="sr-only">Light</span>
      </label>
      <input class="hidden" type="radio" id="dark-theme" name="theme" value="dark" checked />
      <label
        class="flex size-10 cursor-pointer items-center justify-center rounded-full border border-gray-500 bg-gray-800 text-base"
        for="dark-theme">
        <Moon class="size-6" />
        <span class="sr-only">Dark</span>
      </label>
    </div>
    <button class="btn w-fit"><RotateCcw size={16} /> Reset to system preferences</button>
  </div>
</SettingsItem>
