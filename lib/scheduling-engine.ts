/**
 * Hoppy 스케줄링 엔진 (scheduling-engine-spec.md v1.5 구현)
 *
 * lib/schedule.ts의 고정 30일 스케줄(recipeForDay)을 대체하는 개인화 캘린더 생성기.
 * Tier(강도) × Type(유형) 조합으로 캘린더를 만들고, 장벽 점수·인시던트 오버라이드·
 * 자극 지연·2단계 잠금 해제 판정까지 같은 상태 기계 원칙을 공유한다.
 *
 * v1.5(11번): 방어일(defense)/공격일(attack) 축을 도입해 하루 단위 순차 시뮬레이션으로
 * 캘린더를 생성한다. 방어일은 3종 성분 로테이션을 돌고, 공격일은 Tier별 간격 규칙과
 * 레티놀 합류 조건을 따른다. SOS Rest(가입일 기준 고정일)는 인시던트 다음으로 우선한다.
 */
import { RECIPES, type Recipe, type RecipeType, TOTAL_DAYS } from "@/lib/schedule"

/**
 * 13-3(v1.7). 저장된 diary_profiles.engine_version과 비교해 캐시 무효화를 판단하는 기준값.
 * 엔진 로직(특히 generateCalendar()의 카테고리 배정 규칙)이 바뀔 때마다 반드시 올린다 —
 * 릴리스 체크리스트 항목. 올리지 않으면 이번에 고친 "세션 캐싱" 버그가 형태만 바뀌어 재발한다.
 */
export const CURRENT_ENGINE_VERSION = "1.7"

// ── 2. Tier(강도) × Type(유형) ──────────────────────────────

/** X = 의료 상담 필요 (9-2). 캘린더를 생성하지 않는다. */
export type Tier = 0 | 1 | 2 | "X"
export type SkinType = "A" | "B" | "C"

export interface DiagnosisInput {
  /** 진단 시점에 겹쳐 쓰고 있던 액티브 성분 개수 (checker.html strong.length) */
  overlapCount: number
  irritationReported: boolean
  skinType: SkinType
  /** checker.html symptom 값. 'bad'면 액티브 개수와 무관하게 Tier X로 분기 (9-2) */
  symptom?: string
  /** 11-5(v1.5). checker.html "성분을 잘 모르겠어요" 체크 — Tier 안전 하한을 1로 올린다(낮추지는 않음) */
  unsure?: boolean
}

interface TierRule {
  /** 마지막 휴식일. Day 1~restEndDay는 액티브 없이 휴식/보습만 진행 */
  restEndDay: number
  /** 첫 액티브 도입일 */
  firstActiveDay: number
}

/** v1.3 — 체감 효능 격차 수정으로 각 Tier 내에서 도입일을 앞당김 (Day 10/14/21 → 3/5/9) */
const TIER_RULES: Record<0 | 1 | 2, TierRule> = {
  0: { restEndDay: 2, firstActiveDay: 3 },
  1: { restEndDay: 4, firstActiveDay: 5 },
  2: { restEndDay: 8, firstActiveDay: 9 },
}

/** 2-1. Tier 배정 + 9-2. Tier X 우선 분기 + 11-5. unsure 안전 하한(v1.5) */
export function assignTier(
  diagnosis: Pick<DiagnosisInput, "overlapCount" | "irritationReported" | "symptom" | "unsure">,
): Tier {
  if (diagnosis.symptom === "bad") return "X"

  let tier: 0 | 1 | 2
  if (diagnosis.overlapCount >= 3) tier = 2
  else if (diagnosis.overlapCount === 2 || diagnosis.irritationReported) tier = 1
  else tier = 0

  // "성분을 잘 모르겠어요" — 계산된 Tier를 낮추지는 않고, 0이었을 때만 안전 하한 1로 올린다
  if (diagnosis.unsure && tier === 0) tier = 1

  return tier
}

