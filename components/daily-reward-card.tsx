"use client"

import { useEffect, useState } from "react"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

export interface RewardCardData {
  specialCare: Array<"mask" | "trouble">
  hasActive: boolean
  hasBarrier: boolean
  freeInput: string
}

interface DailyRewardCardProps {
  data: RewardCardData
  locale: Locale
  onDone: () => void
}

const VISIBLE_MS = 3800
const FADE_OUT_MS = 400

export function DailyRewardCard({ data, locale, onDone }: DailyRewardCardProps) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), VISIBLE_MS)
    const doneTimer = setTimeout(onDone, VISIBLE_MS + FADE_OUT_MS)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  const lines: string[] = []
  for (const care of data.specialCare) {
    const valueLabel = t(`dailySlots.specialCare.option_${care}`, locale)
    lines.push(`${t("dailySlots.specialCare.title", locale)} – ${valueLabel}`)
  }
  if (data.hasActive) lines.push(t("dailySlots.slots.active", locale))
  if (data.hasBarrier) lines.push(t("dailySlots.slots.barrier", locale))
  if (data.freeInput) lines.push(data.freeInput)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 px-6 pointer-events-none">
      <div
        className={`w-full max-w-[280px] rounded-3xl bg-card ring-1 ring-border shadow-lg p-6 flex flex-col items-center gap-3 ${
          leaving ? "animate-reward-out" : "animate-reward-in"
        }`}
      >
        <img
          src="/rewards/flowers/flower-08-sunflower.png"
          alt=""
          className="size-20 object-contain"
        />
        <p className="text-sm font-bold text-center text-foreground">
          {t("dailySlots.reward.title", locale)}
        </p>
        {lines.length > 0 && (
          <div className="font-handwriting text-center text-sm text-foreground space-y-1">
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
