"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  consumeOAuthErrorFromURL,
  isAnonymousSession,
  linkIdentity,
  signInExistingIdentity,
  type LoginProvider,
} from "@/lib/supabase/auth"
import { ensureAnonSession } from "@/lib/supabase/sync"
import { X } from "lucide-react"

const DISMISSED_KEY = "hoppy-login-banner-dismissed"
const PROVIDER_LABEL: Record<LoginProvider, string> = { kakao: "카카오", google: "Google" }

/**
 * 13-1/13-2/13-4. 로그인을 강제하지 않는다 — 익명 세션으로도 기존처럼 계속 이용
 * 가능하고, 이 배너는 "기기 바뀌어도 이어보기" 이점을 담백하게 안내만 한다.
 * "회원가입하고 혜택받기!" 류 이벤트성 문구 대신 설명형 문구를 쓴다(원칙 6).
 * 이미 카카오/구글로 연결된 세션이거나, 유저가 닫은 적이 있으면 노출하지 않는다.
 */
export function LoginBanner() {
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState<LoginProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** identity_already_exists로 돌아왔을 때만 채워진다 — "연결" 대신 "그 계정으로 로그인" 화면을 보여준다 */
  const [identityConflict, setIdentityConflict] = useState<LoginProvider | null>(null)

  useEffect(() => {
    let cancelled = false

    // 이미 다른 유저에 연결된 소셜 계정으로 연결을 시도했다가 에러와 함께 돌아온
    // 경우를 먼저 처리한다 — 이 경우 아래의 일반 "계정 연결 안내" 판정보다 우선한다
    const oauthError = consumeOAuthErrorFromURL()
    if (oauthError) {
      if (oauthError.errorCode === "identity_already_exists" && oauthError.provider) {
        setIdentityConflict(oauthError.provider)
      } else {
        setError("계정을 연결하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.")
      }
      setVisible(true)
      return
    }

    const dismissed = typeof window !== "undefined" && window.localStorage.getItem(DISMISSED_KEY) === "1"
    if (dismissed) return

    // use-diary.ts도 별도로 ensureAnonSession()을 호출하지만, 마운트 순서가 보장되지
    // 않아 이 배너가 먼저 세션 상태를 확인하면 아직 세션이 없어 "익명 아님"으로
    // 잘못 판정될 수 있다. ensureAnonSession()은 이미 세션이 있으면 그대로 반환하는
    // 멱등 함수라 여기서 먼저 호출해도 안전하다.
    ensureAnonSession()
      .then(() => isAnonymousSession())
      .then((anonymous) => {
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
    if (result.error) setError("지금은 계정을 연결할 수 없어요. 잠시 후 다시 시도해주세요.")
  }

  async function handleUseExisting() {
    if (!identityConflict) return
    setError(null)
    setPending(identityConflict)
    const result = await signInExistingIdentity(identityConflict)
    setPending(null)
    if (result.error) setError("지금은 로그인할 수 없어요. 잠시 후 다시 시도해주세요.")
  }

  if (!visible) return null

  if (identityConflict) {
    const label = PROVIDER_LABEL[identityConflict]
    return (
      <section className="rounded-4xl bg-secondary/60 p-4 ring-1 ring-border" aria-label="이미 연결된 계정 안내">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-foreground">이미 연결된 {label} 계정이에요</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              이 {label} 계정은 이미 다른 기기에서 연결돼 있어요. 그 계정으로 로그인하면 지금 이 브라우저의 기록
              대신 그 계정에 저장된 기록을 보게 돼요.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="mt-3">
          <Button type="button" onClick={handleUseExisting} disabled={pending !== null} className="w-full rounded-full">
            {pending === identityConflict ? "로그인하는 중이에요..." : `그 ${label} 계정으로 로그인`}
          </Button>
        </div>

        {error && <p className="mt-2 text-center text-xs font-medium text-destructive">{error}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-4xl bg-secondary/60 p-4 ring-1 ring-border" aria-label="계정 연결 안내">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold text-foreground">기기가 바뀌어도 기록을 이어가시려면</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            지금 쓰던 기록은 그대로 두고, 계정만 연결해두면 다른 기기에서도 이어서 볼 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="닫기"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => handleLogin("kakao")}
          disabled={pending !== null}
          className="w-full rounded-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90"
        >
          {pending === "kakao" ? "연결하는 중이에요..." : "카카오로 계속하기"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleLogin("google")}
          disabled={pending !== null}
          className="w-full rounded-full"
        >
          {pending === "google" ? "연결하는 중이에요..." : "Google로 계속하기"}
        </Button>
      </div>

      {error && <p className="mt-2 text-center text-xs font-medium text-destructive">{error}</p>}
    </section>
  )
}