/** 9-1. checker.html symptom → 자극 보고 여부 매핑 */
const IRRITATION_SYMPTOMS = ["dry", "flush", "flaky", "trouble", "bad"]
export function isIrritationSymptom(symptom: string | undefined): boolean {
  return !!symptom && IRRITATION_SYMPTOMS.includes(symptom)
}

/**
 * 9-3. A/B/C 유형 판별 임시 휴리스틱.
 * checker.html에 유형 판별 전용 문항이 생기면 이 함수를 대체한다.
 */
export interface SkinTypeHeuristicInput {
  symptom?: string
  resetGroupSymptoms: string[]
  selectedActiveIds: string[]
  bhaOrBenzoylPeroxideIds: string[]
  ahaOrTonerPadIds: string[]
}

export function inferSkinType({
  symptom,
  resetGroupSymptoms,
  selectedActiveIds,
  bhaOrBenzoylPeroxideIds,
  ahaOrTonerPadIds,
}: SkinTypeHeuristicInput): SkinType {
  if (symptom === "bad" || (symptom && resetGroupSymptoms.includes(symptom))) return "A"
  if (selectedActiveIds.some((id) => bhaOrBenzoylPeroxideIds.includes(id))) return "C"
  if (selectedActiveIds.some((id) => ahaOrTonerPadIds.includes(id))) return "B"
  return "B"
}

/**
 * 2-2. Type별 주력 액티브(공격일 콘텐츠).
 * A유형(장벽 붕괴형)은 이번 코스에서 액티브를 도입하지 않고 방어일 로테이션만 반복한다.
 */
const PRIMARY_ACTIVE_CATEGORY: Record<SkinType, "aha" | "bha" | null> = {
  A: null,
  B: "aha",
  C: "bha",
}

// ── 3~4. 캘린더 생성 ─────────────────────────────────────────

export interface CalendarEntry {
  day: number
  date: string // ISO
  category: RecipeType
  recipe: Recipe
  completed: boolean | null
  reactionFlag: boolean | null
  /**
   * Type A(장벽 붕괴형)의 Tier별 첫 액티브 도입일(Day5/Day9)에만 true.
   * 실제로 바르는 성분은 그대로 rest/moist고, UI에서 "장벽 집중 케어 데이"처럼
   * 그 날만 다르게 표시하기 위한 이름표 용도의 플래그다.
   */
  milestone: boolean
}

export interface GenerateCalendarParams {
  diagnosis: DiagnosisInput
  signupDate: string // ISO
  totalDays?: number
  /**
   * 11-4·2-3 클린 완료 판정에 쓰는 완료/자극 이력. 생략하면(예: 최초 생성 시점)
   * 아직 완료된 날이 없는 것으로 보고 레티놀 합류 조건도 미충족 상태로 계산한다.
   */
  completedDays?: number[]
  /** 자극이 신고된 날짜 목록 — reportReaction()이 호출된 날 */
  reactionDays?: number[]
}

export type GenerateCalendarResult =
  | { status: "medical_referral" }
  | { status: "ok"; tier: 0 | 1 | 2; skinType: SkinType; calendar: CalendarEntry[] }

function addDays(iso: string, amount: number): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + amount)
  return date.toISOString()
}

// ── 11. 7성분 로테이션 시스템(v1.5) ───────────────────────────

/** 11-1. 방어일(defense) 3종 로테이션 — 세라마이드+시카 → 비타민C+나이아신아마이드 → 히알루론산+세라마이드 */
const DEFENSE_ROTATION: readonly RecipeType[] = ["defense_barrier", "defense_toning", "defense_hydration"]

function defenseCategoryForCount(count: number): RecipeType {
  return DEFENSE_ROTATION[count % DEFENSE_ROTATION.length]
}

/** 11-4. SOS Rest — 가입일 기준 고정일(Day 7/14/22/29). 인시던트 다음으로 우선하는 캘린더 트리거형 오버라이드 */
const SOS_REST_DAYS: ReadonlySet<number> = new Set([7, 14, 22, 29])

