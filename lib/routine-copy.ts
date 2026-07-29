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

/** 스페셜케어(AHA/BHA/레티놀) 3종 */
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

/**
 * day의 카테고리에 맞는 루틴 문구. title/detail은 calendar 기반으로 해당 카테고리의
 * 등장 횟수를 세어 variant 순환 선택. caution은 고정 정보성 문구.
 */
export function getCategoryCopy(category: RecipeType, calendar: CalendarEntry[], day: number): RoutineCopy {
  const appearanceCount = countCategoryAppearances(calendar, category, day)
  const index = pickVariantIndex(category, appearanceCount)
  const variant = getVariantsForCategory(category)[index]

  if (!variant) {
    return { title: "", detail: "" }
  }

  let detail = variant.detail

  if ((category === "aha" || category === "bha" || category === "retinol") && detail.includes("{{name}}")) {
    detail = detail.replace(/\{\{name\}\}/g, ACTIVE_LABEL[category])
  }

  const caution = CAUTION_TEXT[category]
  return { title: variant.title, detail, caution }
}

/** 오리엔테이션 배너는 방어/락 계열 ↔ 액티브 계열을 오갈 때만 보여준다. SOS Rest는 응급 상황이라 대상 아님 */
type OrientationGroup = "DEFENSE" | "ACTIVE"

function orientationGroup(category: RecipeType): OrientationGroup | null {
  if (category === "bha" || category === "retinol") return "ACTIVE"
  if (category === "sos_rest") return null
  return "DEFENSE"
}

const GROUP_WEEKLY_GUIDE: Record<OrientationGroup, RoutineCopy> = {
  DEFENSE: {
    title: "반갑습니다, 당신의 피부 아군입니다.",
    detail: "이번 코스에서는 화장대에 있는 진정·보습 성분을 활용해 장벽의 기초 체력을 다지는 데 집중합니다.",
  },
  ACTIVE: {
    title: "장벽의 기초 체력이 다져졌어요.",
    detail:
      "이제 쌓여있는 각질과 피지를 정돈할 타이밍입니다. 성분 충돌을 막기 위해 BHA·레티놀은 정해진 간격으로, 안전 구역 안에서만 번갈아 시작해요.",
  },
}

/**
 * day % 7 === 1 (Day 1/8/15/22/29...)에 호출한다. 오늘 카테고리가 속한 그룹이
 * 이전 주차 체크포인트(Day 1/8/15/22...)에서는 한 번도 나온 적 없는, 이번이 "처음
 * 시작"하는 그룹일 때만 오리엔테이션 문구를 반환한다. 이미 어느 체크포인트에선가
 * 보여준 적 있는 그룹이거나 SOS Rest면 null을 반환한다.
 */
export function getOrientationCopy(getRecipeForDay: (day: number) => Recipe, day: number): RoutineCopy | null {
  const group = orientationGroup(getRecipeForDay(day).type)
  if (!group) return null

  for (let past = day - 7; past >= 1; past -= 7) {
    if (orientationGroup(getRecipeForDay(past).type) === group) return null
  }
  return GROUP_WEEKLY_GUIDE[group]
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number): RoutineCopy {
  return {
    title: "장벽 리셋 코스를 완주했어요",
    detail: `${totalDays}일간의 기록을 기반으로 장벽 점수 변화를 정리했어요. 꾸준히 함께해주셔서 감사해요. 다음 단계로 이어가고 싶다면 아래에서 확인해보세요.`,
  }
}
