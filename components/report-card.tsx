"use client"

import { useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { getIngredientGuide } from "@/lib/ingredient-guide"
import { getIngredientWarning } from "@/lib/ingredient-warnings"
import { getFirstConcernTagLabel, getAgeLabel } from "@/lib/label-mappings"
import { t, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface ReportCardProps {
  mode: "onboarding" | "revisit"
  locale: Locale
  age?: string | null
  skinType?: string | null
  concernTags?: string | null // 쉼표 구분 또는 배열 형태
  activeIngredients?: string[] | null
  onCTAClick?: () => void
  /** revisit 모드 하단 "설정" 버튼 클릭 시 호출 — 이 카드를 모달로 띄운 쪽에서 닫기 등을 처리 */
  onClose?: () => void
}

export function getCheckerUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/checker.html"
    : "https://myroutinediet.com/checker-en.html"
}

export function ReportCard({
  mode,
  locale,
  age,
  skinType,
  concernTags,
  activeIngredients,
  onCTAClick,
  onClose,
}: ReportCardProps) {
  // concern tags를 배열로 정규화
  const concernTagArray = useMemo(() => {
    if (!concernTags) return []
    if (typeof concernTags === "string") {
      return concernTags.split(",").map((tag) => tag.trim().toUpperCase())
    }
    return Array.isArray(concernTags) ? concernTags : []
  }, [concernTags])

  // 첫 번째 concern tag 사용 (시안에서는 하나씩 표시)
  const primaryConcern = concernTagArray[0] ?? null

  // primaryConcern의 한글 라벨 — 화면 표시 전용. getIngredientGuide에는
  // 절대 이 값이 아니라 원본 코드값(primaryConcern)을 넘겨야 한다(그쪽은 대문자 코드를
  // 키로 기대하는 설계라 라벨을 넘기면 매칭이 깨진다).
  const primaryConcernLabel = useMemo(() => {
    const key = getFirstConcernTagLabel(concernTags)
    return key ? t(key, locale) : null
  }, [concernTags, locale])

  // 성분 가이드
  const ingredients = useMemo(() => {
    if (!primaryConcern || !skinType) return []
    return getIngredientGuide(primaryConcern, skinType, locale)
  }, [primaryConcern, skinType, locale])

  // 성분 경고
  const warning = useMemo(() => {
    return getIngredientWarning(activeIngredients, locale)
  }, [activeIngredients, locale])

  const ageLabelKey = getAgeLabel(age)
  const ageLabel = ageLabelKey ? t(ageLabelKey, locale) : null

  // revisit 모드에서 핵심 데이터 부재 시 안내 UI 표시. age는 Step Q에 질문이
  // 없어서 체커 URL로 안 들어온 유저는 영영 null이라 필수 조건에서 뺐다 —
  // skinType/concernTags만 있어도 리포트를 보여줄 수 있다.
  const hasCoreData = skinType && concernTags
  if (mode === "revisit" && !hasCoreData) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <img
            src="/onboarding/intro-02.jpeg"
            alt={t("reportCard.hoppiAlt", locale)}
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              {t("reportCard.emptyStateTitle", locale)}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("reportCard.emptyStateDescLine1", locale)}<br />
              {t("reportCard.emptyStateDescLine2", locale)}
            </p>
          </div>
          <a
            href={getCheckerUrl(locale)}
            className="inline-block bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            {t("reportCard.emptyStateCta", locale)}
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      {/* 헤더: 사용자 정보 */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src="/onboarding/intro-02.jpeg"
          alt={t("reportCard.hoppiAlt", locale)}
          className="w-10 h-10 rounded-full object-cover border border-card shadow-sm"
        />
        <div className="text-xs text-ink-3 leading-tight">
          <div className="text-sm font-bold text-ink-2">{t("reportCard.hoppiAlt", locale)}</div>
          <div>{t("reportCard.greeting", locale)}</div>
        </div>
      </div>

      {/* 타이틀 섹션 */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-primary-text mb-2">
          {t("reportCard.badgeLabel", locale)}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-ink mb-2">
          {primaryConcernLabel ? (
            <>
              {ageLabel ? `${ageLabel} · ` : ""}
              {primaryConcernLabel}
              <br />
            </>
          ) : null}
          {t("reportCard.titleFallback", locale)}
        </h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          {t("reportCard.subtitleLine1", locale)}
          <br />
          {t("reportCard.subtitleLine2", locale)}
        </p>
      </div>

      {/* 성분 가이드 섹션 */}
      {ingredients.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-text mt-6 mb-3">
            {t("reportCard.ingredientGuideTitle", locale)}
          </p>

          <div className="bg-card border-1.5 border-line rounded-2xl p-5 mb-4">
            <span className="inline-block text-xs font-bold text-primary-text bg-primary-soft px-2.5 py-1 rounded-full mb-2.5">
              {primaryConcernLabel}
            </span>
            <p className="text-sm font-bold text-ink mb-1 leading-relaxed">
              {t("reportCard.ingredientRecommend", locale)}<span className="text-primary-text">{ingredients.join(" · ")}</span>
            </p>
            <p className="text-xs text-ink-2 leading-relaxed">
              {t("reportCard.niacinamideTip", locale)}
            </p>
          </div>
        </>
      )}

      {/* 성분 경고 카드 */}
      {warning && (
        <div
          className={cn(
            "rounded-2xl p-5 mb-4 border-1.5 flex gap-3",
            warning.level === "warning"
              ? "bg-warn-bg border-warn-border"
              : "bg-warn-bg border-warn-border"
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--warn)" }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--warn)" }}>
              {warning.title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {warning.message}
            </p>
          </div>
        </div>
      )}

      {/* 현재 사용 성분 카드 */}
      {activeIngredients && activeIngredients.length > 0 && (
        <div className="bg-primary-soft rounded-2xl p-4.5 mb-6">
          <p className="text-xs leading-relaxed text-primary-fg">
            <span className="font-bold">{t("reportCard.currentIngredientsLabel", locale)}</span> — {activeIngredients.join(" · ")}
          </p>
          <p className="text-xs leading-relaxed text-primary-fg mt-2">
            {t("reportCard.retinolTipPrefix", locale)}<span className="font-bold">{t("reportCard.retinolTipBold", locale)}</span>{t("reportCard.retinolTipSuffix", locale)}
          </p>
        </div>
      )}

      {/* 온보딩 모드: 완주 동기 카드 + CTA */}
      {mode === "onboarding" && (
        <>
          {/* 완주 동기 카드 */}
          <div className="rounded-2xl p-6 mb-6 text-white bg-primary-text">
            <p className="text-xs font-bold uppercase tracking-wider mb-4 text-white/70">
              {t("reportCard.motivationTitle", locale)}
            </p>

            <div className="space-y-3.5">
              <div className="flex gap-4 pb-3.5 border-b border-white/8">
                <div className="text-xs font-bold flex-shrink-0 w-16 text-white/70">
                  Day 30
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  {t("reportCard.motivationDay30", locale)}
                </div>
              </div>

              <div className="flex gap-4 pb-3.5 border-b border-white/8">
                <div className="text-xs font-bold flex-shrink-0 w-16 text-white/70">
                  Month 6
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  {t("reportCard.motivationMonth6", locale)}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-xs font-bold flex-shrink-0 w-16 text-white/70">
                  Year 1
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  {t("reportCard.motivationYear1", locale)}
                </div>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={onCTAClick}
            className="w-full bg-primary text-primary-foreground font-bold text-base rounded-2xl px-6 py-4.5 shadow-lg hover:opacity-90 transition-opacity"
          >
            {t("reportCard.ctaButton", locale)}
          </button>
        </>
      )}

      {/* 모드별 하단 텍스트 */}
      {mode === "revisit" && (
        <>
          <p className="text-xs text-ink-3 text-center leading-relaxed mb-4">
            {t("reportCard.revisitFooterLine1", locale)}
            <br />
            {t("reportCard.revisitFooterLine2", locale)}
            <br />
            {t("reportCard.revisitFooterLine3", locale)}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm font-bold text-primary-text bg-card border-1.5 border-line rounded-2xl px-6 py-3.5 hover:bg-secondary transition-colors"
          >
            {t("reportCard.revisitSettingsButton", locale)}
          </button>
          <p className="text-xs text-ink-3 text-center mt-3">
            {t("reportCard.revisitBrandFooter", locale)}
          </p>
        </>
      )}
    </main>
  )
}
