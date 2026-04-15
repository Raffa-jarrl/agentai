-- Scalability improvements for 1000+ agencies
-- Performance indexes, webhook tracking, materialized views

-- ============================================================
-- INDEXES for query performance
-- ============================================================
create index if not exists listings_agent_status_created on public.listings(agent_id, status, created_at desc);
create index if not exists leads_agent_score_status on public.leads(agent_id, score, status);
create index if not exists leads_agent_next_followup on public.leads(agent_id, next_followup_at) where next_followup_at is not null;
create index if not exists conversations_lead_updated on public.conversations(lead_id, updated_at desc);
create index if not exists content_agent_status_scheduled on public.content_posts(agent_id, status, scheduled_for);
create index if not exists viewings_agent_scheduled on public.viewings(agent_id, scheduled_at desc);
create index if not exists matches_listing_score on public.lead_listing_matches(listing_id, match_score desc) where notification_sent = false;

-- Webhook indexes
create index if not exists webhook_attempts_retry on public.webhook_attempts(agent_id, status, next_retry_at) where status in ('pending', 'failed');
create index if not exists webhook_attempts_idempotency on public.webhook_attempts(idempotency_key) where idempotency_key is not null;

-- ============================================================
-- WEBHOOK ATTEMPTS table (if not created already)
-- ============================================================
create table if not exists public.webhook_attempts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  webhook_type text not null,
  payload jsonb not null,
  idempotency_key text unique,
  status text not null default 'pending',
  attempt_count int default 0,
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.webhook_attempts enable row level security;
create policy webhook_attempts_agent on public.webhook_attempts
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- ============================================================
-- MATERIALIZED VIEW for dashboard metrics (fast, cached)
-- ============================================================
create materialized view if not exists public.agent_dashboard_cache as
select
  a.id as agent_id,
  a.full_name,
  count(distinct case when l.score = 'hot' and l.status not in ('closed_lost', 'inactive') then l.id end)::int as hot_leads_count,
  count(distinct case when v.scheduled_at >= now()::date and v.scheduled_at < (now()::date + '7 days'::interval) then v.id end)::int as viewings_week_count,
  coalesce(sum(l.potential_commission), 0)::int as pipeline_value,
  0::int as response_time_avg_minutes
from public.agents a
left join public.leads l on l.agent_id = a.id
left join public.viewings v on v.agent_id = a.id
group by a.id, a.full_name;

create unique index if not exists idx_dashboard_cache_agent on public.agent_dashboard_cache(agent_id);

-- Refresh materialized view periodically via cron job or manually:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY agent_dashboard_cache;

-- ============================================================
-- FUNCTION: Update agent row's updated_at on any change
-- ============================================================
create or replace function public.touch_agents_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.agents set updated_at = now() where id = new.agent_id or id = old.agent_id;
  return new;
end $$;

create or replace trigger leads_touch_agent before insert or update on public.leads
  for each row execute function public.touch_agents_updated_at();
create or replace trigger listings_touch_agent before insert or update on public.listings
  for each row execute function public.touch_agents_updated_at();
