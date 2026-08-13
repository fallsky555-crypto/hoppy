-- checker_diagnoses에 routine_step 컬럼 추가
--
-- hoppy-skin-diary가 온보딩 진입 시 URL 파라미터(?routine_step=...)로 받은 값을,
-- 같은 user_id의 가장 최근(1시간 이내) 체커 진단 행에 채워 넣기 위한 컬럼이다.
-- checker_diagnoses 테이블 자체는 이 저장소의 마이그레이션 밖에서 관리되므로
-- (0012_add_checker_diagnoses_gender_and_identity.sql 참고) 컬럼 존재를 전제하지 않고
-- add column if not exists로 추가한다.
--
-- hoppy-skin-diary는 이전까지 이 테이블에 쓴 적이 없어(체커 쪽 코드만 insert),
-- UPDATE 정책이 없을 수 있다. 소유자만 자신의 진단 행을 갱신할 수 있도록 정책을 추가한다.

alter table public.checker_diagnoses
  add column if not exists routine_step text;

comment on column public.checker_diagnoses.routine_step is
  '체커 이후 hoppy-skin-diary 온보딩에서 받은 routine_step URL 파라미터. hoppy-skin-diary가 user_id 기준 가장 최근(1시간 이내) 진단 행에 채워 넣는다.';

drop policy if exists "checker_diagnoses_owner_update" on public.checker_diagnoses;
create policy "checker_diagnoses_owner_update" on public.checker_diagnoses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
