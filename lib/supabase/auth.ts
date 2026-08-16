import { getSupabaseClient } from "@/lib/supabase/client"

/** 13-1. 이메일+비밀번호는 도입하지 않는다 — 카카오·구글 OAuth만 지원한다 */
export type LoginProvider = "kakao" | "google"

/**
 * linkIdentity()가 어느 provider로 연결을 시도했는지 기록해둔다. Supabase는 이 소셜
 * 계정이 이미 다른 유저에 연결돼 있으면 콜백 이후 우리 앱으로 에러 리다이렉트만 보내고
 * "어느 provider였는지"는 알려주지 않으므로, 리다이렉트 전에 직접 남겨서 돌아온 뒤
 * consumeOAuthErrorFromURL()에서 다시 읽는다.
 */
const LINK_ATTEMPT_KEY = "hoppy-oauth-link-attempt"

function rememberLinkAttempt(provider: LoginProvider) {
  try {
    window.sessionStorage.setItem(LINK_ATTEMPT_KEY, provider)
  } catch {
    // 저장 실패는 무시
  }
}

/**
 * OAuth 리다이렉트로 나가기 직전에 남겨두는 표시. useDiary 하이드레이션 effect가 돌아온
 * 페이지에서 consumeLoginPendingFlag()로 읽어 "방금 로그인 플로우를 마치고 돌아왔는지"를
 * 판단한다. linkIdentity()로 첫 연결에 성공하는 가장 흔한 경우 익명 세션의 userId가 그대로
 * 유지되어 소유자 비교(ownerMatches)가 항상 true가 되고, 그러면 원격 fetch 자체가 없어
 * justRestoredFromRemote가 "원격 데이터를 실제로 복원했는지"만 보고 있으면 절대 true가
 * 되지 않는다 — 그 결과 로그인 성공 직후에도 커버 화면이 매번 다시 뜬다. 이 플래그로
 * "원격 fetch 여부"와 무관하게 "로그인 직후"를 직접 판별한다.
 */
const LOGIN_PENDING_KEY = "hoppy-oauth-login-pending"

function rememberLoginPending() {
  try {
    window.sessionStorage.setItem(LOGIN_PENDING_KEY, "1")
  } catch {
    // 저장 실패는 무시
  }
}

function clearLoginPending() {
  try {
    window.sessionStorage.removeItem(LOGIN_PENDING_KEY)
  } catch {
    // 무시
  }
}

/** 로그인 플로우에서 돌아온 페이지에서 한 번만 소비한다 — 읽자마자 지워서 이후
 * 새로고침에는 영향을 주지 않는다. */
export function consumeLoginPendingFlag(): boolean {
  if (typeof window === "undefined") return false
  try {
    const pending = window.sessionStorage.getItem(LOGIN_PENDING_KEY) === "1"
    window.sessionStorage.removeItem(LOGIN_PENDING_KEY)
    return pending
  } catch {
    return false
  }
}

/**
 * URL에 OAuth 에러 파라미터가 있는지만 확인한다(소비하지 않고 지우지도 않음 —
 * consumeOAuthErrorFromURL()이 별도로 그 역할을 한다). consumeLoginPendingFlag()와
 * 같이 써서 "로그인이 에러로 돌아온 경우"를 "로그인 직후" 판정에서 제외하기 위한 용도다.
 * LoginBanner는 커버/온보딩을 지나야만 마운트되므로 그 안의 consumeOAuthErrorFromURL()에
 * 기대지 않고 useDiary 하이드레이션에서 직접 확인해야 순서 문제가 없다.
 */
export function hasOAuthErrorInURL(): boolean {
  if (typeof window === "undefined") return false
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const searchParams = new URLSearchParams(window.location.search)
  return Boolean(searchParams.get("error_code") ?? hashParams.get("error_code"))
}

/**
 * 13-2. 현재 익명 세션(Supabase Anonymous Auth)을 카카오/구글 영구 계정에 그대로
 * 연결한다(identity linking). user_id가 로그인 전후로 동일하게 유지되므로 별도
 * 데이터 마이그레이션이 필요 없다 — "회원가입"이 아니라 "지금 쓰던 세션에 계정 연결".
 *
 * Supabase 대시보드에서 "Enable Manual Linking"과 카카오/구글 OAuth Provider가
 * 미리 설정돼 있어야 동작한다. 설정 전에는 error가 채워진 결과를 반환한다.
 *
 * 이 소셜 계정이 이미 다른 유저에 연결돼 있으면(identity_already_exists) 이 함수
 * 자체는 에러 없이 리다이렉트를 시작하고, 실패는 콜백 이후 돌아온 URL에 담겨서
 * consumeOAuthErrorFromURL()로 감지된다 — signInExistingIdentity() 참고.
 */
