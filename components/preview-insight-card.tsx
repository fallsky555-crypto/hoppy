"use client"

import { Sparkles, Lock } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"

/** 이 구간 아래(7일 이상)부터는 SkinBalanceRadar의 실제 오버레이가 같은 역할을 대신한다 */
const MIN_LOGGED_DAYS = 3
const MAX_LOGGED_DAYS = 7

const EXAMPLE_KEYS = [
  "previewInsightCard.example1",
  "previewInsightCard.example2",
  "previewInsightCard.example3",
] as const

export function PreviewInsightCard() {
  const locale = useLocale()
  const diary = useDiary()
  const loggedCount = diary.loggedDays?.length ?? 0

  if (loggedCount < MIN_LOGGED_DAYS || loggedCount >= MAX_LOGGED_DAYS) return null

  const progress = interpolate(t("previewInsightCard.progress", locale), {
    count: String(loggedCount),
  })

  const scrollToDailySlots = () => {
    document.getElementById("daily-slots-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-3xl bg-secondary/30 p-4 ring-1 ring-border"
      aria-label={t("previewInsightCard.label", locale)}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs font-semibold text-foreground">{t("previewInsightCard.label", locale)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs leading-relaxed text-muted-foreground">{t("previewInsightCard.body1", locale)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("previewInsightCard.body2", locale)}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("previewInsightCard.body3", locale)}</p>
      </div>

      <div className="space-y-1.5 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-border">
        {EXAMPLE_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <p className="select-none text-xs text-foreground/70 blur-[3px]">{t(key, locale)}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">{progress}</p>

      <button
        type="button"
        onClick={scrollToDailySlots}
        className="w-fit rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("previewInsightCard.cta", locale)}
      </button>
    </section>
  )
}
