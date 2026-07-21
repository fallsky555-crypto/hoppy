import { getSupabaseClient } from "@/lib/supabase/client"

/** 13-1. 이메일+비밀번호는 도입하지 않는다 — 카카오·구글 OAuth만 지원한다 */
export type LoginProvider = "kakao" | "google"

/**
 * 13-2. 현재 익명 세션(Supabase Anonymous Auth)을 카카오/구글 영구 계정에 그대로
 * 연결한다(identity linking). user_id가 로그인 전후로 동일하게 유지되므로 별도
 * 데이터 마이그레이션이 필요 없다 — "회원가입"이 아니라 "지금 쓰던 세션에 계정 연결".
 *
 * Supabase 대시보드에서 "Enable Manual Linking"과 카카오/구글 OAuth Provider가
 * 미리 설정돼 있어야 동작한다. 설정 전에는 error가 채워진 결과를 반환한다.
 */
export async function linkIdentity(provider: LoginProvider): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: "Supabase가 설정되지 않았습니다." }

  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: typeof window !== "undefined" ? window.location.href : undefined },
  })

  if (error) {
    console.warn(`[supabase] linkIdentity(${provider}) failed:`, error.message)
    return { error: error.message }
  }
  // 성공하면 브라우저가 곧바로 OAuth 제공자로 리다이렉트되므로 이 반환값이 쓰일 일은 거의 없다
  return { error: null }
}

/** 현재 세션이 아직 영구 계정에 연결되지 않은 익명 세션인지 확인한다 */
export async function isAnonymousSession(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.is_anonymous ?? false
  } catch (err) {
    console.warn("[supabase] isAnonymousSession threw:", err)
    return false
  }
}
