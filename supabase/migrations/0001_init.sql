-- Hoppy 스킨 다이어리 — scheduling-engine-spec.md 7번 데이터 스키마를 정규화한 테이블
--
-- user_id는 Supabase Anonymous Auth의 auth.uid()를 그대로 쓴다. 클라이언트가 publishable
-- key(= anon key)만 들고 있으므로, RLS가 없으면 아무나 남의 데이터를 읽고 쓸 수 있다.
-- 그래서 모든 테이블에 "auth.uid() = user_id" RLS를 건다.
--
-- 이 파일은 Supabase 대시보드의 SQL Editor에 붙여넣어 실행하거나
-- `supabase db push`로 적용한다. publishable key만으로는 DDL을 실행할 수 없다.

-- ── 1. diary_profiles — 진단 결과 + 코스 진행 상태 (spec 7의 최상위 필드들) ──────

create table if not exists public.diary_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  signup_date date not null,
  -- 진단 결과 (diagnosis)
  overlap_count int,
  irritation_reported boolean,
  skin_type text check (skin_type in ('A', 'B', 'C')),
  symptom text,
  pregnant boolean not null default false,
  prescription_meds boolean not null default false,
  -- assignTier() 결과. 'X'는 의료 상담(Tier X) 케이스
  tier text check (tier in ('0', '1', '2', 'X')),
  course_length_days int not null default 30,
  state text not null default 'NORMAL' check (state in ('NORMAL', 'INCIDENT_OVERRIDE')),
  unlock_state jsonb not null default '{"stage_1":"in_progress","stage_2":"locked","stage_3":"locked"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diary_profiles enable row level security;

create policy "diary_profiles_owner_select" on public.diary_profiles
  for select using (auth.uid() = user_id);
create policy "diary_profiles_owner_insert" on public.diary_profiles
  for insert with check (auth.uid() = user_id);
create policy "diary_profiles_owner_update" on public.diary_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_profiles_owner_delete" on public.diary_profiles
  for delete using (auth.uid() = user_id);

-- ── 2. calendar_entries — 캘린더 진행 상황 (spec 7의 calendar 배열) ─────────────

create table if not exists public.calendar_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  date date not null,
  category text not null check (category in ('rest', 'aha', 'moist', 'retinol', 'bha')),
  -- 완료 여부 / 그날 자극 신고 여부. null = 아직 지나지 않았거나 기록 안 함
  completed boolean,
  reaction_flag boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.calendar_entries enable row level security;

create policy "calendar_entries_owner_select" on public.calendar_entries
  for select using (auth.uid() = user_id);
create policy "calendar_entries_owner_insert" on public.calendar_entries
  for insert with check (auth.uid() = user_id);
create policy "calendar_entries_owner_update" on public.calendar_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_entries_owner_delete" on public.calendar_entries
  for delete using (auth.uid() = user_id);

create index if not exists calendar_entries_user_day_idx on public.calendar_entries (user_id, day);

-- ── 3. reaction_log — 8번 엣지케이스, 자극 신고 시 7일 연기 기록 ─────────────────

create table if not exists public.reaction_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  category text not null check (category in ('rest', 'aha', 'moist', 'retinol', 'bha')),
  flag boolean not null default true,
  delayed_to_day int not null,
  created_at timestamptz not null default now()
);

alter table public.reaction_log enable row level security;

create policy "reaction_log_owner_select" on public.reaction_log
  for select using (auth.uid() = user_id);
create policy "reaction_log_owner_insert" on public.reaction_log
  for insert with check (auth.uid() = user_id);
create policy "reaction_log_owner_delete" on public.reaction_log
  for delete using (auth.uid() = user_id);

create index if not exists reaction_log_user_day_idx on public.reaction_log (user_id, day);

-- ── 4. incident_log — 5번 스킨 인시던트(생리/선번/시술) 기록 ────────────────────

create table if not exists public.incident_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  incident_type text not null check (incident_type in ('period', 'sunburn', 'treatment')),
  started_at timestamptz not null,
  override_routine text not null check (override_routine in ('rest', 'aha', 'moist', 'retinol', 'bha')),
  resumes_normal_at_day int not null,
  created_at timestamptz not null default now()
);

alter table public.incident_log enable row level security;

create policy "incident_log_owner_select" on public.incident_log
  for select using (auth.uid() = user_id);
create policy "incident_log_owner_insert" on public.incident_log
  for insert with check (auth.uid() = user_id);
create policy "incident_log_owner_delete" on public.incident_log
  for delete using (auth.uid() = user_id);

create index if not exists incident_log_user_day_idx on public.incident_log (user_id, day);

-- ── 5. barrier_score_log — 4-1번 장벽 점수 시계열 ───────────────────────────────

create table if not exists public.barrier_score_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day int not null,
  score int not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.barrier_score_log enable row level security;

create policy "barrier_score_log_owner_select" on public.barrier_score_log
  for select using (auth.uid() = user_id);
create policy "barrier_score_log_owner_insert" on public.barrier_score_log
  for insert with check (auth.uid() = user_id);
create policy "barrier_score_log_owner_update" on public.barrier_score_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── updated_at 자동 갱신 트리거 ──────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger diary_profiles_set_updated_at
  before update on public.diary_profiles
  for each row execute function public.set_updated_at();

create trigger calendar_entries_set_updated_at
  before update on public.calendar_entries
  for each row execute function public.set_updated_at();
