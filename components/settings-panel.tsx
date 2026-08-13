"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
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

      {/* 결과지 다시보기 — 체커 데이터 없음/일부만 있음 처리는 ReportCard(mode="revisit")가 알아서 한다 */}
      <div className="pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowReportCard(true)}
          className="w-full rounded-full text-xs font-bold"
        >
          {t("settings.reviewReportButton", locale)}
        </Button>
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
              checkerResultUrl={diary.checkerResultUrl}
              onClose={() => setShowReportCard(false)}
            />
          </div>
        </div>
      )}
    </section>
  )
}
