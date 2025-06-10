<script lang="ts">
  import { onMount } from "svelte";
  import "easymde/dist/easymde.min.css";
  import "../../styles/editor.css";
  import hljs from "highlight.js";

  let content = $state("");
  let textareaElement: HTMLElement;
  let editorInstance: any;

  onMount(async () => {
    // dynamically import easymde
    const EasyMDE = (await import("easymde")).default;

    // ensure the textarea element is in the dom
    if (textareaElement) {
      editorInstance = new EasyMDE({
        element: textareaElement,
        initialValue: content,
        autofocus: true,
        // toolbar: false,
        spellChecker: false, // disable to avoid red underlines
        status: ["lines", "words"], // clean up the status bar
        placeholder: "Let your mind flow...",
        lineWrapping: true,
        previewClass: "main-editor-preview",
        unorderedListStyle: "-",
        hideIcons: ["fullscreen", "side-by-side"],
        shortcuts: {
          drawImage: "Ctrl-Alt-K",
          drawTable: "Ctrl-Alt-T",
        },
        renderingConfig: {
          codeSyntaxHighlighting: true,
          hljs: hljs,
          markedOptions: {
            gfm: true,
          },
        },
      });

      // sync changes from the editor back to our svelte state
      editorInstance.codemirror.on("change", () => {
        content = editorInstance?.value();
      });
    }

    // cleanup when the component is destroyed
    return () => {
      editorInstance?.toTextArea();
      editorInstance = undefined;
    };
  });
</script>

<textarea bind:this={textareaElement}></textarea>
