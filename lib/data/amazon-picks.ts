/**
 * Amazon (US) affiliate product dataset — English-locale-only product recommendations.
 *
 * This is a separate dataset from lib/affiliate-picks.ts (Coupang/Korean picks) and does
 * NOT replace or modify it. lib/affiliate-picks.ts stays untouched and keeps powering the
 * `locale === "ko"` picks exactly as before; this file only powers `locale === "en"`.
 *
 * All 15 "daily" items below were individually verified live on amazon.com (2026-09-11): each
 * affiliateUrl's ASIN was confirmed to open the intended product's official listing (byline
 * reads "Visit the <Brand> Store", not a third-party reseller), and each imageUrl is that
 * listing's own #landingImage src. affiliateUrl uses tag=kcultureclass-20.
 *
 * Two items from the original draft were swapped out because no authentic/official listing
 * could be found on Amazon for them:
 *  - "Beauty of Joseon Relief Sun" — every Relief Sun listing on Amazon.com is an
 *    unbranded/reseller listing (no "Visit the Beauty of Joseon Store" byline); the brand's
 *    own Amazon store does not carry it, likely due to Korean sunscreens' UV filters not
 *    being FDA-approved for the US OTC sunscreen monograph. Replaced with Isntree's
 *    official SPF listing.
 *  - "COSRX Advanced Snail 96 Mucin Power Essence" (standalone) — did not appear in COSRX's
 *    official Amazon store or in search under its own listing (likely temporarily
 *    unavailable/delisted); only bundle/duo variants exist. Replaced with COSRX's 6X Peptide
 *    Collagen Skin Booster Serum, also official and well-reviewed.
 * "Anua Peach 70% Niacinamide Serum" doesn't exist as a real Anua product either — swapped
 * for Anua's actual bestselling niacinamide serum (Niacinamide 10 + TXA 4).
 *
 * 5 "special" items were added on 2026-09-15 (see internal "오늘의 추천" curation spec) to
 * move Today's Pick selection away from pure US Amazon bestseller ranking toward manually
 * curated, Korean-market-validated picks (화해/글로우픽 등). All 5 were verified live on
 * amazon.com the same way as the original 15 ("Visit the <Brand> Store" byline confirmed).
 * The two Mediheal eye-patch items needed a second pass: the ASIN initially found for
 * "Retinol" (B0FWJM46PL) was correct, but the initially-found "Vitamin C" ASIN redirected
 * to that same Retinol listing (not a working standalone product) — its actual ASIN is
 * B0H9LJ2B5L, found via that listing's own cross-sell module and confirmed official.
 *
 * reviewScore holds a manually-entered rating on a 0–5 scale — the spec's intended "후기 지수"
 * signal for ranking Today's Pick. Filled in 2026-09-15 per a 3-tier grade mapping (see inline
 * comment on each item for the specific basis):
 *   - A (4.8) — 화해 앱에서 해당 제품/브랜드 랭킹을 직접 확인
 *   - B (4.5) — 화해 상위 브랜드 소속(개별 제품 순위 미확인) 또는 타 플랫폼 실사용 리뷰 다수 확인
 *   - C (4.2) — 아직 근거 없음, 화해에서 개별 제품 검증 필요 (브랜드 인지도와 무관한 임시값)
 * C-grade items aren't ranked low because the brand is obscure — they just haven't been
 * checked individually yet. Re-verify in the 화해 app and upgrade to A/B as that happens.
 */

import type { SkinWeather } from "@/lib/skin-weather"

export type AmazonProductCategory =
  | "Cleanser"
  | "Toner"
  | "Serum/Ampoule"
  | "Moisturizer"
  | "Sunscreen"
  | "Eye Care"
  | "Soothing/Barrier"
  | "Intensive Care"
  | "Brightening"

/** Weather condition this product is best suited for. "all_weather" = always a safe pick. */
export type TargetWeather = "high_humidity" | "dry_wind" | "high_uv" | "freezing" | "high_pm" | "all_weather"

