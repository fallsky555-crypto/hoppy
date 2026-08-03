"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { dayFromJoinDate, RECIPES, TOTAL_DAYS, type Recipe, type RecipeType, type ScheduleSettings } from "@/lib/schedule"
import {
  CURRENT_ENGINE_VERSION,
  delayForReaction,
  generateCalendar,
  REACTION_DELAY_DAYS,
  startIncidentOverride,
  type CalendarEntry,
  type IncidentLogEntry,
  type IncidentType,
  type ReactionLogEntry,
} from "@/lib/scheduling-engine"
import {
  appendIncidentLog,
  appendReactionLog,
  ensureAnonSession,
  loadRemoteState,
  saveCalendar,
  saveConcern,
  saveCompletionFeedback,
  saveConditionLog,
  saveContextFlags,
  saveEngineVersion,
  saveHabitLog,
  saveSettings,
  saveUsedProducts,
} from "@/lib/supabase/sync"
import type { Concern, SupportId } from "@/lib/routine-copy"
import { heroImageSrcForDay } from "@/lib/hero-image"
import PRODUCTS_DATA from "@/lib/data/products.json"

export interface UsedProduct {
  id: string
  brand: string
  name: string
  lang: "ko" | "en"
}

/** 유저가 실시간으로 트리거하는 캘린더 조정 이벤트 (인시던트 / 자극 신고). day 순서로 재생(replay)한다 */
type ScheduleEvent =
  | { kind: "incident"; day: number; incidentType: IncidentType; durationDays?: number }
  | { kind: "reaction"; day: number; category: RecipeType }

interface DiaryState {
  /** 가입일(Day 1) — ISO 문자열 */
  joinDate: string
  /** usage_log에 슬롯이 탭된 날짜 목록 */
  loggedDays: number[]
  /** 이미 본 Weekly Mini Insight 마일스톤 (7, 14, 21, 28) */
  seenMilestones: number[]
  /** 날별 슬롯 기록: { day: [{ slot, tag }, ...] } */
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>
  conditions: Record<number, "good" | "neutral" | "bad">
  /** BHA/레티놀 도입 간격 슬라이더. 아무것도 안 건드리면 워크북 기본값(7/7)을 그대로 쓴다 */
  settings: ScheduleSettings
  events: ScheduleEvent[]
  /** 임신/수유 중 — 레티놀 슬롯 잠금 안내에 사용 */
  pregnant: boolean
  /** 처방약 사용 중 — "처방 지도가 앱 가이드보다 우선" 고지에 사용 */
  prescriptionMeds: boolean
  /** 루틴 문구에 강조할 관심사. 스케줄 계산과는 무관하고 문구에만 영향을 준다 */
  concern: Concern
  /** 유저가 이미 갖고 있다고 답한 성분 id 목록 */
  supportOwned: SupportId[]
  /** 체커에서 전달받은 제품 목록 (Day 0 온보딩 시에만 저장, 갱신은 별도 self-report 기능에서 처리 예정) */
  usedProducts: UsedProduct[] | null
  /**
   * 이 유저의 데이터가 마지막으로 확인된 엔진 버전. null이면 이 필드가 생기기 전의
   * 레거시 상태 — CURRENT_ENGINE_VERSION과 다르면 하이드레이션 직후 갱신한다.
   */
  engineVersion: string | null
  /** 피부 기록 수집에 동의했는지 여부 (온보딩 1단계) */
  dataConsent: boolean
  /** 동의한 시점 (ISO 8601 형식, UTC) */
  dataConsentAt: string | null
}

/** 로그아웃 시 로컬 캐시를 지우는 용도로도 쓰인다(login-banner.tsx) */
export const STORAGE_KEY = "hoppy-skin-diary-v1"

function todayISO() {
  return new Date().toISOString()
}

function freshState(): DiaryState {
  return {
    joinDate: todayISO(),
    loggedDays: [],
    seenMilestones: [],
    loggedSlots: {},
    conditions: {},
    settings: {},
    events: [],
    pregnant: false,
    prescriptionMeds: false,
    concern: "none",
    supportOwned: [],
    usedProducts: null,
    engineVersion: null,
    dataConsent: false,
    dataConsentAt: null,
  }
}

function loadLocalState(): DiaryState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    const fresh = freshState()
    return {
      joinDate: parsed.joinDate ?? fresh.joinDate,
      loggedDays: parsed.loggedDays ?? [],
      seenMilestones: parsed.seenMilestones ?? [],
      loggedSlots: parsed.loggedSlots ?? {},
      conditions: parsed.conditions ?? {},
      settings: parsed.settings ?? {},
      events: parsed.events ?? [],
      pregnant: parsed.pregnant ?? false,
      prescriptionMeds: parsed.prescriptionMeds ?? false,
      concern: parsed.concern ?? "none",
      supportOwned: parsed.supportOwned ?? [],
      usedProducts: parsed.usedProducts ?? null,
      engineVersion: parsed.engineVersion ?? null,
      dataConsent: parsed.dataConsent ?? false,
      dataConsentAt: parsed.dataConsentAt ?? null,
    }
  } catch {
    return null
  }
}