/** 11-3. 레티놀 합류에 필요한 주력 액티브 클린 완료 횟수 — Tier2는 더 보수적으로 3회 */
const CLEAN_COMPLETIONS_FOR_RETINOL: Record<0 | 1 | 2, number> = { 0: 2, 1: 2, 2: 3 }

/**
 * 11-6. 하루 단위 순차 시뮬레이션으로 캘린더를 만든다. day 1부터 totalDays까지 훑으며
 * 우선순위 순으로 그날의 카테고리를 정한다: SOS Rest > Type A(항상 방어 로테이션) >
 * 액티브 도입 전(방어 로테이션) > 공격일 판정(Tier별 간격 규칙) > 레티놀 합류.
 *
 * 방어 로테이션 카운터는 캘린더 전체를 통틀어 누적되는 순번이며, SOS Rest·공격일로
 * 소비된 날은 카운트를 올리지 않는다(그 자리를 건너뛰어도 로테이션 순서는 유지된다).
 * 공격일 판정은 Tier0·1은 도입일부터 이어지는 날짜 기반 격일 패턴, Tier2는 직전
 * 공격일로부터 최소 3일 간격이 되는 첫 날로 계산한다. 레티놀 합류 이후에는 직전
 * 공격일 콘텐츠와 다른 것을 배정해 주력 액티브 ↔ 레티놀이 자연히 교대된다.
 */
export function generateCalendar({
  diagnosis,
  signupDate,
  totalDays = TOTAL_DAYS,
  completedDays = [],
  reactionDays = [],
}: GenerateCalendarParams): GenerateCalendarResult {
  const tier = assignTier(diagnosis)
  if (tier === "X") return { status: "medical_referral" }

  const { firstActiveDay } = TIER_RULES[tier]
  const primary = PRIMARY_ACTIVE_CATEGORY[diagnosis.skinType]
  const cleanThreshold = CLEAN_COMPLETIONS_FOR_RETINOL[tier]
  const completedSet = new Set(completedDays)
  const reactionSet = new Set(reactionDays)
  /**
   * 11-2/11-6 버그 수정(v1.7). 최초 생성 시점엔 completedDays/reactionDays가 둘 다
   * 비어 있어 "자극 없이 N회 클린 완료"를 판정할 실제 데이터가 없다 — 이전엔 이 경우
   * 조건이 항상 거짓으로 평가되어 레티놀이 30일 내내 한 번도 합류하지 못했다. 실제
   * 기록이 하나라도 있으면(반응 우선 원칙) 이 낙관적 가정은 즉시 꺼지고, 아래 카운팅은
   * completedSet/reactionSet 기반 실측치로만 판정한다.
   */
  const noRealDataYet = completedDays.length === 0 && reactionDays.length === 0

  const calendar: CalendarEntry[] = []
  let defenseCount = 0
  let lastAttackDay = 0
  let lastAttackContent: RecipeType | null = null
  let primaryCleanCompletions = 0

  for (let day = 1; day <= totalDays; day++) {
    let category: RecipeType

    if (SOS_REST_DAYS.has(day)) {
      category = "sos_rest"
    } else if (!primary || day < firstActiveDay) {
      // Type A는 액티브를 도입하지 않고, 그 외 유형도 도입일 전에는 방어 로테이션만 돈다
      category = defenseCategoryForCount(defenseCount)
      defenseCount++
    } else {
      const isAttackDay =
        tier === 2
          ? lastAttackDay === 0
            ? day === firstActiveDay
            : day - lastAttackDay >= 3
          : (day - firstActiveDay) % 2 === 0

      if (!isAttackDay) {
        category = defenseCategoryForCount(defenseCount)
        defenseCount++
      } else {
        lastAttackDay = day
        const retinolEligible = primaryCleanCompletions >= cleanThreshold
        category = retinolEligible ? (lastAttackContent === primary ? "retinol" : primary) : primary
        lastAttackContent = category
        if (category === primary) {
          const countsAsClean = noRealDataYet || (completedSet.has(day) && !reactionSet.has(day))
          if (countsAsClean) primaryCleanCompletions++
        }
      }
    }

    calendar.push({
      day,
      date: addDays(signupDate, day - 1),
      category,
      recipe: RECIPES[category],
      completed: null,
      reactionFlag: null,
      // Type A는 액티브 카테고리가 없으니, 대신 Tier별 첫 액티브 도입일에 이름표만 붙인다
      milestone: !primary && day === firstActiveDay,
    })
  }

  return { status: "ok", tier, skinType: diagnosis.skinType, calendar }
}

