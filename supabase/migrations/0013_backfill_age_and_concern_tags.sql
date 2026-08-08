-- [스키마 드리프트 백필] diary_profiles.age / diary_profiles.concern_tags
--
-- 두 컬럼 모두 실제 라이브 DB에는 이미 존재하고(lib/supabase/sync.ts의 saveAge/
-- saveConcernTags/loadRemoteState가 정상 동작 중이었음 — anon key로 직접 조회해
-- 존재를 확인했다), 앱 코드도 계속 이 값을 읽고 써왔다. 하지만 두 컬럼을 추가한
-- 마이그레이션 파일이 이 저장소에 없었다 — 아마 초기에 대시보드에서 직접
-- 추가되었을 것으로 추정된다.
--
-- add column if not exists라 라이브 DB에서는 아무 효과 없이 통과하고(이미 있으므로),
-- 저장소 마이그레이션 이력과 실제 스키마를 맞추는 용도다. 이 파일이 없으면 새
-- 환경(예: 로컬 개발용 별도 프로젝트)에서 `supabase db push`로 처음부터 스키마를
-- 만들 때 이 두 컬럼이 누락된다.

alter table public.diary_profiles
  add column if not exists age text,
  add column if not exists concern_tags text;

comment on column public.diary_profiles.age is
  '체커에서 선택한 나이대 (teen/20s/30s/40s/50s/60s_plus)';

comment on column public.diary_profiles.concern_tags is
  '체커의 beauty_concerns (DRY,TONE 등 콤마 구분 문자열)';
