"use client"

import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface ProgressHeaderProps {
  currentDay: number
  totalDays: number
  completedCount: number
  /** 상단 여정 카드 히어로 이미지 — "스페셜케어 사이클"마다 바뀐다(lib/hero-image.ts 참고) */
  heroImageSrc: string
}

export function ProgressHeader({ currentDay, totalDays, completedCount, heroImageSrc }: ProgressHeaderProps) {
  const locale = useLocale()
  const remaining = totalDays - currentDay

  return (
    <header className="overflow-hidden rounded-4xl bg-card ring-1 ring-border">
      {/* 텍스트와 겹치지 않는 별도 배너 영역 */}
      <img src={heroImageSrc} alt="" className="h-40 w-full object-cover" />

      <div className="px-6 py-7">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("progressHeader.tagline", locale)}</p>
        <h1 className="mt-2.5 font-display text-lg font-semibold leading-tight text-foreground text-balance">
          {t("progressHeader.title", locale)}
        </h1>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-foreground">
              {currentDay}
              <span className="font-sans text-xs font-medium text-muted-foreground">/{totalDays}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">{t("progressHeader.progress", locale)}</span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-foreground">
              {completedCount}
              <span className="font-sans text-xs font-medium text-muted-foreground">{locale === "en" ? "" : "일"}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">{t("progressHeader.completed", locale)}</span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-primary">
              {remaining}
              <span className="font-sans text-xs font-medium text-muted-foreground">{locale === "en" ? "" : "일"}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">{t("progressHeader.remaining", locale)}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
