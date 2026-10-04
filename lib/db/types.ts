/** Shared domain types — mirrors Supabase tables (see supabase/migrations). */

export type UserRole = "ARTIST" | "COLLECTOR" | "GALLERY" | "CURATOR" | "ORG" | "ADMIN";

export type GoalType =
  | "FIRST_EXHIBITION"
  | "FIND_GALLERY"
  | "FIRST_SALE"
  | "INCREASE_SALES"
  | "FIND_COLLECTORS"
  | "COMMISSIONS"
  | "COLLABS"
  | "PORTFOLIO"
  | "INTERNATIONAL"
  | "NETWORK";

export type TrackingStatus =
  | "SAVED"
  | "CONSIDERING"
  | "PREPARING"
  | "APPLIED"
  | "CONTACTED"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED";

export type OpportunityType =
  | "EXHIBITION"
  | "OPEN_CALL"
  | "RESIDENCY"
  | "GRANT"
  | "COMPETITION"
  | "COMMISSION"
  | "FELLOWSHIP"
  | "WORKSHOP"
  | "FAIR"
  | "GALLERY";

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  name: string;
  location_country: string | null;
  location_city: string | null;
  avatar_url: string | null;
  disciplines: string[];
  mediums: string[];
  styles: string[];
  bio: string | null;
  statement: string | null;
  short_desc: string | null;
  career_stage: string | null;
  commission_open: boolean;
  profile_completeness: number;
  is_verified: boolean;
}

export interface Artwork {
  id: string;
  artist_id: string;
  collection_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  category: string | null;
  price_cents: number | null;
  currency: string;
  availability: "AVAILABLE" | "SOLD" | "RESERVED" | "NOT_FOR_SALE";
}

export interface Opportunity {
  id: string;
  org_id: string;
  type: OpportunityType;
  title: string;
  description: string;
  location: string | null;
  deadline: string | null;
  disciplines: string[];
  eligibility: Record<string, unknown>;
}

export interface TodayPayload {
  goal: { title: string } | null;
  nextStep: string | null;
  opportunities: Opportunity[];
  people: Pick<Profile, "id" | "name" | "role">[];
  activity: { profileViews: number };
  commerce: { inquiries: number };
}
