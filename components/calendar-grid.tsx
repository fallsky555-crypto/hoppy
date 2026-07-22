"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { RECIPE_ICON } from "@/components/recipe-icon"
import { Check } from "lucide-react"

/** 아이콘 자체를 카테고리 색으로 칠한다 — 이모지는 플랫폼마다 고정 원색이라 CSS로 톤을 맞출 수 없었다 */
const ICON_COLOR: Record<RecipeType, string> = {
  rest: "text-rest",
  aha: "text-aha",
  moist: "text-moist",
  retinol: "text-retinol",
  bha: "text-bha",
  defense_barrier: "text-defense-barrier",
  defense_toning: "text-defense-toning",
  defense_hydration: "text-defense-hydration",
  sos_rest: "text-sos-rest",
}

/** 카테고리 구분은 배경 워시가 아니라 카드 좌측 바(테두리) + 아이콘색으로만 표현한다 */
const CATEGORY_BORDER: Record<RecipeType, string> = {
  rest: "border-l-rest",
  aha: "border-l-aha",
  moist: "border-l-moist",
  retinol: "border-l-retinol",
  bha: "border-l-bha",
  defense_barrier: "border-l-defense-barrier",
  defense_toning: "border-l-defense-toning",
  defense_hydration: "border-l-defense-hydration",
  sos_rest: "border-l-sos-rest",
}

/** 캘린더 그리드 셀에 아이콘과 함께 표시할 짧은 한글 라벨 */
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
    <section className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-border" aria-label="30일 도자기 피부 루틴 캘린더">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-bold text-foreground">30일 도자기 피부 루틴 캘린더</h2>
        <span className="text-xs text-muted-foreground">가입일부터 Day {totalDays}까지</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const recipe = getRecipe(day)
          const isToday = day === currentDay
          const isSelected = day === selectedDay
          const isCompleted = completedDays.includes(day)
          const isFuture = day > currentDay
          const justStamped = day === justStampedDay

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={`Day ${day} ${recipe.title}${isCompleted ? ", 기록 완료" : ""}${isToday ? ", 오늘" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center gap-px rounded-2xl border-l-4 bg-card p-1 transition-all",
                CATEGORY_BORDER[recipe.color],
                isFuture && "opacity-55",
                isSelected
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                  : isToday
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-black/5",
              )}
            >
              <span className={cn("text-[11px] font-bold leading-none", isToday ? "text-primary" : "text-foreground/70")}>
                {day}
              </span>
              <Icon type={recipe.type} className={cn("mt-0.5 size-4", ICON_COLOR[recipe.color])} />
              <span className="text-[8px] font-semibold leading-none text-muted-foreground">{SHORT_LABEL[recipe.type]}</span>

              {isToday && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-today-accent px-1.5 py-px text-[8px] font-bold text-today-accent-foreground shadow-sm">
                  오늘
                </span>
              )}

              {isCompleted && (
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
                    justStamped ? "animate-stamp" : "",
                  )}
                >
                  <Check className="size-2.5" aria-hidden strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <Legend type="defense_barrier" label="장벽 잠금" />
        <Legend type="defense_toning" label="톤 정돈 케어" />
        <Legend type="defense_hydration" label="수분 충전" />
        <Legend type="sos_rest" label="SOS 진정" />
        <Legend type="aha" label="AHA" />
        <Legend type="bha" label="BHA" />
        <Legend type="retinol" label="레티놀" />
      </div>
    </section>
  )
}

function Icon({ type, className }: { type: RecipeType; className?: string }) {
  const IconComponent = RECIPE_ICON[type]
  return <IconComponent aria-hidden className={className} />
}

function Legend({ type, label }: { type: RecipeType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon type={type} className={cn("size-3.5", ICON_COLOR[type])} />
      {label}
    </span>
  )
}
