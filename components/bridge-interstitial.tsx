"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import type { Locale } from "@/lib/i18n"
import { t, interpolate } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function getPrivacyPolicyUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/privacy-policy.html"
    : "https://myroutinediet.com/privacy-policy-en.html"
}

// Concern별 추천 성분 매핑
const CONCERN_INGREDIENT_MAP: Record<string, string> = {
  dry: "히알루론산",       // 건조: 보습
  flush: "시카",          // 홍조: 진정
  flaky: "나이아신아마이드", // 각질: 부드러운 관리
  trouble: "시카",        // 트러블: 진정
  none: "히알루론산",     // 기본: 보습
}

export function BridgeInterstitial() {
  const locale = useLocale()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [userConcern, setUserConcern] = useState("")
  const [userNickname, setUserNickname] = useState("")
  const [supportOwned, setSupportOwned] = useState<string[]>([])
  const [consentChecked, setConsentChecked] = useState(false)
  const consentRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log("[BridgeInterstitial] mounting...")
    setMounted(true)

    const seen = localStorage.getItem("hoppy-bridge-seen")
    console.log("[BridgeInterstitial] hoppy-bridge-seen:", seen)

    if (seen) {
      console.log("[BridgeInterstitial] already seen, returning")
      return
    }

    console.log("[BridgeInterstitial] setting show = true")
    setShow(true)

    const profile = localStorage.getItem("hoppy-profile")
    if (profile) {
      try {
        const parsed = JSON.parse(profile)
        setUserName(parsed.name || "")
        setUserNickname(parsed.nickname || "")
        setSupportOwned(parsed.support_owned || [])
      } catch {}
    }

    const checkerResult = localStorage.getItem("hoppy-checker-result")
    if (checkerResult) {
      try {
        const parsed = JSON.parse(checkerResult)
        setUserConcern(parsed.concern || "")
      } catch {}
    }
  }, [])

  const handleStep0Proceed = () => {
    if (consentRef.current?.checked) {
      setStep(1)
    }
  }

  const handleStep1Proceed = () => {
    handleDismiss()
  }

  const handleDismiss = () => {
    localStorage.setItem("hoppy-bridge-seen", "true")
    setShow(false)
  }

  if (!mounted) {
    return <div suppressHydrationWarning />
  }

  if (!show) {
    return null
  }

  return (
    <>
      {step === 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* 배경 이미지 (max-w-md 안) */}
          <div
            className="absolute inset-0 z-0 w-full max-w-md mx-auto"
            style={{
              backgroundImage: 'url(/journal/cover-bg.png?v=2)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* 투명 오버레이 */}
          <div className="absolute inset-0 z-0 bg-black/20" />

          {/* 콘텐츠 래퍼 */}
          <div className="relative z-10 flex flex-col w-full max-w-md mx-auto px-6 pt-12 pb-8">
            {/* 상단 콘텐츠 */}
            <div className="flex flex-col items-center text-center gap-6">
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {t("bridgeInterstitial.step1.label", locale)}
              </p>

              <h1 className="text-3xl font-display font-bold text-white whitespace-pre-line leading-tight">
                {t("bridgeInterstitial.step1.title", locale)}
              </h1>
            </div>

            {/* 하단 고정 바 */}
            <div className="mt-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group" onClick={() => setConsentChecked(!consentChecked)}>
                <input
                  ref={consentRef}
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-5 h-5 rounded border border-white/50 bg-white/10 checked:bg-white checked:border-white accent-black mt-0.5 flex-shrink-0"
                />
                <div className="text-xs text-white/70 group-hover:text-white/80 transition-colors">
                  <p className="font-semibold">
                    {t("bridgeInterstitial.step1.consent_label", locale)}
                  </p>
                  <a
                    href={getPrivacyPolicyUrl(locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-white/60 underline hover:text-white/80 transition-colors"
                  >
                    {t("bridgeInterstitial.step1.consent_link", locale)}
                  </a>
                </div>
              </label>

              <button
                onClick={handleStep0Proceed}
                disabled={!consentChecked}
                className={cn(
                  "w-full px-6 py-3 rounded-full font-semibold transition-all",
                  consentChecked
                    ? "bg-white text-black hover:bg-white/90 active:scale-95"
                    : "bg-white/40 text-white/60 cursor-not-allowed"
                )}
              >
                {t("bridgeInterstitial.step1.button", locale)}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-y-auto">
          <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-6">
            {/* 타이틀 섹션 */}
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                {userName
                  ? interpolate(t("bridgeInterstitial.step2.title_with_name", locale), { name: userName })
                  : t("bridgeInterstitial.step2.title_without_name", locale)}
              </h2>

              {userConcern && userNickname && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {interpolate(t("bridgeInterstitial.step2.concern_description", locale), {
                      nickname: userNickname,
                      concern: userConcern,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {interpolate(t("bridgeInterstitial.step2.recommended_ingredient", locale), {
                      ingredient: CONCERN_INGREDIENT_MAP[userConcern] || CONCERN_INGREDIENT_MAP.none,
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* 30일 기록 섹션 */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                {t("bridgeInterstitial.step2.record_section_title", locale)}
              </h3>

              {/* 30개 점 (10개씩 3줄) */}
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i === 0 ? "bg-gray-900" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {interpolate(t("bridgeInterstitial.step2.record_hint", locale), { day: "1" })}
              </p>
            </div>

            {/* 설명 및 버튼 섹션 */}
            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                {t("bridgeInterstitial.step2.next_button_description", locale)}
              </p>

              <button
                onClick={handleStep1Proceed}
                className={cn(
                  "w-full px-6 py-3 rounded-full",
                  "bg-gray-900 text-white font-semibold",
                  "transition-colors hover:bg-gray-800 active:scale-95"
                )}
              >
                {t("bridgeInterstitial.step2.next_button", locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
