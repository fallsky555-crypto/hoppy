"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { getCategoryCopy, type Concern, type SupportId } from "@/lib/routine-copy"
import { Button } from "@/components/ui/button"
import { RECIPE_ICON } from "@/components/recipe-icon"
import { Check, ShieldAlert } from "lucide-react"

/** 자극 신고 대상이 될 수 있는 카테고리 — 실제로 도입 스케줄이 있는 액티브만 해당 */
const REACTIVE_CATEGORIES: RecipeType[] = ["aha", "bha", "retinol"]

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

/** 태그 배지도 솔리드 채움 대신 아웃라인(테두리+텍스트색)으로 표현한다 */
const TAG_STYLE: Record<RecipeType, string> = {
  rest: "border-rest text-rest",
  aha: "border-aha text-aha",
  moist: "border-moist text-moist",
  retinol: "border-retinol text-retinol",
  bha: "border-bha text-bha",
  defense_barrier: "border-defense-barrier text-defense-barrier",
  defense_toning: "border-defense-toning text-defense-toning",
  defense_hydration: "border-defense-hydration text-defense-hydration",
  sos_rest: "border-sos-rest text-sos-rest",
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
      className={cn(
        "rounded-4xl p-6 shadow-sm ring-1 ring-border",
        isToday ? "bg-today-accent" : cn("border-l-4 bg-card", CATEGORY_BORDER[recipe.color]),
      )}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-bold",
            TAG_STYLE[recipe.color],
          )}
        >
          <TagIcon aria-hidden className="size-3.5" />
          {recipe.tag}
        </span>
        <span className={cn("font-display text-sm font-bold", isToday ? "text-today-accent-foreground/80" : "text-foreground/70")}>
          Day {day}
          {isToday && <span className="ml-1 text-today-accent-foreground">· 오늘</span>}
        </span>
      </div>

      <h3
        className={cn(
          "mt-3 font-display text-xl font-bold text-balance",
          isToday ? "text-today-accent-foreground" : "text-emphasis",
        )}
      >
        {copy.title}
      </h3>

      <p className={cn("mt-1.5 text-base leading-relaxed", isToday ? "text-today-accent-foreground/90" : "text-foreground/80")}>
        {copy.detail}
      </p>

      {recipe.caution && (
        <p className={cn("mt-2 text-xs font-medium", isToday ? "text-today-accent-foreground/70" : "text-muted-foreground")}>
          {recipe.caution}
        </p>
      )}

      <div className="mt-4">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-secondary/70 py-3 text-sm font-bold text-primary">
            <Check className="size-4" aria-hidden />
            기록 완료했어요
          </div>
        ) : isToday ? (
          <Button onClick={onRecord} size="lg" className="w-full rounded-full text-base font-bold shadow-sm">
            기록 완료
          </Button>
        ) : isFuture ? (
          <p className="text-center text-xs font-medium text-muted-foreground">
            아직 오지 않은 날이에요. 그날이 되면 기록할 수 있어요.
          </p>
        ) : (
          <p className="text-center text-xs font-medium text-muted-foreground">지나간 날의 루틴이에요.</p>
        )}
      </div>

      {canReportReaction && (
        <div className="mt-2.5">
          {hasReportedReaction ? (
            <p className="flex items-center justify-center gap-1.5 rounded-full bg-secondary/60 py-2 text-xs font-bold text-foreground/70">
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
