"use client"

import { cn } from "@/lib/utils"
import type { Recipe, RecipeType } from "@/lib/schedule"
import { Check } from "lucide-react"

/** 캘린더 그리드 셀에 표시할 짧은 한글 라벨 — 카테고리 구분은 색이 아니라 이 텍스트 라벨만으로 표현한다 */
const SHORT_LABEL: Record<RecipeType, string> = {
  bha: "BHA",
  retinol: "레티놀",
  defense_barrier: "장벽",
  defense_toning: "톤정돈",
  defense_hydration: "수분",
  barrier_lock: "밀폐",
  hydration_lock: "수분잠금",
  toning_solo: "비타민C",
  sos_rest: "SOS",
}

/** 마일스톤(Day 1 또는 BHA 사이클 시작일) 셀에 얹는 원형 초상 오버레이 이미지 */
const DAY_ONE_MILESTONE_IMAGE = "/milestones/day1-camera.jpeg"
const DEFAULT_MILESTONE_IMAGE = "/hero/hero-01.jpeg"

interface CalendarGridProps {
  totalDays: number
  currentDay: number
  selectedDay: number
  completedDays: number[]
  justStampedDay: number | null
  onSelect: (day: number) => void
  getRecipe: (day: number) => Recipe
}

export function CalendarGrid({
  totalDays,
  currentDay,
  selectedDay,
  completedDays,
  justStampedDay,
  onSelect,
  getRecipe,
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
          const isMilestone = recipe.type === "bha" || day === 1
          const milestoneImageSrc = day === 1 ? DAY_ONE_MILESTONE_IMAGE : DEFAULT_MILESTONE_IMAGE

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={`Day ${day} ${recipe.title}${isCompleted ? ", 기록 완료" : ""}${isToday ? ", 오늘" : ""}${isMilestone ? ", 마일스톤" : ""}`}
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

              {isMilestone && (
                <span className="absolute -bottom-1 -left-1 size-4 overflow-hidden rounded-full ring-2 ring-card">
                  <img src={milestoneImageSrc} alt="" className="size-full object-cover" />
                </span>
              )}

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
