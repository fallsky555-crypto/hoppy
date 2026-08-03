"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from "@/lib/schedule"
import { normalizeInterval } from "@/lib/scheduling-engine"
import { t, interpolate } from "@/lib/i18n"
import type { Locale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import type { Concern, SupportId } from "@/lib/routine-copy"

interface OnboardingFlowProps {
  locale: Locale
  /** 4단계 "시작하기" — 최종 clamp된 간격(일), 데이터 수집 동의, 피부 컨디션을 넘긴다. useDiary().completeOnboarding에 그대로 연결한다 */
  onComplete: (intervalDays: number, dataConsent: boolean, condition: "good" | "neutral" | "bad") => void
}

type Step = 1 | 2 | 3

/** "잘 안 써요"는 사실상 무한대 간격으로 보고, MAX_INTERVAL_DAYS 초과 구간에 태운다 */
const NEVER_USES_RAW_DAYS = 999

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

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2">
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step >= 1 ? "bg-primary" : "bg-border")} />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step >= 2 ? "bg-primary" : "bg-border")} />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step >= 3 ? "bg-primary" : "bg-border")} />
    </div>
  )
}

const CONCERN_LABEL: Record<Exclude<Concern, "none">, string> = {
  dry: "건조",
  flush: "홍조",
  flaky: "각질",
  trouble: "트러블",
}

const SUPPORT_LABEL: Record<SupportId, string> = {
  hya: "히알루론산",
  cica: "시카",
  nia: "나이아신아마이드",
  cer: "세라마이드",
}

