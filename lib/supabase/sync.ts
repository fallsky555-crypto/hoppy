import { getSupabaseClient } from "@/lib/supabase/client"
import type { ScheduleSettings } from "@/lib/schedule"
import type { BarrierScorePoint, CalendarEntry } from "@/lib/scheduling-engine"
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

/**
 * [2026-08-09] GoTrue 클라이언트가 특별 취급하는 3개 에러코드. URL에 이 중 하나가 있으면
 * @supabase/auth-js의 _initialize()가 스토리지의 기존 세션을 메모리로 복구하지 않고 그냥
 * 리턴해버린다(SDK 소스 확인: node_modules/@supabase/auth-js/dist/main/GoTrueClient.js의
 * _initialize() — "Don't remove existing session on URL login failure" 주석 부분). 세션
 * 토큰 자체는 localStorage에 멀쩡히 남아있는데 GoTrue가 그걸 메모리로 안 읽어들이는 것뿐이라,
 * getSession()이 null을 리턴해도 실제로는 "세션이 없는" 게 아니다.
 */
const RECOVERABLE_SESSION_ERROR_CODES = ["identity_already_exists", "identity_not_found", "single_identity_not_deletable"]

/** [임시 디버그용, 검증 끝나면 제거] */
function hasRecoverableSessionErrorInURL(): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const errorCode = params.get("error_code") ?? hashParams.get("error_code")
  return errorCode !== null && RECOVERABLE_SESSION_ERROR_CODES.includes(errorCode)
}

/** localStorage에 supabase-js가 직접 저장해둔 세션 토큰을 읽는다. 스토리지 키는 supabase-js
 * 기본 규칙(sb-<project-ref>-auth-token, SupabaseClient 생성자 로직과 동일)을 재현한다. */
function readPersistedSessionTokens(): { access_token: string; refresh_token: string } | null {
  if (typeof window === "undefined") return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    const projectRef = new URL(url).hostname.split(".")[0]
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.access_token === "string" && typeof parsed?.refresh_token === "string") {
      return { access_token: parsed.access_token, refresh_token: parsed.refresh_token }
    }
    return null
  } catch {
    return null
  }
}

async function createOrRecoverAnonSession(): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user.id) {
      console.log("[createOrRecoverAnonSession] getSession()에서 바로 세션 찾음:", data.session.user.id)
      return data.session.user.id
    }

    // getSession()이 null이어도, URL에 identity_already_exists류 에러가 있으면 GoTrue가
    // 세션 복구를 스킵한 것뿐일 수 있다 — 새 익명 세션을 만들기 전에 로컬에 남아있는 기존
    // 토큰으로 직접 복구를 먼저 시도한다.
    if (hasRecoverableSessionErrorInURL()) {
      console.log("[createOrRecoverAnonSession] URL에 identity_already_exists류 에러 감지 — 로컬 저장 토큰으로 세션 복구 시도")
      const tokens = readPersistedSessionTokens()
      if (tokens) {
        const { data: restoreData, error: restoreError } = await supabase.auth.setSession(tokens)
        if (!restoreError && restoreData.session?.user.id) {
          console.log("[createOrRecoverAnonSession] setSession() 복구 성공, 새 익명 세션 생성 안 함:", restoreData.session.user.id)
          return restoreData.session.user.id
        }
        console.log("[createOrRecoverAnonSession] setSession() 복구 실패, 새 익명 세션으로 폴백:", restoreError?.message)
      } else {
        console.log("[createOrRecoverAnonSession] 로컬에 저장된 세션 토큰을 못 찾음, 새 익명 세션으로 폴백")
      }
    }

    const { data: signInData, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn("[supabase] anonymous sign-in failed:", error.message)
      return null
    }
    console.log("[createOrRecoverAnonSession] 새 익명 세션 생성됨:", signInData.user?.id)
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
  concern: Concern
  supportOwned: SupportId[]
  activeIngredients: string[]
  /** 이 프로필이 마지막으로 확인된 엔진 버전 — null이면 이 필드가 생기기 전의 레거시 유저 */
  engineVersion: string | null
  skinType: string | null
  age: string | null
  concernTags: string | null
  overlap: number | null
  tier: string | null
  gender: string | null
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

