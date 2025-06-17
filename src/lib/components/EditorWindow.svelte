<script lang="ts">
  import { onMount } from "svelte";
  import "easymde/dist/easymde.min.css";
  import "../../styles/editor.css";
  import hljs from "highlight.js";

  let content = $state("");
  let isDirty = $state(false);
  let activeFilename: string | null = $state(null);
  let textareaElement: HTMLElement;
  let fileInput: HTMLInputElement; // for the fallback method
  let editorInstance: any;

  let documentTitle = $derived(() => {
    const dirtyIndicator = isDirty ? "* " : "";
    let fileName = activeFilename;

    if (!fileName) {
      const generated = generateFilename(content);
      fileName = generated !== "note.md" ? generated : "Untitled";
    }

    return `${dirtyIndicator}${fileName}`;
  });

  /**
   * Creates a sanitized filename from the first H1 heading in the content.
   * Falls back to "note.md" if no heading is found.
   * @param markdownContent The full markdown text.
   * @returns A safe filename string ending in .md.
   */
  function generateFilename(markdownContent: string): string {
    const headingMatch = markdownContent.match(/^# (.*)/m);
    let baseName = "note";

    if (headingMatch && headingMatch[1]) {
      baseName = headingMatch[1].trim();
    }

    const sanitizedName = baseName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return (sanitizedName || "note") + ".md";
  }

  /**
   * Prompts the user to download the current editor content.
   */
  function saveFile() {
    if (!content) return;
    const filename = activeFilename ?? generateFilename(content);
    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    activeFilename = filename;
    isDirty = false;
  }

  /**
   * Updates the editor and state with new file content.
   * @param fileContent The text content of the file.
   * @param fileName The name of the file.
   */
  function loadFileContent(fileContent: string, fileName: string) {
    if (editorInstance) {
      editorInstance.value(fileContent);
    }
    activeFilename = fileName;
    isDirty = false;
  }

  /**
   * Handles file selection from the hidden input (fallback method).
   * @param event The change event from the file input.
   */
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newContent = e.target?.result as string;
      loadFileContent(newContent, file.name);
    };
    reader.readAsText(file);
    input.value = ""; // reset to allow opening the same file again
  }

  /**
   * Opens a file dialog using the best available browser API.
   */
  async function openFile() {
    if (isDirty && !confirm("You have unsaved changes. Discard them and open the file?")) {
      return;
    }

    // feature detection: use modern api if available
    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Markdown",
              accept: { "text/markdown": [".md"] },
            },
          ],
        });
        const file = await fileHandle.getFile();
        const newContent = await file.text();
        loadFileContent(newContent, file.name);
      } catch (err: any) {
        // do nothing if the user cancels the dialog
        if (err.name !== "AbortError") {
          console.error("error opening file:", err);
        }
      }
    } else {
      // fallback for older browsers (firefox, safari)
      fileInput.click();
    }
  }

  onMount(async () => {
    const EasyMDE = (await import("easymde")).default;

    if (textareaElement) {
      editorInstance = new EasyMDE({
        element: textareaElement,
        initialValue: content,
        autofocus: true,
        spellChecker: false,
        status: ["lines", "words"],
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
          markedOptions: { gfm: true },
        },
      });

      editorInstance.codemirror.on("change", () => {
        content = editorInstance?.value();
        isDirty = true;
      });

      editorInstance.codemirror.setOption("extraKeys", {
        "Cmd-S": saveFile,
        "Ctrl-S": saveFile,
        "Cmd-O": openFile,
        "Ctrl-O": openFile,
      });
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      editorInstance?.toTextArea();
      editorInstance = undefined;
    };
  });
</script>

<svelte:head>
  <title>{documentTitle()} - Penflow</title>
</svelte:head>

<input
  type="file"
  bind:this={fileInput}
  onchange={handleFileSelect}
  style="display: none;"
  accept=".md, text/markdown" />

<textarea bind:this={textareaElement}></textarea>
