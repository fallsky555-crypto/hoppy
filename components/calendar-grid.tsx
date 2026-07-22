"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { Check } from "lucide-react"

/** 캘린더 그리드 셀에 표시할 짧은 한글 라벨 — 카테고리 구분은 색이 아니라 이 텍스트 라벨만으로 표현한다 */
const SHORT_LABEL: Record<RecipeType, string> = {
  rest: "휴식",
  aha: "AHA",
  moist: "수분팩",
  retinol: "레티놀",
  bha: "BHA",
  defense_barrier: "장벽",
  defense_toning: "톤정돈",
  defense_hydration: "수분",
  sos_rest: "SOS",
}

interface CalendarGridProps {
  totalDays: number
  currentDay: number
  selectedDay: number
  completedDays: number[]
  justStampedDay: number | null
  onSelect: (day: number) => void
  /** 진단이 있으면 개인화 캘린더, 없으면 기본 30일 스케줄(recipeForDay)을 사용 */
  getRecipe?: (day: number) => Recipe
}

export function CalendarGrid({
  totalDays,
  currentDay,
  selectedDay,
  completedDays,
  justStampedDay,
  onSelect,
  getRecipe = recipeForDay,
}: CalendarGridProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <section className="rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label="30일 도자기 피부 루틴 캘린더">
      <div className="mb-4 flex items-baseline justify-between gap-2 px-0.5">
        <h2 className="text-[13px] font-semibold text-foreground">30일 루틴 캘린더</h2>
        <span className="text-[11px] text-muted-foreground">Day {totalDays}까지</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const recipe = getRecipe(day)
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
              aria-label={`Day ${day} ${recipe.title}${isCompleted ? ", 기록 완료" : ""}${isToday ? ", 오늘" : ""}`}
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
                  오늘
                </span>
              )}

              {isCompleted && (
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 flex size-[15px] items-center justify-center rounded-full bg-foreground",
                    justStamped ? "animate-stamp" : "",
                  )}
                >
                  <Check className="size-2 text-white" aria-hidden strokeWidth={3.5} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
