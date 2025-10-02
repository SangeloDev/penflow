<script lang="ts">
  import { settings } from "./Settings.svelte.ts";

  // import General from "./settings/General.svelte";
  // import Home from "./settings/Home.svelte";
  import Appearance from "./settings/Appearance.svelte";
  // import LanguageAndRegion from "./settings/LanguageAndRegion.svelte";
  // import Accessibility from "./settings/Accessibility.svelte";
  // import Plugins from "./settings/Plugins.svelte";
  import About from "./settings/About.svelte";
  // import { AccessibilityIcon, ChevronRight, Globe, House, Info, Paintbrush, Puzzle, Wrench } from "lucide-svelte";
  import { ChevronRight, Info, Paintbrush } from "lucide-svelte";

  interface TabItem {
    id: string;
    name: string;
    icon: any;
    component?: any;
    href?: string;
  }

  const data: {
    nav: TabItem[];
    footer: TabItem[];
  } = {
    nav: [
      // { id: "general", name: "General", icon: Wrench, component: General },
      { id: "appearance", name: "Appearance", icon: Paintbrush, component: Appearance },
      // { id: "languageAndRegion", name: "Language & region", icon: Globe, component: LanguageAndRegion },
      // { id: "accessibility", name: "Accessibility", icon: AccessibilityIcon, component: Accessibility },
      // { id: "plugins", name: "Plugins", icon: Puzzle, component: Plugins },
    ],
    footer: [{ id: "about", name: "About", icon: Info, component: About }],
  };

  let current: TabItem = $state(data.nav[0]);
  let initialized = $state(false);

  $effect(() => {
    // access settings to track as a dependency
    const snapshot = settings;
    if (!initialized) {
      initialized = true;
      return;
    }
    localStorage.setItem("penflow.settings", JSON.stringify(snapshot));
  });
</script>

<div class="flex flex-row gap-4 lg:grid-cols-2">
  <div class="border-base-300 flex min-w-1/5 flex-col gap-1 border-r pr-4">
    {#each data.nav as item (item.id)}
      {@const Icon = item.icon}
      <button class="btn" onclick={() => (current = item)} aria-pressed={current.id === item.id}>
        {#if item.icon}
          <Icon size={16} />
        {/if}
        {item.name}
      </button>
    {/each}
    <div class="mt-auto flex flex-col gap-1">
      {#each data.footer as item (item.id)}
        {@const Icon = item.icon}
        <button class="btn" onclick={() => (current = item)} aria-pressed={current.id === item.id}>
          {#if item.icon}
            <Icon size={16} />
          {/if}
          {item.name}
        </button>
      {/each}
    </div>
  </div>
  <div class="flex min-h-[600px] w-full flex-1 flex-col overflow-hidden">
    <header class="flex shrink-0 items-center gap-2 px-4">
      <span class="opacity-65">Settings</span>
      <ChevronRight size={16} class="opacity-65" />
      <span>{current.name}</span>
    </header>
    <div class="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
      {#if current.component}
        {@const SettingsPage = current.component}
        <SettingsPage />
      {/if}
    </div>
  </div>
</div>
