import type { CalendarEntry, Recipe, RecipeType } from "@/lib/schedule"

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

/** 방어 계열 3종(장벽 잠금, 톤 정돈, 수분 충전) */
const DEFENSE_BARRIER_VARIANTS: readonly CategoryCopyVariant[] = [
  {
    title: "든든한 기본을 채우는 날",
    detail: "화려한 성분보다, 든든한 기본으로 채우는 날이에요. 세라마이드와 시카 크림을 평소보다 도톰하게 발라, 장벽이 스스로 회복할 시간을 만들어주세요.",
  },
  {
    title: "보이지 않아도 쌓이는 힘",
    detail: "눈에 띄는 변화는 없어도, 오늘 같은 날들이 진짜 힘이 돼요. 세라마이드와 시카 크림으로 피부 보호막을 다시 한 번 다져주세요.",
  },
  {
    title: "오늘은 지키는 날이에요",
    detail: "무언가를 더하기보다, 가진 걸 지키는 날이에요. 세라마이드와 시카로 장벽을 든든하게 감싸주세요.",
  },
]

const DEFENSE_BARRIER_CAUTION = "세라마이드 크림으로 장벽 보호 · 이 시기엔 이 성분 하나만 사용하세요."

/** 톤 정돈 케어 3종 */
const DEFENSE_TONING_VARIANTS: readonly CategoryCopyVariant[] = [
  {
    title: "조용히 정돈되는 시간",
    detail: "눈에 띄는 변화는 없어도, 오늘 같은 날들이 진짜 힘이 돼요. 비타민C와 나이아신아마이드로 톤을 가볍게 정돈하고, 마무리는 보습으로 편안하게 잡아주세요.",
  },
  {
    title: "결을 다듬는 하루",
    detail: "서두르지 않고 천천히, 비타민C와 나이아신아마이드로 톤과 유분 밸런스를 잡아주세요. 마무리는 보습으로.",
  },
  {
    title: "맑아지는 건 천천히예요",
    detail: "오늘은 톤 정돈에 집중하는 날이에요. 비타민C와 나이아신아마이드를 가볍게 얹고, 보습으로 마무리해주세요.",
  },
]

const DEFENSE_TONING_CAUTION = "비타민C·나이아신아마이드로 톤 정돈 · 이 시기엔 이 성분 하나만 사용하세요."

/** 수분 충전 3종 */
const DEFENSE_HYDRATION_VARIANTS: readonly CategoryCopyVariant[] = [
  {
    title: "매일이 쌓여 변화가 돼요",
    detail: "매일 같은 루틴 같아도, 피부는 조용히 기억하고 있어요. 히알루론산으로 속수분을 채우고, 결 따라 가볍게 덧발라 당김 없이 유지해주세요.",
  },
  {
    title: "채우는 만큼 편안해져요",
    detail: "오늘은 수분을 채우는 날이에요. 히알루론산을 결 따라 가볍게 덧발라, 당김 없는 편안한 하루를 만들어주세요.",
  },
  {
    title: "속부터 촉촉하게",
    detail: "겉보다 속이 먼저예요. 히알루론산으로 속수분을 채워, 피부가 스스로 균형을 잡을 수 있게 도와주세요.",
  },
]

const DEFENSE_HYDRATION_CAUTION = "히알루론산 앰플만 · 이 시기엔 이 성분 하나만 사용하세요."

/** SOS 진정 4종 */
const SOS_REST_VARIANTS: readonly CategoryCopyVariant[] = [
  {
    title: "오늘은 쉬어가도 괜찮아요",
    detail: "오늘은 아무것도 더하지 않아요. 시카 하나로, 피부가 스스로 회복할 시간을 만들어주세요.",
  },
  {
    title: "잠시 멈춰도 괜찮은 날",
    detail: "잠시 쉬어가도 괜찮아요. 오늘은 진정 하나에만 마음을 써주는 날이에요.",
  },
  {
    title: "애쓰지 않아도 되는 하루",
    detail: "애쓰지 않아도 되는 하루예요. 시카가 그 자리를 대신 채워줄 거예요.",
  },
  {
    title: "오늘은 결정하지 않아도 돼요",
    detail: "오늘만큼은 아무 결정도 하지 마세요. 진정 성분 하나면 충분한 날이에요.",
  },
]

const SOS_REST_CAUTION = "시카·어성초로 열감·자극 리셋 · 이 시기엔 이 성분 하나만 사용하세요."

/** 스페셜케어(AHA/BHA/레티놀) — 첫 등장 전용 + 이후 3종 순환 */
const ACTIVE_FIRST_VARIANT: CategoryCopyVariant = {
  title: "오늘부터 시작해요",
  detail: "오늘부터 {{name}}을 시작해요. 처음엔 딱 한 방울, 천천히 적응해가는 걸로 충분해요. 다른 기능성 제품과 섞지 말고, 내일 아침엔 자외선 차단제 꼭 챙겨주세요.",
}

const ACTIVE_VARIANTS: readonly CategoryCopyVariant[] = [
  {
    title: "여기까지 오신 게 이미 대단해요",
    detail: "오늘, {{name}}과 마주하는 시간이에요. 꾸준히 쌓아온 하루하루가 있었기에 지금 이 순간이 왔어요. 욕심내지 않고 딱 한 방울, 내일 아침엔 자외선 차단제로 오늘의 노력을 지켜주세요.",
  },
  {
    title: "피부가 준비된 순간이에요",
    detail: "{{name}}, 오늘 피부가 받아들일 준비가 됐어요. 여기까지 잘 와주셔서, 이 한 방울이 헛되지 않을 거예요. 아침 자외선 차단제, 잊지 마시고요.",
  },
  {
    title: "오늘은 특별한 밤이에요",
    detail: "오늘은 {{name}}에게 자리를 내어주는 특별한 밤이에요. 매일의 작은 선택들이 지금의 변화를 만들고 있어요. 내일 아침 선크림으로 이 노력을 마무리해주세요.",
  },
]

