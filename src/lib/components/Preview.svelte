<script lang="ts">
  import MarkdownIt from "markdown-it";
  import hljs from "highlight.js";
  import { full as emoji } from "markdown-it-emoji";
  import checkboxes from "markdown-it-task-checkbox";
  import { alert } from "@mdit/plugin-alert";
  import footnote from "markdown-it-footnote";
  import twemoji from "@twemoji/api";
  import DOMPurify from "isomorphic-dompurify";
  import { setContent } from "./Editor.svelte.ts";
  import "highlight.js/styles/base16/dracula.min.css";
  import "../../styles/preview.css";
  let {
    content,
    onContentChange,
  }: {
    content: string;
    onContentChange?: (newContent: string) => void;
  } = $props();
  let renderedHtml = $derived("");

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
  })
    .use(emoji)
    .use(checkboxes, {
      disabled: false,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .use(alert)
    .use(footnote)
    .enable("table")
    .enable("strikethrough");

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

  md.core.ruler.push("source_line_injector", addSourceLineNumbers);

  md.renderer.rules.emoji = (token: Array<any>, idx: number) => {
    return twemoji.parse(token[idx].content, {
      folder: "svg",
      ext: ".svg",
    });
  };

  $effect(() => {
    if (typeof content !== "string") {
      console.warn("Preview received invalid content:", content);
      renderedHtml = "<pre style='color:red'>⚠️ Error: Content is not a string.</pre>";
      return;
    }

    try {
      renderedHtml = md.render(content);
    } catch (err) {
      console.error("Markdown rendering failed:", err);
      renderedHtml = "<pre style='color:red'>⚠️ Error while rendering markdown.</pre>";
    }

    // only use checkbox listener if dom is updated successfully
    setTimeout(() => {
      const checkboxes = document.querySelectorAll("input[type='checkbox'][data-source-line]");
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("click", (e) => {
          e.preventDefault();
          const input = e.target as HTMLInputElement;
          const line = input.getAttribute("data-source-line");
          if (!line) return;

          const lineNumber = parseInt(line);
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
        });
      });
    });
  });
</script>

<div
  class="
  prose
  prose-pre:prose-code:bg-transparent
  prose-pre:prose-code:px-0
  prose-code:bg-gray-300
  prose-code:py-1
  prose-code:px-2
  prose-code:rounded-sm
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
  break-words">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html DOMPurify.sanitize(renderedHtml as string)}
</div>
