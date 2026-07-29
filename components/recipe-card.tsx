"use client"

import { cn } from "@/lib/utils"
import type { CalendarEntry, Recipe, RecipeType } from "@/lib/schedule"
import { getCategoryCopy, type Concern, type SupportId } from "@/lib/routine-copy"
import { REACTION_DELAY_DAYS } from "@/lib/scheduling-engine"
import { Button } from "@/components/ui/button"
import { Check, ShieldAlert } from "lucide-react"

/** 자극 신고 대상이 될 수 있는 카테고리 — 실제로 도입 스케줄이 있는 액티브만 해당 */
const REACTIVE_CATEGORIES: RecipeType[] = ["bha", "retinol"]

/** 카테고리별 호빵이 캐릭터 이미지 매핑 */
const CHARACTER_IMAGES: Record<RecipeType, string | null> = {
  defense_barrier: "/characters/defense-barrier.jpeg",
  defense_toning: "/characters/defense-toning.jpeg",
  defense_hydration: "/characters/defense-hydration.jpeg",
  sos_rest: "/characters/sos-rest.jpeg",
  bha: "/characters/bha.jpeg",
  aha: "/characters/aha.jpeg",
  retinol: "/characters/retinol.jpeg",
  barrier_lock: null,
  hydration_lock: null,
  toning_solo: null,
}

interface RecipeCardProps {
  day: number
  currentDay: number
  isCompleted: boolean
  onRecord: () => void
  getRecipe: (day: number) => Recipe
  calendar: CalendarEntry[]
  /** 오늘 이미 이 성분에 대한 자극을 신고했는지 */
  hasReportedReaction?: boolean
  onReportReaction?: () => void
  /** 방어/락 계열 문구에 강조할 관심사 + 보유 성분 */
  concern?: Concern
  supportOwned?: SupportId[]
}

export function RecipeCard({
  day,
  currentDay,
  isCompleted,
  onRecord,
  getRecipe,
  calendar,
  hasReportedReaction = false,
  onReportReaction,
  concern = "none",
  supportOwned = [],
}: RecipeCardProps) {
  const recipe = getRecipe(day)
  const copy = getCategoryCopy(recipe.type, calendar, day)
  const isToday = day === currentDay
  const isFuture = day > currentDay
  const canReportReaction = isToday && onReportReaction && REACTIVE_CATEGORIES.includes(recipe.type)

  return (
    <section
      className={cn(
        "rounded-4xl px-[22px] py-[26px] ring-1",
        isToday ? "bg-today-accent ring-transparent" : "bg-card ring-border",
      )}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={cn("font-display text-[13px] font-semibold", isToday ? "text-white/85" : "text-muted-foreground")}>
            Day {day}
            {isToday && <span className="ml-1">· 오늘</span>}
          </span>

          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.06em]",
              isToday ? "border-transparent bg-white/18 text-white" : "border-border text-muted-foreground",
            )}
          >
            {recipe.tag}
          </span>
        </div>

        {CHARACTER_IMAGES[recipe.type] && (
          <img
            src={CHARACTER_IMAGES[recipe.type]!}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        )}
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

      {copy.caution && (
        <p className={cn("mt-2 text-xs font-medium", isToday ? "text-white/70" : "text-muted-foreground")}>{copy.caution}</p>
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
              오늘 자극을 신고했어요. 이 성분은 {REACTION_DELAY_DAYS}일 뒤로 미뤄져요.
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
