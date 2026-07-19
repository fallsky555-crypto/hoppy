"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { dayFromJoinDate, recipeForDay, TOTAL_DAYS, type Recipe, type RecipeType } from "@/lib/schedule"
import {
  buildBarrierScoreLog,
  delayForReaction,
  generateCalendar,
  startIncidentOverride,
  type BarrierScorePoint,
  type CalendarEntry,
  type DiagnosisInput,
  type IncidentLogEntry,
  type IncidentType,
  type ReactionLogEntry,
  type SkinType,
  type Tier,
} from "@/lib/scheduling-engine"

/** 4번. 장벽 점수 그래프는 2주차(Day 8)부터 노출된다 */
export const BARRIER_SCORE_START_DAY = 8

export interface DailyHabit {
  sunscreen: boolean
  water: number // 0 ~ 8
}

/** 유저가 실시간으로 트리거하는 캘린더 조정 이벤트 (인시던트 / 자극 신고). day 순서로 재생(replay)한다 */
type ScheduleEvent =
  | { kind: "incident"; day: number; incidentType: IncidentType; durationDays?: number }
  | { kind: "reaction"; day: number; category: RecipeType }

interface DiaryState {
  /** 가입일(Day 1) — ISO 문자열 */
  joinDate: string
  completedDays: number[]
  habits: Record<number, DailyHabit>
  /** 진단 결과. 아직 진단을 받지 않았으면 null → 기본 30일 스케줄(schedule.ts) 사용 */
  diagnosis: DiagnosisInput | null
  events: ScheduleEvent[]
  /** 9-1. 임신/수유 중 — 레티놀 슬롯 잠금 안내에 사용 (Tier·Type과 무관한 공통 규칙) */
  pregnant: boolean
  /** 9-1. 처방약 사용 중 — "처방 지도가 앱 가이드보다 우선" 고지에 사용 */
  prescriptionMeds: boolean
}

const STORAGE_KEY = "hoppy-skin-diary-v1"
const MAX_WATER = 8

function todayISO() {
  return new Date().toISOString()
}

function loadState(): DiaryState {
  const fresh: DiaryState = {
    joinDate: todayISO(),
    completedDays: [],
    habits: {},
    diagnosis: null,
    events: [],
    pregnant: false,
    prescriptionMeds: false,
  }
  if (typeof window === "undefined") return fresh
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    return {
      joinDate: parsed.joinDate ?? fresh.joinDate,
      completedDays: parsed.completedDays ?? [],
      habits: parsed.habits ?? {},
      diagnosis: parsed.diagnosis ?? null,
      events: parsed.events ?? [],
      pregnant: parsed.pregnant ?? false,
      prescriptionMeds: parsed.prescriptionMeds ?? false,
    }
  } catch {
    return fresh
  }
}

/**
 * 5번 · 8번 엣지케이스. 인시던트/자극 신고 이벤트를 day 순서로 캘린더에 순차 적용한다.
 * 인시던트 기간 중에는 액티브가 이미 응급 루틴으로 대체돼 있으므로, 그 기간에 신고된
 * 자극은 자연히 "인시던트 종료 후 재개 시점"의 다음 해당 카테고리 일정부터 지연된다.
 */
function applyEvents(baseCalendar: CalendarEntry[], events: ScheduleEvent[]) {
  const sorted = [...events].sort((a, b) => a.day - b.day)
  let calendar = baseCalendar
  const incidentLog: IncidentLogEntry[] = []
  const reactionLog: ReactionLogEntry[] = []

  for (const event of sorted) {
    if (event.kind === "incident") {
      const result = startIncidentOverride(calendar, event.day, event.incidentType, event.durationDays)
      calendar = result.calendar
      incidentLog.push(result.incident)
    } else {
      const result = delayForReaction(calendar, event.day, event.category)
      calendar = result.calendar
      reactionLog.push(result.reaction)
    }
  }

  return { calendar, incidentLog, reactionLog }
}

interface URLDiagnosisPayload {
  diagnosis: DiagnosisInput
  pregnant: boolean
  prescriptionMeds: boolean
}

/**
 * 9-4. 외부 진단 화면(checker.html 등) 또는 앱 내 /diagnosis 화면에서 넘어올 때 쓰는
 * URL 파라미터를 읽는다.
 * ?overlap={number}&irritation={true/false}&type={A/B/C}&symptom={string}&preg={0/1}&rx={0/1}
 * tier는 이 앱이 assignTier()로 직접 재계산하므로 URL의 tier 파라미터는 참고하지 않는다.
 */
function diagnosisFromURL(): URLDiagnosisPayload | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const overlap = params.get("overlap")
  const type = params.get("type")
  if (overlap === null || type === null) return null
  if (type !== "A" && type !== "B" && type !== "C") return null

  const overlapCount = Number(overlap)
  if (!Number.isFinite(overlapCount)) return null

  return {
    diagnosis: {
      overlapCount,
      irritationReported: params.get("irritation") === "true",
      skinType: type as SkinType,
      symptom: params.get("symptom") ?? undefined,
    },
    pregnant: params.get("preg") === "1",
    prescriptionMeds: params.get("rx") === "1",
  }
}

