"use client"

import { cn } from "@/lib/utils"
import type { CalendarEntry, Recipe, RecipeType } from "@/lib/schedule"
import { getRecipes } from "@/lib/schedule"
import { getCategoryCopy, type Concern, type SupportId } from "@/lib/routine-copy"
import { REACTION_DELAY_DAYS } from "@/lib/scheduling-engine"
import { Button } from "@/components/ui/button"
import { Check, ShieldAlert, Droplet, Brush, CheckCircle, Clock, Smile, Meh, Frown } from "lucide-react"
import { useState } from "react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

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
  /** 이 day에 이미 기록된 컨디션 */
  condition?: "good" | "neutral" | "bad"
  /** 컨디션 기록 콜백 */
  onConditionRecord?: (condition: "good" | "neutral" | "bad") => void
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
  condition,
  onConditionRecord,
}: RecipeCardProps) {
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)
  const locale = useLocale()
  const recipe = getRecipe(day)
  const localizedRecipe = getRecipes(locale)[recipe.type]
  const copy = getCategoryCopy(recipe.type, calendar, day, concern, supportOwned, locale)
  const isToday = day === currentDay
  const isFuture = day > currentDay
  const canReportReaction = isToday && onReportReaction && REACTIVE_CATEGORIES.includes(recipe.type)

  return (
    <section
      className={cn(
        "rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border",
        isToday && "border-l-4 border-l-primary",
      )}
      aria-label="오늘의 레시피 상세"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[13px] font-semibold text-muted-foreground">
            Day {day}
            {isToday && <span className="ml-1">· {t("recipe_card.today", locale)}</span>}
          </span>

          <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-muted-foreground">
            {localizedRecipe.tag}
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

      <h3 className="mt-3.5 font-display text-xl leading-[1.3] font-semibold text-balance text-foreground">
        {copy.title}
      </h3>

      <p className="mt-2 text-[15.5px] leading-[1.7] text-muted-foreground">{copy.detail}</p>

      {copy.caution && (
        <p className="mt-2 text-xs font-medium text-muted-foreground">{copy.caution}</p>
      )}

      {localizedRecipe.steps && localizedRecipe.steps.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {localizedRecipe.steps.map((step, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold bg-secondary text-foreground">
                {index + 1}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {step}
              </span>
              {index < localizedRecipe.steps.length - 1 && (
                <span className="ml-1 text-[9px] text-muted-foreground">·</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        {isCompleted ? (
          condition ? (
            <div className="flex items-center justify-center gap-1.5 rounded-full p-[13px] text-[13px] font-semibold bg-secondary text-foreground">
              {condition === "good" && <Smile className="size-4" aria-hidden />}
              {condition === "neutral" && <Meh className="size-4" aria-hidden />}
              {condition === "bad" && <Frown className="size-4" aria-hidden />}
              {t("recipe_card.recorded", locale)}
            </div>
          ) : showConditionPrompt ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onConditionRecord?.("good")
                    setShowConditionPrompt(false)
                  }}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors flex flex-col items-center gap-1",
                    "border-border bg-card text-foreground",
                  )}
                  aria-label={t("onboarding.mappingResult.condition_good", locale)}
                >
                  <Smile className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_good", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConditionRecord?.("neutral")
                    setShowConditionPrompt(false)
                  }}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors flex flex-col items-center gap-1",
                    "border-border bg-card text-foreground",
                  )}
                  aria-label={t("onboarding.mappingResult.condition_neutral", locale)}
                >
                  <Meh className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_neutral", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConditionRecord?.("bad")
                    setShowConditionPrompt(false)
                  }}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors flex flex-col items-center gap-1",
                    "border-border bg-card text-foreground",
                  )}
                  aria-label={t("onboarding.mappingResult.condition_bad", locale)}
                >
                  <Frown className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_bad", locale)}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowConditionPrompt(false)}
                className="w-full text-xs font-medium text-muted-foreground py-2"
              >
                {t("common.later", locale)}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 rounded-full p-[13px] text-[13px] font-semibold bg-secondary text-foreground">
              <Check className="size-4" aria-hidden />
              {t("recipe_card.recorded", locale)}
            </div>
          )
        ) : isToday ? (
          <Button
            onClick={() => {
              onRecord()
              setShowConditionPrompt(true)
            }}
            size="lg"
            className="h-auto w-full rounded-full bg-primary text-primary-foreground p-[14px] text-[14px] font-bold tracking-[0.01em]"
          >
            {t("recipe_card.record_button", locale)}
          </Button>
        ) : isFuture ? (
          <p className="text-center text-xs font-medium text-muted-foreground">
            {t("recipe_card.not_yet_available", locale)}
          </p>
        ) : (
          <p className="text-center text-xs font-medium text-muted-foreground">{t("recipe_card.past_routine", locale)}</p>
        )}
      </div>

      {canReportReaction && (
        <div className="mt-3">
          {hasReportedReaction ? (
            <p className="flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold bg-secondary text-foreground">
              <ShieldAlert className="size-3.5" aria-hidden />
              {interpolate(t("recipe_card.reaction_reported", locale), { days: String(REACTION_DELAY_DAYS) })}
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
              {t("recipe_card.report_reaction", locale)}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
