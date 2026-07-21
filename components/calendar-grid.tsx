"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { RECIPE_ICON } from "@/components/recipe-icon"

/** 12-1(v1.6). 아이콘 자체를 흙톤 팔레트로 칠한다 — 이모지는 플랫폼마다 고정 원색이라 CSS로 톤을 맞출 수 없었다 */
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

const CELL_TINT: Record<RecipeType, string> = {
  rest: "bg-rest-soft",
  aha: "bg-aha-soft",
  moist: "bg-moist-soft",
  retinol: "bg-retinol-soft",
  bha: "bg-bha-soft",
  defense_barrier: "bg-defense-barrier-soft",
  defense_toning: "bg-defense-toning-soft",
  defense_hydration: "bg-defense-hydration-soft",
  sos_rest: "bg-sos-rest-soft",
}

const DOT_COLOR: Record<RecipeType, string> = {
  rest: "bg-rest",
  aha: "bg-aha",
  moist: "bg-moist",
  retinol: "bg-retinol",
  bha: "bg-bha",
  defense_barrier: "bg-defense-barrier",
  defense_toning: "bg-defense-toning",
  defense_hydration: "bg-defense-hydration",
  sos_rest: "bg-sos-rest",
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
    <section className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-border" aria-label="1개월 차 디데이 스케줄러">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-bold text-foreground">1개월 차 리셋 캘린더</h2>
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
              aria-label={`Day ${day} ${recipe.tag}${isCompleted ? ", 기록 완료" : ""}${isToday ? ", 오늘" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all",
                CELL_TINT[recipe.color],
                isFuture && "opacity-55",
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : "ring-1 ring-black/5",
                isToday && !isSelected && "ring-2 ring-primary/40",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-bold leading-none",
                  isToday ? "text-primary" : "text-foreground/70",
                )}
              >
                {day}
              </span>
              <CalendarIcon type={recipe.type} className="mt-0.5 size-5" />
              <span aria-hidden className={cn("mt-1 size-2 rounded-full", DOT_COLOR[recipe.color])} />

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

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <Legend type="defense_barrier" label="보호막 케어" />
        <Legend type="defense_toning" label="톤 정돈 케어" />
        <Legend type="defense_hydration" label="속수분 케어" />
        <Legend type="sos_rest" label="긴급 진정 케어" />
        <Legend type="aha" label="AHA 스케일링" />
        <Legend type="bha" label="BHA 모공 케어" />
        <Legend type="retinol" label="레티놀 재생" />
      </div>
    </section>
  )
}

function CalendarIcon({ type, className }: { type: RecipeType; className?: string }) {
  const Icon = RECIPE_ICON[type]
  return <Icon aria-hidden className={cn(ICON_COLOR[type], className)} />
}

function Legend({ type, label }: { type: RecipeType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <CalendarIcon type={type} className="size-3.5" />
      {label}
    </span>
  )
}
