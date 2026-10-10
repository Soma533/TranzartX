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
    // Unified search: one box searches every category at once (type=all),
    // tagging each hit so the UI can render the right card.
    if (type === "all") {
      const like = `%${q}%`;
      const [people, artworks, opps, cols] = await Promise.all([
        supabase.from("profiles").select("id,name,role,avatar_url,disciplines,location_country,short_desc,is_verified").ilike("name", like).limit(24),
        supabase.from("artworks").select("id,title,image_url,medium,price_cents,currency,availability,created_at,profiles!artworks_artist_id_fkey(id,name)").ilike("title", like).limit(24),
        supabase.from("opportunities").select("id,title,type,location,deadline").ilike("title", like).limit(12),
        supabase.from("collections").select("id,title,description").ilike("title", like).limit(12)
      ]);
      const err = people.error ?? artworks.error ?? opps.error ?? cols.error;
      if (err) throw err;
      return Response.json({
        results: [
          ...(people.data ?? []).map((p) => ({ ...p, _type: "person" })),
          ...(artworks.data ?? []).map((a) => ({ ...a, _type: "artwork" })),
          ...(opps.data ?? []).map((o) => ({ ...o, _type: "opportunity" })),
          ...(cols.data ?? []).map((c) => ({ ...c, _type: "collection" }))
        ]
      });
    }
    // Role filters for roles without a dedicated branch
    // (artists and galleries keep their original queries).
    const ROLE_FILTERS: Record<string, string> = {
      collectors: "COLLECTOR",
      curators: "CURATOR",
      organizations: "ORG",
      aesthetes: "AESTHETE"
    };
    if (ROLE_FILTERS[type]) {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", ROLE_FILTERS[type])
        .ilike("name", `%${q}%`)
        .limit(24);
      if (country) query = query.eq("location_country", country);
      if (discipline) query = query.overlaps("disciplines", [discipline]);
      const { data, error } = await query;
      if (error) throw error;
      return Response.json({ results: data });
    }
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
    if (type === "people") {
      // Networking search across every role (PRD §18).
      let query = supabase.from("profiles").select("id,name,role,avatar_url,disciplines,location_country").ilike("name", `%${q}%`).limit(24);
      const role = params.get("role") ?? "";
      if (role) query = query.eq("role", role);
      if (discipline) query = query.overlaps("disciplines", [discipline]);
      const { data, error } = await query;
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
    const { data, error } = await supabase.from("artworks").select("*, profiles!inner!artworks_artist_id_fkey(id,name)").ilike("title", `%${q}%`).limit(24);
    if (error) throw error;
    return Response.json({ results: data });
  } catch (err) {
    return apiError("SEARCH", err instanceof Error ? err.message : "failed", 500);
  }
}
