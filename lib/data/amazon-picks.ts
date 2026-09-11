/**
 * Amazon (US) affiliate product dataset — English-locale-only product recommendations.
 *
 * This is a separate dataset from lib/affiliate-picks.ts (Coupang/Korean picks) and does
 * NOT replace or modify it. lib/affiliate-picks.ts stays untouched and keeps powering the
 * `locale === "ko"` picks exactly as before; this file only powers `locale === "en"`.
 *
 * All 15 items below were individually verified live on amazon.com (2026-09-11): each
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
 */

import type { SkinWeather } from "@/lib/skin-weather"

export type AmazonProductCategory = "Cleanser" | "Toner" | "Serum/Ampoule" | "Moisturizer" | "Sunscreen"

/** Weather condition this product is best suited for. "all_weather" = always a safe pick. */
export type TargetWeather = "high_humidity" | "dry_wind" | "high_uv" | "freezing" | "high_pm" | "all_weather"

export interface AmazonPick {
  id: string
  category: AmazonProductCategory
  targetWeather: TargetWeather[]
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
    brand: "COSRX",
    name: "Balancium Comfort Ceramide Cream",
    tagLine: "Ceramide-rich barrier repair cream for when your skin feels tight and stripped.",
    ingredientFocus: "Ceramide NP, Centella Asiatica",
    affiliateUrl: amzUrl("B07CZZ2QGB"),
    imageUrl: "https://m.media-amazon.com/images/I/61W4Vrd5MHS._SX425_.jpg",
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

/**
 * Today's weather → up to 4 Amazon picks, one per category where possible.
 * Falls back to filling from the full catalog (still de-duplicated) if fewer than 3
 * products match today's conditions, so the lookbook is never empty.
 */
export function getTodayAmazonPicks(weather: SkinWeather, now: Date = new Date()): AmazonPick[] {
  void now // reserved for future day-based rotation; weather is the only driver today

  const activeTags = deriveWeatherTags(weather)
  const matched = AMAZON_PICKS.filter((p) => p.targetWeather.some((w) => activeTags.includes(w)))
  const pool = matched.length > 0 ? matched : AMAZON_PICKS

  const out: AmazonPick[] = []
  const seenCategories = new Set<AmazonProductCategory>()
  for (const item of pool) {
    if (out.length >= 4) break
    if (seenCategories.has(item.category)) continue
    seenCategories.add(item.category)
    out.push(item)
  }

  if (out.length < 3) {
    const usedIds = new Set(out.map((o) => o.id))
    for (const item of pool) {
      if (out.length >= 3) break
      if (usedIds.has(item.id)) continue
      usedIds.add(item.id)
      out.push(item)
    }
  }

  return out
}
