import { requireUser } from "@/services/auth-guard";
import { apiError } from "@/lib/logger";

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;
  const params = new URL(request.url).searchParams;
  const type = params.get("type") ?? "artwork";
  const q = (params.get("q") ?? "").slice(0, 80);
  const country = params.get("country") ?? "";
  const discipline = params.get("discipline") ?? "";
  try {
    if (type === "artists") {
      let query = supabase.from("profiles").select("*").eq("role", "ARTIST").ilike("name", `%${q}%`).limit(24);
      if (country) query = query.eq("location_country", country);
      if (discipline) query = query.overlaps("disciplines", [discipline]);
      const { data, error } = await query;
      if (error) throw error;
      return Response.json({ results: data });
    }
    if (type === "galleries") {
      const { data, error } = await supabase.from("profiles").select("*").eq("role", "GALLERY").ilike("name", `%${q}%`).limit(24);
      if (error) throw error;
      return Response.json({ results: data });
    }
    if (type === "opportunities") {
      let query = supabase.from("opportunities").select("*").ilike("title", `%${q}%`).limit(24);
      if (discipline) query = query.overlaps("disciplines", [discipline]);
      const { data, error } = await query;
      if (error) throw error;
      return Response.json({ results: data });
    }
    if (type === "collections") {
      const { data, error } = await supabase.from("collections").select("*").ilike("title", `%${q}%`).limit(24);
      if (error) throw error;
      return Response.json({ results: data });
    }
    const { data, error } = await supabase.from("artworks").select("*, profiles!inner(id,name)").ilike("title", `%${q}%`).limit(24);
    if (error) throw error;
    return Response.json({ results: data });
  } catch (err) {
    return apiError("SEARCH", err instanceof Error ? err.message : "failed", 500);
  }
}
