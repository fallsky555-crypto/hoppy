import type { RecipeType } from "@/lib/schedule"

type SlotType = "prep" | "hydration" | "active" | "barrier" | "sun_care"

/**
 * RecipeType → SlotType 매핑
 * 추천 배지 로직에 사용
 */
const RECIPE_TO_SLOT: Record<RecipeType, SlotType | null> = {
  // 액티브 (기능성 공격일)
  bha: "active",
  retinol: "active",

  // 방어 케어 (6단계 서브 로테이션)
  defense_barrier: "barrier",
  defense_toning: "prep",
  defense_hydration: "hydration",
  barrier_lock: "barrier",
  hydration_lock: "hydration",
  toning_solo: "prep",

  // 인시던트 전용
  sos_rest: "barrier",
}

/**
 * RecipeType에서 추천될 SlotType을 반환합니다.
 * sun_care는 추천 대상이 아니므로 null 반환.
 */
export function getRecommendedSlot(recipeType: RecipeType): SlotType | null {
  return RECIPE_TO_SLOT[recipeType] ?? null
}
