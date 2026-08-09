"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  checkAnonymousDataLoss,
  consumeOAuthErrorFromURL,
  getLinkedProvider,
  isAnonymousSession,
  linkIdentity,
  signInExistingIdentity,
  signOut,
  type LinkedIdentity,
  type LoginProvider,
} from "@/lib/supabase/auth"
import { ensureAnonSession } from "@/lib/supabase/sync"
import { STORAGE_KEY as DIARY_STORAGE_KEY } from "@/lib/use-diary"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { X } from "lucide-react"

const DISMISSED_KEY = "hoppy-login-banner-dismissed"

/** 로컬 localStorage에 온보딩 완료 데이터가 있는지 확인 */
function hasLocalOnboardingData(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = window.localStorage.getItem(DIARY_STORAGE_KEY)
    if (!raw) return false
    const state = JSON.parse(raw) as any
    return (
      state.settings?.activeIntervalDays !== undefined &&
      state.settings?.bhaIntervalDays !== undefined
    )
  } catch {
    return false
  }
}

/**
 * 13-1/13-2/13-4. 로그인을 강제하지 않는다 — 익명 세션으로도 기존처럼 계속 이용
 * 가능하고, 이 배너는 "기기 바뀌어도 이어보기" 이점을 담백하게 안내만 한다.
 * "회원가입하고 혜택받기!" 류 이벤트성 문구 대신 설명형 문구를 쓴다(원칙 6).
 * 이미 카카오/구글로 연결된 세션이거나, 유저가 닫은 적이 있으면 노출하지 않는다.
 */
