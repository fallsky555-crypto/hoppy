-- 2026-07-27 스케줄링 엔진 재설계: Tier×Type 진단 기반 개인화를 걷어내고, 워크북
-- 표준 시퀀스 + BHA/레티놀 간격 슬라이더로 전환한다.
--
-- 기존 유저의 과거 진단 이력(overlap_count/irritation_reported/tier/symptom)은
-- 되돌리기 어려운 데이터라 이 마이그레이션에서 컬럼을 지우지 않는다 — 더 이상
-- 읽거나 쓰지 않을 뿐, 필요하면 나중에 별도 마이그레이션으로 정리한다.
-- skin_type 컬럼은 계속 쓰되 의미가 "진단 결과"에서 "UI 카피 전용 값"으로 바뀐다.
--
-- 0001~0003이 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  add column if not exists active_interval_days int check (active_interval_days is null or active_interval_days > 0),
  add column if not exists bha_interval_days int check (bha_interval_days is null or bha_interval_days > 0);

-- calendar_entries / reaction_log / incident_log의 category(또는 override_routine)
-- check 제약을 새 RecipeType 9종으로 교체한다. 기존 제약은 defense_barrier 등
-- v1.5부터 이미 쓰이던 카테고리조차 허용하지 않던 낡은 상태였다.

alter table public.calendar_entries
  drop constraint if exists calendar_entries_category_check;
alter table public.calendar_entries
  add constraint calendar_entries_category_check check (
    category in (
      'bha', 'retinol',
      'defense_barrier', 'defense_toning', 'defense_hydration',
      'barrier_lock', 'hydration_lock', 'toning_solo',
      'sos_rest'
    )
  );

alter table public.reaction_log
  drop constraint if exists reaction_log_category_check;
alter table public.reaction_log
  add constraint reaction_log_category_check check (
    category in (
      'bha', 'retinol',
      'defense_barrier', 'defense_toning', 'defense_hydration',
      'barrier_lock', 'hydration_lock', 'toning_solo',
      'sos_rest'
    )
  );

alter table public.incident_log
  drop constraint if exists incident_log_override_routine_check;
alter table public.incident_log
  add constraint incident_log_override_routine_check check (
    override_routine in (
      'bha', 'retinol',
      'defense_barrier', 'defense_toning', 'defense_hydration',
      'barrier_lock', 'hydration_lock', 'toning_solo',
      'sos_rest'
    )
  );
