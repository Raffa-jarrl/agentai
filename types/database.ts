// Hand-written DB types for Phase 1. Regenerate with `npm run db:types` once Supabase project is set up.

export type SubscriptionStatus = "trial" | "active" | "cancelled";
export type PropertyType = "apartment" | "house" | "penthouse" | "land" | "commercial";
export type ListingStatus = "active" | "sold" | "rented" | "inactive";
export type LeadSource = "whatsapp" | "yad2" | "instagram" | "website" | "referral" | "manual" | "facebook";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "viewing_scheduled"
  | "negotiating"
  | "closed_won"
  | "closed_lost"
  | "inactive";
export type LeadScoreTier = "hot" | "warm" | "cold";
export type LeadTimeline = "immediate" | "1_3_months" | "3_6_months" | "exploring";
export type ContentPlatform = "instagram" | "facebook" | "both";
export type ContentStatus = "draft" | "scheduled" | "posted" | "ready";
export type ContentPostType = "listing_highlight" | "market_tip" | "neighborhood_guide" | "testimonial" | "general";
export type ViewingStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type MatchResponse = "interested" | "not_interested" | "no_response";

export interface Agent {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  whatsapp_business_number: string | null;
  business_name: string | null;
  profile_image_url: string | null;
  subscription_status: SubscriptionStatus;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  rooms: number | null;
  size_sqm: number | null;
  price: number;
  city: string;
  neighborhood: string | null;
  address: string | null;
  floor: number | null;
  total_floors: number | null;
  parking: boolean | null;
  elevator: boolean | null;
  renovated: boolean | null;
  photos: string[];
  status: ListingStatus;
  ai_generated_description: string | null;
  voice_note_url: string | null;
  voice_note_transcript: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: LeadScoreTier;
  score_value: number;
  budget_min: number | null;
  budget_max: number | null;
  preferred_rooms: number | null;
  preferred_areas: string[];
  mortgage_approved: boolean | null;
  mortgage_amount: number | null;
  timeline: LeadTimeline | null;
  notes: string | null;
  potential_commission: number;
  last_contact_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  timestamp: string;
  type?: "text" | "image" | "voice";
}

export interface Conversation {
  id: string;
  agent_id: string;
  lead_id: string;
  messages: ConversationMessage[];
  qualification_complete: boolean;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPost {
  id: string;
  agent_id: string;
  listing_id: string | null;
  platform: ContentPlatform;
  caption_hebrew: string;
  caption_facebook: string | null;
  caption_ad: string | null;
  hashtags: string[];
  image_urls: string[];
  status: ContentStatus;
  scheduled_for: string | null;
  post_type: ContentPostType;
  created_at: string;
  updated_at: string;
}

export interface LeadListingMatch {
  id: string;
  agent_id: string;
  lead_id: string;
  listing_id: string;
  match_score: number;
  match_reasons: string[];
  notification_sent: boolean;
  notification_sent_at: string | null;
  lead_response: MatchResponse | null;
  created_at: string;
}

export interface Viewing {
  id: string;
  agent_id: string;
  lead_id: string;
  listing_id: string;
  scheduled_at: string;
  status: ViewingStatus;
  notes: string | null;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  agent_id: string;
  week_start: string;
  week_end: string;
  messages_handled: number;
  leads_qualified: number;
  viewings_booked: number;
  hours_saved: number;
  pipeline_value: number;
  hot_leads_count: number;
  warm_leads_count: number;
  cold_leads_count: number;
  response_time_avg_minutes: number;
  content_posts_generated: number;
  highlights: string[];
  created_at: string;
}
