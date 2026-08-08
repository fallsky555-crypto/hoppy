-- ── free_input_log — 자유입력 기록 (구조화 분석 대상 아님, raw text 그대로 저장) ──
-- 리포트/차트 등 정량 분석 로직에는 포함시키지 않는다. 사용자가 자유롭게 쓴 텍스트를
-- 그대로 보관하는 용도.
create table if not exists public.free_input_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.free_input_log enable row level security;
create policy "free_input_log_owner_select" on public.free_input_log
  for select using (auth.uid() = user_id);
create policy "free_input_log_owner_insert" on public.free_input_log
  for insert with check (auth.uid() = user_id);

create index if not exists free_input_log_user_day_idx on public.free_input_log (user_id, day);
