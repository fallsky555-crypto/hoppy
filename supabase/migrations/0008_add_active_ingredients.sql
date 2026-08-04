-- ── Add active_ingredients to diary_profiles ──────────────────────
alter table public.diary_profiles
add column active_ingredients jsonb not null default '[]'::jsonb;
