"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"

const CELL_TINT: Record<RecipeType, string> = {
  rest: "bg-rest-soft",
  aha: "bg-aha-soft",
  moist: "bg-moist-soft",
  retinol: "bg-retinol-soft",
  bha: "bg-bha-soft",
}

const DOT_COLOR: Record<RecipeType, string> = {
  rest: "bg-rest",
  aha: "bg-aha",
  moist: "bg-moist",
  retinol: "bg-retinol",
  bha: "bg-bha",
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
    <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border" aria-label="1개월 차 디데이 스케줄러">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-bold text-foreground">1개월 차 리셋 캘린더</h2>
        <span className="text-xs text-muted-foreground">가입일부터 Day {totalDays}까지</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
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
              aria-label={`Day ${day} ${recipe.tag}${isCompleted ? ", 기록 완료" : ""}${isToday ? ", 오늘" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl p-0.5 transition-all",
                CELL_TINT[recipe.color],
                isFuture && "opacity-55",
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : "ring-1 ring-black/5",
                isToday && !isSelected && "ring-2 ring-primary/40",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold leading-none",
                  isToday ? "text-primary" : "text-foreground/70",
                )}
              >
                {day}
              </span>
              <span aria-hidden className="mt-0.5 text-base leading-none">
                {recipe.emoji}
              </span>
              <span aria-hidden className={cn("mt-1 size-1.5 rounded-full", DOT_COLOR[recipe.color])} />

              {isToday && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-px text-[8px] font-bold text-primary-foreground shadow-sm">
                  오늘
                </span>
              )}

              {isCompleted && (
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    justStamped ? "animate-stamp" : "",
                  )}
                >
                  <Image
                    src="/paw-stamp.png"
                    alt=""
                    width={30}
                    height={30}
                    className="size-7 rotate-[-12deg] object-contain opacity-90 drop-shadow-sm"
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <Legend emoji="🌿" label="장벽 휴식" />
        <Legend emoji="🧼" label="AHA 스케일링" />
        <Legend emoji="💦" label="수분팩" />
        <Legend emoji="🧪" label="레티놀 재생" />
        <Legend emoji="🧴" label="BHA 모공 케어" />
      </div>
    </section>
  )
}

function Legend({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden>{emoji}</span>
      {label}
    </span>
  )
}
