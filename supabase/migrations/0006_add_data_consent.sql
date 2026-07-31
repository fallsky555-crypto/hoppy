-- 2026-07-31 온보딩 1단계 데이터 수집 동의 컬럼 추가
-- diary_profiles 테이블에 동의 여부와 타이밍 기록
-- 0001~0005가 먼저 적용돼 있어야 한다

alter table public.diary_profiles
  add column if not exists data_consent boolean not null default false,
  add column if not exists data_consent_at timestamptz;

comment on column public.diary_profiles.data_consent is
  '사용자가 피부 기록 수집에 동의했는지 여부 (온보딩 1단계)';

comment on column public.diary_profiles.data_consent_at is
  '동의한 시점 (ISO 8601 형식, UTC)';
