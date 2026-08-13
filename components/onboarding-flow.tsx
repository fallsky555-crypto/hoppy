"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { t, type Locale } from "@/lib/i18n"
import { useDiary } from "@/lib/diary-context"
import { ReportCard } from "@/components/report-card"

interface OnboardingFlowProps {
  locale: Locale
  diary: ReturnType<typeof useDiary>
  onComplete: (dataConsent: boolean) => void
}

type Step = 1 | "report"

function getPrivacyPolicyUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/privacy-policy.html"
    : "https://myroutinediet.com/privacy-policy-en.html"
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2">
      <div className="w-2 h-2 rounded-full transition-colors duration-200 bg-primary" />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step === "report" ? "bg-primary" : "bg-border")} />
    </div>
  )
}

export function OnboardingFlow({ locale, diary, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [dataConsent, setDataConsent] = useState(false)

  // 체커를 항상 거쳐 들어온다는 전제이므로 "체커 데이터 있음/없음"을 가리지 않고
  // 항상 리포트 카드를 보여준다. 체커 URL 파라미터는 use-diary.ts의 hydration effect에서
  // 마운트 이전에 이미 diary.skinType/concernTags 등에 반영되어 있다.
  function handleNext() {
    if (!dataConsent) return
    setStep("report")
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <StepIndicator step={step} />

      {step === 1 && (
        <section key="step-1" className="relative min-h-[420px] flex flex-col justify-center transition-opacity duration-200" aria-label="Intro Step">
          <div className="space-y-4 text-center">
            <img src="/onboarding/cover-cat-sleeping.png" alt="" className="mx-auto h-40 w-40 object-contain" />
            <h1 className="font-display text-xl font-bold leading-snug text-foreground">
              {t("onboarding.introStep.title", locale)}
            </h1>
            <p className="text-[15px] leading-relaxed text-[#4A4438] text-center whitespace-pre-line">
              {t("onboarding.introStep.subtitle", locale)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("onboarding.introStep.description", locale)}
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={!dataConsent}
              onClick={handleNext}
              className={cn(
                "h-auto w-auto px-6 rounded-full py-2.5 text-[15px] mx-auto",
                !dataConsent && "opacity-50 cursor-not-allowed"
              )}
            >
              {t("onboarding.introStep.ctaButton", locale)}
            </Button>

            <div className="flex items-center justify-between gap-3 rounded-3xl bg-secondary/30 px-4 py-3">
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  id="data-consent"
                  checked={dataConsent}
                  onChange={(e) => setDataConsent(e.target.checked)}
                  className="shrink-0 mt-0.5 w-4 h-4 rounded border border-border cursor-pointer accent-primary"
                />
                <div className="text-left">
                  <label htmlFor="data-consent" className="cursor-pointer text-[13px] leading-relaxed text-foreground block">
                    {t("onboarding.introStep.dataConsentLabel", locale)}
                  </label>
                  <a
                    href={getPrivacyPolicyUrl(locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-text text-[13px] underline hover:text-primary-text/80 transition-colors inline-block"
                  >
                    {t("onboarding.introStep.dataConsentLink", locale)}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!dataConsent}
                className={cn(
                  "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  dataConsent
                    ? "bg-primary hover:bg-primary/90 active:scale-95"
                    : "bg-slate-400 opacity-60 cursor-not-allowed"
                )}
                aria-label="Next step"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "report" && (
        <section key="step-report" className="space-y-5 transition-opacity duration-200" aria-label="Report Card">
          <ReportCard
            mode="onboarding"
            locale={locale}
            age={diary.age}
            skinType={diary.skinType}
            concernTags={diary.concernTags}
            activeIngredients={diary.activeIngredients}
            onCTAClick={() => onComplete(dataConsent)}
          />
        </section>
      )}
    </main>
  )
}
