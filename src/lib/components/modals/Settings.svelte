<script lang="ts">
  import { settings } from "$lib/settings/index.svelte.ts";
  import { m } from "$paraglide/messages";

  import General from "./settings/General.svelte";
  import Appearance from "./settings/Appearance.svelte";
  import LanguageAndRegion from "./settings/LanguageAndRegion.svelte";
  // import Accessibility from "./settings/Accessibility.svelte";
  // import Plugins from "./settings/Plugins.svelte";
  import Developer from "./settings/Developer.svelte";
  import About from "./settings/About.svelte";
  // import { AccessibilityIcon, Puzzle } from "lucide-svelte";
  import { ChevronRight, Info, Paintbrush, Wrench, Globe, Star } from "lucide-svelte";

  interface TabItem {
    id: string;
    name: string;
    icon: any;
    component?: any;
    href?: string;
  }

  function buildDataObject() {
    const footerItems: TabItem[] = [];

    // only show developer tab if developer mode is enabled
    if (settings.general.developer) {
      footerItems.push({ id: "developer", name: m.settings_developer_section(), icon: Star, component: Developer });
    }

    footerItems.push({ id: "about", name: m.settings_about_section(), icon: Info, component: About });

    return {
      nav: [
        {
          id: "general",
          name: m.settings_general_section(),
          icon: Wrench,
          component: General,
        },
        {
          id: "appearance",
          name: m.settings_appearance_section(),
          icon: Paintbrush,
          component: Appearance,
        },
        {
          id: "languageAndRegion",
          name: m.settings_i18n_section(),
          icon: Globe,
          component: LanguageAndRegion,
        },
        // { id: "accessibility", name: "Accessibility", icon: AccessibilityIcon, component: Accessibility },
        // { id: "plugins", name: "Plugins", icon: Puzzle, component: Plugins },
      ] as TabItem[],
      footer: footerItems, // use filtered items
    };
  }

  let data = $state(buildDataObject());

  $effect(() => {
    // By accessing a message, we ensure the effect re-runs on language change
    m.settings();
    const newData = buildDataObject();
    data.nav = newData.nav;
    data.footer = newData.footer;
  });

  let currentId = $state("general");
  const allItems = $derived([...data.nav, ...data.footer]);
  let current = $derived(allItems.find((item) => item.id === currentId) ?? allItems[0]);
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
      <button class="btn" onclick={() => (currentId = item.id)} aria-pressed={currentId === item.id}>
        {#if item.icon}
          <Icon size={16} />
        {/if}
        {item.name}
      </button>
    {/each}
    <div class="mt-auto flex flex-col gap-1">
      {#each data.footer as item (item.id)}
        {@const Icon = item.icon}
        <button class="btn" onclick={() => (currentId = item.id)} aria-pressed={currentId === item.id}>
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
      <span class="opacity-65">{m.settings()}</span>
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
