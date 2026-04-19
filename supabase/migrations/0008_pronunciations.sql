-- Pronunciation dictionary for the Spectra voice AI agent.
-- Overrides TTS output for specific Hebrew words/phrases so Azure HilaNeural
-- pronounces them correctly. Merged at runtime with the hardcoded defaults
-- in lib/pronunciations.ts.
--
-- Shared across all agents (no agent_id) since the target is the same
-- real-estate domain, but we scope write access to authenticated users only.

create table if not exists pronunciations (
  id uuid primary key default gen_random_uuid(),
  original_text text not null unique,
  phonetic_text text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pronunciations_original_idx on pronunciations (original_text);

-- RLS: public read (needed by the unauthenticated Vapi webhook),
-- authenticated write.
alter table pronunciations enable row level security;

create policy "pronunciations read all" on pronunciations
  for select using (true);

create policy "pronunciations auth write" on pronunciations
  for insert with check (auth.uid() is not null);

create policy "pronunciations auth update" on pronunciations
  for update using (auth.uid() is not null);

create policy "pronunciations auth delete" on pronunciations
  for delete using (auth.uid() is not null);

-- Auto-update updated_at
create or replace function touch_pronunciation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists pronunciations_touch on pronunciations;
create trigger pronunciations_touch before update on pronunciations
  for each row execute function touch_pronunciation_updated_at();
