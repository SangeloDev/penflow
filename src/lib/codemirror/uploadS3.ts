import { EditorView } from "@codemirror/view";
import { settings } from "$lib/components/modals/Settings.svelte.ts";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

function createS3Client(): S3Client | null {
  const { endpoint, accessKey, secretKey, region } = settings.general.s3;
  if (!endpoint || !accessKey || !secretKey || !region) {
    return null;
  }
  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });
}

function getPublicUrl(fileName: string): string {
  const { endpoint, bucket } = settings.general.s3;
  const encodedFileName = encodeURIComponent(fileName);

  // If bucket is provided, include it in the path
  const bucketPath = bucket ? `${bucket}/` : "";
  const baseUrl = endpoint?.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

  return `${baseUrl}/${bucketPath}images/${encodedFileName}`;
}

async function uploadImageToS3(file: File): Promise<string> {
  const { bucket } = settings.general.s3;

  const s3Client = createS3Client();
  if (!s3Client) {
    throw new Error("S3 client configuration incomplete");
  }

  const fileName = file.name;
  const key = `images/${fileName}`;
  const fileBuffer = await file.arrayBuffer();

  // Use bucket if provided, otherwise rely on endpoint configuration
  const bucketName = bucket || "default"; // You might want to handle this differently

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: file.type,
    ACL: "public-read",
  });

  try {
    await s3Client.send(command);
    return getPublicUrl(fileName);
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function validateS3Configuration(): string | null {
  const { endpoint, accessKey, secretKey, region } = settings.general.s3;
  if (!endpoint) return "S3 endpoint not configured";
  if (!accessKey) return "S3 access key not configured";
  if (!secretKey) return "S3 secret key not configured";
  if (!region) return "S3 region not configured";
  // Bucket is now optional - removed bucket validation
  return null;
}

function handleImageUpload(imageFile: File, view: EditorView, insertPos: number) {
  const configError = validateS3Configuration();
  if (configError) {
    alert(`Image upload failed: ${configError}. Please configure S3 settings.`);
    return;
  }

  const placeholder = insertImagePlaceholder(view, imageFile.name, insertPos);
  uploadImageToS3(imageFile)
    .then((url) => replaceImagePlaceholder(view, placeholder, url))
    .catch((err) => {
      console.error("Upload error:", err);
      alert("Image upload failed: " + err.message);
      replaceImagePlaceholder(view, placeholder, "");
    });
}

export const imagePasteDrop = EditorView.domEventHandlers({
  paste(event, view) {
    const files = Array.from(event.clipboardData?.files ?? []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));
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
      const dropPos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      const insertPos = dropPos !== null ? dropPos : view.state.selection.main.from;
      handleImageUpload(imageFile, view, insertPos);
    }
  },
});
