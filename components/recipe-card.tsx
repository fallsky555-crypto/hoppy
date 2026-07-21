"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { getCategoryCopy, type Concern, type SupportId } from "@/lib/routine-copy"
import { Button } from "@/components/ui/button"
import { RECIPE_ICON } from "@/components/recipe-icon"
import { Check, ShieldAlert } from "lucide-react"

/** 자극 신고 대상이 될 수 있는 카테고리 — 실제로 도입 스케줄이 있는 액티브만 해당 */
const REACTIVE_CATEGORIES: RecipeType[] = ["aha", "bha", "retinol"]

const ACCENT_BG: Record<RecipeType, string> = {
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

const ACCENT_TAG: Record<RecipeType, string> = {
  rest: "bg-rest text-white",
  aha: "bg-aha text-white",
  moist: "bg-moist text-white",
  retinol: "bg-retinol text-white",
  bha: "bg-bha text-white",
  defense_barrier: "bg-defense-barrier text-white",
  defense_toning: "bg-defense-toning text-white",
  defense_hydration: "bg-defense-hydration text-white",
  sos_rest: "bg-sos-rest text-white",
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
  /** rest/moist 문구에 강조할 관심사 + 보유 성분 */
  concern?: Concern
  supportOwned?: SupportId[]
}

export function RecipeCard({
  day,
  currentDay,
  isCompleted,
  onRecord,
  getRecipe = recipeForDay,
  hasReportedReaction = false,
  onReportReaction,
  concern = "none",
  supportOwned = [],
}: RecipeCardProps) {
  const recipe = getRecipe(day)
  const copy = getCategoryCopy(recipe.type, concern, supportOwned)
  const isToday = day === currentDay
  const isFuture = day > currentDay
  const canReportReaction = isToday && onReportReaction && REACTIVE_CATEGORIES.includes(recipe.type)
  const TagIcon = RECIPE_ICON[recipe.type]

  return (
    <section
      className={cn("rounded-4xl p-6 shadow-sm ring-1 ring-border transition-colors", ACCENT_BG[recipe.color])}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
            ACCENT_TAG[recipe.color],
          )}
        >
          <TagIcon aria-hidden className="size-3.5" />
          {recipe.tag}
        </span>
        <span className="font-display text-sm font-bold text-foreground/70">
          Day {day}
          {isToday && <span className="ml-1 text-primary">· 오늘</span>}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-bold text-foreground text-balance">{copy.title}</h3>

      <p className="mt-1.5 text-base leading-relaxed text-foreground/80">{copy.detail}</p>

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
