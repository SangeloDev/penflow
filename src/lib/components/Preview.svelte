<script lang="ts">
  import MarkdownIt from "markdown-it";
  import DOMPurify from "isomorphic-dompurify";
  import "highlight.js/styles/base16/dracula.min.css";
  import hljs from "highlight.js";
  import { full as emoji } from "markdown-it-emoji";
  import twemoji from "@twemoji/api";
  import checkboxes from "markdown-it-task-checkbox";

  let { content }: { content: string } = $props();
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
      disabled: true,
      divWrap: false,
      divClass: "checkbox",
      idPrefix: "cbx_",
      ulClass: "task-list",
      liClass: "task-list-item",
    })
    .enable("table")
    .enable("strikethrough");

  function addSourceLineNumbers(state: any) {
    for (const token of state.tokens) {
      if (token.map && token.nesting === 1) {
        token.attrSet("data-source-line", String(token.map[0]));
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
    renderedHtml = md.render(content);
  });
</script>

<div class="prose max-w-none flex-1 p-4 break-words">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html DOMPurify.sanitize(renderedHtml as string)}
</div>
