-- Per-call state for the voice agent's "read one, offer WhatsApp" flow.
--
-- When the agent calls search_listings, we cache the top N matches keyed by
-- the Vapi call ID so queue_whatsapp can later look up a listing by its
-- spoken number (1..N) instead of needing the full URL passed through the LLM.
--
-- When the caller says "yes, add that to WhatsApp", queue_whatsapp writes a
-- row to call_whatsapp_queue. On call end, the webhook reads the queue for
-- that call ID, composes a Hebrew message with the listings, sends it
-- (sandbox for now), and clears the rows.

create table if not exists call_search_results (
  id uuid primary key default gen_random_uuid(),
  call_id text not null,
  listing_number integer not null,
  url text not null,
  title text not null,
  street text,
  neighborhood text,
  price integer not null,
  rooms numeric,
  size_sqm integer,
  floor integer,
  listing_type text not null,
  property_type text,
  created_at timestamptz not null default now()
);

create unique index if not exists call_search_results_call_num_idx
  on call_search_results (call_id, listing_number);
create index if not exists call_search_results_call_idx
  on call_search_results (call_id, created_at desc);

create table if not exists call_whatsapp_queue (
  id uuid primary key default gen_random_uuid(),
  call_id text not null,
  caller_phone text,
  listing_url text not null,
  title text not null,
  street text,
  price integer,
  rooms numeric,
  size_sqm integer,
  floor integer,
  listing_type text,
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists call_whatsapp_queue_call_idx
  on call_whatsapp_queue (call_id, created_at);
create index if not exists call_whatsapp_queue_unsent_idx
  on call_whatsapp_queue (sent, created_at) where sent = false;

-- RLS: service role only. The Vapi webhooks are unauthenticated but hit our
-- Next.js endpoints which use the service-role client to write here.
alter table call_search_results enable row level security;
alter table call_whatsapp_queue enable row level security;
-- No policies → only service role (which bypasses RLS) can read/write.
