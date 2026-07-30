import type { CalendarEntry, Recipe, RecipeType } from "@/lib/schedule"
import type { Locale } from "@/lib/i18n"
import { t, interpolate } from "@/lib/i18n"

/**
 * 2026-07-27 최종 스펙: title/detail 순환 기반으로 카테고리별 감성·사용법을 번갈아 노출한다.
 * 같은 카테고리가 calendar에 등장한 횟수를 세어, 그 순서에 맞는 title/detail 배열을 순환 선택.
 * caution은 기존 정보성 문구(성분 설명)를 그대로 유지한다.
 *
 * lib/scheduling-engine.ts는 건드리지 않는다 — 이 파일은 화면에 보여줄 문구만
 * 담당하고, 어떤 카테고리·날짜인지는 기존 엔진(getRecipeForDay, dayFromJoinDate
 * 등)이 그대로 정한다.
 */

export interface RoutineCopy {
  title: string
  detail: string
  caution?: string
}

/** 체커의 오늘 피부 상태(symptom) 문항에서 넘어오는 관심사 */
export type Concern = "dry" | "flush" | "flaky" | "trouble" | "none"
/** 유저가 이미 갖고 있다고 답한 성분 id (콤마 구분 URL 파라미터) */
export type SupportId = "hya" | "cica" | "nia" | "cer"

/** 카테고리별 순환할 title/detail 쌍 + caution(고정) */
interface CategoryCopyVariant {
  title: string
  detail: string
}

/** 같은 카테고리가 calendar 내 day 이전까지 몇 번 나타났는지 카운트 */
function countCategoryAppearances(calendar: CalendarEntry[], category: RecipeType, upToDay: number): number {
  return calendar.filter((e) => e.day < upToDay && e.category === category).length
}

/** 카테고리와 등장 횟수에 따라 배열 인덱스 반환 */
function pickVariantIndex(category: RecipeType, appearanceCount: number): number {
  const variants = getVariantsForCategory(category)
  return appearanceCount % variants.length
}

/** 카테고리별 variant 배열 반환 */
function getVariantsForCategory(category: RecipeType): readonly CategoryCopyVariant[] {
  const keyMap: Record<RecipeType, string> = {
    defense_barrier: "routine.defense_barrier.variants",
    defense_toning: "routine.defense_toning.variants",
    defense_hydration: "routine.defense_hydration.variants",
    barrier_lock: "routine.barrier_lock.variants",
    hydration_lock: "routine.hydration_lock.variants",
    toning_solo: "routine.toning_solo.variants",
    sos_rest: "routine.sos_rest.variants",
    aha: "routine.active.variants",
    bha: "routine.active.variants",
    retinol: "routine.active.variants",
  }
  return t(keyMap[category]) || []
}

/** concern별 관련 카테고리 (언제 노출될지 결정) */
const CONCERN_CATEGORIES: Record<Exclude<Concern, "none">, RecipeType[]> = {
  nia: ["defense_toning", "defense_toning"],
  hya: ["defense_hydration", "defense_hydration"],
  cica: ["defense_barrier", "sos_rest"],
  cer: ["defense_barrier", "barrier_lock"],
}

/**
 * day의 카테고리에 맞는 루틴 문구. title/detail은 calendar 기반으로 해당 카테고리의
 * 등장 횟수를 세어 variant 순환 선택. caution은 고정 정보성 문구.
 * 스페셜케어는 첫 등장(count===0)일 때 별도 문구, 이후부터 3개 순환.
 * concern이 설정되고 해당 성분이 없으면 구매 가이드 문구를 caution 뒤에 추가.
 */
export function getCategoryCopy(
  category: RecipeType,
  calendar: CalendarEntry[],
  day: number,
  concern: Concern = "none",
  supportOwned: SupportId[] = [],
): RoutineCopy {
  const appearanceCount = countCategoryAppearances(calendar, category, day)

  // 스페셜케어 첫 등장: 별도 문구 사용
  if ((category === "aha" || category === "bha" || category === "retinol") && appearanceCount === 0) {
    const firstVariant = t("routine.active_first")
    const label = t(`routine.active_label.${category}`)
    let detail = interpolate(firstVariant.detail, { name: label })
    const caution = t(`routine.active.caution.${category}`)
    return { title: firstVariant.title, detail, caution }
  }

  const index = pickVariantIndex(category, appearanceCount)
  const variant = getVariantsForCategory(category)[index]

  if (!variant) {
    return { title: "", detail: "" }
  }

  let detail = variant.detail

  if ((category === "aha" || category === "bha" || category === "retinol") && detail.includes("{{name}}")) {
    const label = t(`routine.active_label.${category}`)
    detail = interpolate(detail, { name: label })
  }

  let caution = getCautionForCategory(category)

  // concern 기반 구매 가이드: 해당 카테고리에 처음 또는 두 번째 등장할 때만 노출
  if (concern !== "none" && concern in t("routine.concern_purchase_guide")) {
    const concernCategories = CONCERN_CATEGORIES[concern]
    const categoryMatches = concernCategories.includes(category)

    if (categoryMatches && appearanceCount < 2) {
      const supportId = concern as SupportId
      if (!supportOwned.includes(supportId)) {
        const guide = t(`routine.concern_purchase_guide.${concern}`)
        if (caution) {
          caution = `${caution} · ${guide}`
        } else {
          caution = guide
        }
      }
    }
  }

  return { title: variant.title, detail, caution }
}

/** 카테고리별 caution 반환 */
function getCautionForCategory(category: RecipeType): string | null {
  const cautionMap: Record<RecipeType, string> = {
    defense_barrier: "routine.defense_barrier.caution",
    defense_toning: "routine.defense_toning.caution",
    defense_hydration: "routine.defense_hydration.caution",
    sos_rest: "routine.sos_rest.caution",
    aha: "routine.active.caution.aha",
    bha: "routine.active.caution.bha",
    retinol: "routine.active.caution.retinol",
    barrier_lock: "routine.barrier_lock.caution",
    hydration_lock: "routine.hydration_lock.caution",
    toning_solo: "routine.toning_solo.caution",
  }
  return t(cautionMap[category]) || null
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number, locale: Locale = "ko"): RoutineCopy {
  const completion = t("routine.completion", locale)
  const detail = interpolate(completion.detail_template, { totalDays: String(totalDays) })
  return {
    title: completion.title,
    detail,
  }
}
