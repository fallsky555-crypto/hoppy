-- ── condition_log — 컨디션 체크인 ──────────────────────────
create table if not exists public.condition_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  condition text not null check (condition in ('good','neutral','bad')),
  source text not null check (source in ('onboarding','daily_checkin')),
  linked_category text,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.condition_log enable row level security;
create policy "condition_log_owner_select" on public.condition_log
  for select using (auth.uid() = user_id);
create policy "condition_log_owner_insert" on public.condition_log
  for insert with check (auth.uid() = user_id);
create policy "condition_log_owner_update" on public.condition_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists condition_log_user_day_idx on public.condition_log (user_id, day);

-- ── habit_log — 습관 데이터 서버 동기화 ──────────────────────
create table if not exists public.habit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  sunscreen boolean not null default false,
  water int not null check (water >= 0 and water <= 8) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.habit_log enable row level security;
create policy "habit_log_owner_select" on public.habit_log
  for select using (auth.uid() = user_id);
create policy "habit_log_owner_insert" on public.habit_log
  for insert with check (auth.uid() = user_id);
create policy "habit_log_owner_update" on public.habit_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_updated_at
  before update on public.habit_log
  for each row execute function public.set_updated_at();

create index if not exists habit_log_user_day_idx on public.habit_log (user_id, day);