"use client"

import { FileText, ArrowRight } from "lucide-react"
import { getFirstConcernTagShortLabelKey, getAgeLabel } from "@/lib/label-mappings"
import { t, type Locale } from "@/lib/i18n"

interface ReportCardProps {
  mode: "onboarding" | "revisit"
  locale: Locale
  age?: string | null
  skinType?: string | null
  concernTags?: string | null // 쉼표 구분 또는 배열 형태
  activeIngredients?: string[] | null
  /** 체커 자신의 결과 화면(성분 리스트, 컨설턴트 코멘트 등)을 재현하는 링크. 있을 때만 "검사 결과지 펼쳐보기" 노출 */
  checkerResultUrl?: string | null
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
  checkerResultUrl,
  onCTAClick,
  onClose,
}: ReportCardProps) {
  const shortConcernLabelKey = getFirstConcernTagShortLabelKey(concernTags)
  const shortConcernLabel = shortConcernLabelKey ? t(shortConcernLabelKey, locale) : null

  const ageLabelKey = getAgeLabel(age)
  const ageLabel = ageLabelKey ? t(ageLabelKey, locale) : null

  // revisit 모드에서 핵심 데이터 부재 시 안내 UI 표시. age는 Step Q에 질문이
  // 없어서 체커 URL로 안 들어온 유저는 영영 null이라 필수 조건에서 뺐다 —
  // skinType/concernTags만 있어도 리포트를 보여줄 수 있다.
  const hasCoreData = skinType && concernTags
  if (mode === "revisit" && !hasCoreData) {
    return (
      <main className="theme-report mx-auto w-full max-w-md px-5 py-6 bg-background flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <img
            src="/onboarding/intro-02.jpeg"
            alt={t("reportCard.hoppiAlt", locale)}
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-ink">
              {t("reportCard.emptyStateTitle", locale)}
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
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
    <main className="theme-report mx-auto w-full max-w-md px-5 py-6 bg-background">
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
          {locale === "ko" && ageLabel && shortConcernLabel ? (
            <>
              {ageLabel}의 {shortConcernLabel} 고민을 위한<br />
              조언을 정리했어요
            </>
          ) : (
            t("reportCard.titleFallback", locale)
          )}
        </h1>
        {checkerResultUrl && (
          <a
            href={checkerResultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-between px-3.5 py-3 border-1.5 border-line rounded-xl no-underline hover:bg-secondary transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-primary-text">
              <FileText className="w-4.5 h-4.5" aria-hidden="true" />
              {t("reportCard.checkerResultLink", locale)}
            </span>
            <ArrowRight className="w-4 h-4 text-primary-text" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* 온보딩 모드: 완주 동기 카드 + CTA */}
      {mode === "onboarding" && (
        <>
          {/* 완주 동기 카드 */}
          <div className="rounded-2xl p-6 mb-6 border-1.5 border-line bg-card">
            <p className="text-xs font-bold uppercase tracking-wider mb-4 text-primary-text">
              {t("reportCard.motivationTitle", locale)}
            </p>

            <div className="space-y-3.5">
              <div className="flex gap-4 pb-3.5 border-b border-line">
                <div className="text-xs font-bold flex-shrink-0 w-[72px] text-ink-3">
                  {t("reportCard.motivationLabelMonth1", locale)}
                </div>
                <div className="text-sm font-bold text-ink leading-relaxed">
                  {t("reportCard.motivationDay30", locale)}
                </div>
              </div>

              <div className="flex gap-4 pb-3.5 border-b border-line">
                <div className="text-xs font-bold flex-shrink-0 w-[72px] text-ink-3">
                  {t("reportCard.motivationLabelMonth6", locale)}
                </div>
                <div className="text-sm font-bold text-ink leading-relaxed">
                  {t("reportCard.motivationMonth6", locale)}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-xs font-bold flex-shrink-0 w-[72px] text-ink-3">
                  {t("reportCard.motivationLabelYear1", locale)}
                </div>
                <div className="text-sm font-bold text-ink leading-relaxed">
                  {t("reportCard.motivationYear1", locale)}
                </div>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <button
            onClick={onCTAClick}
            className="w-full bg-primary text-primary-foreground font-bold text-base rounded-2xl px-6 py-4.5 hover:opacity-90 transition-opacity border-1.5 border-primary-text"
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
