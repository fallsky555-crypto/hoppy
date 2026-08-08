-- diary_profiles에 gender(체커 Q1 성별 질문), name(다이어리 커버 이름 입력 예정) 컬럼 추가
--
-- gender: 체커의 &gender= URL 파라미터로 Hoppy 앱에 이미 전달되고 있었으나 저장할 컬럼이
-- 없었다. checker-en.html의 GENDER_OPTS와 값 맞춤: female/male/other/unspecified.
-- name: 다이어리 커버 이름 입력 기능(예정)을 위한 사전 준비.
--
-- 0001~0010이 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  add column if not exists gender text check (gender in ('female', 'male', 'other', 'unspecified')),
  add column if not exists name text;

comment on column public.diary_profiles.gender is
  '체커 Q1(성별)에서 전달받은 값. female/male/other/unspecified';

comment on column public.diary_profiles.name is
  '다이어리 커버에 표시할 이름 (자유 입력, 온보딩 이후 별도 기능에서 저장)';
