import welcomeContent from "./welcome-tour/01-welcome.md?raw";
import modesContent from "./welcome-tour/02-modes.md?raw";
import emojisContent from "./welcome-tour/03-emojis.md?raw";
import offlineContent from "./welcome-tour/04-offline.md?raw";
import gettingStartedContent from "./welcome-tour/99-getting-started.md?raw";

export interface TourStep {
  title: string;
  content: string;
}

export const welcomeTourData: TourStep[] = [
  {
    title: "Welcome to Penflow!",
    content: welcomeContent,
  },
  {
    title: "Getting Started", // Modes
    content: modesContent,
  },
  {
    title: "Getting Started", // Emojis
    content: emojisContent,
  },
  {
    title: "Getting Started", // Offline-First
    content: offlineContent,
  },
  {
    title: "Getting Started", // Create new note
    content: gettingStartedContent,
  },
];
