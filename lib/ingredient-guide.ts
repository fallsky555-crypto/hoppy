/**
 * 피부 고민별 추천 성분 매트릭스
 * concernTag(DRY/TONE/TEXTURE/TROUBLE/AGING/BARRIER) × skinType(dry/oily/combo/sensitive)
 */

export type ConcernTag = "DRY" | "TONE" | "TEXTURE" | "TROUBLE" | "AGING" | "BARRIER"
export type SkinType = "dry" | "oily" | "combo" | "sensitive"

interface IngredientGuide {
  label: string
  ingredients: string[]
  caution?: string
}

/** 성분명 매핑 (id → 언어별 성분명) */
const INGREDIENT_NAMES: Record<string, Record<"ko" | "en", string>> = {
  hya: { ko: "히알루론산", en: "Hyaluronic Acid" },
  gly: { ko: "글리세린", en: "Glycerin" },
  cer: { ko: "세라마이드", en: "Ceramide" },
  chol: { ko: "콜레스테롤", en: "Cholesterol" },
  pant: { ko: "판테놀", en: "Panthenol" },
  niacinamide: { ko: "나이아신아마이드", en: "Niacinamide" },
  fer: { ko: "발효 성분", en: "Fermented ingredients" },
  vit_c: { ko: "비타민C", en: "Vitamin C" },
  ret: { ko: "레티놀", en: "Retinol" },
  aha: { ko: "AHA", en: "AHA" },
  bha: { ko: "BHA", en: "BHA" },
  azeic: { ko: "아젤라산", en: "Azelaic Acid" },
  squalane: { ko: "스쿠알란", en: "Squalane" },
  spf: { ko: "자외선차단제", en: "SPF/Sunscreen" },
}

/** 피부 고민별 × 피부 타입별 추천 성분 매트릭스 */
const CONCERN_RECOMMEND: Record<ConcernTag, Record<SkinType, string[]>> = {
  DRY: {
    dry: ["hya", "gly", "cer", "chol", "pant"],
    oily: ["hya", "gly"],
    combo: ["hya", "gly", "cer"],
    sensitive: ["hya", "gly", "cer", "pant"],
  },
  TONE: {
    dry: ["niacinamide", "fer", "vit_c", "squalane"],
    oily: ["niacinamide", "fer", "vit_c"],
    combo: ["niacinamide", "fer", "vit_c"],
    sensitive: ["niacinamide", "fer", "spf"],
  },
  TEXTURE: {
    dry: ["aha", "hya", "cer"],
    oily: ["bha", "aha"],
    combo: ["aha", "bha"],
    sensitive: ["aha", "hya"],
  },
  TROUBLE: {
    dry: ["niacinamide", "cer", "azeic"],
    oily: ["bha", "niacinamide", "azeic"],
    combo: ["niacinamide", "bha", "azeic"],
    sensitive: ["niacinamide", "cer", "azeic"],
  },
  AGING: {
    dry: ["ret", "vit_c", "niacinamide", "cer"],
    oily: ["ret", "vit_c"],
    combo: ["ret", "vit_c", "niacinamide"],
    sensitive: ["ret", "vit_c", "niacinamide"],
  },
  BARRIER: {
    dry: ["cer", "chol", "pant", "hya"],
    oily: ["niacinamide", "hya"],
    combo: ["cer", "hya", "niacinamide"],
    sensitive: ["cer", "chol", "pant", "hya"],
  },
}

/**
 * 피부 고민과 피부 타입을 기반으로 추천 성분을 반환
 * @param concernTag 피부 고민 (DRY/TONE/TEXTURE/TROUBLE/AGING/BARRIER)
 * @param skinType 피부 타입 (dry/oily/combo/sensitive)
 * @returns 추천 성분 한글명 배열
 */
export function getIngredientGuide(
  concernTag: ConcernTag | string | null | undefined,
  skinType: SkinType | string | null | undefined,
  locale: "ko" | "en" = "ko",
): string[] {
  if (!concernTag || !skinType) return []

  const tag = concernTag.toUpperCase() as ConcernTag
  const type = (skinType.toLowerCase()) as SkinType

  if (!(tag in CONCERN_RECOMMEND) || !(type in CONCERN_RECOMMEND[tag])) {
    return []
  }

  const ingredientIds = CONCERN_RECOMMEND[tag][type]
  return ingredientIds
    .map((id) => INGREDIENT_NAMES[id]?.[locale])
    .filter(Boolean)
}

/**
 * 성분 id를 언어별 성분명으로 변환
 */
export function getIngredientName(ingredientId: string, locale: "ko" | "en" = "ko"): string {
  return INGREDIENT_NAMES[ingredientId]?.[locale] || ingredientId
}

/**
 * 모든 가능한 concernTag 반환
 */
export function getAllConcernTags(): ConcernTag[] {
  return ["DRY", "TONE", "TEXTURE", "TROUBLE", "AGING", "BARRIER"]
}
