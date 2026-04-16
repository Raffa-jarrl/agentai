-- Add notes/outcome to viewings
alter table public.viewings add column if not exists outcome text;
alter table public.viewings add column if not exists client_feedback text;
