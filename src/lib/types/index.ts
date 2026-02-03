import type { Component } from "svelte";

export type BlockType = "paragraph" | "h1" | "h2";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

export interface ToolbarItem {
  id: string;
  order?: number;
  title?: string;
  action?: (textarea: HTMLTextAreaElement | undefined) => void;
  icon?: Component;
  enabled: boolean;
}

export interface Hotkey {
  id: number;
  desc: string | null;
  shortcut?: string;
  key?: string;
  hidden?: boolean;
  action: (arg0: any) => void;
}

/**
 * @deprecated Use MarkdownFile from '$lib/types/database' instead
 * This interface is kept for backwards compatibility only
 */
export interface MarkdownFile {
  id?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  visitedAt: number;
  title?: string;
  tags?: string;
}

// Re-export database types
export * from "./database";
