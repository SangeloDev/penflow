import type { ToolbarItem } from ".";

interface Options {
  version: number;
  general: {
    visited: string; // whether or not penflow has been initialised
    editor: {
      toolbarItems: ToolbarItem[];
    };
  };
  appearance: {
    editor: {
      wrapping: boolean;
    };
  };
}

export type { Options };
