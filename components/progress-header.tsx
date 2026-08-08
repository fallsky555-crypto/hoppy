"use client"

import Image from "next/image"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface ProgressHeaderProps {
  currentDay: number
  totalDays: number
  loggedDays: number[]
  /** 상단 여정 카드 히어로 이미지 — "스페셜케어 사이클"마다 바뀐다(lib/hero-image.ts 참고) */
  heroImageSrc: string
  /** 사용자 나이대 i18n 라벨 키 (예: "settings.ageLabel.thirties") — 없으면 배지 미표시 */
  ageLabel?: string
  /** 사용자 주요 피부고민 i18n 라벨 키 (예: "onboarding.concernLabel.dry") — 없으면 배지 미표시 */
  firstConcernTagLabel?: string
}

export function ProgressHeader({ currentDay, totalDays, loggedDays, heroImageSrc, ageLabel, firstConcernTagLabel }: ProgressHeaderProps) {
  const locale = useLocale()

  // 기록한 날 수
  const loggedCount = loggedDays.length

  // 이번 주 기록 (최근 7일: currentDay-6 ~ currentDay)
  const thisWeekCount = loggedDays.filter(day => day >= currentDay - 6 && day <= currentDay).length

  // 리포트까지 남은 날
  const daysUntilReport = Math.max(0, 30 - loggedCount)
  const isReportReady = loggedCount >= 30

  return (
    <header className="overflow-hidden rounded-4xl bg-card ring-1 ring-border">
      {/* 텍스트와 겹치지 않는 별도 배너 영역 */}
      <div className="relative h-40 w-full">
        <Image
          src={heroImageSrc}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="px-6 py-7">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("progressHeader.tagline", locale)}</p>
        <div className="mt-2.5 flex items-center gap-3">
          <h1 className="flex-1 truncate font-display text-lg font-semibold leading-tight text-foreground">
            {t("progressHeader.title", locale)}
          </h1>
          {(ageLabel || firstConcernTagLabel) && (
            <div className="flex shrink-0 gap-1.5">
              {ageLabel && (
                <span className="rounded-2xl bg-secondary px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
                  {t(ageLabel, locale)}
                </span>
              )}
              {firstConcernTagLabel && (
                <span className="rounded-2xl bg-secondary px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
                  {t(firstConcernTagLabel, locale)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-foreground">
              {loggedCount}
              <span className="font-sans text-xs font-medium text-muted-foreground">/{totalDays}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">{t("homeStats.loggedDays", locale)}</span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-foreground">
              {thisWeekCount}
              <span className="font-sans text-xs font-medium text-muted-foreground">/7</span>
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">{t("homeStats.thisWeek", locale)}</span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
            <span className="font-display text-2xl font-semibold text-primary-text">
              {isReportReady ? "✓" : `D-${daysUntilReport}`}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {isReportReady ? t("homeStats.reportReady", locale) : t("homeStats.untilReport", locale)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
