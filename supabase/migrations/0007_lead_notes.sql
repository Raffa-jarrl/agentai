create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.lead_notes enable row level security;
drop policy if exists lead_notes_agent on public.lead_notes;
create policy lead_notes_agent on public.lead_notes
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());
create index if not exists lead_notes_lead on public.lead_notes(lead_id, created_at desc);
