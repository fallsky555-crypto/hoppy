/**
 * 30일 리포트용 분석 함수들
 * - 사용 패턴: tag별 카운트, 권장 비율 비교
 * - 밸런스: Active:Defense 비율
 * - 주기성: Active 슬롯 사용 간격
 * - 컨디션: 슬롯 사용일의 컨디션 분포
 */

export interface UsagePattern {
  tag: string
  count: number
  percentage: number
  recommendedPercentage: number
}

export interface BalanceRatio {
  activePercentage: number
  defensePercentage: number
}

export interface PeriodicityStat {
  gaps: number[]
  average: number
  variance: number
}

export interface ConditionCorrelation {
  tag: string
  goodPercentage: number
  neutralPercentage: number
  badPercentage: number
  totalDays: number
}

/** 엔진 권장 비율 (설계 기준) */
const RECOMMENDED_RATIOS: Record<string, number> = {
  "Active/Stimulate": 0.30,
  "Defense/Barrier": 0.30,
  "Hydration": 0.20,
  "Exfoliation": 0.15,
  "Sun": 0.05,
}

/** 고정된 5개 tag (항상 표시) */
const ALL_TAGS = ["Exfoliation", "Hydration", "Active/Stimulate", "Defense/Barrier", "Sun"]

/**
 * tag별 사용 비율 계산 — 모든 태그를 항상 표시 (0%도 포함)
 */
export function calculateUsagePattern(slots: Array<{ slot: string; tag: string }>): UsagePattern[] {
  const tagCounts: Record<string, number> = {}
  const total = slots.length || 1

  for (const { tag } of slots) {
    tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
  }

  return ALL_TAGS.map((tag) => ({
    tag,
    count: tagCounts[tag] ?? 0,
    percentage: Math.round(((tagCounts[tag] ?? 0) / total) * 100),
    recommendedPercentage: Math.round((RECOMMENDED_RATIOS[tag] ?? 0) * 100),
  }))
}

/**
 * Active:Defense 비율 계산 (점수화 X, 비율만 표시)
 */
export function calculateBalanceRatio(slots: Array<{ slot: string; tag: string }>): BalanceRatio {
  const activeCount = slots.filter(s => s.tag === "Active/Stimulate").length
  const defenseCount = slots.filter(s => s.tag === "Defense/Barrier").length
  const total = activeCount + defenseCount || 1

  return {
    activePercentage: Math.round((activeCount / total) * 100),
    defensePercentage: Math.round((defenseCount / total) * 100),
  }
}

/**
 * Active tag 슬롯의 사용 간격 계산 (연속 사용일 간 차이)
 */
export function calculatePeriodicity(loggedDays: number[]): PeriodicityStat {
  const activeDays = [...loggedDays].sort((a, b) => a - b)
  if (activeDays.length < 2) {
    return { gaps: [], average: 0, variance: 0 }
  }

  const gaps: number[] = []
  for (let i = 1; i < activeDays.length; i++) {
    gaps.push(activeDays[i] - activeDays[i - 1])
  }

  const average = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0
  const variance =
    gaps.length > 0
      ? Math.round(
          gaps.reduce((sum, g) => sum + Math.pow(g - average, 2), 0) / gaps.length
        )
      : 0

  return { gaps, average, variance }
}

/**
 * condition_log × usage_log 조인: 슬롯 사용일의 컨디션 분포
 */
export function calculateConditionCorrelation(
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>,
  conditions: Record<number, "good" | "neutral" | "bad">
): ConditionCorrelation[] {
  const tagConditions: Record<string, Record<string, number>> = {}

  for (const [dayStr, slots] of Object.entries(loggedSlots)) {
    const day = parseInt(dayStr, 10)
    const condition = conditions[day]
    if (!condition) continue

    for (const { tag } of slots) {
      if (!tagConditions[tag]) {
        tagConditions[tag] = { good: 0, neutral: 0, bad: 0 }
      }
      tagConditions[tag][condition]++
    }
  }

  return Object.entries(tagConditions).map(([tag, counts]) => {
    const total = counts.good + counts.neutral + counts.bad || 1
    return {
      tag,
      goodPercentage: Math.round((counts.good / total) * 100),
      neutralPercentage: Math.round((counts.neutral / total) * 100),
      badPercentage: Math.round((counts.bad / total) * 100),
      totalDays: total,
    }
  })
}

/**
 * Weekly Mini Insight 로직 재사용: 최근 7일 최빈 tag 구하기
 */
export function getTopTagFromLoggedSlots(
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>,
  recentDays: number[]
): string | null {
  const recentSet = new Set(recentDays)
  const tagCounts: Record<string, number> = {}

  for (const [dayStr, slots] of Object.entries(loggedSlots)) {
    const day = parseInt(dayStr, 10)
    if (!recentSet.has(day)) continue

    for (const { tag } of slots) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  if (Object.keys(tagCounts).length === 0) return null

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}
