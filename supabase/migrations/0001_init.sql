-- ============================================================
-- AgentAI Phase 1 MVP — initial schema
-- Multi-tenant: all tenant rows carry agent_id; RLS enforces isolation.
-- ============================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------
-- Enums
-- -----------------------------------------------------------
create type subscription_status as enum ('trial', 'active', 'cancelled');
create type property_type as enum ('apartment', 'house', 'penthouse', 'land', 'commercial');
create type listing_status as enum ('active', 'sold', 'rented', 'inactive');
create type lead_source as enum ('whatsapp', 'yad2', 'instagram', 'website', 'referral', 'manual', 'facebook');
create type lead_status as enum ('new', 'contacted', 'qualified', 'viewing_scheduled', 'negotiating', 'closed_won', 'closed_lost', 'inactive');
create type lead_score_tier as enum ('hot', 'warm', 'cold');
create type lead_timeline as enum ('immediate', '1_3_months', '3_6_months', 'exploring');
create type content_platform as enum ('instagram', 'facebook', 'both');
create type content_status as enum ('draft', 'scheduled', 'posted', 'ready');
create type content_post_type as enum ('listing_highlight', 'market_tip', 'neighborhood_guide', 'testimonial', 'general');
create type viewing_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type match_response as enum ('interested', 'not_interested', 'no_response');

-- -----------------------------------------------------------
-- agents  (extends auth.users)
-- -----------------------------------------------------------
create table public.agents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  whatsapp_business_number text,
  business_name text,
  profile_image_url text,
  subscription_status subscription_status not null default 'trial',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create agents row when a new auth user signs up
create or replace function public.handle_new_agent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.agents (id, email, full_name, phone, business_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'business_name'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_agent();

-- -----------------------------------------------------------
-- listings
-- -----------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null,
  description text,
  property_type property_type not null,
  rooms numeric(3,1),
  size_sqm integer,
  price integer not null,
  city text not null,
  neighborhood text,
  address text,
  floor integer,
  total_floors integer,
  parking boolean default false,
  elevator boolean default false,
  renovated boolean default false,
  photos text[] not null default '{}',
  status listing_status not null default 'active',
  ai_generated_description text,
  voice_note_url text,
  voice_note_transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_agent_status_idx on public.listings(agent_id, status);
create index listings_agent_city_idx on public.listings(agent_id, city);

-- -----------------------------------------------------------
-- leads
-- -----------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  full_name text not null,
  phone text not null,
  source lead_source not null default 'manual',
  status lead_status not null default 'new',
  score lead_score_tier not null default 'cold',
  score_value integer not null default 0,
  budget_min integer,
  budget_max integer,
  preferred_rooms numeric(3,1),
  preferred_areas text[] not null default '{}',
  mortgage_approved boolean,
  mortgage_amount integer,
  timeline lead_timeline,
  notes text,
  potential_commission integer not null default 0,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_agent_status_idx on public.leads(agent_id, status);
create index leads_agent_score_idx on public.leads(agent_id, score);
create index leads_agent_next_followup_idx on public.leads(agent_id, next_followup_at);

-- -----------------------------------------------------------
-- conversations
-- -----------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  qualification_complete boolean not null default false,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_lead_idx on public.conversations(lead_id);

-- -----------------------------------------------------------
-- content_posts
-- -----------------------------------------------------------
create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  platform content_platform not null default 'instagram',
  caption_hebrew text not null,
  caption_facebook text,
  caption_ad text,
  hashtags text[] not null default '{}',
  image_urls text[] not null default '{}',
  status content_status not null default 'draft',
  scheduled_for timestamptz,
  post_type content_post_type not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_posts_agent_status_idx on public.content_posts(agent_id, status);
create index content_posts_agent_scheduled_idx on public.content_posts(agent_id, scheduled_for);

-- -----------------------------------------------------------
-- lead_listing_matches
-- -----------------------------------------------------------
create table public.lead_listing_matches (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  match_reasons text[] not null default '{}',
  notification_sent boolean not null default false,
  notification_sent_at timestamptz,
  lead_response match_response,
  created_at timestamptz not null default now(),
  unique (lead_id, listing_id)
);
create index matches_agent_idx on public.lead_listing_matches(agent_id);
create index matches_listing_idx on public.lead_listing_matches(listing_id);
create index matches_lead_idx on public.lead_listing_matches(lead_id);

-- -----------------------------------------------------------
-- viewings
-- -----------------------------------------------------------
create table public.viewings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  scheduled_at timestamptz not null,
  status viewing_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);
create index viewings_agent_scheduled_idx on public.viewings(agent_id, scheduled_at);

-- -----------------------------------------------------------
-- weekly_reports
-- -----------------------------------------------------------
create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  messages_handled integer not null default 0,
  leads_qualified integer not null default 0,
  viewings_booked integer not null default 0,
  hours_saved numeric(6,2) not null default 0,
  pipeline_value integer not null default 0,
  hot_leads_count integer not null default 0,
  warm_leads_count integer not null default 0,
  cold_leads_count integer not null default 0,
  response_time_avg_minutes numeric(6,2) not null default 0,
  content_posts_generated integer not null default 0,
  highlights text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (agent_id, week_start)
);

-- -----------------------------------------------------------
-- updated_at trigger (shared)
-- -----------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();
create trigger conversations_touch before update on public.conversations
  for each row execute function public.touch_updated_at();
create trigger content_posts_touch before update on public.content_posts
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.agents enable row level security;
alter table public.listings enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.content_posts enable row level security;
alter table public.lead_listing_matches enable row level security;
alter table public.viewings enable row level security;
alter table public.weekly_reports enable row level security;

-- agents: self only
create policy agents_self on public.agents
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Generic tenant policy template (one per table since column name is the same)
create policy listings_tenant on public.listings
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy leads_tenant on public.leads
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy conversations_tenant on public.conversations
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy content_tenant on public.content_posts
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy matches_tenant on public.lead_listing_matches
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy viewings_tenant on public.viewings
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create policy reports_tenant on public.weekly_reports
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('listing-photos', 'listing-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('voice-notes', 'voice-notes', false)
  on conflict (id) do nothing;

-- Per-agent write policy (first path segment = agent_id)
create policy "listing-photos: agent owns folder" on storage.objects
  for all to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "voice-notes: agent owns folder" on storage.objects
  for all to authenticated
  using (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = auth.uid()::text);
