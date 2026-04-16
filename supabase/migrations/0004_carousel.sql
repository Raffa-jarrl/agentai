-- Add Instagram carousel slides to listing_campaigns
alter table public.listing_campaigns
  add column if not exists instagram_carousel jsonb not null default '[]'::jsonb;
-- Each slide: { "slide": 1, "image_index": 0, "headline": "...", "body": "...", "cta": "..." }
