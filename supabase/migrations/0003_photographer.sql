-- Add role to agents table
alter table public.agents add column if not exists role text not null default 'agent' check (role in ('agent', 'photographer'));
alter table public.agents add column if not exists invited_by uuid references public.agents(id);

-- Photo submissions (photographer uploads, pending agent approval)
create table if not exists public.photo_submissions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  photographer_id uuid not null references public.agents(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  photos text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.photo_submissions enable row level security;

-- Agent can see submissions for their listings
create policy photo_submissions_agent on public.photo_submissions
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- Photographer can see their own submissions
create policy photo_submissions_photographer on public.photo_submissions
  for select using (photographer_id = auth.uid());

create policy photo_submissions_photographer_insert on public.photo_submissions
  for insert with check (photographer_id = auth.uid());

-- Photographer invitations
create table if not exists public.photographer_invitations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table public.photographer_invitations enable row level security;
create policy invitations_agent on public.photographer_invitations
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- Platform campaigns generated from approved photos
create table if not exists public.listing_campaigns (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  submission_id uuid references public.photo_submissions(id),
  instagram_caption text,
  instagram_hashtags text[],
  facebook_post text,
  facebook_ad_headline text,
  facebook_ad_body text,
  yad2_title text,
  yad2_description text,
  madlan_title text,
  madlan_description text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  created_at timestamptz not null default now()
);

alter table public.listing_campaigns enable row level security;
create policy campaigns_agent on public.listing_campaigns
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create index if not exists photo_submissions_listing on public.photo_submissions(listing_id);
create index if not exists photo_submissions_agent on public.photo_submissions(agent_id);
create index if not exists campaigns_listing on public.listing_campaigns(listing_id);
