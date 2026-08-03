import { getSupabaseClient } from "@/lib/supabase/client"
import type { RecipeType, ScheduleSettings } from "@/lib/schedule"
import type { BarrierScorePoint, CalendarEntry, IncidentLogEntry, IncidentType, ReactionLogEntry } from "@/lib/scheduling-engine"
import type { Concern, SupportId } from "@/lib/routine-copy"
import type { UsedProduct } from "@/lib/use-diary"

/**
 * Supabase 연동. 이 모듈의 모든 함수는 실패해도(오프라인, 마이그레이션 미적용 등)
 * 앱이 계속 동작해야 하므로 예외를 던지지 않고 콘솔 경고 후 조용히 무시한다.
 * localStorage가 여전히 1차 캐시이고, Supabase는 기기 간 복원을 위한 백엔드다.
 */

/**
 * 페이지 로드마다 use-diary.ts와 LoginBanner가 각자 ensureAnonSession()을 부르는데,
 * 둘 다 getSession()이 끝나기 전에는 "세션 없음"으로 보여서 둘 다 signInAnonymously()를
 * 호출해버리는 레이스가 있었다 — 익명 유저가 페이지 로드 한 번에 2개씩(마이크로초
 * 단위로) 생기는 문제로 실측됨. 같은 페이지 로드 안에서는 이 진행 중인 프로미스를
 * 모든 호출자가 공유해서, 실제로 세션 생성 시도는 딱 한 번만 일어나게 한다.
 */
let anonSessionPromise: Promise<string | null> | null = null

async function createOrRecoverAnonSession(): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user.id) return data.session.user.id

    const { data: signInData, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn("[supabase] anonymous sign-in failed:", error.message)
      return null
    }
    return signInData.user?.id ?? null
  } catch (err) {
    console.warn("[supabase] anonymous sign-in threw:", err)
    return null
  }
}

/** 익명 세션을 보장하고 auth.uid()를 반환한다. Supabase가 설정되지 않았으면 null */
export function ensureAnonSession(): Promise<string | null> {
  if (!anonSessionPromise) {
    anonSessionPromise = createOrRecoverAnonSession()
  }
  return anonSessionPromise
}

interface RemoteProfile {
  signupDate: string
  settings: ScheduleSettings
  pregnant: boolean
  prescriptionMeds: boolean
  concern: Concern
  supportOwned: SupportId[]
  /** 이 프로필이 마지막으로 확인된 엔진 버전 — null이면 이 필드가 생기기 전의 레거시 유저 */
  engineVersion: string | null
}

/** BHA/레티놀 도입 간격 슬라이더 + 가입일을 diary_profiles에 upsert한다 */
export async function saveSettings(userId: string, signupDate: string, settings: ScheduleSettings): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    {
      user_id: userId,
      signup_date: signupDate.slice(0, 10),
      active_interval_days: settings.activeIntervalDays ?? null,
      bha_interval_days: settings.bhaIntervalDays ?? null,
    },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveSettings failed:", error.message)
}

/** 임신/처방약 플래그 + 데이터 수집 동의를 diary_profiles에 반영한다 */
export async function saveContextFlags(
  userId: string,
  signupDate: string,
  flags: {
    pregnant?: boolean
    prescriptionMeds?: boolean
    concern?: string
    supportOwned?: string[]
    dataConsent?: boolean
  },
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const updatePayload: Record<string, unknown> = {
    user_id: userId,
    signup_date: signupDate.slice(0, 10),
  }

  if (flags.pregnant !== undefined) updatePayload.pregnant = flags.pregnant
  if (flags.prescriptionMeds !== undefined) updatePayload.prescription_meds = flags.prescriptionMeds
  if (flags.concern !== undefined) updatePayload.concern = flags.concern
  if (flags.supportOwned !== undefined) updatePayload.support_owned = flags.supportOwned

  if (flags.dataConsent !== undefined) {
    updatePayload.data_consent = flags.dataConsent
    if (flags.dataConsent) {
      updatePayload.data_consent_at = new Date().toISOString()
    }
  }

  const { error } = await supabase
    .from("diary_profiles")
    .upsert(updatePayload, { onConflict: "user_id" })
  if (error) console.warn("[supabase] saveContextFlags failed:", error.message)
}

