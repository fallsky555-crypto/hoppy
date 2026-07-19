import type { Recipe, RecipeType } from "@/lib/schedule"

/**
 * routine-copy-ko.md v2.0 문구 세트 — 카테고리를 3개 그룹으로 묶어서 관리한다.
 * lib/scheduling-engine.ts는 건드리지 않는다 — 이 파일은 화면에 보여줄 문구만 담당하고,
 * 어떤 카테고리·날짜인지는 기존 엔진(getRecipeForDay, dayFromJoinDate 등)이 그대로 정한다.
 *
 * rest → BARRIER_GIPS, moist → BARRIER_LOCKING, aha/bha/retinol → ACTIVE_OPEN
 */

export interface RoutineCopy {
  title: string
  detail: string
}

type CategoryGroup = "BARRIER_GIPS" | "BARRIER_LOCKING" | "ACTIVE_OPEN"

function categoryGroup(category: RecipeType): CategoryGroup {
  if (category === "rest") return "BARRIER_GIPS"
  if (category === "moist") return "BARRIER_LOCKING"
  return "ACTIVE_OPEN" // aha, bha, retinol
}

/** ACTIVE_OPEN 문구의 "가이드에 지정된 활성 성분 제품" 자리에 들어갈 실제 성분 이름 */
const ACTIVE_LABEL: Partial<Record<RecipeType, string>> = {
  aha: "AHA",
  bha: "BHA",
  retinol: "레티놀",
}

/** 오늘(또는 보고 있는 날)의 카테고리에 맞는 루틴 문구 */
export function getCategoryCopy(category: RecipeType): RoutineCopy {
  const group = categoryGroup(category)

  if (group === "BARRIER_GIPS") {
    return {
      title: "보호막 형성을 위한 재생크림 레이어링",
      detail:
        "오늘 밤은 화장대에 있는 재생크림을 평소보다 조금 더 도톰하게 얹어주세요. 외부 자극을 물리적으로 막아주고, 장벽이 편안해질 시간을 만들어주는 과정이에요.",
    }
  }

  if (group === "BARRIER_LOCKING") {
    return {
      title: "수분 보충 후 유수분 압착 잠금",
      detail:
        "자극이 없는 토너를 가볍게 수차례 두드려 속수분을 채우셨나요? 그 위에 재생크림을 가볍게 펴 발라, 채워진 수분이 날아가지 않도록 잡아주는 단계예요.",
    }
  }

  // ACTIVE_OPEN — {{activeName}}을 오늘 실제 성분 이름으로 치환
  const name = ACTIVE_LABEL[category] ?? "활성 성분"
  return {
    title: `안전 구역 내 ${name} 슬롯 오픈`,
    detail: `오늘 밤에는 ${name} 제품을 딱 한 방울만 루틴에 추가합니다. 다른 기능성 제품과 섞이지 않도록 단독으로 사용해주시고, 다음 날 아침에는 자외선 차단제를 꼭 챙겨주세요.`,
  }
}

/** BARRIER_LOCKING은 오리엔테이션(weekly_guide) 문구가 없다 — 정의된 그룹만 매핑 */
const GROUP_WEEKLY_GUIDE: Partial<Record<CategoryGroup, RoutineCopy>> = {
  BARRIER_GIPS: {
    title: "반갑습니다, 당신의 피부 아군입니다.",
    detail:
      "이번 코스에서는 새로운 기능성 제품을 추가하기보다, 화장대에 있는 재생크림을 활용해 장벽의 기초 체력을 다지는 데 집중합니다.",
  },
  ACTIVE_OPEN: {
    title: "장벽의 기초 체력이 다져졌어요.",
    detail:
      "이제 쌓여있는 각질과 피지를 정돈할 타이밍입니다. 성분 충돌을 막기 위해 이번 주부터는 맞춤형 활성 성분을 주 1회, 안전 구역 안에서만 시작해요.",
  },
}

/**
 * day % 7 === 1 (Day 1/8/15/22/29...)에 호출한다. 오늘 카테고리가 속한 그룹이
 * 이전 주차 체크포인트(Day 1/8/15/22...)에서는 한 번도 나온 적 없는, 이번이 "처음
 * 시작"하는 그룹일 때만 오리엔테이션 문구를 반환한다. 이미 어느 체크포인트에선가
 * 보여준 적 있는 그룹이거나(BARRIER_LOCKING처럼) weekly_guide가 없는 그룹이면 null을 반환한다.
 */
export function getOrientationCopy(getRecipeForDay: (day: number) => Recipe, day: number): RoutineCopy | null {
  const group = categoryGroup(getRecipeForDay(day).type)
  const guide = GROUP_WEEKLY_GUIDE[group]
  if (!guide) return null

  for (let past = day - 7; past >= 1; past -= 7) {
    if (categoryGroup(getRecipeForDay(past).type) === group) return null
  }
  return guide
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number): RoutineCopy {
  return {
    title: "장벽 리셋 코스를 완주했어요",
    detail: `${totalDays}일간의 기록을 기반으로 장벽 점수 변화를 정리했어요. 꾸준히 함께해주셔서 감사해요. 다음 단계로 이어가고 싶다면 아래에서 확인해보세요.`,
  }
}
