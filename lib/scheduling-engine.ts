/**
 * Hoppy 스케줄링 엔진 (2026-07-27 재설계 스펙 구현)
 *
 * "이미 건강한 피부를 위한 모공 케어 웰니스 프로그램" 컨셉으로 전환하면서, 진단
 * 기반(Tier×Type) 개인화를 걷어내고 "요철이 사라지는 30일 표준 스케줄러" 워크북의
 * 하루 단위 순차 시뮬레이션만 남긴다. 액티브(BHA/레티놀)는 각자 독립적인 고정
 * 간격으로 도입되고, 액티브가 아닌 날은 6단계 서브 로테이션을 돈다.
 *
 * [2026-08-09] 인시던트(생리/선번/시술)·자극 신고 구조화 기능은 자유입력(condition_log)
 * 도입으로 역할이 대체되어 전체 삭제됨 — startIncidentOverride/delayForReaction 및
 * 관련 타입은 더 이상 존재하지 않는다.
 */
import {
  DEFAULT_ACTIVE_INTERVAL_DAYS,
  DEFAULT_BHA_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  MIN_INTERVAL_DAYS,
  RECIPES,
  type Recipe,
  type RecipeType,
  type ScheduleSettings,
  TOTAL_DAYS,
} from "@/lib/schedule"

/**
 * 저장된 diary_profiles.engine_version과 비교해 캐시 무효화를 판단하는 기준값.
 * generateCalendar()의 카테고리 배정 규칙이 바뀔 때마다 반드시 올린다.
 */
export const CURRENT_ENGINE_VERSION = "2.0"

// ── 캘린더 생성 ─────────────────────────────────────────────

export interface CalendarEntry {
  day: number
  date: string // ISO
  category: RecipeType
  recipe: Recipe
  completed: boolean | null
  reactionFlag: boolean | null
  /**
   * 어제가 액티브(bha/retinol)였던 이유로 오늘 방어/락 계열이 배정된 날에만 true.
   * 강제 로직은 아니고, UI에서 "전날 액티브 하셨다면 오늘은 수분·장벽에 집중해주세요"
   * 같은 문구를 보여주고 싶을 때 쓰는 이름표 용도의 선택적 플래그다.
   */
  afterActiveRestDay: boolean
}

export interface GenerateCalendarParams {
  signupDate: string // ISO
  totalDays?: number
  settings?: ScheduleSettings
}

function addDays(iso: string, amount: number): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + amount)
  return date.toISOString()
}

// ── 6단계 서브 로테이션(방어일) ─────────────────────────────

/** 고정 순서 — 슬라이더 조정 대상 아님 */
const DEFENSE_ROTATION: readonly RecipeType[] = [
  "defense_barrier",
  "defense_toning",
  "defense_hydration",
  "barrier_lock",
  "hydration_lock",
  "toning_solo",
]

function defenseCategoryForCount(count: number): RecipeType {
  return DEFENSE_ROTATION[count % DEFENSE_ROTATION.length]
}

// ── 액티브(BHA/레티놀) 도입 판정 ─────────────────────────────

type ActiveKind = "bha" | "retinol"

/**
 * 유저가 준 값이 있으면 반올림 후 [MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS]로 clamp하고,
 * 없거나 유효하지 않으면 fallback을 그대로 clamp해 돌려준다. 온보딩 화면(3단계
 * 매핑+코멘트)도 최종값을 미리 보여줄 때 이 함수를 그대로 가져다 쓴다 — clamp
 * 규칙이 엔진과 어긋나지 않도록 하기 위해서다.
 */
export function normalizeInterval(days: number | undefined, fallback: number): number {
  const value = days !== undefined && Number.isFinite(days) ? Math.round(days) : fallback
  return Math.min(Math.max(value, MIN_INTERVAL_DAYS), MAX_INTERVAL_DAYS)
}

