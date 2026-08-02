-- ── usage_log — 사용 기록 (스케줄 피보팅용) ─────────────────────
create table if not exists public.usage_log (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  slots jsonb not null,
  recommended_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.usage_log enable row level security;
create policy "usage_log_owner_select" on public.usage_log
  for select using (auth.uid() = user_id);
create policy "usage_log_owner_insert" on public.usage_log
  for insert with check (auth.uid() = user_id);
create policy "usage_log_owner_update" on public.usage_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_updated_at
  before update on public.usage_log
  for each row execute function public.set_updated_at();

create index if not exists usage_log_user_day_idx on public.usage_log (user_id, day);
