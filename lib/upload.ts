import { createClient } from "@/lib/supabase/client";

export type UploadBucket = "artworks" | "avatars" | "messages";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_FILE = 25 * 1024 * 1024;

const DOC_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

/** Strips codec/parameter suffixes: "audio/webm;codecs=opus" -> "audio/webm". */
function baseType(mime: string): string {
  return (mime.split(";")[0] ?? "").trim().toLowerCase();
}

/**
 * Accepts a whole family (image/*, audio/*) rather than an exact list.
 * MediaRecorder reports codec parameters ("audio/webm;codecs=opus") that no
 * static list can predict, so matching the base type is the reliable test.
 */
function typeAllowed(mime: string, kind: "image" | "audio" | "file"): boolean {
  const t = baseType(mime);
  if (kind === "image") return t.startsWith("image/");
  if (kind === "audio") return t.startsWith("audio/");
  return t.startsWith("image/") || t.startsWith("audio/") || DOC_TYPES.has(t);
}

/** Extension used when the picked file has no usable name (voice recordings). */
const EXT_FOR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "application/pdf": "pdf",
  "text/plain": "txt"
};

/** Upload a file via a signed URL and return its public URL. Throws with a user-facing message. */
export async function uploadFile(
  file: File,
  bucket: UploadBucket = "artworks",
  opts: { kind?: "image" | "audio" | "file" } = {}
): Promise<string> {
  const kind = opts.kind ?? "image";
  const limit = kind === "image" ? MAX_IMAGE : MAX_FILE;
  if (!typeAllowed(file.type, kind)) {
    throw new Error(
      kind === "audio"
        ? "This browser recorded an audio format we can't send."
        : "Use an image, audio, PDF, document or plain text file."
    );
  }
  if (file.size > limit) {
    throw new Error(kind === "image" ? "Image must be under 8 MB." : "File must be under 25 MB.");
  }
  const fromName = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const ext = fromName || EXT_FOR[baseType(file.type)] || "bin";

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
  if (!typeAllowed(file.type, "image")) throw new Error("Use a JPG, PNG or WebP image.");
  return uploadFile(file, bucket, { kind: "image" });
}