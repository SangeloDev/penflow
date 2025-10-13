declare module "markdown-it-task-checkbox" {
  import type MarkdownIt from "markdown-it";
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module "markdown-it-emoji" {
  import MarkdownIt from "markdown-it";
  export const full: MarkdownIt.PluginSimple;
}

declare module "virtual:commit-hash" {
  const commitHash: string;
  export default commitHash;
}
