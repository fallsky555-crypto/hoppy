-- amazon_pick_exposures — "오늘의 추천"(영문 로케일 아마존 픽) 전체 공통 노출 이력.
--
-- 최근 7일 내 노출된 제품을 다음 선정에서 낮은 우선순위로 내리기 위한 용도로만 쓴다
-- (완전 배제가 아니라 가중치 페널티, lib/data/amazon-picks.ts의 selectTodayAmazonRecommendation
-- 참고). 로그인/기기 식별 없이 앱 전체가 공유하는 전역 카운터라 user_id가 없다(2026-09-15
-- 오늘의 추천 로직 개편 스펙 결정: 노출 이력은 유저별이 아닌 전체 공통).
create table if not exists public.amazon_pick_exposures (
  product_id text not null,
  exposed_date date not null,
  created_at timestamptz not null default now(),
  primary key (product_id, exposed_date)
);

alter table public.amazon_pick_exposures enable row level security;

-- 소유자 개념이 없는 전역 공개 테이블이라 로그인 여부와 무관하게 읽고 쓸 수 있다.
create policy "amazon_pick_exposures_public_select" on public.amazon_pick_exposures
  for select using (true);
create policy "amazon_pick_exposures_public_insert" on public.amazon_pick_exposures
  for insert with check (true);

create index if not exists amazon_pick_exposures_date_idx on public.amazon_pick_exposures (exposed_date);