// ── 4. 4주 Lock-in 주차 라벨 (감정적 마일스톤 오버레이) ─────────
//
// v1.3 우선순위 원칙: 액티브 성분의 실제 첫 도입일·빈도는 TIER_RULES(2-1)와
// generateCalendar()의 하루 단위 시뮬레이션(11-6)이 항상 우선한다. 아래 이름표는
// 그 계산 결과를 절대 읽거나 되돌리지 않는 순수 연출용 레이어라, "내러티브가
// 실제 시작일을 3주차로 늦춘다"는 구조적 충돌이 애초에 발생할 수 없다.

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

// ── 4-1. 장벽 점수 ───────────────────────────────────────────

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

// ── 5. 스킨 인시던트 — 비상 재생 주기 ─────────────────────────

export type IncidentType = "period" | "sunburn" | "treatment"

export interface IncidentLogEntry {
  day: number
  incidentType: IncidentType
  startedAt: string
  overrideRoutine: RecipeType
  resumesNormalAtDay: number
}

/** period 5~7일의 기본값. sunburn/treatment는 48시간 쿨링 + 5일 복구 = 7일 */
const DEFAULT_INCIDENT_DURATION_DAYS: Record<IncidentType, number> = {
  period: 6,
  sunburn: 7,
  treatment: 7,
}

/** 인시던트 기간 동안 전면 대체되는 루틴. 기능성 성분은 전부 배제한다 */
const INCIDENT_OVERRIDE_ROUTINE: Record<IncidentType, RecipeType> = {
  period: "moist", // 피지 조절 + 장벽 진정
  sunburn: "rest", // 세라마이드·판테놀 계열 진정, 기능성 성분 전면 차단
  treatment: "rest",
}

/**
 * atDay 위치에 count일만큼 새 일정을 끼워 넣고, atDay 이후의 기존 일정은 전부
 * count일만큼 뒤로 밀어낸다. atDay 이전 일정은 그대로 유지된다.
 *
 * "기존 항목을 그 자리에서 재색칠"하는 방식 대신 항상 새 슬롯을 삽입하기 때문에,
 * 인시던트·자극 지연을 몇 번을 적용해도 캘린더에 빈 Day가 생기거나 두 일정이
 * 같은 Day를 두고 충돌하는 일이 구조적으로 발생하지 않는다.
 */
function insertDays(
  calendar: CalendarEntry[],
  atDay: number,
  count: number,
  categoryForInsertedDay: (day: number) => RecipeType,
): CalendarEntry[] {
  const past = calendar.filter((entry) => entry.day < atDay)
  const baseDate = calendar.find((entry) => entry.day === atDay)?.date ?? calendar[calendar.length - 1]?.date ?? new Date().toISOString()

  const inserted: CalendarEntry[] = Array.from({ length: count }, (_, i) => {
    const day = atDay + i
    const category = categoryForInsertedDay(day)
    return { day, date: addDays(baseDate, i), category, recipe: RECIPES[category], completed: null, reactionFlag: null, milestone: false }
  })

  const shiftedFuture = calendar
    .filter((entry) => entry.day >= atDay)
    .map((entry) => ({ ...entry, day: entry.day + count, date: addDays(entry.date, count) }))

  return [...past, ...inserted, ...shiftedFuture]
}

