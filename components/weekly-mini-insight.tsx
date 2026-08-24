"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { calculateUsagePattern } from "@/lib/report-analytics"

/** 7·14일차는 daily-tip.ts의 checkWeeklyBalance가 이미 담당하므로 여기서는 21·28일차만 다룬다 */
const MILESTONES = [21, 28]

const SLOT_TAG_LABELS: Record<string, Record<"ko" | "en", string>> = {
  "Exfoliation": { ko: "각질케어", en: "Exfoliation" },
  "Hydration": { ko: "수분케어", en: "Hydration" },
  "Active/Stimulate": { ko: "고민케어", en: "Active Care" },
  "Defense/Barrier": { ko: "진정케어", en: "Barrier Care" },
  "Sun": { ko: "자외선차단", en: "Sun Protection" },
}

/** milestone 시점 기준 최근 7일(day > milestone-7 && day <= milestone)의 슬롯만 펼쳐서 반환 */
function pickWeekSlots(
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>,
  milestone: number
): Array<{ slot: string; tag: string }> {
  const flat: Array<{ slot: string; tag: string }> = []
  for (const [dayStr, slots] of Object.entries(loggedSlots)) {
    const day = Number(dayStr)
    if (day > milestone - 7 && day <= milestone) flat.push(...slots)
  }
  return flat
}

export function WeeklyMiniInsight() {
  const locale = useLocale()
  const diary = useDiary()
  const [showInsight, setShowInsight] = useState(false)
  const [topTag, setTopTag] = useState<string>("")
  const [milestone, setMilestone] = useState<number>(0)

  useEffect(() => {
    if (!diary.loggedDays || !diary.seenMilestones) return

    const loggedCount = diary.loggedDays.length
    const seenSet = new Set(diary.seenMilestones)

    for (const m of MILESTONES) {
      if (loggedCount >= m && !seenSet.has(m)) {
        const weekSlots = pickWeekSlots(diary.loggedSlots, m)
        const pattern = calculateUsagePattern(weekSlots).filter((p) => p.count > 0)
        const top = pattern.length > 0
          ? pattern.reduce((max, p) => (p.count > max.count ? p : max), pattern[0])
          : null

        setTopTag(top?.tag ?? "")
        setMilestone(m)
        setShowInsight(true)
        diary.markMilestoneAsSeen(m)
        return
      }
    }
  }, [diary.loggedDays, diary.seenMilestones, diary.loggedSlots])

  if (!showInsight || milestone === 0) return null

  const remaining = 30 - diary.loggedDays.length
  const message = topTag
    ? interpolate(t("weeklyInsight.banner", locale), {
        topTag: SLOT_TAG_LABELS[topTag]?.[locale] ?? topTag,
        remaining: String(remaining),
      })
    : interpolate(t("weeklyInsight.bannerNoTag", locale), { remaining: String(remaining) })

  return (
    <section
      className="flex items-center gap-2.5 rounded-3xl bg-secondary/30 px-4 py-3 ring-1 ring-border"
      aria-label={t("weeklyInsight.ariaLabel", locale)}
    >
      <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-xs font-medium leading-relaxed text-foreground">{message}</p>
    </section>
  )
}
