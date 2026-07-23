"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { dayFromJoinDate, recipeForDay, TOTAL_DAYS, type Recipe, type RecipeType } from "@/lib/schedule"
import {
  buildBarrierScoreLog,
  CURRENT_ENGINE_VERSION,
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
import {
  appendIncidentLog,
  appendReactionLog,
  ensureAnonSession,
  loadRemoteState,
  saveBarrierScoreLog,
  saveCalendar,
  saveConcern,
  saveContextFlags,
  saveDiagnosis,
  saveEngineVersion,
} from "@/lib/supabase/sync"
import type { Concern, SupportId } from "@/lib/routine-copy"

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
  /** rest/moist 문구에 강조할 관심사. Tier·Type 계산과는 무관하고 문구에만 영향을 준다 */
  concern: Concern
  /** 유저가 이미 갖고 있다고 답한 성분 id 목록 */
  supportOwned: SupportId[]
  /**
   * 13-3(v1.7). 이 유저의 데이터가 마지막으로 확인된 엔진 버전. null이면 이 필드가
   * 생기기 전의 레거시 상태 — CURRENT_ENGINE_VERSION과 다르면 하이드레이션 직후 갱신한다.
   */
  engineVersion: string | null
}

/** 로그아웃 시 로컬 캐시를 지우는 용도로도 쓰인다(login-banner.tsx) */
export const STORAGE_KEY = "hoppy-skin-diary-v1"
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
    concern: "none",
    supportOwned: [],
    engineVersion: null,
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
      concern: parsed.concern ?? "none",
      supportOwned: parsed.supportOwned ?? [],
      engineVersion: parsed.engineVersion ?? null,
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
  concern: Concern
  supportOwned: SupportId[]
}

const VALID_CONCERNS: Concern[] = ["dry", "flush", "flaky", "trouble", "none"]
const VALID_SUPPORT_IDS: SupportId[] = ["hya", "cica", "nia", "cer"]

function parseConcern(raw: string | null): Concern {
  return VALID_CONCERNS.includes(raw as Concern) ? (raw as Concern) : "none"
}

function parseSupportOwned(raw: string | null): SupportId[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id): id is SupportId => VALID_SUPPORT_IDS.includes(id as SupportId))
}