/**
 * 하루 단위 순차 시뮬레이션으로 캘린더를 만든다. day 1부터 totalDays까지 훑으며
 * 우선순위 순으로 그날의 카테고리를 정한다:
 *
 *   1. 어제가 액티브였다면 → 오늘은 무조건 방어/락 계열(액티브 연속 금지)
 *   2. 오늘이 BHA/레티놀 "도입 타이밍"이면 → 액티브 배정
 *      (각자 독립적인 간격을 가지며, 아직 한 번도 배정되지 않았으면 즉시 도입 대상이다.
 *      같은 날 둘 다 도입 타이밍이 겹치면, 지난번 충돌에서 배정됐던 쪽이 이번엔
 *      양보하는 교대 방식으로 하나만 배정하고 나머지는 다음 가능한 날로 미룬다)
 *   3. 그 외 → 6단계 서브 로테이션에서 다음 순서 배정
 *
 * 방어 로테이션 카운터는 캘린더 전체에서 누적되고, 액티브로 소비된 날은 건너뛰되
 * 카운터는 그대로 유지한다.
 */
export function generateCalendar({ signupDate, totalDays = TOTAL_DAYS, settings = {} }: GenerateCalendarParams): CalendarEntry[] {
  const bhaInterval = normalizeInterval(settings.bhaIntervalDays, DEFAULT_BHA_INTERVAL_DAYS)
  const retinolInterval = normalizeInterval(settings.activeIntervalDays, DEFAULT_ACTIVE_INTERVAL_DAYS)

  const calendar: CalendarEntry[] = []
  let defenseCount = 0
  let lastBhaDay = 0
  let lastRetinolDay = 0
  /** day는 1부터 시작하므로, "아직 액티브 배정 없음"은 day-1(=0)과 절대 겹치지 않는 -1로 표시한다 */
  let lastActiveDay = -1
  /** 같은 날 두 액티브가 겹칠 때, 지난번에 우선 배정됐던 쪽을 이번엔 양보시키는 교대 우선순위 */
  let collisionPriority: ActiveKind = "bha"

  const isDue = (kind: ActiveKind, day: number): boolean => {
    const lastDay = kind === "bha" ? lastBhaDay : lastRetinolDay
    const interval = kind === "bha" ? bhaInterval : retinolInterval
    const minStartDay = 3
    if (lastDay === 0) return day >= minStartDay
    return day - lastDay >= interval
  }

  const placeActive = (kind: ActiveKind, day: number): RecipeType => {
    if (kind === "bha") lastBhaDay = day
    else lastRetinolDay = day
    lastActiveDay = day
    return kind
  }

  for (let day = 1; day <= totalDays; day++) {
    let category: RecipeType
    let afterActiveRestDay = false

    if (lastActiveDay === day - 1) {
      // 규칙 1. 어제가 액티브였다면 오늘은 무조건 방어/락 계열
      category = defenseCategoryForCount(defenseCount)
      defenseCount++
      afterActiveRestDay = true
    } else {
      const bhaDue = isDue("bha", day)
      const retinolDue = isDue("retinol", day)

      if (bhaDue && retinolDue) {
        // 규칙 2. 같은 날 두 액티브가 겹치면 하나만 배정하고, 진 쪽은 다음 가능한 날로 미룬다
        const winner: ActiveKind = collisionPriority
        collisionPriority = winner === "bha" ? "retinol" : "bha"
        category = placeActive(winner, day)
      } else if (bhaDue) {
        category = placeActive("bha", day)
      } else if (retinolDue) {
        category = placeActive("retinol", day)
      } else {
        // 규칙 3. 6단계 서브 로테이션
        category = defenseCategoryForCount(defenseCount)
        defenseCount++
      }
    }

    calendar.push({
      day,
      date: addDays(signupDate, day - 1),
      category,
      recipe: RECIPES[category],
      completed: null,
      reactionFlag: null,
      afterActiveRestDay,
    })
  }

  return calendar
}