export function OnboardingFlow({ locale, onComplete }: OnboardingFlowProps) {
  const diary = useDiary()

  const [step, setStep] = useState<Step>(1)
  const [inputValue, setInputValue] = useState("")
  const [neverUses, setNeverUses] = useState(false)
  const [rawDays, setRawDays] = useState<number | null>(null)
  const [dataConsent, setDataConsent] = useState(false)
  const [condition, setCondition] = useState<"good" | "neutral" | "bad" | null>(null)

  // 체커 데이터 상태: pending (UI 표시), loaded (요약 표시), dismissed (표시 안 함), none (데이터 없음)
  const [checkerChoice, setCheckerChoice] = useState<"pending" | "loaded" | "dismissed" | "none">("none")
  const [appliedCheckerSummary, setAppliedCheckerSummary] = useState<{ concern: Concern; supportOwned: SupportId[] } | null>(null)

  // step 2에 진입했을 때 또는 hydration 완료 후 pendingCheckerContext를 확인하고 한 번만 "pending"으로 설정
  useEffect(() => {
    if (step === 2 && diary.hydrated && diary.pendingCheckerContext && checkerChoice === "none") {
      setCheckerChoice("pending")
    }
  }, [step, diary.hydrated])

  // pendingCheckerContext가 나중에 채워진 경우를 감시해서 checkerChoice 업데이트
  useEffect(() => {
    if (diary.pendingCheckerContext && checkerChoice === "none") {
      setCheckerChoice("pending")
    }
  }, [diary.pendingCheckerContext])

  const parsedValue = Number(inputValue)
  const canSubmitHabit = neverUses || (inputValue.trim() !== "" && Number.isFinite(parsedValue) && parsedValue > 0)

  function handleHabitNext() {
    setRawDays(neverUses ? NEVER_USES_RAW_DAYS : Math.round(parsedValue))
    setStep(3)
  }

  const clampedDays = rawDays === null ? MIN_INTERVAL_DAYS : normalizeInterval(rawDays, MIN_INTERVAL_DAYS)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <StepIndicator step={step} />

      {step === 1 && (
        <section key="step-1" className="relative min-h-[420px] flex flex-col justify-center transition-opacity duration-200" aria-label={t("common.programIntro", locale)}>
          <div className="space-y-4 text-center">
            <img src="/onboarding/intro-01.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
            <h1 className="font-display text-xl font-bold leading-snug text-foreground">
              {t("onboarding.intro.title", locale)}
            </h1>
            <p className="text-[15px] leading-relaxed text-[#4A4438] text-center whitespace-pre-line">
              {t("onboarding.intro.description", locale)}
            </p>

            <div className="flex items-start gap-3 rounded-3xl bg-secondary/30 p-3.5">
              <input
                type="checkbox"
                id="data-consent"
                checked={dataConsent}
                onChange={(e) => setDataConsent(e.target.checked)}
                className="shrink-0 mt-0.5 w-4 h-4 rounded border border-border cursor-pointer accent-primary"
              />
              <label htmlFor="data-consent" className="cursor-pointer text-[13px] leading-relaxed text-foreground">
                {t("onboarding.intro.dataConsentLabel", locale)}
              </label>
            </div>

            <div className="text-center">
              <a
                href={getPrivacyPolicyUrl(locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text text-[13px] underline hover:text-primary-text/80 transition-colors"
              >
                {t("onboarding.intro.dataConsentLink", locale)}
              </a>
            </div>

            <Button type="button" size="lg" onClick={() => setStep(2)} disabled={!dataConsent} className="h-auto w-full rounded-full py-3 text-[15px]">
              {t("onboarding.intro.next", locale)}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section key="step-2" className="space-y-5 transition-opacity duration-200" aria-label={t("common.habitCheck", locale)}>
          <img src="/onboarding/intro-02.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />

          {(checkerChoice === "pending" || checkerChoice === "loaded") && (
            <>
              {checkerChoice === "pending" && (
                <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground text-center">
                    {t("onboarding.checkerImport.question", locale)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (diary.pendingCheckerContext) {
                          setAppliedCheckerSummary(diary.pendingCheckerContext)
                          diary.applyCheckerContext()
                          setCheckerChoice("loaded")
                        }
                      }}
                      className="flex-1 rounded-2xl border border-primary bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary-text transition-colors hover:bg-primary/20"
                    >
                      {t("onboarding.checkerImport.load", locale)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        diary.dismissCheckerContext()
                        setCheckerChoice("dismissed")
                      }}
                      className="flex-1 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      {t("onboarding.checkerImport.skip", locale)}
                    </button>
                  </div>
                </div>
              )}

              {checkerChoice === "loaded" && appliedCheckerSummary && (
                <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {appliedCheckerSummary.concern !== "none" && (
                      <>
                        {CONCERN_LABEL[appliedCheckerSummary.concern]} 고민,{" "}
                      </>
                    )}
                    {appliedCheckerSummary.supportOwned.length > 0 && (
                      <>
                        {appliedCheckerSummary.supportOwned.map(id => SUPPORT_LABEL[id]).join("·")} 성분 보유 중이시네요.
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.checkerImport.bridge", locale)}
                  </p>
                </div>
              )}
            </>
          )}

          <h1 className="font-display text-sm font-bold leading-snug text-foreground text-center">
            {t("onboarding.habitCheck.question", locale)}
          </h1>
          <p className="text-xs text-muted-foreground text-center">
            {t("onboarding.habitCheck.subQuestion", locale)}
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3">
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
                "w-full rounded-3xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                neverUses ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
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
        <section key="step-3" className="space-y-5 text-center transition-opacity duration-200" aria-label={t("common.mappingResult", locale)}>
          <img src="/onboarding/intro-03.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
          <p className="text-sm font-medium text-muted-foreground">
            {neverUses ? t("onboarding.mappingResult.mapping_never_uses", locale) : interpolate(t("onboarding.mappingResult.mapping_with_interval", locale), { days: String(rawDays) })}
          </p>
          <h1 className="font-display text-xl font-bold text-foreground">{interpolate(t("onboarding.mappingResult.interval_display", locale), { days: String(clampedDays) })}</h1>
          <p className="text-xs text-muted-foreground">
            {t("onboarding.mappingResult.checker_recommend_note", locale)}
          </p>

          <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">{t("onboarding.mappingResult.conditionQuestion", locale)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCondition("good")}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "good" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
                )}
                aria-pressed={condition === "good"}
              >
                {t("onboarding.mappingResult.condition_good", locale)}
              </button>
              <button
                type="button"
                onClick={() => setCondition("neutral")}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "neutral" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
                )}
                aria-pressed={condition === "neutral"}
              >
                {t("onboarding.mappingResult.condition_neutral", locale)}
              </button>
              <button
                type="button"
                onClick={() => setCondition("bad")}
                className={cn(
                  "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  condition === "bad" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
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