/** 방어/락 계열 문구에 강조할 관심사 + 보유 성분을 diary_profiles에 반영한다 */
export async function saveConcern(userId: string, signupDate: string, concern: Concern, supportOwned: SupportId[]): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), concern, support_owned: supportOwned },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveConcern failed:", error.message)
}

/** 13-3(v1.7). 이 유저의 프로필이 확인된 엔진 버전을 diary_profiles에 반영한다 */
export async function saveEngineVersion(userId: string, signupDate: string, engineVersion: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), engine_version: engineVersion },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveEngineVersion failed:", error.message)
}

/**
 * 체커에서 전달받은 제품 목록(items)을 diary_profiles에 저장한다 — fire-and-forget
 * Day 0 온보딩 시에만 호출된다. 갱신(self-report)은 별도 기능에서 처리 예정.
 */
export async function saveUsedProducts(
  userId: string,
  signupDate: string,
  usedProducts: UsedProduct[] | null,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    {
      user_id: userId,
      signup_date: signupDate.slice(0, 10),
      used_products: usedProducts,
    },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveUsedProducts failed:", error.message)
}

/** 현재 계산된 캘린더 전체를 calendar_entries에 반영한다 (일정이 통째로 밀리는 경우가 있어 매번 upsert) */
export async function saveCalendar(userId: string, calendar: CalendarEntry[]): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase || calendar.length === 0) return

  const rows = calendar.map((entry) => ({
    user_id: userId,
    day: entry.day,
    date: entry.date.slice(0, 10),
    category: entry.category,
    completed: entry.completed,
    reaction_flag: entry.reactionFlag,
  }))

  const { error } = await supabase.from("calendar_entries").upsert(rows, { onConflict: "user_id,day" })
  if (error) console.warn("[supabase] saveCalendar failed:", error.message)
}

/** Day 기록 완료 체크 한 건만 가볍게 반영할 때 쓴다 */
export async function markCalendarDayCompleted(userId: string, day: number): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("calendar_entries").update({ completed: true }).eq("user_id", userId).eq("day", day)
  if (error) console.warn("[supabase] markCalendarDayCompleted failed:", error.message)
}

export async function appendIncidentLog(userId: string, entry: IncidentLogEntry): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("incident_log").insert({
    user_id: userId,
    day: entry.day,
    incident_type: entry.incidentType,
    started_at: entry.startedAt,
    override_routine: entry.overrideRoutine,
    resumes_normal_at_day: entry.resumesNormalAtDay,
  })
  if (error) console.warn("[supabase] appendIncidentLog failed:", error.message)
}

export async function appendReactionLog(userId: string, entry: ReactionLogEntry): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("reaction_log").insert({
    user_id: userId,
    day: entry.day,
    category: entry.category,
    flag: entry.flag,
    delayed_to_day: entry.delayedToDay,
  })
  if (error) console.warn("[supabase] appendReactionLog failed:", error.message)
}

export async function saveBarrierScoreLog(userId: string, points: BarrierScorePoint[]): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase || points.length === 0) return

  const rows = points.map((point) => ({ user_id: userId, day: point.day, score: point.score }))
  const { error } = await supabase.from("barrier_score_log").upsert(rows, { onConflict: "user_id,day" })
  if (error) console.warn("[supabase] saveBarrierScoreLog failed:", error.message)
}

export async function saveHabitLog(userId: string, day: number, habit: { sunscreen: boolean }): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("habit_log").upsert(
    {
      user_id: userId,
      day,
      sunscreen: habit.sunscreen,
    },
    { onConflict: "user_id,day" },
  )
  if (error) console.warn("[supabase] saveHabitLog failed:", error.message)
}

export async function saveConditionLog(
  userId: string,
  day: number,
  condition: "good" | "neutral" | "bad",
  source: "onboarding" | "daily_checkin",
  linkedCategory?: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const payload: Record<string, unknown> = {
    user_id: userId,
    day,
    condition,
    source,
  }
  if (linkedCategory !== undefined) {
    payload.linked_category = linkedCategory
  }

  const { error } = await supabase.from("condition_log").upsert(payload, { onConflict: "user_id,day" })
  if (error) console.warn("[supabase] saveConditionLog failed:", error.message)
}

