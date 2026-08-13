"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Check, ChevronLeft, ChevronRight, Frown, Meh, Smile } from "lucide-react"

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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

type CellFillState = "recorded" | "empty" | "future" | "out-of-range"

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
  const today = startOfDay(new Date())

  // 가입일(Day 1)의 실제 날짜. 프로그램 day 번호는 이 날짜로부터의 경과일수(+1)와 정확히
  // 일치하므로(건너뛰는 날 없음), 표시는 실제 달력으로 바꾸되 day 번호 ↔ 날짜 변환만
  // 이 함수로 담당하고, loggedSlots/conditions/freeInputs 등 기존 데이터 모델(day 번호 키)은
  // 그대로 둔다 — 30일 카운팅/리포트 로직(currentDay, totalDays 비교)에는 영향 없음.
  const joinStart = useMemo(() => startOfDay(new Date(joinDate)), [joinDate])
  const lastProgramDate = useMemo(() => {
    const d = new Date(joinStart)
    d.setDate(d.getDate() + (totalDays - 1))
    return d
  }, [joinStart, totalDays])

  const minMonth = useMemo(() => startOfMonth(joinStart), [joinStart])
  const maxMonth = useMemo(() => startOfMonth(lastProgramDate), [lastProgramDate])

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const todayMonth = startOfMonth(today)
    if (todayMonth < minMonth) return minMonth
    if (todayMonth > maxMonth) return maxMonth
    return todayMonth
  })

  function programDayForDate(date: Date): number | null {
    const diffDays = Math.round((startOfDay(date).getTime() - joinStart.getTime()) / 86_400_000)
    const day = diffDays + 1
    return day >= 1 && day <= totalDays ? day : null
  }

  function getSlotIcon(day: number): string | null {
    const slots = loggedSlots[day] ?? []
    const slotSet = new Set(slots.map((s) => s.slot))

    // 우선순위 기반 아이콘 선택
    if (slotSet.has("special_care_trouble")) return "🩹"
    if (slotSet.has("special_care_mask")) return "🫙"
    if (slotSet.has("active")) return "🎯"
    if (slotSet.has("barrier")) return "🌿"

    return null
  }

  const atMinMonth = isSameMonth(viewMonth, minMonth)
  const atMaxMonth = isSameMonth(viewMonth, maxMonth)

  function goToPrevMonth() {
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      return next < minMonth ? minMonth : next
    })
  }

  function goToNextMonth() {
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      return next > maxMonth ? maxMonth : next
    })
  }

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" }),
    [locale],
  )
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric" }),
    [locale],
  )

  const cells = useMemo(() => {
    const gridStart = new Date(viewMonth)
    gridStart.setDate(gridStart.getDate() - viewMonth.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [viewMonth])

  return (
    <section className="rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("calendar.ariaLabel", locale)}>
      <div className="mb-4 flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[13px] font-semibold text-foreground">{t("calendar.title", locale)}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={atMinMonth}
            aria-label={t("calendar.prevMonth", locale)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors",
              atMinMonth ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:bg-secondary",
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="min-w-[92px] text-center text-[12px] font-semibold tabular-nums text-foreground">
            {monthFormatter.format(viewMonth)}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={atMaxMonth}
            aria-label={t("calendar.nextMonth", locale)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors",
              atMaxMonth ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:bg-secondary",
            )}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
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

        {/* Calendar grid — 실제 월간 날짜 그리드. 이전/다음 달의 넘치는 날짜도 채워서 보여준다 */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date) => {
            const programDay = programDayForDate(date)
            const inProgram = programDay !== null
            const isCurrentMonth = isSameMonth(date, viewMonth)
            const isToday = isSameDate(date, today)
            const isFuture = date.getTime() > today.getTime()
            const isSelected = inProgram && programDay === selectedDay
            const isCompleted = inProgram && completedDays.includes(programDay)
            const clickable = inProgram && !isFuture
            const justStamped = inProgram && programDay === justStampedDay
            const slotIcon = inProgram ? getSlotIcon(programDay) : null
            const condition = inProgram ? conditions[programDay] : undefined
            const highlighted = isToday || isSelected

            const fillState: CellFillState = !inProgram
              ? "out-of-range"
              : isFuture
                ? "future"
                : isCompleted
                  ? "recorded"
                  : "empty"

            // 4가지 상태(미래 / 오늘 / 과거·기록없음 / 과거·기록있음)를 시각적으로 구분한다.
            // border-width/border-color/배경/불투명도를 각각 정확히 하나의 값으로만 계산해서
            // (twMerge가 나중 클래스를 우선하므로) 클래스 충돌 없이 결정한다.
            const borderColorClass = highlighted
              ? "border-primary"
              : fillState === "recorded"
                ? "border-primary/30"
                : fillState === "out-of-range"
                  ? "border-transparent"
                  : "border-[#D8D3C4]"
            const bgClass = fillState === "recorded" ? "bg-primary/10" : "bg-card"
            // 오늘은 border-2로 이미 강조되므로 empty/future 상태의 흐림 처리를 적용하지 않는다 —
            // "기록 안 한 오늘"이 "기록 안 한 과거"와 같은 밝기로 흐려 보이면 강조 효과가 죽는다.
            const opacityClass = isToday
              ? ""
              : isCurrentMonth
                ? fillState === "recorded"
                  ? ""
                  : fillState === "empty"
                    ? "opacity-70"
                    : fillState === "future"
                      ? "opacity-40"
                      : "opacity-30"
                : fillState === "recorded"
                  ? "opacity-80"
                  : fillState === "empty"
                    ? "opacity-40"
                    : fillState === "future"
                      ? "opacity-25"
                      : "opacity-20"
            const dateTextClass = isToday
              ? "text-primary-text"
              : fillState === "empty" || fillState === "out-of-range"
                ? "text-muted-foreground"
                : "text-foreground"

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={!clickable}
                onClick={() => {
                  if (!clickable || programDay === null) return
                  onSelect(programDay)
                }}
                aria-label={`${dateFormatter.format(date)}${slotIcon ? ` ${slotIcon}` : ""}${isCompleted ? ` ${t("calendar.completed", locale)}` : ""}${condition ? ` ${t(`calendar.condition_${condition}`, locale)}` : ""}${isToday ? t("calendar.today", locale) : ""}${isFuture ? ` ${t("calendar.future", locale)}` : ""}`}
                aria-disabled={!clickable}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl p-0.5 shadow-[0_1px_2px_rgba(30,29,26,0.04)] transition-all",
                  highlighted ? "border-2" : "border",
                  borderColorClass,
                  bgClass,
                  opacityClass,
                  clickable ? "cursor-pointer" : "cursor-not-allowed",
                  isToday && revealPulse && "animate-today-pulse",
                )}
              >
                <span className={cn("text-xs font-extrabold leading-none", dateTextClass)}>
                  {date.getDate()}
                </span>
                {slotIcon && <span className="text-lg leading-none">{slotIcon}</span>}

                {isToday && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-text-foreground">
                    {t("calendar.todayBadge", locale)}
                  </span>
                )}

                {isCompleted && (
                  (() => {
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
