"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Check, ShieldAlert } from "lucide-react"

/** 자극 신고 대상이 될 수 있는 카테고리 — 실제로 도입 스케줄이 있는 액티브만 해당 */
const REACTIVE_CATEGORIES: RecipeType[] = ["aha", "bha", "retinol"]

const ACCENT_BG: Record<RecipeType, string> = {
  rest: "bg-rest-soft",
  aha: "bg-aha-soft",
  moist: "bg-moist-soft",
  retinol: "bg-retinol-soft",
  bha: "bg-bha-soft",
}

const ACCENT_TAG: Record<RecipeType, string> = {
  rest: "bg-rest text-white",
  aha: "bg-aha text-white",
  moist: "bg-moist text-white",
  retinol: "bg-retinol text-white",
  bha: "bg-bha text-white",
}

interface RecipeCardProps {
  day: number
  currentDay: number
  isCompleted: boolean
  onRecord: () => void
  /** 진단이 있으면 개인화 캘린더, 없으면 기본 30일 스케줄(recipeForDay)을 사용 */
  getRecipe?: (day: number) => Recipe
  /** 오늘 이미 이 성분에 대한 자극을 신고했는지 */
  hasReportedReaction?: boolean
  onReportReaction?: () => void
}

export function RecipeCard({
  day,
  currentDay,
  isCompleted,
  onRecord,
  getRecipe = recipeForDay,
  hasReportedReaction = false,
  onReportReaction,
}: RecipeCardProps) {
  const recipe = getRecipe(day)
  const isToday = day === currentDay
  const isFuture = day > currentDay
  const canReportReaction = isToday && onReportReaction && REACTIVE_CATEGORIES.includes(recipe.type)

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

      {canReportReaction && (
        <div className="mt-2.5">
          {hasReportedReaction ? (
            <p className="flex items-center justify-center gap-1.5 rounded-full bg-card/70 py-2 text-xs font-bold text-foreground/70">
              <ShieldAlert className="size-3.5" aria-hidden />
              오늘 자극을 신고했어요. 이 성분은 7일 뒤로 미뤄져요.
            </p>
          ) : (
            <Button
              type="button"
              onClick={onReportReaction}
              variant="outline"
              size="sm"
              className="w-full rounded-full text-xs font-bold"
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              오늘 이 성분에 자극이 있었어요
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
