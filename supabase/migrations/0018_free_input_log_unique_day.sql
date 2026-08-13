-- ── free_input_log: 하루 1건으로 전환 (재저장 시 덮어쓰기) ──
-- 기존에는 하루에 여러 메모를 남길 수 있는 append-only 구조였으나, UI가 "저장 버튼
-- 하나로 그날의 메모 하나를 저장"하는 개념으로 통일되면서 usage_log/condition_log와
-- 동일하게 (user_id, day) 유일성을 강제한다. 기존에 중복 저장된 행이 있다면 가장
-- 최근 것만 남기고 정리한 뒤 제약을 건다.
delete from public.free_input_log t
where t.id not in (
  select distinct on (user_id, day) id
  from public.free_input_log
  order by user_id, day, created_at desc, id desc
);

alter table public.free_input_log
  add constraint free_input_log_user_day_key unique (user_id, day);

create policy "free_input_log_owner_update" on public.free_input_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
