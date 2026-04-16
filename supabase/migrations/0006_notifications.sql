create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  type text not null, -- 'new_lead', 'viewing_reminder', 'photo_submitted', 'match_found', 'report_ready'
  title text not null,
  body text not null,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists notifications_agent on public.notifications;
create policy notifications_agent on public.notifications
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create index if not exists notifications_agent_read on public.notifications(agent_id, read, created_at desc);