export async function saveUsageLog(
  userId: string,
  day: number,
  slots: unknown,
  recommendedCategory?: string,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const payload: Record<string, unknown> = {
    user_id: userId,
    day,
    slots,
  }
  if (recommendedCategory !== undefined) {
    payload.recommended_category = recommendedCategory
  }

  const { error } = await supabase.from("usage_log").upsert(payload, { onConflict: "user_id,day" })
  if (error) console.warn("[supabase] saveUsageLog failed:", error.message)
}

/** 완주 30일 기념 소감을 completion_feedback에 저장한다 */
export async function saveCompletionFeedback(userId: string, feedbackText: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("completion_feedback").insert({
    user_id: userId,
    feedback_text: feedbackText,
  })
  if (error) console.warn("[supabase] saveCompletionFeedback failed:", error.message)
}

export interface RemoteScheduleEvent {
  kind: "incident" | "reaction"
  day: number
  incidentType?: IncidentType
  durationDays?: number
  category?: RecipeType
}

export interface RemoteState {
  profile: RemoteProfile
  completedDays: number[]
  /** incident_log · reaction_log로부터 재구성한, 로컬 엔진이 그대로 재생(replay)할 수 있는 이벤트 목록 */
  events: RemoteScheduleEvent[]
  /** usage_log로부터 로드한 슬롯 기록 */
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>
  /** condition_log로부터 로드한 컨디션 기록 */
  conditions: Record<number, "good" | "neutral" | "bad">
}

/**
 * 새 기기/브라우저에서 기존 계정의 진행 기록을 복원할 때 쓴다. diary_profiles가 없으면
 * (이 계정으로 한 번도 기록한 적 없는 경우) null을 반환하고, 앱은 기본 워크북 시퀀스로 새로 시작한다.
 */
export async function loadRemoteState(userId: string): Promise<RemoteState | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data: profile, error: profileError } = await supabase
      .from("diary_profiles")
      .select(
        "signup_date, active_interval_days, bha_interval_days, pregnant, prescription_meds, concern, support_owned, engine_version",
      )
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError) {
      console.warn("[supabase] loadRemoteState profile failed:", profileError.message)
      return null
    }
    if (!profile) return null

    const [{ data: calendarRows }, { data: incidentRows }, { data: reactionRows }, { data: usageLogRows }, { data: conditionLogRows }] = await Promise.all([
      supabase.from("calendar_entries").select("day, completed").eq("user_id", userId),
      supabase.from("incident_log").select("day, incident_type, resumes_normal_at_day").eq("user_id", userId),
      supabase.from("reaction_log").select("day, category, delayed_to_day").eq("user_id", userId),
      supabase.from("usage_log").select("day, slots").eq("user_id", userId),
      supabase.from("condition_log").select("day, condition").eq("user_id", userId),
    ])

    const completedDays = (calendarRows ?? []).filter((row) => row.completed).map((row) => row.day)

    const loggedSlots: Record<number, Array<{ slot: string; tag: string }>> = {}
    for (const row of usageLogRows ?? []) {
      if (Array.isArray(row.slots)) {
        loggedSlots[row.day] = row.slots
      }
    }

    const conditions: Record<number, "good" | "neutral" | "bad"> = {}
    for (const row of conditionLogRows ?? []) {
      if (["good", "neutral", "bad"].includes(row.condition)) {
        conditions[row.day] = row.condition
      }
    }

    const events: RemoteScheduleEvent[] = [
      ...(incidentRows ?? []).map((row) => ({
        kind: "incident" as const,
        day: row.day,
        incidentType: row.incident_type as IncidentType,
        durationDays: row.resumes_normal_at_day - row.day,
      })),
      ...(reactionRows ?? []).map((row) => ({
        kind: "reaction" as const,
        day: row.day,
        category: row.category as RecipeType,
      })),
    ]

    return {
      profile: {
        signupDate: new Date(profile.signup_date).toISOString(),
        settings: {
          activeIntervalDays: profile.active_interval_days ?? undefined,
          bhaIntervalDays: profile.bha_interval_days ?? undefined,
        },
        pregnant: profile.pregnant ?? false,
        prescriptionMeds: profile.prescription_meds ?? false,
        concern: (profile.concern as Concern) ?? "none",
        supportOwned: (profile.support_owned as SupportId[] | null) ?? [],
        engineVersion: profile.engine_version ?? null,
      },
      completedDays,
      events,
      loggedSlots,
      conditions,
    }
  } catch (err) {
    console.warn("[supabase] loadRemoteState threw:", err)
    return null
  }
}
