<script lang="ts">
  import MarkdownIt from "markdown-it";
  import DOMPurify from "dompurify";
  import "highlight.js/styles/base16/dracula.min.css";
  import hljs from "highlight.js";

  let { content }: { content: string } = $props();
  let renderedHtml = $derived("");

  const md = new MarkdownIt({
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

  function addSourceLineNumbers(state: any) {
    for (const token of state.tokens) {
      if (token.map && token.nesting === 1) {
        token.attrSet("data-source-line", String(token.map[0]));
      }
    }
  }

  md.core.ruler.push("source_line_injector", addSourceLineNumbers);

  $effect(() => {
    renderedHtml = md.render(content);
  });
</script>

<div class="prose max-w-none flex-1 overflow-auto p-4">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html DOMPurify.sanitize(renderedHtml as string)}
</div>

<!-- <script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  let { content }: { content: string } = $props();
  let html = $derived(marked.parse(content));
</script>

<div class="prose max-w-none flex-1 p-4">
  <!-- eslint-disable-next-line svelte/no-at-html-tags
  {@html DOMPurify.sanitize(html as string)}
</div> -->
