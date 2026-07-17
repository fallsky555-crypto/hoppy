"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type RecipeType } from "@/lib/schedule"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Check } from "lucide-react"

const ACCENT_BG: Record<RecipeType, string> = {
  rest: "bg-rest-soft",
  aha: "bg-aha-soft",
  moist: "bg-moist-soft",
  retinol: "bg-retinol-soft",
}

const ACCENT_TAG: Record<RecipeType, string> = {
  rest: "bg-rest text-white",
  aha: "bg-aha text-white",
  moist: "bg-moist text-white",
  retinol: "bg-retinol text-white",
}

interface RecipeCardProps {
  day: number
  currentDay: number
  isCompleted: boolean
  onRecord: () => void
}

export function RecipeCard({ day, currentDay, isCompleted, onRecord }: RecipeCardProps) {
  const recipe = recipeForDay(day)
  const isToday = day === currentDay
  const isFuture = day > currentDay

  return (
    <section
      className={cn("rounded-4xl p-5 shadow-sm ring-1 ring-border transition-colors", ACCENT_BG[recipe.color])}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
            ACCENT_TAG[recipe.color],
          )}
        >
          <span aria-hidden>{recipe.emoji}</span>
          {recipe.tag}
        </span>
        <span className="font-display text-sm font-bold text-foreground/70">
          Day {day}
          {isToday && <span className="ml-1 text-primary">· 오늘</span>}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-bold text-foreground text-balance">
        {isToday ? "오늘은 " : ""}
        <span className="text-primary">[{recipe.title}]</span>
        {isToday ? " 입니다!" : ""}
      </h3>

      <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{recipe.guide}</p>

      {recipe.caution && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-card/70 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-foreground/75">{recipe.caution}</p>
        </div>
      )}

      <div className="mt-4">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-card/80 py-3 text-sm font-bold text-primary">
            <Check className="size-4" aria-hidden />
            기록 완료! 호빵이 발도장을 찍었어요 🐱
          </div>
        ) : isToday ? (
          <Button
            onClick={onRecord}
            size="lg"
            className="w-full rounded-full text-base font-bold shadow-sm"
          >
            기록 완료 🐱
          </Button>
        ) : isFuture ? (
          <p className="text-center text-xs font-medium text-muted-foreground">
            아직 오지 않은 날이에요. 그날이 되면 기록할 수 있어요!
          </p>
        ) : (
          <p className="text-center text-xs font-medium text-muted-foreground">지나간 날의 루틴이에요.</p>
        )}
      </div>
    </section>
  )
}
