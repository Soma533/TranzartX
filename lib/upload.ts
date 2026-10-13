import { createClient } from "@/lib/supabase/client";

export type UploadBucket = "artworks" | "avatars" | "messages";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_FILE = 25 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a"];
const ALL_TYPES = [...IMAGE_TYPES, ...AUDIO_TYPES, "application/pdf", "text/plain", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

/** Upload a file via a signed URL and return its public URL. Throws with a user-facing message. */
export async function uploadFile(
  file: File,
  bucket: UploadBucket = "artworks",
  opts: { kind?: "image" | "audio" | "file" } = {}
): Promise<string> {
  const kind = opts.kind ?? "image";
  const limit = kind === "image" ? MAX_IMAGE : MAX_FILE;
  if (!ALL_TYPES.includes(file.type)) {
    throw new Error(
      kind === "audio"
        ? "Unsupported recording format."
        : "Use an image, PDF, document or plain text file."
    );
  }
  if (file.size > limit) {
    throw new Error(kind === "image" ? "Image must be under 8 MB." : "File must be under 25 MB.");
  }
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";

  const sign = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, ext })
  });
  if (sign.status === 401) throw new Error("Sign in to send attachments.");
  const sj = (await sign.json().catch(() => null)) as { path?: string; token?: string } | null;
  if (!sign.ok || !sj?.path || !sj?.token) throw new Error("Could not prepare upload. Try again.");

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(sj.path, sj.token, file);
  if (error) throw new Error(error.message || "Upload failed. Try again.");

  const { data } = supabase.storage.from(bucket).getPublicUrl(sj.path);
  return data.publicUrl;
}

/** Image-only upload used by portfolio and avatars. */
export async function uploadImage(file: File, bucket: "artworks" | "avatars" = "artworks"): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  return uploadFile(file, bucket, { kind: "image" });
}