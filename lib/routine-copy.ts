import type { RecipeType } from "@/lib/schedule"

/**
 * routine-copy-ko.md v1.0 문구 세트.
 * lib/scheduling-engine.ts는 건드리지 않는다 — 이 파일은 화면에 보여줄 문구만 담당하고,
 * 어떤 카테고리·주차인지는 기존 엔진(getRecipeForDay, dayFromJoinDate 등)이 그대로 정한다.
 */

export interface RoutineCopy {
  title: string
  detail: string
}

const CATEGORY_COPY: Record<RecipeType, (day: number) => RoutineCopy> = {
  rest: () => ({
    title: "오늘은 장벽 휴식 데이예요",
    detail:
      "오늘은 아무것도 더하지 않아요. 순한 세안 후 평소 쓰던 보습제만 평소보다 도톰하게 발라, 장벽이 스스로 회복할 시간을 주세요. 각질 제거·기능성 성분은 오늘 쉬어갑니다. 자극 = 0이 오늘의 목표예요.",
  }),
  moist: () => ({
    title: "오늘은 수분팩 데이예요",
    detail:
      "가볍게 만드는 토너를 3번 정도 나눠 두드려 수분을 채운 다음, 그 위에 보습제로 덮어 수분이 날아가지 않게 잡아주세요. 장벽이 회복되는 동안 촉촉함을 유지하는 게 오늘의 역할이에요.",
  }),
  aha: (day) => ({
    title: `오늘은 AHA 도입 ${day}일차예요`,
    detail:
      "저농도 AHA를 딱 한 번, 소량만 발라주세요. 다른 기능성 성분과 같이 쓰면 자극이 겹칠 수 있어요. 오늘만큼은 AHA 외에 다른 액티브는 쉬어가는 게 안전해요. 다음날 아침 자외선차단제는 꼭 챙겨주세요.",
  }),
  bha: (day) => ({
    title: `오늘은 BHA 도입 ${day}일차예요`,
    detail:
      "모공 속 노폐물을 정리하는 BHA를 소량 발라주세요. 따갑거나 붉어지면 양을 줄이거나 다음 회차로 미뤄도 괜찮아요. 피부가 보내는 신호를 스케줄보다 먼저 들어주세요.",
  }),
  retinol: (day) => ({
    title: `오늘은 레티놀 도입 ${day}일차예요`,
    detail:
      "쌀알 반보다 적은 양을, 눈가와 입가는 피해서 발라주세요. 레티놀을 쓴 다음 날은 자외선에 더 예민해질 수 있어서, 아침 자외선차단제가 평소보다 중요한 날이에요.",
  }),
}

/** 오늘(또는 보고 있는 날)의 카테고리에 맞는 문구. {{day}}는 실제 day 값으로 채워진다 */
export function getCategoryCopy(category: RecipeType, day: number): RoutineCopy {
  return CATEGORY_COPY[category](day)
}

const WEEK_COPY: Record<1 | 2 | 3 | 4, RoutineCopy> = {
  1: {
    title: "1주차 · 장벽부터 다지는 시간",
    detail:
      "이번 주는 아무것도 더하지 않는 게 목표예요. 순한 세안과 보습만으로, 지금 피부가 원래 상태를 되찾을 시간을 드릴게요. 1주 안에 눈에 띄게 편안해지는 걸 느끼실 수도 있어요.",
  },
  2: {
    title: "2주차 · 다음을 위한 준비 시간",
    detail:
      "1주차 동안 장벽이 한결 편안해지셨을 거예요. 이번 주는 다음에 들어올 성분들을 잘 받아들일 수 있도록 보습 위주로 기초 체력을 다지는 구간이에요. 아직 액티브 성분은 도입하지 않아요.",
  },
  3: {
    title: "3주차 · 첫 액티브 성분을 시작해요",
    detail:
      "이제 피부가 준비됐어요. 이번 주부터 진단 결과에 맞는 액티브 성분을 딱 주 1회씩만 조심스럽게 시작해요. 여러 개를 한꺼번에 쓰지 않는 게 이번 주 가장 중요한 규칙이에요.",
  },
  4: {
    title: "4주차 · 지금까지의 변화를 지켜볼 시간",
    detail:
      "마지막 주예요. 지금 루틴을 유지하면서, 장벽 점수가 어떻게 변해왔는지 확인해보세요. 코스가 끝나면 지금까지 기록을 바탕으로 한 리포트를 보여드릴게요.",
  },
}

/** 5주차 이후(Tier 1/2로 코스가 길어진 구간)는 이 문구를 계속 재사용한다 */
function extendedWeekCopy(week: number): RoutineCopy {
  return {
    title: `${week}주차 · 계속 이어가는 중이에요`,
    detail: "표준 4주보다 조금 더 긴 코스를 진행 중이에요. 서두르지 않고 지금 속도 그대로 가는 게 가장 안전해요.",
  }
}

/** day % 7 === 1 (Day 1/8/15/22/29...)에 노출할 주차 오리엔테이션 문구 */
export function getWeekOrientationCopy(week: number): RoutineCopy {
  if (week >= 1 && week <= 4) return WEEK_COPY[week as 1 | 2 | 3 | 4]
  return extendedWeekCopy(week)
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number): RoutineCopy {
  return {
    title: "장벽 리셋 코스를 완주했어요",
    detail: `${totalDays}일간의 기록을 기반으로 장벽 점수 변화를 정리했어요. 꾸준히 함께해주셔서 감사해요. 다음 단계로 이어가고 싶다면 아래에서 확인해보세요.`,
  }
}
