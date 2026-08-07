/**
 * 동시 사용 시 주의가 필요한 성분 조합 경고
 * 우선순위: 트리플 > 더블 조합
 */

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
function normalizeIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase().trim()
  return INGREDIENT_ALIASES[lower] || lower
}

/**
 * 활성 성분 배열을 기반으로 경고 반환
 * @param activeIngredients 사용 중인 성분 배열 (한글명 또는 ID)
 * @returns IngredientWarning 또는 null (경고 없음)
 */
export function getIngredientWarning(activeIngredients: string[] | null | undefined): IngredientWarning | null {
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
      title: "세 가지 활성 성분을 동시에 사용하고 계세요",
      message:
        "레티놀, 비타민C, 각질케어 성분을 함께 쓰면 피부에 자극이 커질 수 있어요. 사용 간격을 충분히 두거나(예: 아침/저녁 분리, 요일 분리) 농도를 낮춰서 피부 반응을 보면서 진행하세요. 호빵이 스킨저널에서 사용 패턴을 함께 기록해보세요.",
      conflictingIngredients: ["레티놀", "비타민C", "각질케어"],
    }
  }

  // 더블 겹침: 레티놀 + 각질케어
  if (hasRetinol && hasExfoliate) {
    return {
      level: "caution",
      title: "레티놀과 각질케어를 함께 사용 중이에요",
      message:
        "두 성분 모두 진피층에 자극을 주는 활성 성분이에요. 같은 날 사용할 때는 한 번에 한 가지만 사용하거나, 며칠 간격을 두고 번갈아 사용하세요.",
      conflictingIngredients: ["레티놀", "각질케어"],
    }
  }

  // 더블 겹침: 레티놀 + 비타민C
  if (hasRetinol && hasVitC) {
    return {
      level: "caution",
      title: "레티놀과 비타민C를 함께 사용 중이에요",
      message:
        "두 성분 모두 강력한 활성 성분이므로 아침/저녁으로 분리하거나 며칠 간격을 두고 사용하는 것을 추천해요. 호빵이 스킨저널에서 어떤 간격으로 쓰고 있는지 기록해보세요.",
      conflictingIngredients: ["레티놀", "비타민C"],
    }
  }

  // 더블 겹침: 각질케어 + 비타민C
  if (hasExfoliate && hasVitC) {
    return {
      level: "caution",
      title: "각질케어와 비타민C를 함께 사용 중이에요",
      message:
        "산성 성분인 비타민C와 각질케어 성분을 함께 쓸 때는 피부 반응을 잘 살펴보세요. 처음에는 일주일에 2-3회만 사용하고, 피부가 적응하면 횟수를 늘리세요.",
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
