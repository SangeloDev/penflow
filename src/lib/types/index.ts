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

export interface MarkdownFile {
  filename: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  visitedAt: number;
  tags: string;
}