export async function linkIdentity(provider: LoginProvider): Promise<{ error: string | null; code?: string }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: "Supabase가 설정되지 않았습니다." }

  if (typeof window !== "undefined") rememberLinkAttempt(provider)
  if (typeof window !== "undefined") rememberLoginPending()

  // origin만 넘긴다(경로·쿼리 제외) — 진단 파라미터가 URL에 남아있으면 매번 다른
  // redirectTo 값이 되어 Supabase의 Redirect URLs 허용 목록과 정확히 일치하지 않을 수
  // 있고, 그러면 Supabase가 조용히 Site URL(기본값 localhost)로 대체해버린다. 진단은
  // 이 시점에 이미 로컬/원격에 저장돼 있으므로 origin만으로도 복귀 후 상태 복원에 문제없다.
  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  })

  if (error) {
    console.warn(`[supabase] linkIdentity(${provider}) failed:`, error.message)
    clearLoginPending()
    return { error: error.message, code: (error as any).code }
  }
  // 성공하면 브라우저가 곧바로 OAuth 제공자로 리다이렉트되므로 이 반환값이 쓰일 일은 거의 없다
  return { error: null }
}

/**
 * identity_already_exists 폴백. 이 소셜 계정이 이미 다른(영구) 유저에 연결돼 있을 때,
 * 지금 세션에 "연결"하는 대신 그 기존 계정으로 그냥 "로그인"한다. 익명 세션에 로컬로
 * 쌓인 기록은 그 계정으로 옮겨지지 않는다 — 이건 데이터 병합이 아니라 "이미 있는
 * 계정으로 갈아타기"이므로, 호출하는 쪽에서 그 사실을 먼저 안내해야 한다.
 */
export async function signInExistingIdentity(provider: LoginProvider): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: "Supabase가 설정되지 않았습니다." }

  // 익명 세션이 남아있는 채로 signInWithOAuth()를 호출하면 GoTrue가 "지금 세션에
  // 연결 시도"로 취급해 identity_already_exists 충돌이 재발할 수 있다 — Supabase
  // 권장대로 먼저 로그아웃해 세션을 비운 뒤 독립적인 로그인으로 처리되게 한다.
  // signOut()은 세션만 종료할 뿐 로컬 다이어리 데이터(hoppy-skin-diary-v1)는
  // 건드리지 않는다 — 호출 전에 이미 사용자 확인(데이터 유실 다이얼로그)을 받았으므로
  // 여기서 로컬 데이터를 지울 이유도 없다.
  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) {
    console.warn(`[supabase] signOut before signInExistingIdentity(${provider}) failed:`, signOutError.message)
    // 실패해도 로그인 시도 자체는 계속 진행 — 최선 노력 수준의 정리 단계일 뿐
  }

  if (typeof window !== "undefined") rememberLoginPending()

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  })

  if (error) {
    console.warn(`[supabase] signInWithOAuth(${provider}) failed:`, error.message)
    clearLoginPending()
    return { error: error.message }
  }
  return { error: null }
}

export interface OAuthErrorResult {
  errorCode: string
  /** rememberLinkAttempt()로 남겨둔, 이 에러를 유발한 linkIdentity() 시도의 provider (알 수 없으면 null) */
  provider: LoginProvider | null
}

/**
 * OAuth 콜백에서 돌아온 URL에 에러가 있으면 읽어서 반환한다. Supabase 클라이언트
 * 자신도 해시/쿼리 양쪽을 다 확인하므로(쿼리가 우선) 동일한 방식으로 파싱한다.
 * 한 번 읽고 나면 URL에서 에러 파라미터를 지운다 — 새로고침해도 같은 처리가 반복되지
 * 않도록 하기 위함이다.
 */
export function consumeOAuthErrorFromURL(): OAuthErrorResult | null {
  if (typeof window === "undefined") return null

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const searchParams = new URLSearchParams(window.location.search)
  const errorCode = searchParams.get("error_code") ?? hashParams.get("error_code")
  if (!errorCode) return null

  // 로그인이 에러와 함께 돌아온 것 — rememberLoginPending()으로 남겨둔 표시는 여기서
  // 무효화한다. 안 지우면 (예: identity_already_exists로 대화상자만 뜨고 아직 실제
  // 로그인은 안 끝난 상태에서) useDiary 하이드레이션이 "로그인 직후"로 잘못 판단해
  // 커버를 성급히 건너뛴다.
  clearLoginPending()

  let provider: LoginProvider | null = null
  try {
    const attempted = window.sessionStorage.getItem(LINK_ATTEMPT_KEY)
    if (attempted === "kakao" || attempted === "google") provider = attempted
    window.sessionStorage.removeItem(LINK_ATTEMPT_KEY)
  } catch {
    // 무시
  }

  for (const key of ["error", "error_code", "error_description"]) {
    searchParams.delete(key)
  }
  const query = searchParams.toString()
  window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""))

  return { errorCode, provider }
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