export function LoginBanner() {
  const locale = useLocale()
  const PROVIDER_LABEL: Record<LoginProvider, string> = {
    kakao: t("login.provider_label.kakao", locale),
    google: t("login.provider_label.google", locale)
  }
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState<LoginProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** identity_already_exists로 돌아왔을 때만 채워진다 — "연결" 대신 "그 계정으로 로그인" 화면을 보여준다 */
  const [identityConflict, setIdentityConflict] = useState<LoginProvider | null>(null)
  /** 이미 카카오/구글 계정이 연결된 세션이면 채워진다 — "연결 안내" 대신 연결 상태 + 로그아웃을 보여준다 */
  const [linkedIdentity, setLinkedIdentity] = useState<LinkedIdentity | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  /** 익명 세션 데이터 유실 확인 다이얼로그 */
  const [isDataLossDialogOpen, setIsDataLossDialogOpen] = useState(false)
  const [pendingFallbackProvider, setPendingFallbackProvider] = useState<LoginProvider | null>(null)
  const [anonymousDataDetails, setAnonymousDataDetails] = useState<{
    hasProfile: boolean
    entryCount: number
    logCount: number
  } | null>(null)
  /** 로컬 온보딩 데이터가 있는 상태에서 identity_already_exists 발생 시 데이터 유실 확인 다이얼로그 */
  const [confirmLocalDataLossDialogOpen, setConfirmLocalDataLossDialogOpen] = useState(false)
  const [pendingLocalDataLossProvider, setPendingLocalDataLossProvider] = useState<LoginProvider | null>(null)

  useEffect(() => {
    let cancelled = false

    // 이미 다른 유저에 연결된 소셜 계정으로 연결을 시도했다가 에러와 함께 돌아온
    // 경우를 먼저 처리한다 — 이 경우 아래의 일반 "계정 연결 안내" 판정보다 우선한다
    const oauthError = consumeOAuthErrorFromURL()
    if (oauthError) {
      if (oauthError.errorCode === "identity_already_exists" && oauthError.provider) {
        // narrowing한 provider를 변수로 고정 — 클로저 안에서 oauthError.provider를 다시
        // 참조하면 TS가 narrowing을 못 따라가 LoginProvider | null로 되돌아간다
        const provider = oauthError.provider
        // identity_already_exists → 로컬 온보딩 데이터 우선 확인
        if (hasLocalOnboardingData()) {
          // 로컬 데이터가 있으면 사용자 확인 필수 (원격 체크는 스킵)
          setPendingLocalDataLossProvider(provider)
          setConfirmLocalDataLossDialogOpen(true)
          setVisible(true)
        } else {
          // 로컬 데이터가 없으면 기존 원격 체크 로직 (자동 폴백 가능)
          checkAnonymousDataLoss(provider).then(({ hasData, details }) => {
            if (cancelled) return

            // 데이터가 없으면 자동 폴백
            if (!hasData) {
              setError(t("login.message.existing_account_fallback", locale))
              setVisible(true)

              // 1.5초 후 자동 폴백
              setTimeout(() => {
                if (!cancelled) {
                  signInExistingIdentity(provider).then((fallbackResult) => {
                    if (fallbackResult.error) {
                      setError(t("login.error.signin", locale))
                    }
                    // 폴백 성공 시 OAuth 리다이렉트됨
                  })
                }
              }, 1500)
              return
            }

            // 데이터가 있으면 다이얼로그 표시
            setAnonymousDataDetails(details)
            setPendingFallbackProvider(provider)
            setIsDataLossDialogOpen(true)
            setVisible(true)
          }).catch((err) => {
            if (!cancelled) {
              console.warn("[Login Fallback] Error checking data loss:", err)
              // 데이터 확인 실패 시 안전하게 다이얼로그 표시 (데이터가 있을 수도)
              setAnonymousDataDetails({ hasProfile: false, entryCount: 0, logCount: 0 })
              setPendingFallbackProvider(provider)
              setIsDataLossDialogOpen(true)
              setVisible(true)
            }
          })
        }
      } else {
        setError(t("login.error.link", locale))
        setVisible(true)
      }
      return
    }

    // use-diary.ts도 별도로 ensureAnonSession()을 호출하지만, 마운트 순서가 보장되지
    // 않아 이 배너가 먼저 세션 상태를 확인하면 아직 세션이 없어 "익명 아님"으로
    // 잘못 판정될 수 있다. ensureAnonSession()은 이미 세션이 있으면 그대로 반환하는
    // 멱등 함수라 여기서 먼저 호출해도 안전하다.
    ensureAnonSession().then(async () => {
      if (cancelled) return

      // 연결된 계정이 있으면 "닫기"로 숨긴 적이 있어도 항상 보여준다 — 이건 안내 배너가
      // 아니라 현재 로그인 상태를 알려주는 정보 표시라 dismiss 대상이 아니다.
      const identity = await getLinkedProvider()
      if (cancelled) return
      if (identity) {
        setLinkedIdentity(identity)
        setVisible(true)
        return
      }

      const dismissed = typeof window !== "undefined" && window.localStorage.getItem(DISMISSED_KEY) === "1"
      if (dismissed) return
      const anonymous = await isAnonymousSession()
      if (!cancelled && anonymous) setVisible(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setIdentityConflict(null)
    setError(null)
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      // 저장 실패는 무시
    }
  }

  async function handleLogin(provider: LoginProvider) {
    setError(null)
    setPending(provider)
    const result = await linkIdentity(provider)
    // linkIdentity 성공 시 OAuth 제공자로 리다이렉트되므로 이후 코드는 실행되지 않음.
    // 실패 시 콜백 URL의 에러 파라미터로 돌아와 useEffect에서 처리됨.
    if (result.error) {
      setPending(null)
      setError(t("login.error.link_conflict", locale))
    }
  }

  // 사용자가 다이얼로그에서 "계속"을 클릭했을 때
  async function handleConfirmFallback() {
    if (!pendingFallbackProvider) return

    setIsDataLossDialogOpen(false)
    setPending(pendingFallbackProvider)

    // 자동 폴백 진행
    const fallbackResult = await signInExistingIdentity(pendingFallbackProvider)

    if (fallbackResult.error) {
      setPending(null)
      setError(t("login.error.signin", locale))
    }
    // 폴백 성공 시 OAuth 리다이렉트됨
  }

  // 사용자가 다이얼로그에서 "취소"를 클릭했을 때
  function handleCancelFallback() {
    setIsDataLossDialogOpen(false)
    setPendingFallbackProvider(null)
    setAnonymousDataDetails(null)
    setError(null)
    // 원래 화면으로 돌아감 (데이터는 익명 세션에 그대로 남음)
  }

  // 로컬 온보딩 데이터가 있는 상태에서 identity_already_exists 발생 시 사용자 확인 후 폴백
  async function handleConfirmLocalDataLoss() {
    if (!pendingLocalDataLossProvider) return

    setConfirmLocalDataLossDialogOpen(false)
    setPending(pendingLocalDataLossProvider)

    // 폴백 진행
    const fallbackResult = await signInExistingIdentity(pendingLocalDataLossProvider)

    if (fallbackResult.error) {
      setPending(null)
      setError(t("login.error.signin", locale))
    }
    // 폴백 성공 시 OAuth 리다이렉트됨
  }

  // 로컬 온보딩 데이터 유실 확인 다이얼로그에서 "취소" 클릭
  function handleCancelLocalDataLoss() {
    setConfirmLocalDataLossDialogOpen(false)
    setPendingLocalDataLossProvider(null)
    setError(null)
    // 원래 화면으로 돌아감 (로컬 데이터는 현재 세션에 그대로 남음)
  }

  async function handleUseExisting() {
    if (!identityConflict) return
    setError(null)
    setPending(identityConflict)
    const result = await signInExistingIdentity(identityConflict)
    setPending(null)
    if (result.error) setError(t("login.error.signin", locale))
  }

  async function handleSignOut() {
    setError(null)
    setSigningOut(true)
    const result = await signOut()
    if (result.error) {
      setSigningOut(false)
      setError(t("login.error.signout", locale))
      return
    }
    // 로그아웃 자체는 세션만 종료할 뿐 로컬 캐시는 그대로 남아있어, 다음 방문 시 새
    // 익명 세션인데도 화면에는 방금 로그아웃한 계정의 기록이 그대로 보이는 혼란이
    // 생긴다. 로컬 캐시를 지우고 새로고침해 깨끗한 익명 상태로 되돌린다 — 원래
    // 계정으로 다시 연결하면 loadRemoteState()가 그 기록을 복원해준다.
    try {
      window.localStorage.removeItem(DIARY_STORAGE_KEY)
      window.localStorage.removeItem(DISMISSED_KEY)
    } catch {
      // 저장 실패는 무시
    }
    window.location.reload()
  }

  if (!visible) return null

  if (linkedIdentity) {
    const label = PROVIDER_LABEL[linkedIdentity.provider]
    const statusText = linkedIdentity.nickname
      ? interpolate(t("login.linked.with_nickname", locale), { nickname: linkedIdentity.nickname, provider: label })
      : interpolate(t("login.linked.without_nickname", locale), { provider: label })
    return (
      <section className="flex items-center justify-between gap-3 rounded-4xl bg-card px-[22px] py-4 ring-1 ring-border" aria-label={t("login.linked.ariaLabel", locale)}>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {statusText}
          </p>
          {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="shrink-0 rounded-full"
        >
          {signingOut ? t("login.button.signout_pending", locale) : t("login.button.signout", locale)}
        </Button>
      </section>
    )
  }

  if (identityConflict) {
    const label = PROVIDER_LABEL[identityConflict]
    return (
      <section className="rounded-4xl bg-card px-[22px] py-5 ring-1 ring-border" aria-label={t("login.conflict.ariaLabel", locale)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-foreground">
              {interpolate(t("login.conflict.title", locale), { provider: label })}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {interpolate(t("login.conflict.description", locale), { provider: label })}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("login.button.close", locale)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="mt-3">
          <Button type="button" onClick={handleUseExisting} disabled={pending !== null} className="w-full rounded-full">
            {pending === identityConflict
              ? t("login.button.signin_existing_pending", locale)
              : interpolate(t("login.button.signin_existing", locale), { provider: label })}
          </Button>
        </div>

        {error && <p className="mt-2 text-center text-xs font-medium text-destructive">{error}</p>}
      </section>
    )
  }

  return (
    <>
      <section className="rounded-4xl bg-card px-[22px] py-5 ring-1 ring-border" aria-label={t("login.connect.ariaLabel", locale)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-foreground">{t("login.connect.title", locale)}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("login.connect.description", locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("login.button.close", locale)}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => handleLogin("kakao")}
          disabled={pending !== null}
          className="w-full rounded-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90"
        >
          {pending === "kakao" ? t("login.button.kakao_pending", locale) : t("login.button.kakao", locale)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleLogin("google")}
          disabled={pending !== null}
          className="w-full rounded-full"
        >
          {pending === "google" ? t("login.button.google_pending", locale) : t("login.button.google", locale)}
        </Button>
      </div>

      {error && <p className="mt-2 text-center text-xs font-medium text-destructive">{error}</p>}
      </section>

      {isDataLossDialogOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg ring-1 ring-border">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">
              {t("login.dialog.title", locale)}
            </h3>
          </div>

          <div className="px-6 py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              {t("login.dialog.description", locale)}
            </p>

            {anonymousDataDetails && (
              <div className="mb-4 space-y-2 rounded-lg bg-muted/50 p-3">
                {anonymousDataDetails.hasProfile && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("login.dialog.data_summary.profile", locale)}
                    </span>
                    <span className="font-medium text-foreground">●</span>
                  </div>
                )}
                {anonymousDataDetails.entryCount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("login.dialog.data_summary.entries", locale)}
                    </span>
                    <span className="font-medium text-foreground">
                      {anonymousDataDetails.entryCount}
                    </span>
                  </div>
                )}
                {anonymousDataDetails.logCount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("login.dialog.data_summary.logs", locale)}
                    </span>
                    <span className="font-medium text-foreground">
                      {anonymousDataDetails.logCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border px-6 py-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelFallback}
                className="flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("login.dialog.button.cancel", locale)}
              </button>
              <button
                type="button"
                onClick={handleConfirmFallback}
                disabled={pending !== null}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t("login.dialog.button.continue", locale)}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {confirmLocalDataLossDialogOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg ring-1 ring-border">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-base font-semibold text-foreground">
              {interpolate(t("login.localDataLossDialog.title", locale), {
                provider: pendingLocalDataLossProvider === "kakao" ? t("login.provider_label.kakao", locale) : t("login.provider_label.google", locale),
              })}
            </h3>
          </div>

          <div className="px-6 py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              {interpolate(t("login.localDataLossDialog.description", locale), {
                provider: pendingLocalDataLossProvider === "kakao" ? t("login.provider_label.kakao", locale) : t("login.provider_label.google", locale),
              })}
            </p>
          </div>

          <div className="border-t border-border px-6 py-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelLocalDataLoss}
                className="flex-1 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("login.localDataLossDialog.cancel", locale)}
              </button>
              <button
                type="button"
                onClick={handleConfirmLocalDataLoss}
                disabled={pending !== null}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pending === pendingLocalDataLossProvider ? t("login.localDataLossDialog.continuing", locale) : t("login.localDataLossDialog.continue", locale)}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}