/**
 * 9-4. 외부 진단 화면(myroutinediet.com의 checker.html)에서 넘어올 때 쓰는 URL 파라미터를 읽는다.
 * ?overlap={number}&irritation={true/false}&type={A/B/C}&symptom={string}&preg={0/1}&rx={0/1}
 * &concern={dry/flush/flaky/trouble/none}&support={hya,cica,nia,cer 콤마 구분}&unsure={0/1}
 * tier는 이 앱이 assignTier()로 직접 재계산하므로 URL의 tier 파라미터는 참고하지 않는다.
 * unsure=1이면(11-5, v1.5) assignTier()가 계산된 Tier가 0일 때만 안전 하한 1로 올린다.
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
      unsure: params.get("unsure") === "1",
    },
    pregnant: params.get("preg") === "1",
    prescriptionMeds: params.get("rx") === "1",
    concern: parseConcern(params.get("concern")),
    supportOwned: parseSupportOwned(params.get("support")),
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
    concern: "none",
    supportOwned: [],
    engineVersion: null,
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadState()
    // URL로 진단 결과가 넘어왔으면(myroutinediet.com checker.html) 저장된 값보다 우선한다
    const fromURL = diagnosisFromURL()
    setState(
      fromURL
        ? {
            ...loaded,
            diagnosis: fromURL.diagnosis,
            pregnant: fromURL.pregnant,
            prescriptionMeds: fromURL.prescriptionMeds,
            concern: fromURL.concern,
            supportOwned: fromURL.supportOwned,
          }
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

  // Supabase 익명 세션 — localStorage가 여전히 1차 캐시이고, 이건 기기 간 복원용 백엔드다
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ensureAnonSession().then((id) => {
      if (!cancelled) setUserId(id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 이 기기/브라우저에 로컬 진단이 없을 때만, 같은 유저의 원격 진단 데이터를 복원한다
  useEffect(() => {
    if (!userId || !hydrated || state.diagnosis) return
    let cancelled = false
    loadRemoteState(userId).then((remote) => {
      if (cancelled || !remote) return
      setState((prev) => ({
        ...prev,
        joinDate: remote.profile.signupDate,
        diagnosis: remote.profile.diagnosis,
        pregnant: remote.profile.pregnant,
        prescriptionMeds: remote.profile.prescriptionMeds,
        concern: remote.profile.concern,
        supportOwned: remote.profile.supportOwned,
        engineVersion: remote.profile.engineVersion,
        completedDays: remote.completedDays,
        events: remote.events.map((event) =>
          event.kind === "incident"
            ? { kind: "incident" as const, day: event.day, incidentType: event.incidentType!, durationDays: event.durationDays }
            : { kind: "reaction" as const, day: event.day, category: event.category! },
        ),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [userId, hydrated, state.diagnosis])

  /**
   * 13-3(v1.7). 캐시 무효화. baseCalendarResult(아래)는 completedDays/reactionDays를
   * 유일한 소스로 삼아 매 렌더마다 "지금 번들된" generateCalendar()로 다시 계산되므로,
   * 이미 지난 날짜(completedDays/reactionDays에 실제로 기록된 날)는 그 값 자체가 재작성
   * 근거가 되어 자연히 보존되고, 미래 일정만 최신 엔진 로직을 반영한다 — 그래서 여기서는
   * 별도의 캘린더 재생성 호출 없이 태그만 최신으로 맞추면 된다. 이 태그가 하는 일은
   * (1) 이 유저의 데이터가 어느 엔진으로 마지막 확인됐는지 기록해두는 것, (2) 다음 엔진
   * 변경 때도 반드시 CURRENT_ENGINE_VERSION을 올리도록 강제하는 릴리스 체크포인트다.
   */
  useEffect(() => {
    if (!hydrated || state.engineVersion === CURRENT_ENGINE_VERSION) return
    setState((prev) => (prev.engineVersion === CURRENT_ENGINE_VERSION ? prev : { ...prev, engineVersion: CURRENT_ENGINE_VERSION }))
  }, [hydrated, state.engineVersion])

  useEffect(() => {
    if (!userId || state.engineVersion !== CURRENT_ENGINE_VERSION) return
    saveEngineVersion(userId, state.joinDate, CURRENT_ENGINE_VERSION)
  }, [userId, state.joinDate, state.engineVersion])

  const currentDay = dayFromJoinDate(state.joinDate)

  // 2-3(v1.3) 빈도 상향 판정용 — 자극이 신고된 날짜만 뽑아둔다
  const reactionDays = useMemo(() => state.events.filter((event) => event.kind === "reaction").map((event) => event.day), [state.events])

  const baseCalendarResult = useMemo(() => {
    if (!state.diagnosis) return null
    return generateCalendar({
      diagnosis: state.diagnosis,
      signupDate: state.joinDate,
      completedDays: state.completedDays,
      reactionDays,
    })
  }, [state.diagnosis, state.joinDate, state.completedDays, reactionDays])

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

  // 진단 결과 + 캘린더 진행 상황(완료 여부 포함)을 diary_profiles / calendar_entries에 반영한다
  useEffect(() => {
    if (!userId || !state.diagnosis || calendarResult?.status !== "ok") return
    saveDiagnosis(userId, state.joinDate, state.diagnosis, calendarResult.tier)
    saveCalendar(
      userId,
      calendarResult.calendar.map((entry) => ({ ...entry, completed: state.completedDays.includes(entry.day) })),
    )
  }, [userId, state.diagnosis, state.joinDate, state.completedDays, calendarResult])

  // 9-1. 임신/처방약 플래그
  useEffect(() => {
    if (!userId) return
    saveContextFlags(userId, state.joinDate, state.pregnant, state.prescriptionMeds)
  }, [userId, state.joinDate, state.pregnant, state.prescriptionMeds])

  // rest/moist 문구에 강조할 관심사 + 보유 성분
  useEffect(() => {
    if (!userId) return
    saveConcern(userId, state.joinDate, state.concern, state.supportOwned)
  }, [userId, state.joinDate, state.concern, state.supportOwned])

  // incident_log / reaction_log는 append-only라, 새로 생긴 항목만 골라 반영한다
  const syncedIncidentCount = useRef(0)
  useEffect(() => {
    if (!userId) return
    const fresh = incidentLog.slice(syncedIncidentCount.current)
    if (fresh.length === 0) return
    fresh.forEach((entry) => appendIncidentLog(userId, entry))
    syncedIncidentCount.current = incidentLog.length
  }, [userId, incidentLog])

  const syncedReactionCount = useRef(0)
  useEffect(() => {
    if (!userId) return
    const fresh = reactionLog.slice(syncedReactionCount.current)
    if (fresh.length === 0) return
    fresh.forEach((entry) => appendReactionLog(userId, entry))
    syncedReactionCount.current = reactionLog.length
  }, [userId, reactionLog])

  useEffect(() => {
    if (!userId) return
    saveBarrierScoreLog(userId, barrierScoreLog)
  }, [userId, barrierScoreLog])

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
    concern: state.concern,
    supportOwned: state.supportOwned,
  }
}
