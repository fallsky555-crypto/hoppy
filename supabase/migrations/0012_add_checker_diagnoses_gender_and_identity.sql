-- checker_diagnoses에 gender, user_id, email 컬럼 추가
--
-- 주의: checker_diagnoses 테이블 자체는 이 migrations 폴더에 생성 마이그레이션이 없다
-- (Supabase 대시보드에서 수동 생성된 것으로 추정 — memory: checker-diagnoses-schema 참고).
-- 이 파일은 그 라이브 테이블이 이미 존재한다는 전제로 컬럼만 추가한다.
--
-- gender: checker-en.html Q1(성별) 답변. saveProfileToSupabase() payload에 이미
-- gender:gender로 채워 보내고 있었으나 컬럼이 없어 insert 자체가 매번 실패하고
-- 있었다(catch로 조용히 삼켜져 콘솔에만 남음).
--
-- user_id, email: checker-en.html의 saveProfileToSupabase()가 로그인 상태일 때
-- profile.user_id / profile.email을 채워 넣는데, 두 컬럼 모두 없어서 로그인 유저의
-- 진단 저장이 지금 전부 실패하고 있었다(anon key로 직접 확인, 42703 column-not-exist).
-- 이번에 gender 작업하면서 같이 발견해 함께 추가한다.

alter table public.checker_diagnoses
  add column if not exists gender text check (gender in ('female', 'male', 'other', 'unspecified')),
  add column if not exists user_id uuid,
  add column if not exists email text;

comment on column public.checker_diagnoses.gender is
  '체커 Q1(성별) 답변. female/male/other/unspecified';

comment on column public.checker_diagnoses.user_id is
  '로그인 상태에서 진단한 경우의 auth.uid(). 비로그인(guest) 진단은 null — guest_session_id로 식별';

comment on column public.checker_diagnoses.email is
  '로그인 상태에서 진단한 경우의 로그인 이메일. 비로그인 진단은 null';
