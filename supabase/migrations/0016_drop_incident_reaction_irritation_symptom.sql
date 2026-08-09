-- diary_profiles에서 irritation_reported, symptom 컬럼 제거 + incident_log, reaction_log 테이블 제거
--
-- 자극/인시던트(생리·선번·시술) 신고 UI와 로직 전체가 자유입력(condition_log) 도입으로
-- 대체 가능해졌다는 판단에 따라 삭제 확정(2026-08-09). incident_log는 코드에서 이미 쓰기
-- 경로가 없었고(과거 스케줄링 엔진 재설계 때 유실된 것으로 추정), reaction_log는 쓰기는
-- 살아있었으나 읽는 화면이 없어 사실상 죽은 데이터였다. 두 테이블 모두 애플리케이션
-- 코드(components/incident-panel.tsx, components/daily-slots.tsx, components/recipe-card.tsx,
-- lib/use-diary.ts, lib/supabase/sync.ts, lib/scheduling-engine.ts, app/[locale]/page.tsx)에서
-- 참조를 모두 제거한 뒤 이 마이그레이션을 작성한다.
--
-- irritation_reported/symptom도 같은 v1 인시던트 개념의 diary_profiles 쪽 잔재로, 위와
-- 동일한 사유로 함께 제거한다.
--
-- 실 데이터 존재 여부: 사용자가 Table Editor로 직접 재확인 예정(동일 기준: 실데이터 없으면
-- 삭제 확정). anon key로는 RLS 때문에 이 저장소 쪽에서 전체 테이블을 독립적으로 재검증하지는
-- 못했다.
--
-- 0001~0015가 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  drop column if exists irritation_reported,
  drop column if exists symptom;

drop table if exists public.incident_log;
drop table if exists public.reaction_log;
