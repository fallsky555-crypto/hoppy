-- diary_profiles에 checker_result_url 컬럼 추가
--
-- 체커가 hoppyUrl에 실어 보내는 ?checker_result_url=<인코딩된 링크> 파라미터를 저장한다.
-- 이 링크를 열면 체커 자신의 결과 화면(제거/유지 성분 리스트, 피부 컨설턴트 코멘트 등)이
-- 질문 없이 바로 재현된다. ReportCard의 "검사지 보기" 링크가 이 값을 그대로 연다.
--
-- routine_step(checker_diagnoses에 저장)과 달리 diary_profiles에 두는 이유: 이 값은
-- 온보딩 시점뿐 아니라 나중에, 다른 기기의 revisit(설정 > 결과지 다시보기)에서도 다시
-- 보여줘야 해서 skin_type/tier/gender와 동일하게 diary_profiles(user_id 기준 upsert,
-- loadRemoteState로 기기 간 복원)에 둔다. (2026-08-13 결정)

alter table public.diary_profiles
  add column if not exists checker_result_url text;

comment on column public.diary_profiles.checker_result_url is
  '체커 URL 파라미터 checker_result_url. 체커 자신의 결과 화면(성분 리스트, 컨설턴트 코멘트 등)을 질문 없이 재현하는 링크. ReportCard의 "검사지 보기" 링크가 이 값을 연다.';