/** 스페셜케어 caution (동적으로 성분명이 들어감) */
const ACTIVE_CAUTION: Record<"aha" | "bha" | "retinol", string> = {
  aha: "AHA로 각질·피지 정돈 · 이 시기엔 이 성분 하나만 사용하세요.",
  bha: "BHA로 각질·피지 정돈 · 이 시기엔 이 성분 하나만 사용하세요.",
  retinol: "레티놀로 재생 활성 · 이 시기엔 이 성분 하나만 사용하세요.",
}

/** 카테고리별 정보성 caution (기존 유지) */
const CAUTION_TEXT: Record<RecipeType, string | null> = {
  defense_barrier: DEFENSE_BARRIER_CAUTION,
  defense_toning: DEFENSE_TONING_CAUTION,
  defense_hydration: DEFENSE_HYDRATION_CAUTION,
  sos_rest: SOS_REST_CAUTION,
  aha: ACTIVE_CAUTION["aha"],
  bha: ACTIVE_CAUTION["bha"],
  retinol: ACTIVE_CAUTION["retinol"],
  barrier_lock: null,
  hydration_lock: null,
  toning_solo: null,
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
  switch (category) {
    case "defense_barrier":
      return DEFENSE_BARRIER_VARIANTS
    case "defense_toning":
      return DEFENSE_TONING_VARIANTS
    case "defense_hydration":
      return DEFENSE_HYDRATION_VARIANTS
    case "sos_rest":
      return SOS_REST_VARIANTS
    case "aha":
    case "bha":
    case "retinol":
      return ACTIVE_VARIANTS
    default:
      return []
  }
}

/** {{name}} 치환을 위한 성분명 매핑 */
const ACTIVE_LABEL: Record<"aha" | "bha" | "retinol", string> = {
  aha: "AHA",
  bha: "BHA",
  retinol: "레티놀",
}

/** concern별 구매 가이드 문구 (owned=false인 경우) */
const CONCERN_PURCHASE_GUIDE: Record<Exclude<Concern, "none">, string> = {
  nia: "나이아신아마이드, 없으신가요? 자주 쓰시는 구매사이트에서 '나이아신아마이드 2~5%' 세럼으로 검색하시면 자극 부담 없이 시작하기 좋아요.",
  hya: "히알루론산, 없으신가요? 자주 쓰시는 구매사이트에서 '히알루론산' 앰플·세럼으로 검색하시면 돼요. 농도보다 고분자+저분자 혼합인지가 더 중요해요.",
  cica: "시카(마데카소사이드), 없으신가요? 구매사이트에서 '시카' 또는 '마데카소사이드'로 검색하시면 돼요. 크림 제형이면 진정 효과가 오래 유지돼요.",
  cer: "세라마이드, 없으신가요? 구매사이트에서 '세라마이드' 크림으로 검색하시면 돼요. '세라마이드 복합' 또는 '베리어크림' 표기 제품이 안전해요.",
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
    let detail = ACTIVE_FIRST_VARIANT.detail
    detail = detail.replace(/\{\{name\}\}/g, ACTIVE_LABEL[category])
    const caution = CAUTION_TEXT[category]
    return { title: ACTIVE_FIRST_VARIANT.title, detail, caution }
  }

  const index = pickVariantIndex(category, appearanceCount)
  const variant = getVariantsForCategory(category)[index]

  if (!variant) {
    return { title: "", detail: "" }
  }

  let detail = variant.detail

  if ((category === "aha" || category === "bha" || category === "retinol") && detail.includes("{{name}}")) {
    detail = detail.replace(/\{\{name\}\}/g, ACTIVE_LABEL[category])
  }

  let caution = CAUTION_TEXT[category]

  // concern 기반 구매 가이드: 해당 카테고리에 처음 또는 두 번째 등장할 때만 노출
  if (concern !== "none" && concern in CONCERN_PURCHASE_GUIDE) {
    const concernCategories = CONCERN_CATEGORIES[concern]
    const categoryMatches = concernCategories.includes(category)
    const appearanceInConcern = concernCategories.filter((c) => c === category).indexOf(category)

    if (categoryMatches && appearanceCount < 2) {
      // concernAppearanceIndex가 0 또는 1일 때만 노출 (코스 중 최대 2번)
      const supportId = concern as SupportId
      if (!supportOwned.includes(supportId)) {
        if (caution) {
          caution = `${caution} · ${CONCERN_PURCHASE_GUIDE[concern]}`
        } else {
          caution = CONCERN_PURCHASE_GUIDE[concern]
        }
      }
    }
  }

  return { title: variant.title, detail, caution }
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number): RoutineCopy {
  return {
    title: "장벽 리셋 코스를 완주했어요",
    detail: `${totalDays}일간의 기록을 기반으로 장벽 점수 변화를 정리했어요. 꾸준히 함께해주셔서 감사해요. 다음 단계로 이어가고 싶다면 아래에서 확인해보세요.`,
  }
}
