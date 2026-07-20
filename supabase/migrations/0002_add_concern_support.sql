-- rest/moist 문구에 강조할 관심사(concern)와 유저가 이미 갖고 있는 성분(support_owned)을
-- diary_profiles에 추가한다. 0001_init.sql이 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  add column if not exists concern text check (concern in ('dry', 'flush', 'flaky', 'trouble', 'none')),
  add column if not exists support_owned text[] not null default '{}';