/** "daily" = original 15-item rotating pool. "special" = the 5 special-care items added 2026-09-15. */
export type PickPool = "daily" | "special"

/** morning/night-only items are excluded from selection outside their window; "always" has no restriction. */
export type TimeConstraint = "morning" | "night" | "always"

export interface AmazonPick {
  id: string
  category: AmazonProductCategory
  targetWeather: TargetWeather[]
  pool: PickPool
  timeConstraint: TimeConstraint
  /** Manually-entered Korean review-app (화해/글로우픽) rating, 0–5. See file header for the grading tiers. */
  reviewScore: number
  /** Arbitrary fixed order (lower = shown first) used ONLY to break reviewScore ties deterministically —
   *  currently set on the 11 C-grade items, which all share reviewScore 4.2. Undefined sorts last. */
  tieBreakOrder?: number
  /** English brand name */
  brand: string
  /** English product name */
  name: string
  /** One-line English prescription copy, e.g. "Calming barrier shield for humid summer days" */
  tagLine: string
  /** Key ingredient(s), e.g. "Centella Asiatica" */
  ingredientFocus: string
  /** Amazon Associates link — placeholder until real ASIN + tag are filled in */
  affiliateUrl: string
  /** Product thumbnail URL — left blank until sourced/verified (see file header) */
  imageUrl: string
}

