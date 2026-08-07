"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { t, type Locale } from "@/lib/i18n"
import { CONCERN_LABEL_KEYS, SUPPORT_LABEL_KEYS } from "@/lib/label-mappings"
import type { Concern, SupportId } from "@/lib/routine-copy"
import { useDiary } from "@/lib/diary-context"
import { ReportCard } from "@/components/report-card"
import { saveContextFlags } from "@/lib/supabase/sync"
import { TOTAL_DAYS } from "@/lib/schedule"

interface OnboardingFlowProps {
  locale: Locale
  diary: ReturnType<typeof useDiary>
  onComplete: (activeIngredients: string[], dataConsent: boolean, condition: "good" | "neutral" | "bad") => void
}

type Step = 1 | "Q" | 1.5 | 2

/** KST(Asia/Seoul) 기준 "오늘" day를 계산 */
function getTodayDayKST(joinISO: string): number {
  const now = new Date()
  // UTC timestamp에 KST offset(+9시간) 적용
  const kstTime = now.getTime() + (9 * 60 * 60 * 1000)
  const kstNow = new Date(kstTime)

  // 가입일 ISO 문자열을 UTC로 파싱
  const start = new Date(joinISO)

  // UTC 게터를 사용해서 각각의 자정(00:00:00)을 계산
  const startMid = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
    0, 0, 0, 0
  ))
  const kstNowMid = new Date(Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
    0, 0, 0, 0
  ))

  const diffDays = Math.floor((kstNowMid.getTime() - startMid.getTime()) / 86_400_000)
  return Math.min(Math.max(diffDays + 1, 1), TOTAL_DAYS)
}

interface StepQNeeds {
  needSkinType: boolean
  needConcernTags: boolean
  needActiveIngredients: boolean
  needCondition: boolean
  hasAnyNeeded: boolean
}

/** 각 필드별로 Step Q에서 필요한 질문을 판단 */
function checkStepQNeeds(diary: ReturnType<typeof useDiary>): StepQNeeds {
  const needSkinType = !diary.skinType
  const needConcernTags = !diary.concernTags
  const needActiveIngredients = !diary.activeIngredients || diary.activeIngredients.length === 0

  // Q4: 오늘 condition을 이미 기록했으면 스킵 (KST 기준)
  const todayDay = getTodayDayKST(diary.joinDate)
  const needCondition = !(diary.conditions && diary.conditions[todayDay])

  const hasAnyNeeded = needSkinType || needConcernTags || needActiveIngredients || needCondition

  return {
    needSkinType,
    needConcernTags,
    needActiveIngredients,
    needCondition,
    hasAnyNeeded,
  }
}

function getPrivacyPolicyUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/privacy-policy.html"
    : "https://myroutinediet.com/privacy-policy-en.html"
}

