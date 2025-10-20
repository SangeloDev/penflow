<script lang="ts">
  import MarkdownIt from "markdown-it";
  import matter from "gray-matter";
  import hljs from "highlight.js";
  import { full as emoji } from "markdown-it-emoji";
  import checkboxes from "markdown-it-task-checkbox";
  import { alert } from "@mdit/plugin-alert";
  import footnote from "markdown-it-footnote";
  import DOMPurify from "isomorphic-dompurify";
  import { setContent } from "./Editor.svelte.ts";
  import { emojiDefs, emojiShortcuts } from "$lib/editor/emoji.ts";
  import "highlight.js/styles/base16/dracula.min.css";
  import "../../styles/preview.css";

  let {
    content,
    onContentChange,
    onFrontmatterChange,
  }: {
    content: string;
    onContentChange?: (newContent: string) => void;
    onFrontmatterChange?: (data: { [key: string]: any }) => void;
  } = $props();

  let renderedHtml = $derived("");

  // initialise markdown-it instance
  const md = new MarkdownIt("commonmark", {
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (err) {
          throw "failed to run hljs: " + err;
        }
      }

      return ""; // use external default escaping
    },
  });

  // initialise plugins
  md.use(footnote)
    .use(emoji, {
      defs: emojiDefs,
      shortcuts: emojiShortcuts,
    })
    .use(checkboxes, {
      disabled: false,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .use(alert)
    .enable("table")
    .enable("strikethrough");

  // custom emoji renderer
  md.renderer.rules.emoji = (tokens: Array<any>, idx: number) => {
    const token = tokens[idx];
    if (!token?.content) {
      return "";
    }

    const filename = emojiToFilename(token.content);
    const emojiName = token.markup || token.content;

    return `<img src="/assets/emoji/noto/${filename}" alt="${emojiName}" class="emoji" role="img" aria-label="${emojiName}" />`;
  };

  md.core.ruler.push("source_line_injector", addSourceLineNumbers);

  // Helper function to convert emoji character to filename
  function emojiToFilename(emojiChar: string): string {
    const codePoints = [];

    // Convert emoji string to array of codepoints
    for (const char of emojiChar) {
      const codePoint = char.codePointAt(0)!;
      // The noto-emoji SVG files don't include the variation selector in the filename.
      if (codePoint !== 0xfe0f) {
        codePoints.push(codePoint.toString(16));
      }
    }

    // Join with underscore and add prefix
    return `emoji_u${codePoints.join("_")}.svg`;
  }

  function handleCheckboxClick(e: Event) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const line = input.getAttribute("data-source-line");
    if (!line) return;

    const lineNumber = parseInt(line, 10);
    if (isNaN(lineNumber)) return;

    const lines = content.split("\n");
    const currentLine = lines[lineNumber];
    if (!currentLine) return;

    if (currentLine.includes("- [ ]")) {
      lines[lineNumber] = currentLine.replace("- [ ]", "- [x]");
    } else if (currentLine.includes("- [x]")) {
      lines[lineNumber] = currentLine.replace("- [x]", "- [ ]");
    }

    content = lines.join("\n");
    setContent(content);
    onContentChange?.(content);
  }

  function addSourceLineNumbers(state: any) {
    for (const token of state.tokens) {
      if (token.map && token.nesting === 1) {
        token.attrSet("data-source-line", String(token.map[0]));
      }

      if (token.children) {
        for (const child of token.children) {
          if (child.type === "checkbox_input" && token.map) {
            child.attrSet("data-source-line", String(token.map[0]));
          }
        }
      }
    }
  }

  $effect(() => {
    if (typeof content !== "string") {
      console.warn("Preview received invalid content:", content);
      renderedHtml = "<pre style='color:red'>⚠️ Error: Content is not a string.</pre>";
      return;
    }

    try {
      const { data, content: markdownContent } = matter(content);
      renderedHtml = md.render(markdownContent);
      onFrontmatterChange?.(data);
    } catch (err) {
      console.error("Markdown rendering failed:", err);
      renderedHtml = "<pre style='color:red'>⚠️ Error while rendering markdown.</pre>";
    }

    // only use checkbox listener if dom is updated successfully
    setTimeout(() => {
      const checkboxes = document.querySelectorAll("input[type='checkbox'][data-source-line]");
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("click", handleCheckboxClick);
      });
    });
  });
</script>

<div
  class="
  prose
  dark:prose-invert
  prose-pre:prose-code:bg-transparent
  prose-pre:prose-code:px-0
  prose-code:bg-base-400
  prose-code:py-1
  prose-code:px-2
  prose-code:rounded-md
  prose-code:before:content-none
  prose-code:after:content-none
  prose-code:font-medium
  prose-a:text-primary
  prose-a:no-underline
  prose-a:hover:underline
  prose-blockquote:[&>p]:before:content-none
  prose-blockquote:[&>p]:after:content-none
  max-w-none
  flex-1
  p-4
  break-words"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html DOMPurify.sanitize(renderedHtml as string)}
</div>