// ── 4주 Lock-in 주차 라벨 (감정적 마일스톤 오버레이) ─────────

export interface WeekLabel {
  week: 1 | 2 | 3 | 4
  name: string
  purpose: string
}

const WEEK_LABELS: readonly WeekLabel[] = [
  { week: 1, name: "Skin Detox", purpose: "빠른 진정 체감 (Quick Win) + 실제 변화 조기 시작" },
  { week: 2, name: "Barrier Build-up", purpose: "회복 과정의 시각화" },
  { week: 3, name: "Mild Turnover Test", purpose: "다음 단계 기대감 형성" },
  { week: 4, name: "Recovery Report", purpose: "전환 유도" },
]

export function weekLabelForDay(day: number): WeekLabel {
  const week = Math.min(Math.max(Math.ceil(day / 7), 1), 4) as 1 | 2 | 3 | 4
  return WEEK_LABELS[week - 1]
}

// ── 장벽 점수 ───────────────────────────────────────────────

export interface BarrierScoreInput {
  /** 경과일 수 — 인시던트 오버라이드 기간은 제외하고 전달 */
  elapsedDays: number
  recordedDays: number
  irritationDays: number
}

/** 장벽 점수 = (완료율 × 0.5) + (자극 없는 날 비율 × 0.5), 0~100 스케일 */
export function calculateBarrierScore({ elapsedDays, recordedDays, irritationDays }: BarrierScoreInput): number {
  if (elapsedDays <= 0) return 0
  const completionRate = recordedDays / elapsedDays
  const irritationFreeRate = (elapsedDays - irritationDays) / elapsedDays
  return Math.round((completionRate * 0.5 + irritationFreeRate * 0.5) * 100)
}

// ── 장벽 점수 시계열 ────────────────────────────────────────

export interface BarrierScorePoint {
  day: number
  score: number
}

/**
 * fromDay~toDay 구간의 장벽 점수 시계열을 계산한다.
 */
export function buildBarrierScoreLog(
  calendar: CalendarEntry[],
  completedDays: number[],
  fromDay: number,
  toDay: number,
): BarrierScorePoint[] {
  const entryByDay = new Map(calendar.map((entry) => [entry.day, entry]))
  const completedSet = new Set(completedDays)

  const log: BarrierScorePoint[] = []
  for (let day = fromDay; day <= toDay; day++) {
    let elapsedDays = 0
    let recordedDays = 0
    let irritationDays = 0
    for (let d = 1; d <= day; d++) {
      elapsedDays++
      if (completedSet.has(d)) recordedDays++
      if (entryByDay.get(d)?.reactionFlag) irritationDays++
    }
    log.push({ day, score: calculateBarrierScore({ elapsedDays, recordedDays, irritationDays }) })
  }
  return log
}

// ── 완주 및 2단계 잠금 해제 판정 ────────────────────────────

export interface UnlockCheckInput {
  totalDays: number
  recordedDays: number
  /** 인시던트 오버라이드 기간 — 분모·분자 모두 제외 */
  incidentDays: number
  irritationReportsLast2Weeks: number
}

export type UnlockResult = { unlocked: true } | { unlocked: false; extendLastDays: number }

/** 80% 이상 완료 + 최근 2주 자극 신고 1회 이하 → 미충족 시 마지막 2주 반복 후 재평가 */
export function checkStage2Unlock({
  totalDays,
  recordedDays,
  incidentDays,
  irritationReportsLast2Weeks,
}: UnlockCheckInput): UnlockResult {
  const effectiveDays = totalDays - incidentDays
  const completionRate = effectiveDays > 0 ? recordedDays / effectiveDays : 0

  if (completionRate >= 0.8 && irritationReportsLast2Weeks <= 1) {
    return { unlocked: true }
  }
  return { unlocked: false, extendLastDays: 14 }
}
