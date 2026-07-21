-- 13-3(v1.7). 캐시 무효화용 엔진 버전 태그. 저장된 값이 코드의 CURRENT_ENGINE_VERSION과
-- 다르면 앱이 이를 감지해 버전을 갱신한다(lib/scheduling-engine.ts 참고). 0001_init.sql이
-- 먼저 적용돼 있어야 한다.

alter table public.diary_profiles
  add column if not exists engine_version text;
