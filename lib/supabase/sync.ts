import { getSupabaseClient } from "@/lib/supabase/client"
import type { RecipeType } from "@/lib/schedule"
import type {
  BarrierScorePoint,
  CalendarEntry,
  DiagnosisInput,
  IncidentLogEntry,
  IncidentType,
  ReactionLogEntry,
  SkinType,
  Tier,
} from "@/lib/scheduling-engine"
import type { Concern, SupportId } from "@/lib/routine-copy"

/**
 * Supabase 연동. 이 모듈의 모든 함수는 실패해도(오프라인, 마이그레이션 미적용 등)
 * 앱이 계속 동작해야 하므로 예외를 던지지 않고 콘솔 경고 후 조용히 무시한다.
 * localStorage가 여전히 1차 캐시이고, Supabase는 기기 간 복원을 위한 백엔드다.
 */

/** 익명 세션을 보장하고 auth.uid()를 반환한다. Supabase가 설정되지 않았으면 null */
export async function ensureAnonSession(): Promise<string | null> {
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

interface RemoteProfile {
  signupDate: string
  diagnosis: DiagnosisInput | null
  pregnant: boolean
  prescriptionMeds: boolean
  concern: Concern
  supportOwned: SupportId[]
}

/** 진단 결과 + 가입일을 diary_profiles에 upsert한다 */
export async function saveDiagnosis(userId: string, signupDate: string, diagnosis: DiagnosisInput, tier: Tier): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    {
      user_id: userId,
      signup_date: signupDate.slice(0, 10),
      overlap_count: diagnosis.overlapCount,
      irritation_reported: diagnosis.irritationReported,
      skin_type: diagnosis.skinType,
      symptom: diagnosis.symptom ?? null,
      tier: String(tier),
    },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveDiagnosis failed:", error.message)
}

/** 9-1. 임신/처방약 플래그를 diary_profiles에 반영한다 */
export async function saveContextFlags(userId: string, signupDate: string, pregnant: boolean, prescriptionMeds: boolean): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), pregnant, prescription_meds: prescriptionMeds },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveContextFlags failed:", error.message)
}

/** rest/moist 문구에 강조할 관심사 + 보유 성분을 diary_profiles에 반영한다 */
export async function saveConcern(userId: string, signupDate: string, concern: Concern, supportOwned: SupportId[]): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from("diary_profiles").upsert(
    { user_id: userId, signup_date: signupDate.slice(0, 10), concern, support_owned: supportOwned },
    { onConflict: "user_id" },
  )
  if (error) console.warn("[supabase] saveConcern failed:", error.message)
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
}

/**
 * 새 기기/브라우저에서 기존 진단 데이터를 복원할 때 쓴다. diary_profiles가 없으면
 * (한 번도 진단하지 않은 유저) null을 반환하고, 앱은 기존처럼 로컬/URL 파라미터 흐름을 탄다.
 */
export async function loadRemoteState(userId: string): Promise<RemoteState | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data: profile, error: profileError } = await supabase
      .from("diary_profiles")
      .select("signup_date, overlap_count, irritation_reported, skin_type, symptom, pregnant, prescription_meds, concern, support_owned")
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError) {
      console.warn("[supabase] loadRemoteState profile failed:", profileError.message)
      return null
    }
    if (!profile) return null

    const [{ data: calendarRows }, { data: incidentRows }, { data: reactionRows }] = await Promise.all([
      supabase.from("calendar_entries").select("day, completed").eq("user_id", userId),
      supabase.from("incident_log").select("day, incident_type, resumes_normal_at_day").eq("user_id", userId),
      supabase.from("reaction_log").select("day, category, delayed_to_day").eq("user_id", userId),
    ])

    const completedDays = (calendarRows ?? []).filter((row) => row.completed).map((row) => row.day)

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

    const diagnosis: DiagnosisInput | null =
      profile.overlap_count === null || profile.skin_type === null
        ? null
        : {
            overlapCount: profile.overlap_count,
            irritationReported: profile.irritation_reported ?? false,
            skinType: profile.skin_type as SkinType,
            symptom: profile.symptom ?? undefined,
          }

    return {
      profile: {
        signupDate: new Date(profile.signup_date).toISOString(),
        diagnosis,
        pregnant: profile.pregnant ?? false,
        prescriptionMeds: profile.prescription_meds ?? false,
        concern: (profile.concern as Concern) ?? "none",
        supportOwned: (profile.support_owned as SupportId[] | null) ?? [],
      },
      completedDays,
      events,
    }
  } catch (err) {
    console.warn("[supabase] loadRemoteState threw:", err)
    return null
  }
}
