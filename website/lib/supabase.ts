import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Service role key — only available server-side (no NEXT_PUBLIC_ prefix)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client (browser-safe, respects RLS)
export const supabase = createClient(url, anonKey);

// Server-only client that bypasses RLS — use only in Server Components / API routes
export const supabaseAdmin = createClient(url, serviceKey ?? anonKey);

export interface Listing {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  price: number;
  rooms: number | null;
  size_sqm: number | null;
  status: string;
  photos: string[];
  property_type: string;
  description: string | null;
  floor: number | null;
  address: string | null;
}
