-- [스키마 드리프트 수정] diary_profiles.skin_type CHECK 제약
--
-- 0001_init.sql은 skin_type을 옛 Tier×Type 진단 체계의 'A'/'B'/'C' 값으로 제약했다.
-- 0004_recipe_rotation_v2.sql의 재설계 이후 앱은 skin_type을 더 이상 그 체계로 쓰지
-- 않고, 체커의 피부 타입 응답 그대로(sensitive/dry/combo/oily, lib/use-diary.ts의
-- VALID_SKIN_TYPES) 저장한다. 라이브 DB는 이미 이 값들을 문제없이 받고 있어(실제
-- 온보딩 흐름으로 sensitive 저장 확인됨) 제약이 이미 라이브에서 완화된 상태로
-- 보이지만, 이 저장소 마이그레이션 파일에는 옛 'A'/'B'/'C' 제약이 그대로 남아있었다.
-- 이 파일로 저장소 마이그레이션 이력을 실제 라이브 스키마와 맞춘다.
--
-- 0001~0013이 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  drop constraint if exists diary_profiles_skin_type_check;
alter table public.diary_profiles
  add constraint diary_profiles_skin_type_check
    check (skin_type is null or skin_type in ('sensitive', 'dry', 'combo', 'oily'));
