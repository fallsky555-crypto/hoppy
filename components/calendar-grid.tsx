"use client"

import { cn } from "@/lib/utils"
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
  loggedSlots?: Record<number, Array<{ slot: string; tag: string }>>
  conditions?: Record<number, "good" | "neutral" | "bad">
  joinDate: string
  revealPulse?: boolean
}

export function CalendarGrid({
  totalDays,
  currentDay,
  selectedDay,
  completedDays,
  justStampedDay,
  onSelect,
  loggedSlots = {},
  conditions = {},
  joinDate,
  revealPulse = false,
}: CalendarGridProps) {
  const locale = useLocale()
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  function dateForDay(joinISO: string, day: number): Date {
    const start = new Date(joinISO)
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    d.setDate(d.getDate() + (day - 1))
    return d
  }

  const day1Weekday = dateForDay(joinDate, 1).getDay()

  function getSlotIcon(day: number): string | null {
    const slots = loggedSlots[day] ?? []
    const slotSet = new Set(slots.map(s => s.slot))

    // 우선순위 기반 아이콘 선택
    if (slotSet.has("special_care_trouble")) return "🩹"
    if (slotSet.has("special_care_mask")) return "🫙"
    if (slotSet.has("active")) return "🎯"
    if (slotSet.has("barrier")) return "🌿"

    return null
  }

  return (
    <section className="rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("calendar.ariaLabel", locale)}>
      <div className="mb-4 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-[13px] font-semibold text-foreground">{t("calendar.title", locale)}</h2>
        <span className="text-[11px] text-muted-foreground">{interpolate(t("calendar.dayIndicator", locale), { totalDays: String(totalDays) })}</span>
      </div>

      <div className="space-y-2">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5">
          {(t("calendar.weekdays", locale) as string[]).map((label: string, i: number) => (
            <div key={i} className="flex h-6 items-center justify-center text-[11px] font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Placeholder divs for weekday alignment */}
          {Array.from({ length: day1Weekday }).map((_, i) => (
            <div key={`placeholder-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const slotIcon = getSlotIcon(day)
            const isToday = day === currentDay
            const isSelected = day === selectedDay
            const isCompleted = completedDays.includes(day)
            const isFuture = day > currentDay
            const justStamped = day === justStampedDay
            const highlighted = isSelected || isToday
            const actualDate = dateForDay(joinDate, day)
            const dateOfMonth = actualDate.getDate()

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelect(day)}
                aria-label={`Day ${day} ${dateOfMonth}${slotIcon ? ` ${slotIcon}` : ""}${isCompleted ? ` ${t("calendar.completed", locale)}` : ""}${conditions[day] ? ` ${t(`calendar.condition_${conditions[day]}`, locale)}` : ""}${isToday ? t("calendar.today", locale) : ""}`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border bg-card p-0.5 shadow-[0_1px_2px_rgba(30,29,26,0.04)] transition-all",
                  highlighted ? "border-2 border-primary" : "border-[#D8D3C4]",
                  isFuture && "opacity-60",
                  isToday && revealPulse && "animate-today-pulse",
                )}
              >
                <span className={cn("text-xs font-extrabold leading-none", isToday ? "text-primary-text" : "text-foreground")}>
                  {dateOfMonth}
                </span>
                {slotIcon && <span className="text-lg leading-none">{slotIcon}</span>}

                {/* Program day badge */}
                <span className="absolute top-1 left-1 text-[7px] font-semibold text-muted-foreground opacity-60">
                  D{day}
                </span>

                {isToday && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-text-foreground">
                    {t("calendar.todayBadge", locale)}
                  </span>
                )}

                {isCompleted && (
                  (() => {
                    const condition = conditions[day]
                    const Icon =
                      condition === "good" ? Smile : condition === "neutral" ? Meh : condition === "bad" ? Frown : Check

                    return (
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-card size-6",
                          justStamped ? "animate-stamp" : "",
                        )}
                      >
                        <Icon className="size-5 text-primary" aria-hidden strokeWidth={3} />
                      </span>
                    )
                  })()
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
