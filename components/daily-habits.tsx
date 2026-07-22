"use client"

import { cn } from "@/lib/utils"
import type { DailyHabit } from "@/lib/use-diary"
import { Check, Droplet, Minus, Plus, Sun } from "lucide-react"

interface DailyHabitsProps {
  day: number
  habit: DailyHabit
  maxWater: number
  onToggleSunscreen: () => void
  onWater: (delta: number) => void
}

export function DailyHabits({ day, habit, maxWater, onToggleSunscreen, onWater }: DailyHabitsProps) {
  return (
    <section className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-border" aria-label="매일 기본 습관 체크리스트">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-foreground">매일 기본 습관</h2>
        <span className="text-xs text-muted-foreground">Day {day}</span>
      </div>

      {/* 선크림 발랐어요 */}
      <button
        type="button"
        onClick={onToggleSunscreen}
        aria-pressed={habit.sunscreen}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-left ring-1 transition-colors",
          habit.sunscreen ? "ring-retinol/40" : "ring-border",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            habit.sunscreen ? "bg-retinol text-white" : "bg-card text-muted-foreground",
          )}
        >
          <Sun className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-foreground">선크림 발랐어요</span>
          <span className="block text-[11px] text-muted-foreground">자외선 차단은 장벽 회복의 기본이에요</span>
        </span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            habit.sunscreen ? "border-retinol bg-retinol text-white" : "border-border bg-card",
          )}
          aria-hidden
        >
          {habit.sunscreen && <Check className="size-3.5" />}
        </span>
      </button>

      {/* 물 마신 잔 수 */}
      <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3 ring-1 ring-moist/30">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-moist text-white">
          <Droplet className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-foreground">물 마신 잔 수</span>
          <span className="block text-[11px] text-muted-foreground">하루 {maxWater}잔을 목표로 해요</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onWater(-1)}
            disabled={habit.water <= 0}
            aria-label="물 잔 수 줄이기"
            className="flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border transition-opacity disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-display text-lg font-bold tabular-nums text-foreground" aria-live="polite">
            {habit.water}
          </span>
          <button
            type="button"
            onClick={() => onWater(1)}
            disabled={habit.water >= maxWater}
            aria-label="물 잔 수 늘리기"
            className="flex size-8 items-center justify-center rounded-full bg-moist text-white shadow-sm transition-opacity disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* 물 잔 진행 표시 */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden>
        {Array.from({ length: maxWater }, (_, i) => (
          <Droplet
            key={i}
            className={cn(
              "size-4 transition-colors",
              i < habit.water ? "fill-moist text-moist" : "fill-transparent text-border",
            )}
          />
        ))}
      </div>
    </section>
  )
}