/**
 * 인시던트/자극 신고 이벤트를 day 순서로 캘린더에 순차 적용한다.
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

/** 동적으로 생성: products.json에서 모든 id 추출 */
const VALID_PRODUCT_IDS = new Set(PRODUCTS_DATA.map(p => p.id))
const PRODUCTS_BY_ID = new Map(
  PRODUCTS_DATA.map(p => [p.id, p])
)

/** 체커(checker.html)에서 돌아올 때 실려오는, 스케줄과 무관한 부가 정보 */
interface URLContextPayload {
  pregnant: boolean
  prescriptionMeds: boolean
  concern: Concern
  supportOwned: SupportId[]
  usedProducts: UsedProduct[] | null
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

function parseItems(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map(id => id.trim())
    .filter(id => VALID_PRODUCT_IDS.has(id))
}

function buildProductDetails(itemIds: string[]): UsedProduct[] {
  return itemIds
    .map(id => {
      const product = PRODUCTS_BY_ID.get(id)
      return product
        ? {
            id: product.id,
            brand: product.brand,
            name: product.name,
            lang: product.lang,
          }
        : null
    })
    .filter((p): p is UsedProduct => p !== null)
}

/**
 * 외부 진단 화면(myroutinediet.com의 checker.html)에서 넘어올 때 쓰는 URL 파라미터를 읽는다.
 * ?type={A/B/C}&preg={0/1}&rx={0/1}&concern={dry/flush/flaky/trouble/none}&support={hya,cica,nia,cer 콤마 구분}
 * type(피부 유형)은 스케줄 생성에도, 어떤 UI 카피에도 더 이상 관여하지 않는다 — 저장하지
 * 않고, "체커에서 돌아왔다"는 신호로만 그 존재 여부를 확인한다. 스케줄(캘린더)은 이
 * 파라미터 유무와 무관하게 가입 즉시 기본 워크북 시퀀스로 시작한다.
 */
function contextFromURL(): URLContextPayload | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  if (params.get("type") === null) return null

  const itemIds = parseItems(params.get("items"))

  return {
    pregnant: params.get("preg") === "1",
    prescriptionMeds: params.get("rx") === "1",
    concern: parseConcern(params.get("concern")),
    supportOwned: parseSupportOwned(params.get("support")),
    usedProducts: itemIds.length > 0 ? buildProductDetails(itemIds) : null,
  }
}

/** 체커에서 돌아온 뒤 새로고침해도 같은 처리가 반복되지 않도록 URL에서 컨텍스트 파라미터를 지운다 */
function clearContextURLParams() {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  for (const key of ["type", "preg", "rx", "concern", "support"]) {
    params.delete(key)
  }
  const query = params.toString()
  window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""))
}

function applyURLContext(base: DiaryState, context: URLContextPayload | null): DiaryState {
  if (!context) return base
  return {
    ...base,
    pregnant: context.pregnant,
    prescriptionMeds: context.prescriptionMeds,
    concern: context.concern,
    supportOwned: context.supportOwned,
    usedProducts: context.usedProducts,
  }
}