export function useDiary() {
  // 하이드레이션 불일치를 피하기 위해 초기엔 기본값, 마운트 후 localStorage 로드
  const [state, setState] = useState<DiaryState>({
    joinDate: todayISO(),
    completedDays: [],
    habits: {},
    diagnosis: null,
    events: [],
    pregnant: false,
    prescriptionMeds: false,
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadState()
    // URL로 진단 결과가 넘어왔으면(checker.html 또는 앱 내 /diagnosis 화면) 저장된 값보다 우선한다
    const fromURL = diagnosisFromURL()
    setState(
      fromURL
        ? { ...loaded, diagnosis: fromURL.diagnosis, pregnant: fromURL.pregnant, prescriptionMeds: fromURL.prescriptionMeds }
        : loaded,
    )
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 실패는 무시 (사파리 프라이빗 모드 등)
    }
  }, [state, hydrated])

  const currentDay = dayFromJoinDate(state.joinDate)

  const baseCalendarResult = useMemo(() => {
    if (!state.diagnosis) return null
    return generateCalendar({ diagnosis: state.diagnosis, signupDate: state.joinDate })
  }, [state.diagnosis, state.joinDate])

  // 인시던트 오버라이드 / 자극 지연 이벤트를 기본 캘린더 위에 순차 적용한다
  const calendarResult = useMemo(() => {
    if (baseCalendarResult?.status !== "ok") return baseCalendarResult
    const { calendar, incidentLog, reactionLog } = applyEvents(baseCalendarResult.calendar, state.events)
    return { ...baseCalendarResult, calendar, incidentLog, reactionLog }
  }, [baseCalendarResult, state.events])

  const tier: Tier | null = calendarResult === null ? null : calendarResult.status === "ok" ? calendarResult.tier : "X"
  const medicalReferral = calendarResult?.status === "medical_referral"
  const totalDays = calendarResult?.status === "ok" ? calendarResult.calendar.length : TOTAL_DAYS
  const incidentLog = calendarResult?.status === "ok" ? calendarResult.incidentLog : []
  const reactionLog = calendarResult?.status === "ok" ? calendarResult.reactionLog : []

  // 4-1. 장벽 점수 시계열 — 2주차(Day 8)부터 오늘까지
  const barrierScoreLog: BarrierScorePoint[] = useMemo(() => {
    if (calendarResult?.status !== "ok" || currentDay < BARRIER_SCORE_START_DAY) return []
    return buildBarrierScoreLog(calendarResult.calendar, calendarResult.incidentLog, state.completedDays, BARRIER_SCORE_START_DAY, currentDay)
  }, [calendarResult, state.completedDays, currentDay])

  /** 진단이 있으면 개인화 캘린더에서, 없으면 기본 30일 스케줄에서 레시피를 가져온다 */
  const getRecipeForDay = useCallback(
    (day: number): Recipe => {
      if (calendarResult?.status === "ok") {
        const entry = calendarResult.calendar.find((e) => e.day === day)
        if (entry) return entry.recipe
      }
      return recipeForDay(day)
    },
    [calendarResult],
  )

  const setDiagnosis = useCallback((diagnosis: DiagnosisInput) => {
    setState((prev) => ({ ...prev, diagnosis }))
  }, [])

  /** 5번. [Period] / [Sunburn] / [Treatment] 버튼에서 호출 — 캘린더를 응급 루틴으로 전환한다 */
  const reportIncident = useCallback((day: number, incidentType: IncidentType, durationDays?: number) => {
    setState((prev) => ({ ...prev, events: [...prev.events, { kind: "incident", day, incidentType, durationDays }] }))
  }, [])

  /** 8번 엣지케이스. 특정 카테고리에 자극이 신고되면 그 카테고리의 향후 일정을 7일 연기한다 */
  const reportReaction = useCallback((day: number, category: RecipeType) => {
    setState((prev) => ({ ...prev, events: [...prev.events, { kind: "reaction", day, category }] }))
  }, [])

  const complete = useCallback((day: number) => {
    setState((prev) =>
      prev.completedDays.includes(day) ? prev : { ...prev, completedDays: [...prev.completedDays, day] },
    )
  }, [])

  const getHabit = useCallback(
    (day: number): DailyHabit => state.habits[day] ?? { sunscreen: false, water: 0 },
    [state.habits],
  )

  const toggleSunscreen = useCallback((day: number) => {
    setState((prev) => {
      const cur = prev.habits[day] ?? { sunscreen: false, water: 0 }
      return { ...prev, habits: { ...prev.habits, [day]: { ...cur, sunscreen: !cur.sunscreen } } }
    })
  }, [])

  const setWater = useCallback((day: number, delta: number) => {
    setState((prev) => {
      const cur = prev.habits[day] ?? { sunscreen: false, water: 0 }
      const water = Math.min(Math.max(cur.water + delta, 0), MAX_WATER)
      return { ...prev, habits: { ...prev.habits, [day]: { ...cur, water } } }
    })
  }, [])

  return {
    hydrated,
    currentDay,
    totalDays,
    completedDays: state.completedDays,
    complete,
    getHabit,
    toggleSunscreen,
    setWater,
    maxWater: MAX_WATER,
    diagnosis: state.diagnosis,
    setDiagnosis,
    tier,
    skinType: state.diagnosis?.skinType ?? null,
    medicalReferral,
    getRecipeForDay,
    incidentLog,
    reactionLog,
    reportIncident,
    reportReaction,
    barrierScoreLog,
    pregnant: state.pregnant,
    prescriptionMeds: state.prescriptionMeds,
  }
}
