"use client"

import { cn } from "@/lib/utils"
import { recipeForDay, type Recipe, type RecipeType } from "@/lib/schedule"
import { getCategoryCopy, type Concern, type SupportId } from "@/lib/routine-copy"
import { Button } from "@/components/ui/button"
import { Check, ShieldAlert, Sun } from "lucide-react"

/** 자극 신고 대상이 될 수 있는 카테고리 — 실제로 도입 스케줄이 있는 액티브만 해당 */
const REACTIVE_CATEGORIES: RecipeType[] = ["aha", "bha", "retinol"]

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

  return (
    <section
      className={cn(
        "rounded-4xl px-[22px] py-[26px] ring-1",
        isToday ? "bg-primary ring-transparent" : "bg-card ring-border",
      )}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.06em]",
            isToday ? "border-transparent bg-white/18 text-white" : "border-border text-muted-foreground",
          )}
        >
          {recipe.tag}
        </span>
        <span className={cn("font-display text-[13px] font-semibold", isToday ? "text-white/85" : "text-muted-foreground")}>
          Day {day}
          {isToday && <span className="ml-1">· 오늘</span>}
        </span>
      </div>

      <h3
        className={cn(
          "mt-3.5 font-display text-xl leading-[1.3] font-semibold text-balance",
          isToday ? "text-white" : "text-foreground",
        )}
      >
        {copy.title}
      </h3>

      <p className={cn("mt-2 text-[15.5px] leading-[1.7]", isToday ? "text-white/92" : "text-[#4A4438]")}>{copy.detail}</p>

      {recipe.caution && (
        <p className={cn("mt-2 text-xs font-medium", isToday ? "text-white/70" : "text-muted-foreground")}>{recipe.caution}</p>
      )}

      {/* 액티브 성분(AHA/BHA/레티놀) 데이에만 노출되는 선크림 리마인더 — 매일 기본 습관의
          "선크림 발랐어요" 체크와는 별개로, 광과민성이 커지는 날에만 강조해서 보여준다 */}
      {REACTIVE_CATEGORIES.includes(recipe.type) && (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold",
            isToday ? "bg-white/15 text-white" : "bg-secondary text-foreground",
          )}
        >
          <Sun className="size-4 shrink-0" aria-hidden />
          오늘은 자외선에 특히 민감해질 수 있어요. 외출 전 선크림을 꼭 발라주세요.
        </div>
      )}

      <div className="mt-5">
        {isCompleted ? (
          <div
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full p-[13px] text-[13px] font-semibold",
              isToday ? "bg-white/15 text-white" : "bg-secondary text-foreground",
            )}
          >
            <Check className="size-4" aria-hidden />
            기록 완료했어요
          </div>
        ) : isToday ? (
          <Button
            onClick={onRecord}
            size="lg"
            className="h-auto w-full rounded-full bg-background p-[14px] text-[14px] font-bold tracking-[0.01em]"
          >
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
        <div className="mt-3">
          {hasReportedReaction ? (
            <p
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold",
                isToday ? "bg-white/15 text-white" : "bg-secondary text-foreground",
              )}
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              오늘 자극을 신고했어요. 이 성분은 7일 뒤로 미뤄져요.
            </p>
          ) : (
            <Button
              type="button"
              onClick={onReportReaction}
              variant="outline"
              size="sm"
              className={cn(
                "w-full rounded-full text-xs font-bold",
                isToday && "border-white/40 bg-transparent text-white hover:bg-white/10",
              )}
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
