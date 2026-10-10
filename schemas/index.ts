import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  role: z.enum(["ARTIST", "COLLECTOR", "GALLERY", "CURATOR", "ORG", "AESTHETE"]).default("ARTIST"),
  location_country: z.string().max(60).optional().nullable(),
  location_city: z.string().max(60).optional().nullable(),
  disciplines: z.array(z.string().max(40)).max(10).default([]),
  mediums: z.array(z.string().max(40)).max(10).default([]),
  styles: z.array(z.string().max(40)).max(10).default([]),
  bio: z.string().max(4000).optional().nullable(),
  statement: z.string().max(4000).optional().nullable(),
  short_desc: z.string().max(280).optional().nullable(),
  career_stage: z.string().max(60).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  collaboration_types: z.array(z.string().max(40)).max(10).default([]),
  notify_matches: z.boolean().default(true),
  notify_saves: z.boolean().default(true),
  notify_deadlines: z.boolean().default(true),
  commission_open: z.boolean().default(false),
  // Portfolio settings (§7)
  portfolio_public: z.boolean().default(true),
  show_prices: z.boolean().default(true),
  default_currency: z.string().length(3).default("NGN"),
  default_availability: z.enum(["AVAILABLE", "SOLD", "RESERVED", "NOT_FOR_SALE"]).default("AVAILABLE"),
  // Inquiry settings (§25)
  inquiries_open: z.boolean().default(true),
  inquiry_auto_reply: z.string().max(500).optional().nullable(),
  inquiry_response_time: z.string().max(40).default("1-2 days")
});

export const artworkSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().url(),
  collection_id: z.string().uuid().optional().nullable(),
  medium: z.string().max(80).optional().nullable(),
  dimensions: z.string().max(80).optional().nullable(),
  year: z.number().int().min(1900).max(2030).optional().nullable(),
  category: z.string().max(60).optional().nullable(),
  price_cents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().length(3).default("NGN"),
  availability: z.enum(["AVAILABLE", "SOLD", "RESERVED", "NOT_FOR_SALE"]).default("AVAILABLE")
});

export const goalSchema = z.object({
  goal_type: z.enum([
    "FIRST_EXHIBITION",
    "FIND_GALLERY",
    "FIRST_SALE",
    "INCREASE_SALES",
    "FIND_COLLECTORS",
    "COMMISSIONS",
    "COLLABS",
    "PORTFOLIO",
    "INTERNATIONAL",
    "NETWORK"
  ]),
  is_primary: z.boolean().default(false)
});

export const opportunitySchema = z.object({
  type: z.enum([
    "EXHIBITION",
    "OPEN_CALL",
    "RESIDENCY",
    "GRANT",
    "COMPETITION",
    "COMMISSION",
    "FELLOWSHIP",
    "WORKSHOP",
    "FAIR",
    "GALLERY"
  ]),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(8000),
  location: z.string().max(120).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  disciplines: z.array(z.string().max(40)).default([])
});

export const trackingSchema = z.object({
  opportunity_id: z.string().uuid(),
  status: z.enum([
    "SAVED",
    "CONSIDERING",
    "PREPARING",
    "APPLIED",
    "CONTACTED",
    "ACCEPTED",
    "REJECTED",
    "COMPLETED"
  ])
});

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
  artwork_id: z.string().uuid().optional().nullable()
});
