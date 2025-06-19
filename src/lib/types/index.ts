import type { ComponentType } from "svelte";

export type BlockType = "paragraph" | "h1" | "h2";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

export interface ToolbarItem {
  id: number;
  title?: string;
  action?: (textarea: HTMLTextAreaElement | undefined) => void;
  icon?: ComponentType;
  enabled: boolean;
}