function StepIndicator({ step }: { step: Step }) {
  const stepNum = typeof step === "string" ? 1.5 : step
  return (
    <div className="flex justify-center gap-2">
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", stepNum >= 1 ? "bg-primary" : "bg-border")} />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", stepNum >= 1.5 ? "bg-primary" : "bg-border")} />
      <div className={cn("w-2 h-2 rounded-full transition-colors duration-200", stepNum >= 2 ? "bg-primary" : "bg-border")} />
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

  // 최소 질문 (Step Q)용 상태
  const [tempSkinType, setTempSkinType] = useState<string | null>(null)
  const [tempConcernTags, setTempConcernTags] = useState<string[]>([])
  const [tempActiveIngredients, setTempActiveIngredients] = useState<string[]>([])
  const [tempCondition, setTempCondition] = useState<"good" | "neutral" | "bad" | null>(null)

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
                if (dataConsent) {
                  const needs = checkStepQNeeds(diary)
                  setStep(needs.hasAnyNeeded ? "Q" : 1.5)
                }
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
                  if (dataConsent) {
                    const needs = checkStepQNeeds(diary)
                    setStep(needs.hasAnyNeeded ? "Q" : 1.5)
                  }
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

      {step === "Q" && (() => {
        const needs = checkStepQNeeds(diary)
        return (
        <section key="step-Q" className="space-y-4 transition-opacity duration-200 pb-10" aria-label="Minimum Questions">
          <div className="space-y-6">
            {/* 헤더 */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                진단을 위한 기본 정보
              </h2>
              <p className="text-sm text-muted-foreground">
                피부 정보를 알려주세요
              </p>
            </div>

            {/* Q1: 피부 타입 */}
            {needs.needSkinType && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Q1. 피부 타입</p>
              <div className="grid grid-cols-4 gap-2">
                {["sensitive", "dry", "combo", "oily"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTempSkinType(type)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-xs font-semibold border-2 transition-colors",
                      tempSkinType === type
                        ? "border-primary bg-primary/10 text-primary-text"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {{
                      sensitive: "민감성",
                      dry: "건성",
                      combo: "복합성",
                      oily: "지성",
                    }[type]}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Q2: 주요 고민 */}
            {needs.needConcernTags && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Q2. 주요 고민 (복수 선택 가능)</p>
              <div className="space-y-2">
                {[
                  { id: "DRY", label: "속건조·속당김" },
                  { id: "TONE", label: "칙칙함·잡티" },
                  { id: "TEXTURE", label: "오돌토돌 결·모공" },
                  { id: "TROUBLE", label: "민감 자극·트러블" },
                  { id: "AGING", label: "탄력저하·주름" },
                  { id: "BARRIER", label: "홍조·약해진 피부장벽" },
                ].map((concern) => (
                  <button
                    key={concern.id}
                    type="button"
                    onClick={() => {
                      setTempConcernTags((prev) =>
                        prev.includes(concern.id)
                          ? prev.filter((c) => c !== concern.id)
                          : [...prev, concern.id]
                      )
                    }}
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-colors text-left",
                      tempConcernTags.includes(concern.id)
                        ? "border-primary bg-primary/10 text-primary-text"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {concern.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Q3: 고민케어 성분 */}
            {needs.needActiveIngredients && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Q3. 고민케어로 주로 뭘 쓰세요?</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "vitc", label: "비타민C" },
                  { id: "ret", label: "레티놀" },
                  { id: "nia", label: "나이아신아마이드" },
                  { id: "unknown", label: "잘 모르겠어요" },
                ].map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => {
                      setTempActiveIngredients((prev) =>
                        prev.includes(ing.id)
                          ? prev.filter((i) => i !== ing.id)
                          : [...prev, ing.id]
                      )
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-xs font-semibold border-2 transition-colors",
                      tempActiveIngredients.includes(ing.id)
                        ? "border-primary bg-primary/10 text-primary-text"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {ing.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Q4: 오늘 컨디션 */}
            {needs.needCondition && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Q4. 오늘 피부 컨디션은 어때요?</p>
              <div className="flex gap-2">
                {[
                  { id: "good", label: "좋아요" },
                  { id: "neutral", label: "보통이에요" },
                  { id: "bad", label: "안 좋아요" },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setTempCondition(cond.id as "good" | "neutral" | "bad")}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold border-2 transition-colors",
                      tempCondition === cond.id
                        ? "border-primary bg-primary/10 text-primary-text"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* 완료 버튼 */}
            <Button
              type="button"
              disabled={
                (needs.needSkinType && !tempSkinType) ||
                (needs.needConcernTags && tempConcernTags.length === 0) ||
                (needs.needCondition && !tempCondition)
              }
              onClick={async () => {
                if (
                  (needs.needSkinType && !tempSkinType) ||
                  (needs.needConcernTags && tempConcernTags.length === 0) ||
                  (needs.needCondition && !tempCondition)
                ) return

                // diary_profiles에 저장
                const userId = diary.userId
                if (userId) {
                  await saveContextFlags(userId, diary.joinDate, {
                    skinType: tempSkinType,
                    concernTags: tempConcernTags.join(","),
                    activeIngredients: tempActiveIngredients,
                  })

                  // condition 저장
                  diary.recordCondition(0, tempCondition)
                }

                // ReportCard로 이동 (저장된 데이터와 함께)
                setStep(1.5)
              }}
              className="h-auto w-full mx-auto rounded-full py-3 text-[15px]"
            >
              {t("onboarding.introStep.next", locale)}
            </Button>
          </div>
        </section>
        )
      })()}

      {step === 1.5 && (
        <section key="step-1.5" className="space-y-5 transition-opacity duration-200" aria-label="Report Card">
          <ReportCard
            mode="onboarding"
            age={diary.age}
            skinType={diary.skinType || tempSkinType}
            concernTags={diary.concernTags || tempConcernTags.join(",")}
            activeIngredients={diary.activeIngredients || tempActiveIngredients}
            onCTAClick={() => onComplete(tempActiveIngredients, dataConsent, tempCondition!)}
          />
        </section>
      )}


    </main>
  )
}
