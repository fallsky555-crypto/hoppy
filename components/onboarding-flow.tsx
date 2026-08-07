"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { t, type Locale } from "@/lib/i18n"
import { CONCERN_LABEL_KEYS, SUPPORT_LABEL_KEYS } from "@/lib/label-mappings"
import type { Concern, SupportId } from "@/lib/routine-copy"
import { useDiary } from "@/lib/diary-context"

interface OnboardingFlowProps {
  locale: Locale
  diary: ReturnType<typeof useDiary>
  onComplete: (activeIngredients: string[], dataConsent: boolean, condition: "good" | "neutral" | "bad") => void
}

type Step = 1 | 2

function getPrivacyPolicyUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/privacy-policy.html"
    : "https://myroutinediet.com/privacy-policy-en.html"
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2">
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step >= 1 ? "bg-primary" : "bg-border")} />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", step >= 2 ? "bg-primary" : "bg-border")} />
    </div>
  )
}

export function OnboardingFlow({ locale, diary, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [activeIngredients, setActiveIngredients] = useState<string[]>([])
  const [dataConsent, setDataConsent] = useState(false)
  const [condition, setCondition] = useState<"good" | "neutral" | "bad" | null>(null)
  const [checkerChoice, setCheckerChoice] = useState<"pending" | "loaded" | "dismissed" | "not_needed">(
    diary.pendingCheckerContext ? "pending" : "not_needed"
  )
  const [appliedCheckerSummary, setAppliedCheckerSummary] = useState<{ concern: Concern; supportOwned: SupportId[] } | null>(null)

  const ingredientOptions = [
    { id: "vitc", label: t("onboarding.ingredientCheck.option_vitc", locale) },
    { id: "ret", label: t("onboarding.ingredientCheck.option_ret", locale) },
    { id: "nia", label: t("onboarding.ingredientCheck.option_nia", locale) },
    { id: "unknown", label: t("onboarding.ingredientCheck.option_unknown", locale) },
  ]

  function toggleIngredient(id: string) {
    setActiveIngredients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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
              onClick={() => {
                if (dataConsent) setStep(2)
              }}
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
                onClick={() => {
                  if (dataConsent) setStep(2)
                }}
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

      {step === 2 && (
        <section key="step-2" className="space-y-5 transition-opacity duration-200" aria-label="Hoppi Intro">
          {/* 필기체 타이틀과 설명문구 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-gowun text-foreground text-center">
              {t("onboarding.hoppiIntro.title", locale)}
            </h1>
            <p className="text-sm leading-relaxed text-[#4A4438] whitespace-pre-line text-left">
              {t("onboarding.hoppiIntro.description", locale)}
            </p>
          </div>

          {/* 원형 고양이 이미지 */}
          <div className="mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
            <img src="/onboarding/cover-cat-camera.png" alt="" className="w-full h-full object-cover" />
          </div>

          {/* 체커 결과 불러오기 카드 */}
          {(checkerChoice === "pending" || checkerChoice === "loaded" || appliedCheckerSummary) && (
            <div className="rounded-3xl border border-border bg-card/50 p-4 space-y-3">
              {checkerChoice === "pending" && (
                <>
                  <p className="text-sm font-medium text-foreground text-center">
                    {t("onboarding.checkerImport.question", locale)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (diary.pendingCheckerContext) {
                          setAppliedCheckerSummary(diary.pendingCheckerContext)
                          setCheckerChoice("loaded")
                          diary.applyCheckerContext()
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
                </>
              )}

              {checkerChoice === "loaded" && appliedCheckerSummary && (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {appliedCheckerSummary.concern !== "none" && (
                      <>
                        {t(CONCERN_LABEL_KEYS[appliedCheckerSummary.concern], locale)} 고민,{" "}
                      </>
                    )}
                    {appliedCheckerSummary.supportOwned.length > 0 && (
                      <>
                        {appliedCheckerSummary.supportOwned
                          .map((id) => t(SUPPORT_LABEL_KEYS[id], locale))
                          .join("·")}{" "}
                        성분 보유 중이시네요.
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.checkerImport.bridge", locale)}
                  </p>
                </>
              )}
            </div>
          )}

          {/* 두 카드를 감싸는 전체 컨테이너 */}
          <div className="rounded-2xl bg-blue-50 p-4 space-y-4">
            {/* 성분 질문 카드 */}
            <div className="space-y-3">
              <h2 className="font-display text-sm font-bold leading-snug text-foreground text-center">
                {t("onboarding.hoppiIntro.ingredientQuestion", locale)}
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {ingredientOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleIngredient(option.id)}
                    className={cn(
                      "rounded-xl px-1 py-2 text-[10px] font-semibold border transition-colors line-clamp-2",
                      activeIngredients.includes(option.id)
                        ? "border-primary bg-primary/10 text-primary-text"
                        : "border-border bg-card text-foreground"
                    )}
                    aria-pressed={activeIngredients.includes(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 컨디션 질문 카드 */}
            <div className="space-y-3 pt-2 border-t border-blue-100">
              <p className="text-sm font-medium text-foreground text-center">
                {t("onboarding.hoppiIntro.conditionQuestion", locale)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCondition("good")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    condition === "good" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
                  )}
                  aria-pressed={condition === "good"}
                >
                  {t("onboarding.hoppiIntro.condition_good", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("neutral")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    condition === "neutral" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
                  )}
                  aria-pressed={condition === "neutral"}
                >
                  {t("onboarding.hoppiIntro.condition_neutral", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => setCondition("bad")}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    condition === "bad" ? "border-primary bg-primary/10 text-primary-text" : "border-border bg-card text-foreground",
                  )}
                  aria-pressed={condition === "bad"}
                >
                  {t("onboarding.hoppiIntro.condition_bad", locale)}
                </button>
              </div>
            </div>
          </div>

          {/* 완료 버튼 */}
          <Button
            type="button"
            size="lg"
            disabled={activeIngredients.length === 0 || condition === null}
            onClick={() => onComplete(activeIngredients, dataConsent, condition!)}
            className="h-auto w-auto px-12 mx-auto rounded-full py-3 text-[15px]"
          >
            {t("onboarding.introStep.next", locale)}
          </Button>
        </section>
      )}

    </main>
  )
}