export function useDiary() {
  // 하이드레이션 불일치를 피하기 위해 초기엔 기본값, 마운트 후 localStorage 로드
  const [state, setState] = useState<DiaryState>(freshState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    const localState = loadLocalState()
    const urlContext = contextFromURL()

    if (localState) {
      // 이 기기에 이미 진행 중인 로컬 기록이 있다 — joinDate/진행 기록은 그대로 두고,
      // 체커에서 돌아온 경우라면 concern/support/preg/rx 같은 부가 정보만 갱신한다
      setState(applyURLContext(localState, urlContext))
      if (urlContext) clearContextURLParams()
      setHydrated(true)
      return
    }

    ;(async () => {
      // 이 기기는 로컬 기록이 없다 — 로그인 계정이면 다른 기기에서 이어오던 원격 기록이
      // 있는지 먼저 확인한다 (없으면 새 계정으로 보고 기본 워크북 시퀀스를 새로 시작)
      const userId = await ensureAnonSession()
      if (cancelled) return
      const remote = userId ? await loadRemoteState(userId) : null
      if (cancelled) return

      const base: DiaryState = remote
        ? {
            ...freshState(),
            joinDate: remote.profile.signupDate,
            settings: remote.profile.settings,
            pregnant: remote.profile.pregnant,
            prescriptionMeds: remote.profile.prescriptionMeds,
            concern: remote.profile.concern,
            supportOwned: remote.profile.supportOwned,
            engineVersion: remote.profile.engineVersion,
            loggedDays: Object.keys(remote.loggedSlots).map(Number).sort((a, b) => a - b),
            loggedSlots: remote.loggedSlots,
            conditions: remote.conditions,
            events: remote.events.map((event) =>
              event.kind === "incident"
                ? { kind: "incident" as const, day: event.day, incidentType: event.incidentType!, durationDays: event.durationDays }
                : { kind: "reaction" as const, day: event.day, category: event.category! },
            ),
          }
        : freshState()

      setState(applyURLContext(base, urlContext))
      if (urlContext) clearContextURLParams()
      setHydrated(true)
    })()

    return () => {
      cancelled = true
    }
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

  // 캐시 무효화. 엔진 로직이 바뀔 때마다 CURRENT_ENGINE_VERSION을 올리도록 강제하는 릴리스 체크포인트다.
  useEffect(() => {
    if (!hydrated || state.engineVersion === CURRENT_ENGINE_VERSION) return
    setState((prev) => (prev.engineVersion === CURRENT_ENGINE_VERSION ? prev : { ...prev, engineVersion: CURRENT_ENGINE_VERSION }))
  }, [hydrated, state.engineVersion])

  useEffect(() => {
    if (!userId || state.engineVersion !== CURRENT_ENGINE_VERSION) return
    saveEngineVersion(userId, state.joinDate, CURRENT_ENGINE_VERSION)
  }, [userId, state.joinDate, state.engineVersion])

  const currentDay = dayFromJoinDate(state.joinDate)

  /**
   * 온보딩 완료 여부를 별도 필드 없이 판단한다. completeOnboarding()이 항상 두 값을
   * 함께 채워 넣으므로(둘 다 undefined 아니면 온보딩 끝난 것), 새 컬럼/로컬 필드가
   * 필요 없다.
   */
  const onboarded = state.settings.activeIntervalDays !== undefined && state.settings.bhaIntervalDays !== undefined

  const baseCalendar = useMemo(
    () => generateCalendar({ signupDate: state.joinDate, settings: state.settings }),
    [state.joinDate, state.settings],
  )

  // 인시던트 오버라이드 / 자극 지연 이벤트를 기본 캘린더 위에 순차 적용한다
  const { calendar, incidentLog, reactionLog } = useMemo(() => applyEvents(baseCalendar, state.events), [baseCalendar, state.events])

  const totalDays = calendar.length

  // 상단 여정 카드 히어로 이미지 — BHA가 새로 들어가는 날마다 다음 사이클 이미지로 바뀐다
  const heroImageSrc = useMemo(() => heroImageSrcForDay(calendar, currentDay), [calendar, currentDay])

  // 스케줄 설정 + 캘린더 진행 상황(완료 여부 포함)을 diary_profiles / calendar_entries에 반영한다
  useEffect(() => {
    if (!userId) return
    saveSettings(userId, state.joinDate, state.settings)
    saveCalendar(
      userId,
      calendar.map((entry) => ({ ...entry, completed: state.loggedDays.includes(entry.day) })),
    )
  }, [userId, state.joinDate, state.settings, state.loggedDays, calendar])

  // 임신/처방약 플래그
  useEffect(() => {
    if (!userId) return
    saveContextFlags(userId, state.joinDate, { pregnant: state.pregnant, prescriptionMeds: state.prescriptionMeds })
  }, [userId, state.joinDate, state.pregnant, state.prescriptionMeds])

  // 루틴 문구에 강조할 관심사 + 보유 성분
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

  const getRecipeForDay = useCallback(
    (day: number): Recipe => {
      const entry = calendar.find((e) => e.day === day)
      return entry ? entry.recipe : RECIPES.defense_barrier
    },
    [calendar],
  )

  const setSettings = useCallback((settings: ScheduleSettings) => {
    setState((prev) => ({ ...prev, settings }))
  }, [])

  /**
   * 온보딩 4단계 "시작하기" 전용. activeIntervalDays/bhaIntervalDays를 항상 같은
   * 값으로 한 번에 채워 넣고(온보딩 판단 기준이 "둘 다 있는지"라 절대 따로 저장되면
   * 안 된다), 가입일(Day 1)도 이 순간으로 스탬프한다 — 온보딩을 보는 동안은 아직
   * Day 1이 시작되지 않은 것으로 취급한다.
   */
  const completeOnboarding = useCallback(
    async (intervalDays: number, dataConsent: boolean, condition: "good" | "neutral" | "bad") => {
      const now = todayISO()
      setState((prev) => ({
        ...prev,
        joinDate: now,
        settings: { activeIntervalDays: intervalDays, bhaIntervalDays: intervalDays },
        dataConsent,
        dataConsentAt: dataConsent ? now : null,
      }))
      if (userId) {
        // diary_profiles 행이 반드시 먼저 생성되도록 await
        await saveContextFlags(userId, now, { dataConsent })
        saveConditionLog(userId, 0, condition, "onboarding")

        // 이후 used_products 저장 (fire-and-forget, 위의 await로 안전성 보장)
        // Day 0 전용: 갱신은 별도 self-report 기능에서 처리 예정
        if (state.usedProducts) {
          saveUsedProducts(userId, now, state.usedProducts)
        }
      }
    },
    [userId, state.usedProducts],
  )

  /** [Period] / [Sunburn] / [Treatment] 버튼에서 호출 — 캘린더를 응급 루틴으로 전환한다 */
  const reportIncident = useCallback((day: number, incidentType: IncidentType, durationDays?: number) => {
    setState((prev) => ({ ...prev, events: [...prev.events, { kind: "incident", day, incidentType, durationDays }] }))
  }, [])

  /** 특정 카테고리에 자극이 신고되면 그 카테고리의 향후 일정을 5일 연기한다 */
  const reportReaction = useCallback((day: number, category: RecipeType) => {
    setState((prev) => ({ ...prev, events: [...prev.events, { kind: "reaction", day, category }] }))
  }, [])

  const recordLoggedDay = useCallback((day: number) => {
    setState((prev) =>
      prev.loggedDays.includes(day) ? prev : { ...prev, loggedDays: [...prev.loggedDays, day] },
    )
  }, [])

  const markMilestoneAsSeen = useCallback((milestone: number) => {
    setState((prev) =>
      prev.seenMilestones.includes(milestone) ? prev : { ...prev, seenMilestones: [...prev.seenMilestones, milestone] },
    )
  }, [])

  const recordLoggedSlot = useCallback((day: number, slot: string, tag: string) => {
    setState((prev) => {
      const daySlots = prev.loggedSlots[day] ?? []
      const newSlots = [...daySlots, { slot, tag }]

      const newLoggedDays = prev.loggedDays.includes(day) ? prev.loggedDays : [...prev.loggedDays, day]

      return { ...prev, loggedSlots: { ...prev.loggedSlots, [day]: newSlots }, loggedDays: newLoggedDays }
    })
  }, [])



  const recordCondition = useCallback(
    (day: number, condition: "good" | "neutral" | "bad") => {
      setState((prev) => {
        if (userId) {
          const recipe = getRecipeForDay(day)
          saveConditionLog(userId, day, condition, "daily_checkin", recipe.type)
        }
        return { ...prev, conditions: { ...prev.conditions, [day]: condition } }
      })
    },
    [userId, getRecipeForDay],
  )

  /**
   * 설정 화면의 "루틴 처음부터 다시 시작하기" 버튼 전용. 체커 재방문 흐름과는 완전히
   * 분리된, 유저가 직접 요청한 명시적 초기화다 — 가입일을 오늘로 재설정해 진행 기록을
   * 지우되, 슬라이더 설정·관심사·보유 성분 등 개인화 정보는 그대로 유지한다.
   */
  const startFresh = useCallback(() => {
    setState((prev) => ({ ...prev, joinDate: todayISO(), conditions: {}, events: [] }))
  }, [])

  const submitFeedback = useCallback(
    async (feedbackText: string) => {
      if (!userId) return
      await saveCompletionFeedback(userId, feedbackText)
    },
    [userId],
  )

  /** 최근 N일 내 안전 관련 인시던트(period/sunburn/treatment)가 있는지 판단 */
  const hasRecentSafetyIncident = useCallback((day: number, windowDays: number = REACTION_DELAY_DAYS): boolean => {
    const windowStart = day - windowDays
    return incidentLog.some((incident) => incident.day >= windowStart && incident.day <= day)
  }, [incidentLog])

  return {
    hydrated,
    onboarded,
    completeOnboarding,
    currentDay,
    totalDays,
    heroImageSrc,
    calendar,
    loggedDays: state.loggedDays,
    recordLoggedDay,
    loggedSlots: state.loggedSlots,
    recordLoggedSlot,
    seenMilestones: state.seenMilestones,
    markMilestoneAsSeen,
    conditions: state.conditions,
    recordCondition,
    settings: state.settings,
    setSettings,
    getRecipeForDay,
    incidentLog,
    reactionLog,
    reportIncident,
    reportReaction,
    hasRecentSafetyIncident,
    pregnant: state.pregnant,
    prescriptionMeds: state.prescriptionMeds,
    concern: state.concern,
    supportOwned: state.supportOwned,
    usedProducts: state.usedProducts,
    userId,
    joinDate: state.joinDate,
    startFresh,
    submitFeedback,
  }
}
