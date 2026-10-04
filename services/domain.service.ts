/** Profile completeness scorer — PRD §22. */
export function scoreCompleteness(p: {
  avatar_url?: string | null; bio?: string | null; statement?: string | null;
  disciplines?: string[]; mediums?: string[]; career_stage?: string | null;
  artworkCount?: number; hasPrice?: boolean;
}): { pct: number; tips: string[] } {
  let score = 20;
  const tips: string[] = [];
  if (p.avatar_url) score += 10; else tips.push("Add a profile photo");
  if (p.bio) score += 15; else tips.push("Add artist biography");
  if (p.statement) score += 15; else tips.push("Add artist statement");
  if ((p.disciplines?.length ?? 0) > 0) score += 5; else tips.push("Add disciplines");
  if ((p.mediums?.length ?? 0) > 0) score += 5; else tips.push("Add mediums");
  if ((p.artworkCount ?? 0) >= 3) score += 15; else tips.push("Upload at least 3 portfolio pieces");
  if (p.hasPrice) score += 10; else tips.push("Add prices to available artwork");
  if (p.career_stage) score += 5; else tips.push("Add career stage / experience");
  return { pct: Math.min(100, score), tips };
}

/** Opportunity match explainer — PRD §16. */
export function matchReasons(
  opp: { disciplines?: string[]; location?: string | null },
  artist: { disciplines?: string[]; location_country?: string | null; goal?: string | null }
): string[] {
  const reasons: string[] = [];
  if (opp.disciplines?.some((d) => artist.disciplines?.includes(d))) reasons.push("Your discipline matches");
  if (opp.location && artist.location_country && opp.location.includes(artist.location_country))
    reasons.push("Your location is eligible");
  if (artist.goal) reasons.push(`Supports your goal: ${artist.goal}`);
  if (reasons.length === 0) reasons.push("Relevant to emerging artists");
  return reasons;
}
