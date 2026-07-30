"use client"

import { cn } from "@/lib/utils"
import type { DailyHabit } from "@/lib/use-diary"
import { Check, Droplet, Minus, Plus, Sun } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface DailyHabitsProps {
  day: number
  habit: DailyHabit
  maxWater: number
  onToggleSunscreen: () => void
  onWater: (delta: number) => void
}

export function DailyHabits({ day, habit, maxWater, onToggleSunscreen, onWater }: DailyHabitsProps) {
  const locale = useLocale()
  return (
    <section className="rounded-4xl bg-card px-5 py-5 ring-1 ring-border" aria-label="매일 기본 습관 체크리스트">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">{t("daily_habits.title", locale)}</h2>
        <span className="text-[11px] text-muted-foreground">Day {day}</span>
      </div>

      {/* 선크림 발랐어요 */}
      <button
        type="button"
        onClick={onToggleSunscreen}
        aria-pressed={habit.sunscreen}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
          habit.sunscreen ? "border-2 border-primary bg-[#E3E3DC]" : "border-[#DCD7C9] bg-secondary",
        )}
      >
        <span
          className={cn(
            "flex size-[34px] shrink-0 items-center justify-center rounded-full",
            habit.sunscreen ? "bg-primary text-white" : "bg-[#E3DFD3] text-[#5C5648]",
          )}
        >
          <Sun className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-foreground">{t("daily_habits.sunscreen_label", locale)}</span>
          <span className="mt-0.5 block text-[12.5px] text-[#6B6558]">{t("daily_habits.sunscreen_description", locale)}</span>
        </span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            habit.sunscreen ? "border-primary bg-primary" : "border-[#9A9384] bg-transparent",
          )}
          aria-hidden
        >
          {habit.sunscreen && <Check className="size-2.5 text-white" strokeWidth={3} />}
        </span>
      </button>

      {/* 물 마신 잔 수 */}
      <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-secondary p-3.5">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Droplet className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-foreground">{t("daily_habits.water_label", locale)}</span>
          <span className="mt-0.5 block text-[12.5px] text-[#6B6558]">{interpolate(t("daily_habits.water_description", locale), { maxWater: String(maxWater) })}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => onWater(-1)}
            disabled={habit.water <= 0}
            aria-label={t("daily_habits.decrease_water", locale)}
            className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity disabled:opacity-40"
          >
            <Minus className="size-3" aria-hidden />
          </button>
          <span className="w-5 text-center font-display text-base font-semibold tabular-nums text-foreground" aria-live="polite">
            {habit.water}
          </span>
          <button
            type="button"
            onClick={() => onWater(1)}
            disabled={habit.water >= maxWater}
            aria-label={t("daily_habits.increase_water", locale)}
            className="flex size-7 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
          >
            <Plus className="size-3" aria-hidden />
          </button>
        </div>
      </div>

      {/* 물 잔 진행 표시 */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden>
        {Array.from({ length: maxWater }, (_, i) => (
          <Droplet
            key={i}
            className={cn("size-4 transition-colors", i < habit.water ? "fill-primary text-primary" : "fill-transparent text-border")}
          />
        ))}
      </div>
    </section>
  )
}
