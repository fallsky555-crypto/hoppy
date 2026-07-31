"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from "@/lib/schedule"
import { normalizeInterval } from "@/lib/scheduling-engine"
import { t, interpolate } from "@/lib/i18n"
import type { Locale } from "@/lib/locale-context"

interface OnboardingFlowProps {
  locale: Locale
  /** 4단계 "시작하기" — 최종 clamp된 간격(일), 데이터 수집 동의, 피부 컨디션을 넘긴다. useDiary().completeOnboarding에 그대로 연결한다 */
  onComplete: (intervalDays: number, dataConsent: boolean, condition: "good" | "neutral" | "bad") => void
}

type Step = 1 | 2 | 3

/** "잘 안 써요"는 사실상 무한대 간격으로 보고, MAX_INTERVAL_DAYS 초과 구간(3단계 코멘트 분기)에 태운다 */
const NEVER_USES_RAW_DAYS = 999

function commentFor(rawDays: number, locale: Locale): string {
  if (rawDays < MIN_INTERVAL_DAYS) return t("onboarding.mappingResult.comment_too_short", locale)
  if (rawDays > MAX_INTERVAL_DAYS) return t("onboarding.mappingResult.comment_too_frequent", locale)
  return t("onboarding.mappingResult.comment_similar", locale)
}

/**
 * 온보딩 1~4단계. 3(매핑+코멘트)과 4(시작하기)는 별도로 보여줄 새 정보가 없어서
 * 한 화면으로 합쳤다. 완료 전까지는 가입일(Day 1)이 아직 찍히지 않은 상태다 —
 * 실제 스탬프는 onComplete를 호출하는 useDiary().completeOnboarding에서 한다.
 */
function getPrivacyPolicyUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/privacy-policy.html"
    : "https://myroutinediet.com/policy-en.html"
}

export function OnboardingFlow({ locale, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [inputValue, setInputValue] = useState("")
  const [neverUses, setNeverUses] = useState(false)
  const [rawDays, setRawDays] = useState<number | null>(null)
  const [dataConsent, setDataConsent] = useState(false)
  const [condition, setCondition] = useState<"good" | "neutral" | "bad" | null>(null)

  const parsedValue = Number(inputValue)
  const canSubmitHabit = neverUses || (inputValue.trim() !== "" && Number.isFinite(parsedValue) && parsedValue > 0)

  function handleHabitNext() {
    setRawDays(neverUses ? NEVER_USES_RAW_DAYS : Math.round(parsedValue))
    setStep(3)
  }

  const clampedDays = rawDays === null ? MIN_INTERVAL_DAYS : normalizeInterval(rawDays, MIN_INTERVAL_DAYS)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      {step === 1 && (
        <section className="relative min-h-[420px] flex flex-col justify-center" aria-label={t("common.programIntro", locale)}>
          <div className="space-y-4 text-center">
            <img src="/onboarding/intro-01.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
            <h1 className="font-display text-xl font-bold leading-snug text-foreground">
              {t("onboarding.intro.title", locale)}
            </h1>
            <p className="text-[15px] leading-relaxed text-[#4A4438] text-left">
              {t("onboarding.intro.description", locale)}
            </p>

            <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3.5">
              <input
                type="checkbox"
                id="data-consent"
                checked={dataConsent}
                onChange={(e) => setDataConsent(e.target.checked)}
                className="shrink-0 mt-0.5 w-4 h-4 rounded border border-border cursor-pointer accent-primary"
              />
              <label htmlFor="data-consent" className="cursor-pointer text-[13px] leading-relaxed text-foreground">
                {t("onboarding.intro.dataConsentLabel", locale)}{" "}
                <a
                  href={getPrivacyPolicyUrl(locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {t("onboarding.intro.dataConsentLink", locale)}
                </a>
              </label>
            </div>

            <Button type="button" size="lg" onClick={() => setStep(2)} disabled={!dataConsent} className="h-auto w-full rounded-full py-3 text-[15px]">
              {t("onboarding.intro.next", locale)}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5" aria-label={t("common.habitCheck", locale)}>
          <h1 className="font-display text-lg font-bold leading-snug text-foreground">
            {t("onboarding.habitCheck.question", locale)}
          </h1>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={t("onboarding.habitCheck.placeholder", locale)}
                value={inputValue}
                disabled={neverUses}
                onChange={(event) => setInputValue(event.target.value)}
                className="w-full bg-transparent text-base font-semibold text-foreground outline-none disabled:opacity-40"
              />
              <span className="shrink-0 text-sm font-medium text-muted-foreground">{t("onboarding.habitCheck.interval_suffix", locale)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setNeverUses((prev) => !prev)
                setInputValue("")
              }}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                neverUses ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
              )}
              aria-pressed={neverUses}
            >
              {t("onboarding.habitCheck.never_uses", locale)}
            </button>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={!canSubmitHabit}
            onClick={handleHabitNext}
            className="h-auto w-full rounded-full py-3 text-[15px]"
          >
            {t("onboarding.habitCheck.next", locale)}
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5 text-center" aria-label={t("common.mappingResult", locale)}>
          <p className="text-sm font-medium text-muted-foreground">
            {neverUses ? t("onboarding.mappingResult.mapping_never_uses", locale) : interpolate(t("onboarding.mappingResult.mapping_with_interval", locale), { days: String(rawDays) })}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">{interpolate(t("onboarding.mappingResult.interval_display", locale), { days: String(clampedDays) })}</h1>
          <p className="text-[15px] leading-relaxed text-[#4A4438]">{commentFor(rawDays ?? MIN_INTERVAL_DAYS, locale)}</p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t("onboarding.mappingResult.conditionQuestion", locale)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCondition("good")}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "good" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
                )}
                aria-pressed={condition === "good"}
              >
                {t("onboarding.mappingResult.condition_good", locale)}
              </button>
              <button
                type="button"
                onClick={() => setCondition("neutral")}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "neutral" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
                )}
                aria-pressed={condition === "neutral"}
              >
                {t("onboarding.mappingResult.condition_neutral", locale)}
              </button>
              <button
                type="button"
                onClick={() => setCondition("bad")}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "bad" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
                )}
                aria-pressed={condition === "bad"}
              >
                {t("onboarding.mappingResult.condition_bad", locale)}
              </button>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={condition === null}
            onClick={() => onComplete(clampedDays, dataConsent, condition!)}
            className="h-auto w-full rounded-full py-3 text-[15px]"
          >
            {t("onboarding.mappingResult.start", locale)}
          </Button>
        </section>
      )}
    </main>
  )
}