const AMAZON_TAG = "kcultureclass-20"
const amzUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`

export const AMAZON_PICKS: AmazonPick[] = [
  {
    id: "roundlab-birch-sun",
    category: "Sunscreen",
    targetWeather: ["high_uv", "high_humidity"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.5, // B — 화해 브랜드랭킹 3위(Round Lab), 개별 제품 순위 미확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Round Lab",
    name: "Birch Juice Moisturizing UV LOCK SPF 45",
    tagLine: "No white cast, no greasy finish — comfortable sun protection on hot, humid days.",
    ingredientFocus: "Birch Juice",
    affiliateUrl: amzUrl("B0DJGWH3TC"),
    imageUrl: "https://m.media-amazon.com/images/I/51zkVhLubPL._SX425_.jpg",
  },
  {
    id: "isntree-sun-gel",
    category: "Sunscreen",
    targetWeather: ["high_uv", "all_weather"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 1, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "Isntree",
    name: "Hyaluronic Acid Daily Sun Gel SPF 30",
    tagLine: "A lightweight daily gel sunscreen that layers well under makeup, even on high-UV days.",
    ingredientFocus: "Hyaluronic Acid",
    affiliateUrl: amzUrl("B0C7B55GS3"),
    imageUrl: "https://m.media-amazon.com/images/I/51lEn+3Xs2L._SX425_.jpg",
  },
  {
    id: "cosrx-good-morning-cleanser",
    category: "Cleanser",
    targetWeather: ["all_weather", "high_humidity"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 2, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "COSRX",
    name: "Low pH Good Morning Gel Cleanser",
    tagLine: "Gentle low-pH gel cleanse that won't strip your skin, whatever the weather.",
    ingredientFocus: "Tea Tree Leaf Water, BHA",
    affiliateUrl: amzUrl("B016NRXO06"),
    imageUrl: "https://m.media-amazon.com/images/I/61p4e9MbPiL._SY879_.jpg",
  },
  {
    id: "cosrx-salicylic-cleanser",
    category: "Cleanser",
    targetWeather: ["high_humidity", "high_pm"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 3, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "COSRX",
    name: "Salicylic Acid Daily Gentle Cleanser",
    tagLine: "A gentle daily cleanse that helps clear out pollution and excess oil on humid days.",
    ingredientFocus: "Salicylic Acid",
    affiliateUrl: amzUrl("B00OZ6W8DW"),
    imageUrl: "https://m.media-amazon.com/images/I/61ic3PbK8oL._SX425_.jpg",
  },
  {
    id: "anua-heartleaf-toner",
    category: "Toner",
    targetWeather: ["high_pm", "high_humidity"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.5, // B — 화해 브랜드랭킹 7위(Anua), 개별 제품 순위 미확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Anua",
    name: "Heartleaf 77% Soothing Toner",
    tagLine: "Calms redness and irritation from pollution and humidity in one swipe.",
    ingredientFocus: "Houttuynia Cordata (Heartleaf)",
    affiliateUrl: amzUrl("B08CMS8P67"),
    imageUrl: "https://m.media-amazon.com/images/I/51AeF0suKmL._AC_SX522_.jpg",
  },
  {
    id: "roundlab-dokdo-toner",
    category: "Toner",
    targetWeather: ["dry_wind", "high_pm"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.5, // B — 화해 브랜드랭킹 3위(Round Lab), 개별 제품 순위 미확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Round Lab",
    name: "1025 Dokdo Toner",
    tagLine: "Splash-style toner that replenishes moisture fast on dry, windy days.",
    ingredientFocus: "Birch Sap, Deep Sea Water",
    affiliateUrl: amzUrl("B08FM5BTF6"),
    imageUrl: "https://m.media-amazon.com/images/I/41WC1qaAGIL._AC_SX522_.jpg",
  },
  {
    id: "skin1004-centella-toner",
    category: "Toner",
    targetWeather: ["all_weather", "high_pm"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 4, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "SKIN1004",
    name: "Madagascar Centella Toning Toner",
    tagLine: "A soothing daily toner that keeps sensitive skin calm no matter the forecast.",
    ingredientFocus: "Centella Asiatica",
    affiliateUrl: amzUrl("B07NS3T4W2"),
    imageUrl: "https://m.media-amazon.com/images/I/61u3zLKAxAL._SX425_.jpg",
  },
  {
    id: "isntree-ha-toner",
    category: "Toner",
    targetWeather: ["dry_wind", "all_weather"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 5, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "Isntree",
    name: "Hyaluronic Acid Toner",
    tagLine: "A lightweight, everyday hydrator that keeps skin comfortable in any climate.",
    ingredientFocus: "Hyaluronic Acid",
    affiliateUrl: amzUrl("B07Y32L357"),
    imageUrl: "https://m.media-amazon.com/images/I/51q27LoYzVL._SX425_.jpg",
  },
  {
    id: "boj-glow-serum",
    category: "Serum/Ampoule",
    targetWeather: ["dry_wind", "freezing"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 6, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "Beauty of Joseon",
    name: "Glow Serum: Propolis + Niacinamide",
    tagLine: "Deeply hydrating, brightening serum for dry, cold-weather dullness.",
    ingredientFocus: "Propolis, Niacinamide",
    affiliateUrl: amzUrl("B0F8LBX37X"),
    imageUrl: "https://m.media-amazon.com/images/I/61c0Hy2FRiL._SX425_.jpg",
  },
  {
    id: "cosrx-peptide-booster-serum",
    category: "Serum/Ampoule",
    targetWeather: ["dry_wind", "high_humidity"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 7, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "COSRX",
    name: "6X Peptide Collagen Skin Booster Serum",
    tagLine: "A peptide-rich booster that preps and hydrates skin for an even, renewed texture.",
    ingredientFocus: "Copper Peptides (GHK-Cu)",
    affiliateUrl: amzUrl("B0CCJ3SRB9"),
    imageUrl: "https://m.media-amazon.com/images/I/61ZNyaBF0CL._SX425_.jpg",
  },
  {
    id: "anua-niacinamide-txa-serum",
    category: "Serum/Ampoule",
    targetWeather: ["high_uv", "all_weather"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.5, // B — 화해 브랜드랭킹 7위(Anua), 개별 제품 순위 미확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Anua",
    name: "Niacinamide 10 + TXA 4 Serum",
    tagLine: "Evens out tone and fades UV-triggered dullness with a lightweight daily serum.",
    ingredientFocus: "Niacinamide, Tranexamic Acid",
    affiliateUrl: amzUrl("B0CLLV2T1P"),
    imageUrl: "https://m.media-amazon.com/images/I/61-PwDPNjyL._AC_SX522_.jpg",
  },
  {
    id: "torriden-dive-in-serum",
    category: "Serum/Ampoule",
    targetWeather: ["dry_wind", "freezing"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.8, // A — 화해 수분토너 카테고리 2위·브랜드랭킹 1위(Torriden), 직접 확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Torriden",
    name: "DIVE-IN Hyaluronic Acid Serum",
    tagLine: "Deep hydration for tight, dry-feeling skin on cold or dry days.",
    ingredientFocus: "Hyaluronic Acid",
    affiliateUrl: amzUrl("B07WZ2YTDP"),
    imageUrl: "https://m.media-amazon.com/images/I/51IhsMajjFL._SX425_.jpg",
  },
  {
    id: "skin1004-centella-ampoule",
    category: "Serum/Ampoule",
    targetWeather: ["high_pm", "high_humidity"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 8, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "SKIN1004",
    name: "Madagascar Centella Ampoule",
    tagLine: "High-concentration centella to calm skin stressed by pollution and humidity.",
    ingredientFocus: "Centella Asiatica (Cica)",
    affiliateUrl: amzUrl("B06Y15D1LH"),
    imageUrl: "https://m.media-amazon.com/images/I/61Bx8lg8FeL._SY450_.jpg",
  },
  {
    id: "boj-dynasty-cream",
    category: "Moisturizer",
    targetWeather: ["freezing", "dry_wind"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 9, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "Beauty of Joseon",
    name: "Dynasty Cream",
    tagLine: "A rich, ginseng-infused cream that locks in moisture on cold, dry days.",
    ingredientFocus: "Ginseng, Rice Bran Water",
    affiliateUrl: amzUrl("B0CVKM5MMH"),
    imageUrl: "https://m.media-amazon.com/images/I/51GLRpfgbGL._SX425_.jpg",
  },
  {
    id: "cosrx-ceramide-cream",
    category: "Moisturizer",
    targetWeather: ["freezing", "dry_wind"],
    pool: "daily",
    timeConstraint: "always",
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 10, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "COSRX",
    name: "Balancium Comfort Ceramide Cream",
    tagLine: "Ceramide-rich barrier repair cream for when your skin feels tight and stripped.",
    ingredientFocus: "Ceramide NP, Centella Asiatica",
    affiliateUrl: amzUrl("B07CZZ2QGB"),
    imageUrl: "https://m.media-amazon.com/images/I/61W4Vrd5MHS._SX425_.jpg",
  },

  // ── Special-care pool (5 items, added 2026-09-15) ──
  {
    id: "mediheal-eye-patch-retinol",
    category: "Eye Care",
    targetWeather: ["all_weather"],
    pool: "special",
    timeConstraint: "night",
    // Verified live on amazon.com 2026-09-15, "Visit the MEDIHEAL Store" byline (ASIN B0FWJM46PL).
    reviewScore: 4.8, // A — 화해 부분마스크 랭킹 1위, 직접 확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Mediheal",
    name: "Retinol Collagen Capsule Eye Patch (60 Count)",
    tagLine: "An overnight retinol capsule patch that works on fine lines while you sleep.",
    ingredientFocus: "Retinol",
    affiliateUrl: amzUrl("B0FWJM46PL"),
    imageUrl: "https://m.media-amazon.com/images/I/614x6Nnj1uL._SX425_.jpg",
  },
  {
    id: "mediheal-eye-patch-vitamin-c",
    category: "Eye Care",
    targetWeather: ["all_weather"],
    pool: "special",
    timeConstraint: "morning",
    // Verified live on amazon.com 2026-09-15, "Visit the MEDIHEAL Store" byline (ASIN B0H9LJ2B5L —
    // not B0FWJL55C6, which redirects to the retinol listing above and isn't a working ASIN).
    reviewScore: 4.8, // A — 화해 부분마스크 랭킹 5위, 직접 확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Mediheal",
    name: "Vitamin C Collagen Capsule Eye Patch (60 Count)",
    tagLine: "A brightening vitamin C eye capsule patch to wake up tired-looking under-eyes.",
    ingredientFocus: "Vitamin C",
    affiliateUrl: amzUrl("B0H9LJ2B5L"),
    imageUrl: "https://m.media-amazon.com/images/I/51K3cpEoDgL._AC_SX425_.jpg",
  },
  {
    id: "atopalm-panthenol-cream",
    category: "Soothing/Barrier",
    targetWeather: ["dry_wind", "freezing", "high_pm", "all_weather"],
    pool: "special",
    timeConstraint: "always",
    // Verified live on amazon.com 2026-09-15, "Visit the ATOPALM Store" byline (ASIN B09L4S4ZL3).
    reviewScore: 4.5, // B — 글로우픽·공식몰 실사용 후기 다수 확인, 화해 개별 순위는 미확인 (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Atopalm",
    name: "Panthenol Cream",
    tagLine: "A deep-hydration barrier cream that calms itchy, sensitive skin — good in any weather.",
    ingredientFocus: "Panthenol",
    affiliateUrl: amzUrl("B09L4S4ZL3"),
    imageUrl: "https://m.media-amazon.com/images/I/41q4jOyrv9L._SX425_.jpg",
  },
  {
    id: "skin1004-centella-sheet-mask",
    category: "Intensive Care",
    targetWeather: ["high_pm", "high_humidity", "high_uv", "all_weather"],
    pool: "special",
    timeConstraint: "always",
    // Verified live on amazon.com 2026-09-15, "Visit the SKIN1004 Store" byline (ASIN B0849LK66C).
    reviewScore: 4.2, // C — 화해 개별 순위 미확인, 추후 검증 필요 (2026-09-15 화해/글로우픽 등급 매핑)
    tieBreakOrder: 11, // 임의 순번(2026-09-15) — 동점(4.2) C등급끼리 노출 순서만 고정
    brand: "SKIN1004",
    name: "Madagascar Centella Water-Gel Sheet Ampoule Mask (5ea)",
    tagLine: "An affordable, high-dose centella sheet mask for skin that needs extra calming, fast.",
    ingredientFocus: "Centella Asiatica",
    affiliateUrl: amzUrl("B0849LK66C"),
    imageUrl: "https://m.media-amazon.com/images/I/717r0D5SCPL._SX425_.jpg",
  },
  {
    id: "medipeel-melano-x-cream",
    category: "Brightening",
    targetWeather: ["high_uv", "all_weather"],
    pool: "special",
    timeConstraint: "always",
    // Verified live on amazon.com 2026-09-15, "Visit the MEDI-PEEL Store" byline (ASIN B08W8B81Q4).
    reviewScore: 4.5, // B — 쿠팡 리뷰 22,381개·평점 4.5 확인(화해 아닌 타 플랫폼 데이터) (2026-09-15 화해/글로우픽 등급 매핑)
    brand: "Medi-Peel",
    name: "Melano X Cream",
    tagLine: "A brightening spot cream for dark spots and dullness from UV exposure.",
    ingredientFocus: "Tranexamic Acid, Niacinamide",
    affiliateUrl: amzUrl("B08W8B81Q4"),
    imageUrl: "https://m.media-amazon.com/images/I/61YpFjP2zHL._SX425_.jpg",
  },
]

/** Today's weather → matching condition tags. Mirrors the thresholds already used across
 *  lib/skin-weather.ts / lib/care-card-copy.ts (humidity 50%, UV 6, PM2.5 35, temp 5°C). */
function deriveWeatherTags(weather: SkinWeather): TargetWeather[] {
  const tags: TargetWeather[] = ["all_weather"]
  if (weather.humidity !== null && weather.humidity >= 70) tags.push("high_humidity")
  if (weather.humidity !== null && weather.humidity < 50) tags.push("dry_wind")
  if (weather.uvIndex !== null && weather.uvIndex >= 6) tags.push("high_uv")
  if (weather.pm25 !== null && weather.pm25 >= 35) tags.push("high_pm")
  if (weather.temp !== null && weather.temp <= 5) tags.push("freezing")
  return tags
}

function isEligibleNow(pick: AmazonPick, now: Date): boolean {
  if (pick.timeConstraint === "always") return true
  const hour = now.getHours()
  if (pick.timeConstraint === "morning") return hour >= 4 && hour < 12
  // "night": evening through pre-dawn, wrapping past midnight
  return hour >= 18 || hour < 4
}

/** Today's Pick gets demoted (not excluded) by this many reviewScore points if it — or a
 *  regular-pick candidate — was already shown within the last 7 days. */
const RECENCY_PENALTY = 2

export interface TodayAmazonRecommendation {
  /** The single leftmost, highlighted pick — chosen primarily by review score. */
  todaysPick: AmazonPick
  /** The other 2 picks — chosen primarily by today's weather match. */
  regularPicks: AmazonPick[]
}

/**
 * Selects today's 3 Amazon picks (1 Today's Pick + 2 regular), per the 2026-09-15 curation
 * spec:
 *  1. Hard filter: morning/night-only items are dropped outside their window.
 *  2. Recent exposure (last 7 days) is a weighted penalty, not an exclusion.
 *  3. Weather-tag match is the deciding factor for the 2 regular picks.
 *  4. reviewScore (with the recency penalty applied) is the deciding factor for Today's Pick.
 *
 * Pure function — `recentlyExposedIds` must be supplied by the caller (see
 * app/api/amazon-picks/route.ts, which reads the shared amazon_pick_exposures table).
 */
export function selectTodayAmazonRecommendation(
  weather: SkinWeather,
  now: Date = new Date(),
  recentlyExposedIds: ReadonlySet<string> = new Set(),
): TodayAmazonRecommendation {
  const activeTags = deriveWeatherTags(weather)
  const eligible = AMAZON_PICKS.filter((p) => isEligibleNow(p, now))
  const pool = eligible.length > 0 ? eligible : AMAZON_PICKS // safety net; "always" items always exist

  const matchesWeather = (p: AmazonPick) => p.targetWeather.some((w) => activeTags.includes(w))
  const wasRecentlyExposed = (p: AmazonPick) => recentlyExposedIds.has(p.id)
  const penalty = (p: AmazonPick) => (wasRecentlyExposed(p) ? RECENCY_PENALTY : 0)
  // Final, deterministic tiebreaker once reviewScore/weather/penalty are all equal (mainly
  // the 11 C-grade items, which all share reviewScore 4.2). Items without a tieBreakOrder
  // sort after any that have one.
  const tieBreak = (p: AmazonPick) => p.tieBreakOrder ?? Number.POSITIVE_INFINITY

  const byTodaysPickScore = [...pool].sort((a, b) => {
    const scoreDiff = b.reviewScore - penalty(b) - (a.reviewScore - penalty(a))
    if (scoreDiff !== 0) return scoreDiff
    const matchDiff = Number(matchesWeather(b)) - Number(matchesWeather(a))
    if (matchDiff !== 0) return matchDiff
    return tieBreak(a) - tieBreak(b)
  })
  const todaysPick = byTodaysPickScore[0]

  const remaining = pool.filter((p) => p.id !== todaysPick.id)
  const byRegularScore = [...remaining].sort((a, b) => {
    const matchDiff = Number(matchesWeather(b)) - Number(matchesWeather(a))
    if (matchDiff !== 0) return matchDiff
    const penaltyDiff = penalty(a) - penalty(b) // lower penalty first
    if (penaltyDiff !== 0) return penaltyDiff
    const scoreDiff = b.reviewScore - a.reviewScore
    if (scoreDiff !== 0) return scoreDiff
    return tieBreak(a) - tieBreak(b)
  })

  // Prefer category diversity across the 2 regular picks, but never leave a slot empty.
  const regularPicks: AmazonPick[] = []
  const usedCategories = new Set<AmazonProductCategory>([todaysPick.category])
  for (const item of byRegularScore) {
    if (regularPicks.length >= 2) break
    if (usedCategories.has(item.category)) continue
    usedCategories.add(item.category)
    regularPicks.push(item)
  }
  if (regularPicks.length < 2) {
    const usedIds = new Set([todaysPick.id, ...regularPicks.map((p) => p.id)])
    for (const item of byRegularScore) {
      if (regularPicks.length >= 2) break
      if (usedIds.has(item.id)) continue
      usedIds.add(item.id)
      regularPicks.push(item)
    }
  }

  return { todaysPick, regularPicks }
}

/** Month → seasonal tone category, per the curation spec's table. March and July are each
 *  claimed by two overlapping categories in the spec table (환절기 vs 황사, 장마 vs 한여름
 *  자외선); by product decision, March favors yellow_dust and July favors monsoon. November
 *  isn't covered by the spec table at all — treated as a transition month into winter. */
export type SeasonCategory = "transition" | "monsoon" | "high_uv_summer" | "dry_cold" | "yellow_dust"

export function getSeasonCategory(now: Date = new Date()): SeasonCategory {
  switch (now.getMonth() + 1) {
    case 3:
      return "yellow_dust"
    case 4:
      return "transition"
    case 5:
      return "yellow_dust"
    case 6:
      return "monsoon"
    case 7:
      return "monsoon"
    case 8:
      return "high_uv_summer"
    case 9:
    case 10:
    case 11:
      return "transition"
    default: // 12, 1, 2
      return "dry_cold"
  }
}

const SEASON_TONE: Record<SeasonCategory, string> = {
  transition: "It's that in-between season",
  monsoon: "It's monsoon season",
  high_uv_summer: "UV is strong this time of year",
  dry_cold: "It's the dry, cold season",
  yellow_dust: "Fine dust season is here",
}

function describeTodaysWeather(weather: SkinWeather, category: SeasonCategory): string | null {
  if ((category === "dry_cold" || category === "transition") && weather.humidity !== null) {
    return `today's humidity is ${weather.humidity}% — on the dry side`
  }
  if (category === "monsoon" && weather.humidity !== null) {
    return `today's humidity is ${weather.humidity}% — pretty muggy`
  }
  if (category === "high_uv_summer" && weather.uvIndex !== null) {
    return `today's UV index is ${weather.uvIndex} — quite high`
  }
  if (category === "yellow_dust" && weather.pm25 !== null) {
    return `today's PM2.5 is ${weather.pm25}µg/m³ — worth watching`
  }
  return null
}

/**
 * Builds Today's Pick reason copy per the spec's 2-tier template: [seasonal tone] +
 * [today's weather detail] + [ingredient callout]. The other 2 (regular) picks keep reusing
 * their existing `tagLine` field as-is — no generation needed there, per spec.
 */
export function buildTodaysPickReason(pick: AmazonPick, weather: SkinWeather, now: Date = new Date()): string {
  const category = getSeasonCategory(now)
  const tone = SEASON_TONE[category]
  const detail = describeTodaysWeather(weather, category)
  const middle = detail ? `, and ${detail}` : ""
  return `${tone}${middle}. ${pick.ingredientFocus} helps in weather like this.`
}
