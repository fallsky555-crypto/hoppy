-- diary_profiles에 used_products 필드 추가
-- 체커(myroutinediet.com)에서 전달받은 제품 목록을 저장한다.
--
-- 구조: [
--   { id: "h401", brand: "아이오페", name: "아이오페 레티놀 Super Bounce 세럼...", lang: "ko" },
--   { id: "p001", brand: "Estée Lauder", name: "...", lang: "en" }
-- ]
--
-- null = 체커에서 items 파라미터 없이 온 경우 (온보딩 시 한 번만 저장)

ALTER TABLE public.diary_profiles
ADD COLUMN IF NOT EXISTS used_products JSONB DEFAULT NULL;
