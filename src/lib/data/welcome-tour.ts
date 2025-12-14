import { getLocale } from "$paraglide/runtime";

export interface TourStep {
  title: string;
  content: string;
}

// Import all markdown files for all locales using Vite's glob import
const welcomeFiles = import.meta.glob<string>("./welcome-tour/*/01-welcome.md", {
  query: "?raw",
  import: "default",
});
const modesFiles = import.meta.glob<string>("./welcome-tour/*/02-modes.md", {
  query: "?raw",
  import: "default",
});
const emojisFiles = import.meta.glob<string>("./welcome-tour/*/03-emojis.md", {
  query: "?raw",
  import: "default",
});
const offlineFiles = import.meta.glob<string>("./welcome-tour/*/04-offline.md", {
  query: "?raw",
  import: "default",
});
const gettingStartedFiles = import.meta.glob<string>("./welcome-tour/*/99-getting-started.md", {
  query: "?raw",
  import: "default",
});

// Cache for loaded content
let cachedLocale: string | null = null;
let cachedContent: { [key: string]: string } = {};

async function loadContentForLocale(locale: string): Promise<{ [key: string]: string }> {
  // Use cached content if locale hasn't changed
  if (cachedLocale === locale && Object.keys(cachedContent).length > 0) {
    return cachedContent;
  }

  const content: { [key: string]: string } = {};

  try {
    // Try to load files for the current locale
    const welcomePath = `./welcome-tour/${locale}/01-welcome.md`;
    const modesPath = `./welcome-tour/${locale}/02-modes.md`;
    const emojisPath = `./welcome-tour/${locale}/03-emojis.md`;
    const offlinePath = `./welcome-tour/${locale}/04-offline.md`;
    const gettingStartedPath = `./welcome-tour/${locale}/99-getting-started.md`;

    content.welcome = await (welcomeFiles[welcomePath]?.() || welcomeFiles["./welcome-tour/en/01-welcome.md"]());
    content.modes = await (modesFiles[modesPath]?.() || modesFiles["./welcome-tour/en/02-modes.md"]());
    content.emojis = await (emojisFiles[emojisPath]?.() || emojisFiles["./welcome-tour/en/03-emojis.md"]());
    content.offline = await (offlineFiles[offlinePath]?.() || offlineFiles["./welcome-tour/en/04-offline.md"]());
    content.gettingStarted = await (gettingStartedFiles[gettingStartedPath]?.() ||
      gettingStartedFiles["./welcome-tour/en/99-getting-started.md"]());

    // Cache the loaded content
    cachedLocale = locale;
    cachedContent = content;

    return content;
  } catch (error) {
    console.error(`Failed to load welcome tour content for locale ${locale}:`, error);
    // Fallback to English if loading fails
    if (locale !== "en") {
      return loadContentForLocale("en");
    }
    throw error;
  }
}

export async function getWelcomeTourData(): Promise<TourStep[]> {
  const locale = getLocale();
  const content = await loadContentForLocale(locale);

  // Import translations dynamically
  const { m } = await import("$paraglide/messages.js");

  return [
    {
      title: m.welcome_tour_title_welcome(),
      content: content.welcome,
    },
    {
      title: m.welcome_tour_title_modes(),
      content: content.modes,
    },
    {
      title: m.welcome_tour_title_emojis(),
      content: content.emojis,
    },
    {
      title: m.welcome_tour_title_offline(),
      content: content.offline,
    },
    {
      title: m.welcome_tour_title_gettingStarted(),
      content: content.gettingStarted,
    },
  ];
}

// For backward compatibility and SSR support
// This will be loaded eagerly on the server
export const welcomeTourData: TourStep[] = [];