export interface LinkedIdentity {
  provider: LoginProvider
  /** 카카오/구글이 넘겨준 프로필 닉네임(표시 이름). 필드가 없으면 null — 화면에서는 이 경우 닉네임 없이 표시한다 */
  nickname: string | null
}

/** identity_data에서 표시용 닉네임을 뽑아낸다. 카카오는 kakao_account.profile.nickname이
 * gotrue에서 name으로 매핑되고, 구글은 보통 name/full_name에 담긴다 — provider마다 실제
 * 응답 키가 조금씩 달라 여러 후보를 순서대로 시도한다. */
function extractNickname(identityData: Record<string, unknown> | undefined): string | null {
  if (!identityData) return null
  for (const key of ["name", "full_name", "nickname", "preferred_username", "user_name"]) {
    const value = identityData[key]
    if (typeof value === "string" && value.trim().length > 0) return value
  }
  return null
}

/** 현재 세션에 연결된 카카오/구글 identity가 있으면 그 provider와 닉네임을, 없으면(익명) null을 반환한다 */
export async function getLinkedProvider(): Promise<LinkedIdentity | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data } = await supabase.auth.getSession()
    const identities = data.session?.user.identities ?? []
    const linked = identities.find((identity) => identity.provider === "kakao" || identity.provider === "google")
    if (!linked) return null
    return { provider: linked.provider as LoginProvider, nickname: extractNickname(linked.identity_data) }
  } catch (err) {
    console.warn("[supabase] getLinkedProvider threw:", err)
    return null
  }
}

/** 현재 세션을 로그아웃한다. 연결된 계정의 기록은 Supabase에 그대로 남아있고, 같은 계정으로 다시
 * 연결하면 loadRemoteState()가 복원한다 — 이 함수는 세션만 종료할 뿐 데이터를 지우지 않는다. */
export async function signOut(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: "Supabase가 설정되지 않았습니다." }

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.warn("[supabase] signOut failed:", error.message)
    return { error: error.message }
  }
  return { error: null }
}

/** 익명 세션에서 쌓인 데이터 확인. linkIdentity 실패 시 signInExistingIdentity로 폴백할 때,
 * 데이터 유실 여부를 판단하는 데 사용한다. 데이터가 있으면 사용자 확인을 요청하는 다이얼로그를 띄울 수 있다. */
export async function checkAnonymousDataLoss(
  provider: LoginProvider
): Promise<{
  hasData: boolean
  details: {
    hasProfile: boolean
    entryCount: number
    logCount: number
  }
}> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return { hasData: false, details: { hasProfile: false, entryCount: 0, logCount: 0 } }
  }

  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user?.id

    if (!userId) {
      return { hasData: false, details: { hasProfile: false, entryCount: 0, logCount: 0 } }
    }

    // 현재 익명 세션의 주요 데이터 존재 여부 확인
    const [profileResult, entriesResult, logsResult] = await Promise.all([
      supabase.from("diary_profiles").select("created_at").eq("user_id", userId).single(),
      supabase.from("calendar_entries").select("count()").eq("user_id", userId).single(),
      supabase.from("condition_log").select("count()").eq("user_id", userId).single(),
    ])

    const hasProfile = profileResult.data !== null
    const entryCount = (profileResult.data as any)?.count || entriesResult.data?.count || 0
    const logCount = (logsResult.data as any)?.count || 0
    const hasData = hasProfile || entryCount > 0 || logCount > 0

    // 데이터가 있으면 경고 로그 남기기
    if (hasData) {
      console.warn(
        `[Login Fallback] Potential data loss: Anonymous session will be lost when switching to existing account. ` +
          `Provider=${provider}, UserId=${userId}, ` +
          `diary_profile=${hasProfile}, calendar_entries=${entryCount}, condition_logs=${logCount}`
      )
    }

    return {
      hasData,
      details: { hasProfile, entryCount, logCount },
    }
  } catch (err) {
    console.warn(`[Login Fallback] Failed to check anonymous data:`, err)
    // 에러가 나면 데이터가 있을 수도 있으니 안전하게 true 반환
    return { hasData: true, details: { hasProfile: false, entryCount: 0, logCount: 0 } }
  }
}
