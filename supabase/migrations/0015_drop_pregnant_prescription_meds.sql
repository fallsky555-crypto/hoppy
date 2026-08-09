-- diary_profiles에서 pregnant, prescription_meds 컬럼 제거
--
-- v1 시절 질문(임신·수유 중 / 처방약 사용 중)이었으나 v2 재설계(0004_recipe_rotation_v2.sql)
-- 이후 앱 UI에서 완전히 제거되었고, 체커(checker-ko/en.html)도 현재는 항상 &preg=0&rx=0을
-- 고정으로 보낸다. 코드 전체(lib/use-diary.ts, lib/supabase/sync.ts, app/[locale]/page.tsx)에서
-- 참조를 모두 제거한 뒤 이 마이그레이션을 작성한다.
--
-- 실 데이터 존재 여부: Table Editor로 직접 확인한 결과 true 값이 있는 행이 없음(사용자 확인).
-- 컬럼이 NOT NULL DEFAULT false이고 현재 어떤 코드 경로도 true를 쓰지 않는다는 점도
-- 코드 감사로 확인됨 — 다만 anon key로는 RLS 때문에 전체 테이블을 조회할 수 없어 이 저장소
-- 쪽에서 독립적으로 재검증하지는 못했다.
--
-- 0001~0014가 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  drop column if exists pregnant,
  drop column if exists prescription_meds;
