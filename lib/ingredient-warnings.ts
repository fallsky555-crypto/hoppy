/**
 * 동시 사용 시 주의가 필요한 성분 조합 경고
 * 우선순위: 트리플 > 더블 조합
 */

import { t } from "@/lib/i18n"

export interface IngredientWarning {
  level: "caution" | "warning"
  title: string
  message: string
  conflictingIngredients: string[]
}

/** 성분 ID 정규화 (다양한 표기법을 통일) */
const INGREDIENT_ALIASES: Record<string, string> = {
  retinol: "ret",
  레티놀: "ret",
  "비타민C": "vit_c",
  vitamin_c: "vit_c",
  vitc: "vit_c",
  aha: "aha",
  "각질케어": "exfoliate", // AHA/BHA를 통칭
  bha: "bha",
}

/**
 * 성분 이름을 정규화된 ID로 변환
 */
export function normalizeIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase().trim()
  return INGREDIENT_ALIASES[lower] || lower
}

/**
 * 활성 성분 배열을 기반으로 경고 반환
 * @param activeIngredients 사용 중인 성분 배열 (한글명 또는 ID)
 * @returns IngredientWarning 또는 null (경고 없음)
 */
export function getIngredientWarning(activeIngredients: string[] | null | undefined, locale: "ko" | "en" = "ko"): IngredientWarning | null {
  if (!activeIngredients || activeIngredients.length === 0) return null

  const normalized = activeIngredients
    .map((ing) => normalizeIngredient(ing))
    .filter(Boolean)

  if (normalized.length === 0) return null

  const hasRetinol = normalized.includes("ret")
  const hasVitC = normalized.includes("vit_c")
  const hasExfoliate = normalized.includes("aha") || normalized.includes("bha") || normalized.includes("exfoliate")

  // 트리플 겹침: 레티놀 + 비타민C + 각질케어
  if (hasRetinol && hasVitC && hasExfoliate) {
    return {
      level: "warning",
      title: t("ingredientWarnings.triple.title", locale),
      message: t("ingredientWarnings.triple.message", locale),
      conflictingIngredients: ["레티놀", "비타민C", "각질케어"],
    }
  }

  // 더블 겹침: 레티놀 + 각질케어
  if (hasRetinol && hasExfoliate) {
    return {
      level: "caution",
      title: t("ingredientWarnings.retinolExfoliate.title", locale),
      message: t("ingredientWarnings.retinolExfoliate.message", locale),
      conflictingIngredients: ["레티놀", "각질케어"],
    }
  }

  // 더블 겹침: 레티놀 + 비타민C
  if (hasRetinol && hasVitC) {
    return {
      level: "caution",
      title: t("ingredientWarnings.retinolVitC.title", locale),
      message: t("ingredientWarnings.retinolVitC.message", locale),
      conflictingIngredients: ["레티놀", "비타민C"],
    }
  }

  // 더블 겹침: 각질케어 + 비타민C
  if (hasExfoliate && hasVitC) {
    return {
      level: "caution",
      title: t("ingredientWarnings.exfoliateVitC.title", locale),
      message: t("ingredientWarnings.exfoliateVitC.message", locale),
      conflictingIngredients: ["각질케어", "비타민C"],
    }
  }

  return null
}

/**
 * 주의가 필요한 성분 조합 목록 (참고용)
 */
export const RISKY_COMBINATIONS = [
  {
    ingredients: ["ret", "exfoliate", "vit_c"],
    level: "triple",
    desc: "레티놀 + 각질케어 + 비타민C",
  },
  {
    ingredients: ["ret", "exfoliate"],
    level: "double",
    desc: "레티놀 + 각질케어",
  },
  {
    ingredients: ["ret", "vit_c"],
    level: "double",
    desc: "레티놀 + 비타민C",
  },
  {
    ingredients: ["exfoliate", "vit_c"],
    level: "double",
    desc: "각질케어 + 비타민C",
  },
]
