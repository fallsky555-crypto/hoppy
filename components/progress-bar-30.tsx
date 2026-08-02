"use client"

import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface ProgressBar30Props {
  loggedDays: number[]
}

export function ProgressBar30({ loggedDays }: ProgressBar30Props) {
  const locale = useLocale()
  const count = loggedDays.length
  const daysUntilReport = Math.max(0, 30 - count)
  const isComplete = count >= 30

  const progressPercentage = Math.min((count / 30) * 100, 100)

  return (
    <div className="rounded-4xl bg-card px-6 py-5 ring-1 ring-border space-y-3">
      {/* 텍스트 정보 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {isComplete
            ? t("progressBar.reportReady", locale)
            : interpolate(t("progressBar.loggedDays", locale), { count: String(count) })}
        </span>
        {!isComplete && (
          <span className="text-xs font-medium text-muted-foreground">
            {interpolate(t("progressBar.daysUntilReport", locale), { count: String(daysUntilReport) })}
          </span>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* 30일 눈금 표시 (선택사항) */}
      <div className="flex justify-between items-center px-0">
        <span className="text-[10px] font-medium text-muted-foreground">Day 1</span>
        <span className="text-[10px] font-medium text-muted-foreground">Day 15</span>
        <span className="text-[10px] font-medium text-muted-foreground">Day 30</span>
      </div>
    </div>
  )
}
