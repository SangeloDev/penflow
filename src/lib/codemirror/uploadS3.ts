import { EditorView } from "@codemirror/view";
import { settings } from "$lib/components/modals/Settings.svelte.ts";

function insertImagePlaceholder(view: EditorView, fileName: string, from: number) {
  const placeholder = `![Uploading ${fileName}...]()`;
  view.dispatch({
    changes: { from, insert: placeholder },
  });
  return placeholder;
}

function replaceImagePlaceholder(view: EditorView, placeholder: string, url: string) {
  const state = view.state;
  const pos = state.doc.toString().indexOf(placeholder);
  if (pos !== -1) {
    view.dispatch({
      changes: {
        from: pos,
        to: pos + placeholder.length,
        insert: `![](${url})`,
      },
    });
  }
}

function uploadImageToS3(file: File): Promise<string> {
  const fileName = encodeURIComponent(file.name);
  const url = settings.general.s3AttachmentEndpoint + "/images/" + fileName; // URL for uploading to S3 bucket
  return fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  }).then((response) => {
    if (!response.ok) throw new Error("Upload failed");
    return url; // This is the public URL
  });
}

function handleImageUpload(imageFile: File, view: EditorView, insertPos: number) {
  // Check if S3 endpoint is configured
  if (!settings.general.s3AttachmentEndpoint) {
    alert("Image upload failed: No S3 attachment endpoint configured. Please set an endpoint in settings.");
    return;
  }

  const placeholder = insertImagePlaceholder(view, imageFile.name, insertPos);
  uploadImageToS3(imageFile)
    .then((url) => replaceImagePlaceholder(view, placeholder, url))
    .catch((err) => alert("Image upload failed: " + err.message));
}

export const imagePasteDrop = EditorView.domEventHandlers({
  paste(event, view) {
    const files = Array.from(event.clipboardData?.files ?? []);
    const imageFile = files.find((f) => f.type.startsWith("image/")); // detect if the file is an image
    if (imageFile) {
      event.preventDefault();
      handleImageUpload(imageFile, view, view.state.selection.main.from);
    }
  },
  drop(event, view) {
    const files = Array.from(event.dataTransfer?.files ?? []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (imageFile) {
      event.preventDefault();
      // For drop, use drop position instead of cursor position
      const dropPos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      const insertPos = dropPos !== null ? dropPos : view.state.selection.main.from;
      handleImageUpload(imageFile, view, insertPos);
    }
  },
});
