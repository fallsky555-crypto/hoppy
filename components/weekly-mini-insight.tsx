"use client"

import { useEffect, useState } from "react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/use-diary"
import { X } from "lucide-react"

interface SlotInfo {
  slot: string
  tag: string
}

const SLOT_TAG_LABELS: Record<string, Record<"ko" | "en", string>> = {
  "Prep": { ko: "클렌징", en: "Cleansing" },
  "Hydration": { ko: "수분케어", en: "Hydration" },
  "Active/Stimulate": { ko: "고민케어", en: "Active Care" },
  "Defense/Barrier": { ko: "진정케어", en: "Barrier Care" },
  "Sun": { ko: "자외선차단", en: "Sun Protection" },
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
    const milestones = [7, 14, 21, 28]
    const seenSet = new Set(diary.seenMilestones)

    for (const m of milestones) {
      if (loggedCount >= m && !seenSet.has(m)) {
        // Dummy: 랜덤 tag 선택 (실제로는 usage_log 데이터 필요)
        const dummyTags = ["Active/Stimulate", "Hydration", "Defense/Barrier", "Prep", "Sun"]
        const selectedTag = dummyTags[Math.floor(Math.random() * dummyTags.length)]

        setTopTag(selectedTag)
        setMilestone(m)
        setShowInsight(true)
        diary.markMilestoneAsSeen(m)
        return
      }
    }
  }, [diary.loggedDays, diary.seenMilestones])

  if (!showInsight) return null

  const tagLabel = SLOT_TAG_LABELS[topTag]?.[locale] || topTag
  const remaining = 30 - diary.loggedDays.length
  const message = interpolate(t("weeklyInsight.message", locale), {
    days: String(milestone),
    topTag: tagLabel,
    remaining: String(remaining),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="flex items-start justify-between gap-4">
          <p className="flex-1 text-sm font-semibold leading-relaxed text-foreground">
            {message}
          </p>
          <button
            onClick={() => setShowInsight(false)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t("weeklyInsight.close", locale)}
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>
        <button
          onClick={() => setShowInsight(false)}
          className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/85"
        >
          {t("weeklyInsight.close", locale)}
        </button>
      </div>
    </div>
  )
}