/** 데이터 수집 동의 + 관심사/보유 성분 + 피부 타입을 diary_profiles에 반영한다 */
export async function saveContextFlags(
  userId: string,
  signupDate: string,
  flags: {
    concern?: string
    supportOwned?: string[]
    dataConsent?: boolean
    activeIngredients?: string[]
    skinType?: string | null
  },
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const updatePayload: Record<string, unknown> = {
    user_id: userId,
    signup_date: signupDate.slice(0, 10),
  }

  if (flags.concern !== undefined) updatePayload.concern = flags.concern
  if (flags.supportOwned !== undefined) updatePayload.support_owned = flags.supportOwned
  if (flags.activeIngredients !== undefined) updatePayload.active_ingredients = flags.activeIngredients
  if (flags.skinType !== undefined) updatePayload.skin_type = flags.skinType

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

/** 체커에서 선택한 피부 타입을 diary_profiles에 반영한다 */
export async function saveSkinType(userId: string, signupDate: string, skinType: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), skin_type: skinType },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveSkinType failed:", error.message)
}

/** 체커에서 선택한 나이대를 diary_profiles에 반영한다 */
export async function saveAge(userId: string, signupDate: string, age: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), age },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveAge failed:", error.message)
}

/** 체커 Q1(성별)에서 선택한 값을 diary_profiles에 반영한다 */
export async function saveGender(userId: string, signupDate: string, gender: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), gender },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveGender failed:", error.message)
}

/** 체커의 beauty_concerns을 diary_profiles.concern_tags에 반영한다 */
export async function saveConcernTags(userId: string, signupDate: string, concernTags: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), concern_tags: concernTags },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveConcernTags failed:", error.message)
}

/** 성분 겹침 개수를 diary_profiles.overlap_count에 반영한다 */
export async function saveOverlap(userId: string, signupDate: string, overlap: number | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), overlap_count: overlap },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveOverlap failed:", error.message)
}

/** 진단 등급을 diary_profiles.tier에 반영한다 */
export async function saveTier(userId: string, signupDate: string, tier: string | null): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), tier },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveTier failed:", error.message)
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

/**
 * 자유입력 카드에 쓴 raw text를 free_input_log에 저장한다. 구조화된 분석 대상이
 * 아니라 그대로 저장만 하는 용도 — 리포트/차트 로직에서 참조하지 않는다.
 */
export async function saveFreeInputLog(userId: string, day: number, content: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("free_input_log").insert({
    user_id: userId,
    day,
    content,
  })
  if (error) console.warn("[supabase] saveFreeInputLog failed:", error.message)
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

export interface RemoteState {
  profile: RemoteProfile
  completedDays: number[]
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
        "signup_date, active_interval_days, bha_interval_days, concern, support_owned, active_ingredients, engine_version, skin_type, age, concern_tags, overlap_count, tier, gender",
      )
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError) {
      console.warn("[supabase] loadRemoteState profile failed:", profileError.message)
      return null
    }
    if (!profile) return null

    const [{ data: calendarRows }, { data: usageLogRows }, { data: conditionLogRows }] = await Promise.all([
      supabase.from("calendar_entries").select("day, completed").eq("user_id", userId),
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

    return {
      profile: {
        signupDate: new Date(profile.signup_date).toISOString(),
        settings: {
          activeIntervalDays: profile.active_interval_days ?? undefined,
          bhaIntervalDays: profile.bha_interval_days ?? undefined,
        },
        concern: (profile.concern as Concern) ?? "none",
        supportOwned: (profile.support_owned as SupportId[] | null) ?? [],
        activeIngredients: (profile.active_ingredients as string[] | null) ?? [],
        engineVersion: profile.engine_version ?? null,
        skinType: (profile.skin_type as string | null) ?? null,
        age: (profile.age as string | null) ?? null,
        concernTags: (profile.concern_tags as string | null) ?? null,
        overlap: (profile.overlap_count as number | null) ?? null,
        tier: (profile.tier as string | null) ?? null,
        gender: (profile.gender as string | null) ?? null,
      },
      completedDays,
      loggedSlots,
      conditions,
    }
  } catch (err) {
    console.warn("[supabase] loadRemoteState threw:", err)
    return null
  }
}
