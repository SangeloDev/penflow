import type { ToolbarItem } from ".";

type SortBy = "createdAt" | "updatedAt" | "visitedAt" | "name";
type SortOrder = "asc" | "desc";

interface Options {
  version: number;
  general: {
    visited: boolean; // whether or not penflow has been initialised
    developer: boolean;
    editor: {
      toolbarItems: ToolbarItem[];
    };
    library: {
      sort: {
        by: SortBy;
        order: SortOrder;
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

/** Permissive shape for incoming payloads read from storage */
interface OptionsLike {
  version?: number;
  general?: {
    visited?: boolean | string | null;
    developer?: boolean;
    editor?: {
      toolbarItems?: Partial<ToolbarItem>[] | undefined;
    };
    library?: {
      sort?: {
        by?: SortBy;
        order?: SortOrder;
      };
    };
  };
  appearance?: {
    editor?: {
      wrapping?: boolean;
    };
  };
  i18n?: {
    language?: string;
  };
}

export type { Options, OptionsLike, SortBy, SortOrder };
