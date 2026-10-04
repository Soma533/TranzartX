import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Upload a file via signed URL and return its public URL. Throws with a user-facing message. */
export async function uploadImage(
  file: File,
  bucket: "artworks" | "avatars" = "artworks"
): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 8 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const sign = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, ext })
  });
  if (sign.status === 401) throw new Error("Sign in to upload images.");
  const sj = (await sign.json().catch(() => null)) as { path?: string; token?: string } | null;
  if (!sign.ok || !sj?.path || !sj?.token) throw new Error("Could not prepare upload. Try again.");

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(sj.path, sj.token, file);
  if (error) throw new Error(error.message || "Upload failed. Try again.");

  const { data } = supabase.storage.from(bucket).getPublicUrl(sj.path);
  return data.publicUrl;
}
