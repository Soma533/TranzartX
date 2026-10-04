import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

/** Signed upload URL for artwork/avatars via Supabase Storage. */
export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;
  const body = (await request.json().catch(() => null)) as { bucket?: string; ext?: string } | null;
  const bucket = body?.bucket === "avatars" ? "avatars" : "artworks";
  const ext = (body?.ext ?? "jpg").replace(/[^a-z]/gi, "").slice(0, 4) || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) return apiError("UPLOAD", error.message, 500);
  return Response.json({ path, token: data.token, bucket });
}
