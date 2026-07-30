"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
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

  useEffect(() => {
    let cancelled = false

    // 이미 다른 유저에 연결된 소셜 계정으로 연결을 시도했다가 에러와 함께 돌아온
    // 경우를 먼저 처리한다 — 이 경우 아래의 일반 "계정 연결 안내" 판정보다 우선한다
    const oauthError = consumeOAuthErrorFromURL()
    if (oauthError) {
      if (oauthError.errorCode === "identity_already_exists" && oauthError.provider) {
        setIdentityConflict(oauthError.provider)
      } else {
        setError(t("login.error.link", locale))
      }
      setVisible(true)
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
    setPending(null)
    if (result.error) setError(t("login.error.link_conflict", locale))
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
  )
}
