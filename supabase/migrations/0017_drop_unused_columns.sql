-- diary_profiles에서 course_length_days, state, unlock_state 컬럼 제거
--
-- 2026-08-10 전체 컬럼 감사(체커 URL 파라미터 / DB 컬럼 / 코드 read·write 3-way
-- 비교)에서 이 3개가 어디서도 write되지 않는 죽은 컬럼으로 확인됨 — 0001_init.sql
-- 당시 spec 7 최상위 필드로 만들어졌으나, 2026-07-27 v2 스케줄링 엔진 재설계
-- (0004_recipe_rotation_v2.sql) 이후 course_length_days/state 개념 자체가 코드에서
-- 손을 뗐고, unlock_state는 서버 저장 없이 클라이언트에서 loggedDays 기반으로 매번
-- 계산하는 방식으로 대체됨.
--
-- 삭제 전 최종 확인(2026-08-10): course_length_days/courseLengthDays,
-- state(NORMAL/INCIDENT_OVERRIDE), unlock_state/unlockState, stage_1/stage_2/stage_3
-- 전부 코드베이스 전체 grep — 참조 없음. "unlock" 관련해서는 lib/scheduling-engine.ts의
-- checkStage2Unlock()과 components/locked-preview.tsx가 있으나, 둘 다 unlock_state
-- 컬럼과 무관함(전자는 어디서도 호출되지 않는 순수 함수, 후자는 하드코딩된 안내
-- 문구만 렌더링 — 둘 다 DB 값을 읽지 않음).
--
-- 실 데이터 존재 여부: 배리가 Supabase Table Editor에서 직접 확인 예정
-- (동일 기준: 실데이터 없으면 삭제 확정, anon key로는 RLS 때문에 이 저장소 쪽에서
-- 독립적으로 재검증하지 못했다).
--
-- 0001~0016이 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  drop column if exists course_length_days,
  drop column if exists state,
  drop column if exists unlock_state;
