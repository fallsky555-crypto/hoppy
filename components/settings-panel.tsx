"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { CONCERN_LABEL_KEYS, SUPPORT_LABEL_KEYS, SKIN_TYPE_LABEL_KEYS, AGE_LABEL_KEYS, GENDER_LABEL_KEYS, getFirstConcernTagLabel } from "@/lib/label-mappings"
import { ReportCard } from "@/components/report-card"

interface SettingsPanelProps {
  onStartFresh: () => void
}

/**
 * 체커 재방문 흐름과 완전히 분리된, 유저가 직접 요청하는 명시적 초기화 버튼.
 * 실수로 누르는 걸 막기 위해 한 번 더 확인을 받는다.
 */
export function SettingsPanel({ onStartFresh }: SettingsPanelProps) {
  const locale = useLocale()
  const diary = useDiary()
  const [confirming, setConfirming] = useState(false)
  const [showReportCard, setShowReportCard] = useState(false)

  function handleConfirm() {
    onStartFresh()
    setConfirming(false)
  }

  return (
    <section className="space-y-3 rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("settings.title", locale)}>
      <h2 className="text-[13px] font-semibold text-foreground">{t("settings.title", locale)}</h2>

      {/* 내 정보 다시보기 섹션 */}
      <div className="space-y-2.5 text-xs text-foreground/80">
        <div className="pt-2 border-t border-border">
          <p className="font-semibold text-foreground mb-2">{t("settings.reviewTitle", locale)}</p>
          <div className="space-y-1.5 text-[12px]">
            <p>
              <span className="font-medium">{t("settings.reviewLabels.concern", locale)}:</span>{" "}
              {diary.concern && diary.concern !== "none"
                ? t(CONCERN_LABEL_KEYS[diary.concern], locale)
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.supportOwned", locale)}:</span>{" "}
              {diary.supportOwned && diary.supportOwned.length > 0
                ? diary.supportOwned
                    .map((id) => t(SUPPORT_LABEL_KEYS[id], locale))
                    .join(", ")
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.activeIngredients", locale)}:</span>{" "}
              {diary.activeIngredients && diary.activeIngredients.length > 0
                ? diary.activeIngredients.join(", ")
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.usedProducts", locale)}:</span>{" "}
              {diary.usedProducts && diary.usedProducts.length > 0
                ? diary.usedProducts
                    .map((p) => `${p.brand} ${p.name}`)
                    .join("; ")
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.skinType", locale)}:</span>{" "}
              {diary.skinType && SKIN_TYPE_LABEL_KEYS[diary.skinType as keyof typeof SKIN_TYPE_LABEL_KEYS]
                ? t(SKIN_TYPE_LABEL_KEYS[diary.skinType as keyof typeof SKIN_TYPE_LABEL_KEYS], locale)
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.age", locale)}:</span>{" "}
              {diary.age && AGE_LABEL_KEYS[diary.age as keyof typeof AGE_LABEL_KEYS]
                ? t(AGE_LABEL_KEYS[diary.age as keyof typeof AGE_LABEL_KEYS], locale)
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.gender", locale)}:</span>{" "}
              {diary.gender && GENDER_LABEL_KEYS[diary.gender as keyof typeof GENDER_LABEL_KEYS]
                ? t(GENDER_LABEL_KEYS[diary.gender as keyof typeof GENDER_LABEL_KEYS], locale)
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.concernTags", locale)}:</span>{" "}
              {diary.concernTags && getFirstConcernTagLabel(diary.concernTags)
                ? t(getFirstConcernTagLabel(diary.concernTags) as string, locale)
                : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.overlap", locale)}:</span>{" "}
              {diary.overlap !== null && diary.overlap !== undefined ? diary.overlap : t("settings.notSet", locale)}
            </p>
            <p>
              <span className="font-medium">{t("settings.reviewLabels.tier", locale)}:</span>{" "}
              {diary.tier ? diary.tier : t("settings.notSet", locale)}
            </p>
          </div>

          {/* 진단표 다시보기 버튼 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowReportCard(true)}
            className="w-full rounded-full text-xs font-bold mt-3"
          >
            {t("settings.reviewReportButton", locale)}
          </Button>
        </div>
      </div>

      {/* 루틴 초기화 섹션 */}
      <div className="pt-2 border-t border-border">
        {confirming ? (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-destructive">
              {t("settings.restart_confirm", locale)}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="flex-1 rounded-full">
                {t("settings.cancel", locale)}
              </Button>
              <Button type="button" onClick={handleConfirm} className="flex-1 rounded-full">
                {t("settings.restart", locale)}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirming(true)}
            className="w-full rounded-full text-xs font-bold"
          >
            {t("settings.restart_button", locale)}
          </Button>
        )}
      </div>

      {/* ReportCard 모달 */}
      {showReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowReportCard(false)}>
          <div className="relative mx-4 my-10 bg-background rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowReportCard(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-foreground font-bold"
            >
              ✕
            </button>
            <ReportCard
              mode="revisit"
              locale={locale}
              age={diary.age}
              skinType={diary.skinType}
              concernTags={diary.concernTags}
              activeIngredients={diary.activeIngredients}
              onClose={() => setShowReportCard(false)}
            />
          </div>
        </div>
      )}
    </section>
  )
}
