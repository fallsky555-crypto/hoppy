"use client"

import { cn } from "@/lib/utils"
import type { Recipe, RecipeType } from "@/lib/schedule"
import { getRecipes } from "@/lib/schedule"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Check, Smile, Meh, Frown } from "lucide-react"

interface CalendarGridProps {
  totalDays: number
  currentDay: number
  selectedDay: number
  completedDays: number[]
  justStampedDay: number | null
  onSelect: (day: number) => void
  getRecipe: (day: number) => Recipe
  conditions?: Record<number, "good" | "neutral" | "bad">
}

export function CalendarGrid({
  totalDays,
  currentDay,
  selectedDay,
  completedDays,
  justStampedDay,
  onSelect,
  getRecipe,
  conditions = {},
}: CalendarGridProps) {
  const locale = useLocale()
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  // SHORT_LABEL을 컴포넌트 내부로 이동 (locale 사용 가능)
  const SHORT_LABEL: Record<RecipeType, string> = {
    bha: t("calendar.labels.bha", locale),
    retinol: t("calendar.labels.retinol", locale),
    defense_barrier: t("calendar.labels.defense_barrier", locale),
    defense_toning: t("calendar.labels.defense_toning", locale),
    defense_hydration: t("calendar.labels.defense_hydration", locale),
    barrier_lock: t("calendar.labels.barrier_lock", locale),
    hydration_lock: t("calendar.labels.hydration_lock", locale),
    toning_solo: t("calendar.labels.toning_solo", locale),
    sos_rest: t("calendar.labels.sos_rest", locale),
  }

  return (
    <section className="rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("calendar.ariaLabel", locale)}>
      <div className="mb-4 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-[13px] font-semibold text-foreground">{t("calendar.title", locale)}</h2>
        <span className="text-[11px] text-muted-foreground">{interpolate(t("calendar.dayIndicator", locale), { totalDays: String(totalDays) })}</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const recipe = getRecipe(day)
          const localizedRecipe = getRecipes(locale)[recipe.type]
          const isToday = day === currentDay
          const isSelected = day === selectedDay
          const isCompleted = completedDays.includes(day)
          const isFuture = day > currentDay
          const justStamped = day === justStampedDay
          const highlighted = isSelected || isToday

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={`Day ${day} ${localizedRecipe.title}${isCompleted ? ` ${t("calendar.completed", locale)}` : ""}${conditions[day] ? ` ${t(`calendar.condition_${conditions[day]}`, locale)}` : ""}${isToday ? t("calendar.today", locale) : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border bg-card p-0.5 shadow-[0_1px_2px_rgba(30,29,26,0.04)] transition-all",
                highlighted ? "border-2 border-primary" : "border-[#D8D3C4]",
                isFuture && "opacity-60",
              )}
            >
              <span className={cn("text-xs font-extrabold leading-none", isToday ? "text-primary" : "text-foreground")}>
                {day}
              </span>
              <span className="text-[9.5px] font-bold leading-none text-[#5C5648]">{SHORT_LABEL[recipe.type]}</span>

              {isToday && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground">
                  {t("calendar.todayBadge", locale)}
                </span>
              )}

              {isCompleted && (
                (() => {
                  const condition = conditions[day]
                  const bgColor =
                    condition === "good"
                      ? "bg-today-accent"
                      : condition === "neutral"
                        ? "bg-defense-hydration"
                        : condition === "bad"
                          ? "bg-toning-solo"
                          : "bg-foreground"
                  const Icon =
                    condition === "good" ? Smile : condition === "neutral" ? Meh : condition === "bad" ? Frown : Check

                  return (
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 flex size-[20px] items-center justify-center rounded-full",
                        bgColor,
                        justStamped ? "animate-stamp" : "",
                      )}
                    >
                      <Icon className="size-4 text-white" aria-hidden strokeWidth={3} />
                    </span>
                  )
                })()
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