/**
 * 5. 인시던트 오버라이드. 지난 일정은 유지하고, 트리거된 날부터 durationDays만큼
 * 응급 루틴 일정을 새로 끼워 넣는다. 원래 그 자리에 있던 미래 일정은 그만큼
 * 통째로 뒤로 밀린다("종료 시 NORMAL로 복귀, 미래 일정만 뒤로 밀림").
 */
export function startIncidentOverride(
  calendar: CalendarEntry[],
  day: number,
  incidentType: IncidentType,
  durationDays: number = DEFAULT_INCIDENT_DURATION_DAYS[incidentType],
): { calendar: CalendarEntry[]; incident: IncidentLogEntry } {
  const overrideCategory = INCIDENT_OVERRIDE_ROUTINE[incidentType]
  const startedAt = calendar.find((entry) => entry.day === day)?.date ?? new Date().toISOString()

  const next = insertDays(calendar, day, durationDays, () => overrideCategory)

  return {
    calendar: next,
    incident: {
      day,
      incidentType,
      startedAt,
      overrideRoutine: overrideCategory,
      resumesNormalAtDay: day + durationDays,
    },
  }
}

// ── 반응 피드백 루프 — 자극 신고 시 7일 연기 (8번 엣지 케이스) ─────

export interface ReactionLogEntry {
  day: number
  category: RecipeType
  flag: boolean
  delayedToDay: number
}

const REACTION_DELAY_DAYS = 7

/**
 * 자극이 신고된 날의 기록은 그대로 두되(reactionFlag만 표시), 그 다음 날부터
 * 7일간의 휴식/보습 버퍼를 끼워 넣어 이후 일정 전체를 7일 뒤로 미룬다.
 * 이 코스는 Type당 액티브 카테고리를 하나만 도입하므로(2-2), "해당 카테고리만
 * 개별 연기"와 "전체 일정을 7일 미루기"는 실질적으로 동일한 결과를 낸다.
 */
export function delayForReaction(
  calendar: CalendarEntry[],
  day: number,
  category: RecipeType,
): { calendar: CalendarEntry[]; reaction: ReactionLogEntry } {
  const flagged = calendar.map((entry) => (entry.day === day ? { ...entry, reactionFlag: true } : entry))
  const next = insertDays(flagged, day + 1, REACTION_DELAY_DAYS, (d) => (d % 2 === 1 ? "rest" : "moist"))

  return {
    calendar: next,
    reaction: { day, category, flag: true, delayedToDay: day + REACTION_DELAY_DAYS },
  }
}

// ── 4-1(연속). 장벽 점수 시계열 ────────────────────────────────

export interface BarrierScorePoint {
  day: number
  score: number
}

/**
 * fromDay~toDay 구간의 장벽 점수 시계열을 계산한다. 인시던트 오버라이드 기간은
 * (4-1 규칙대로) 완료율·자극 계산에서 통째로 제외한다.
 */
export function buildBarrierScoreLog(
  calendar: CalendarEntry[],
  incidentLog: IncidentLogEntry[],
  completedDays: number[],
  fromDay: number,
  toDay: number,
): BarrierScorePoint[] {
  const isIncidentDay = (day: number) => incidentLog.some((entry) => day >= entry.day && day < entry.resumesNormalAtDay)
  const entryByDay = new Map(calendar.map((entry) => [entry.day, entry]))
  const completedSet = new Set(completedDays)

  const log: BarrierScorePoint[] = []
  for (let day = fromDay; day <= toDay; day++) {
    let elapsedDays = 0
    let recordedDays = 0
    let irritationDays = 0
    for (let d = 1; d <= day; d++) {
      if (isIncidentDay(d)) continue
      elapsedDays++
      if (completedSet.has(d)) recordedDays++
      if (entryByDay.get(d)?.reactionFlag) irritationDays++
    }
    log.push({ day, score: calculateBarrierScore({ elapsedDays, recordedDays, irritationDays }) })
  }
  return log
}

// ── 6. 완주 및 2단계 잠금 해제 판정 ────────────────────────────

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
