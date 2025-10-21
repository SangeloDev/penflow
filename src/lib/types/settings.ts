import type { ToolbarItem } from ".";

interface Options {
  version: number;
  general: {
    visited: string; // whether or not penflow has been initialised
    editor: {
      toolbarItems: ToolbarItem[];
    };
    library: {
      sort: {
        by: "createdAt" | "updatedAt" | "visitedAt" | "name";
        order: "asc" | "desc";
      };
    };
  };
  appearance: {
    editor: {
      wrapping: boolean;
    };
  };
  i18n: {
    language: string;
  };
}

export type { Options };
