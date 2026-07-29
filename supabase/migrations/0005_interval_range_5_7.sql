-- 2026-07-28 온보딩 슬라이더가 처음으로 active_interval_days/bha_interval_days를
-- 실제로 채워 넣는 진입점이 된다. 앱 코드(lib/scheduling-engine.ts의
-- normalizeInterval)가 이미 5~7일로 clamp하므로, DB도 같은 범위를 강제해 앱을
-- 거치지 않은 값(수동 수정, 다른 클라이언트 등)이 들어오는 걸 막는다.
--
-- 0001~0004가 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  drop constraint if exists diary_profiles_active_interval_days_check;
alter table public.diary_profiles
  add constraint diary_profiles_active_interval_days_check
    check (active_interval_days is null or active_interval_days between 5 and 7);

alter table public.diary_profiles
  drop constraint if exists diary_profiles_bha_interval_days_check;
alter table public.diary_profiles
  add constraint diary_profiles_bha_interval_days_check
    check (bha_interval_days is null or bha_interval_days between 5 and 7);
