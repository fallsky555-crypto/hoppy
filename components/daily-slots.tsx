"use client"

import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Smile, Meh, Frown, ChevronDown } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { saveUsageLog } from "@/lib/supabase/sync"
import { getRecommendedSlot } from "@/lib/slot-mapping"
import { REACTION_DELAY_DAYS } from "@/lib/scheduling-engine"

export type SlotType = "exfoliation" | "hydration" | "active" | "barrier" | "sun_care"
type SpecialCareType = "mask" | "trouble"

interface Slot {
  id: SlotType
  emoji: string
  labelKey: string
}

const SLOT_TAGS: Record<SlotType, string> = {
  exfoliation: "Exfoliation",
  hydration: "Hydration",
  active: "Active/Stimulate",
  barrier: "Defense/Barrier",
  sun_care: "Sun",
}

const SPECIAL_CARE_TAGS: Record<SpecialCareType, string> = {
  mask: "Mask",
  trouble: "Trouble",
}

const SUN_CARE_SLOT: Slot = { id: "sun_care", emoji: "☀️", labelKey: "dailySlots.slots.sun_care" }

const OTHER_SLOTS: Slot[] = [
  { id: "exfoliation", emoji: "✨", labelKey: "dailySlots.slots.exfoliation" },
  { id: "hydration", emoji: "💧", labelKey: "dailySlots.slots.hydration" },
  { id: "active", emoji: "🎯", labelKey: "dailySlots.slots.active" },
  { id: "barrier", emoji: "🌿", labelKey: "dailySlots.slots.barrier" },
]

function SlotCard({ slot, isChecked, toggleSlot, isSunCare, isRecommended }: { slot: Slot; isChecked: boolean; toggleSlot: (id: SlotType) => void; isSunCare?: boolean; isRecommended?: boolean }) {
  const locale = useLocale()
  const handleClick = useCallback(() => {
    toggleSlot(slot.id)
  }, [slot.id, toggleSlot])

  const descriptionKey = slot.id !== "sun_care" ? `dailySlots.slotDescriptions.${slot.id}` : null
  const description = descriptionKey ? t(descriptionKey, locale) : null

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative rounded-2xl p-4 transition-all border-2",
        isSunCare
          ? "flex flex-row items-center gap-3 w-full"
          : "flex flex-col items-center gap-2",
        isChecked
          ? "border-primary bg-primary/10"
          : "border-border bg-card",
      )}
    >
      <div className={cn("flex-shrink-0", isSunCare ? "text-2xl" : "text-3xl")}>
        {slot.emoji}
      </div>
      <div className={isSunCare ? "text-left" : "text-center"}>
        <span className={cn("font-semibold text-foreground", isSunCare ? "text-sm" : "text-sm")}>
          {t(slot.labelKey, locale)}
        </span>
        {description && (
          <div className="text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {isRecommended && (
        <span className="absolute -top-1.5 -left-1.5 flex size-[22px] items-center justify-center rounded-full bg-white shadow-sm text-[10px]">
          ⭐
        </span>
      )}
    </button>
  )
}

interface SpecialCareCardProps {
  isExpanded: boolean
  onToggle: () => void
  selectedSpecialCare: Set<SpecialCareType>
  onToggleSpecialCare: (id: SpecialCareType) => void
  locale: string
}

function SpecialCareCard({ isExpanded, onToggle, selectedSpecialCare, onToggleSpecialCare, locale }: SpecialCareCardProps) {

  return (
    <div className="border-2 border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.title", locale)}</div>
            <div className="text-xs text-muted-foreground">{t("dailySlots.specialCare.subtitle", locale)}</div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-5 text-muted-foreground transition-transform",
            isExpanded ? "rotate-180" : "",
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-secondary p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => onToggleSpecialCare("mask")}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
              selectedSpecialCare.has("mask")
                ? "border-primary bg-primary/10"
                : "border-border bg-card",
            )}
          >
            <span>🫙</span>
            <span className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.option_mask", locale)}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleSpecialCare("trouble")}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
              selectedSpecialCare.has("trouble")
                ? "border-primary bg-primary/10"
                : "border-border bg-card",
            )}
          >
            <span>🩹</span>
            <span className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.option_trouble", locale)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface DailySlotsProps {
  day?: number
  onConditionRecord?: (condition: "good" | "neutral" | "bad", linkedCategory: SlotType) => void
}

export function DailySlots({ day = 1, onConditionRecord }: DailySlotsProps) {
  const locale = useLocale()
  const diary = useDiary()
  const diaryRef = useRef(diary)
  const [checkedSlots, setCheckedSlots] = useState<Set<SlotType>>(new Set())
  const [selectedSpecialCare, setSelectedSpecialCare] = useState<Set<SpecialCareType>>(new Set())
  const [specialCareExpanded, setSpecialCareExpanded] = useState(false)
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)

  const checkedSlotsRef = useRef<Set<SlotType>>(new Set())
  const selectedSpecialCareRef = useRef<Set<SpecialCareType>>(new Set())

  const todayRecipe = diary.getRecipeForDay(day)
  const hasRecentIncident = diary.hasRecentSafetyIncident(day)
  const recommendedSlot: SlotType | null = hasRecentIncident
    ? "barrier"
    : (getRecommendedSlot(todayRecipe.type) as SlotType | null)

  useEffect(() => {
    diaryRef.current = diary
  }, [diary])

  useEffect(() => {
    checkedSlotsRef.current = checkedSlots
  }, [checkedSlots])

  useEffect(() => {
    selectedSpecialCareRef.current = selectedSpecialCare
  }, [selectedSpecialCare])

  const toggleSlot = useCallback((slotId: SlotType) => {
    setCheckedSlots((prev) => {
      const newChecked = new Set(prev)
      if (newChecked.has(slotId)) {
        newChecked.delete(slotId)
      } else {
        newChecked.add(slotId)
        diaryRef.current.recordLoggedSlot(day, slotId, SLOT_TAGS[slotId])
      }

      if (diaryRef.current.userId) {
        const recommendedCategory = recommendedSlot || ("active" as SlotType)
        const slotsPayload = [
          ...Array.from(newChecked).map((id) => ({
            slot: id,
            tag: SLOT_TAGS[id],
          })),
          ...Array.from(selectedSpecialCareRef.current).map((id) => ({
            slot: `special_care_${id}`,
            tag: SPECIAL_CARE_TAGS[id],
          })),
        ]
        saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
          console.error("[saveUsageLog] error:", err)
        })
      }

      return newChecked
    })
  }, [day, recommendedSlot])

  const toggleSpecialCare = useCallback((specialCareId: SpecialCareType) => {
    setSelectedSpecialCare((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(specialCareId)) {
        newSet.delete(specialCareId)
      } else {
        newSet.add(specialCareId)
        diaryRef.current.recordLoggedSlot(day, `special_care_${specialCareId}` as SlotType, SPECIAL_CARE_TAGS[specialCareId])
      }

      if (diaryRef.current.userId) {
        const recommendedCategory = recommendedSlot || ("active" as SlotType)
        const slotsPayload = [
          ...Array.from(checkedSlotsRef.current).map((id) => ({
            slot: id,
            tag: SLOT_TAGS[id],
          })),
          ...Array.from(newSet).map((id) => ({
            slot: `special_care_${id}`,
            tag: SPECIAL_CARE_TAGS[id],
          })),
        ]
        saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
          console.error("[saveUsageLog] error:", err)
        })
      }

      return newSet
    })
  }, [day, recommendedSlot])

  const handleReportReaction = useCallback(() => {
    diaryRef.current.reportReaction(day, "retinol")
  }, [day])

  const totalSelected = checkedSlots.size + selectedSpecialCare.size

  return (
    <section
      className="rounded-3xl px-6 py-8 bg-card ring-1 ring-border"
      aria-label={t("dailySlots.ariaLabel", locale)}
    >
      <div className="flex flex-col gap-4">
        {/* 헤더 */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground tracking-tight">
            Day {day} · {t("common.today", locale)}
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold text-foreground">
              {t("dailySlots.headline", locale)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {locale === "ko"
                ? "오늘 하신 일을 선택해주세요 (복수 선택 가능)"
                : "Select what you did today (multiple selections available)"}
            </p>
          </div>
        </div>

        {/* 슬롯 선택 */}
        <div className="space-y-3">
          {/* 자외선차단: 풀와이드 */}
          <SlotCard
            slot={SUN_CARE_SLOT}
            isChecked={checkedSlots.has(SUN_CARE_SLOT.id)}
            toggleSlot={toggleSlot}
            isSunCare
            isRecommended={recommendedSlot === SUN_CARE_SLOT.id}
          />

          {/* 나머지 슬롯: 2열 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {OTHER_SLOTS.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isChecked={checkedSlots.has(slot.id)}
                toggleSlot={toggleSlot}
                isRecommended={recommendedSlot === slot.id}
              />
            ))}
          </div>

          {/* 특별관리 아코디언 */}
          <SpecialCareCard
            isExpanded={specialCareExpanded}
            onToggle={() => setSpecialCareExpanded(!specialCareExpanded)}
            selectedSpecialCare={selectedSpecialCare}
            onToggleSpecialCare={toggleSpecialCare}
            locale={locale}
          />
        </div>

        {/* 안내문구 */}
        {recommendedSlot && (
          <div className="border-t border-border pt-2">
            <p className="text-xs text-center text-muted-foreground mt-1">
              {hasRecentIncident
                ? t("dailySlots.incidentWarning", locale)
                : t("dailySlots.recommendationNote", locale)}
            </p>
          </div>
        )}

        {/* 하단 섹션 */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-center text-foreground">
            {totalSelected > 0
              ? locale === "ko" ? `${totalSelected}개 선택됨` : `${totalSelected} selected`
              : t("dailySlots.tapPrompt", locale)}
          </p>

          {showConditionPrompt && (
            <div className="space-y-3 bg-secondary p-4 rounded-lg">
              <p className="text-sm font-semibold text-foreground">{t("dailySlots.conditionQuestion", locale)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const linkedCategory = recommendedSlot && checkedSlots.has(recommendedSlot)
                      ? recommendedSlot
                      : (Array.from(checkedSlots)[0] || ("active" as SlotType))
                    onConditionRecord?.("good", linkedCategory)
                    setShowConditionPrompt(false)
                    setCheckedSlots(new Set())
                    setSelectedSpecialCare(new Set())
                  }}
                  className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                >
                  <Smile className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_good", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const linkedCategory = recommendedSlot && checkedSlots.has(recommendedSlot)
                      ? recommendedSlot
                      : (Array.from(checkedSlots)[0] || ("active" as SlotType))
                    onConditionRecord?.("neutral", linkedCategory)
                    setShowConditionPrompt(false)
                    setCheckedSlots(new Set())
                    setSelectedSpecialCare(new Set())
                  }}
                  className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                >
                  <Meh className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_neutral", locale)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const linkedCategory = recommendedSlot && checkedSlots.has(recommendedSlot)
                      ? recommendedSlot
                      : (Array.from(checkedSlots)[0] || ("active" as SlotType))
                    onConditionRecord?.("bad", linkedCategory)
                    setShowConditionPrompt(false)
                    setCheckedSlots(new Set())
                    setSelectedSpecialCare(new Set())
                  }}
                  className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                >
                  <Frown className="size-4" aria-hidden />
                  {t("onboarding.mappingResult.condition_bad", locale)}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowConditionPrompt(false)}
                className="w-full text-xs font-medium text-muted-foreground py-2 hover:text-foreground"
              >
                {t("common.later", locale)}
              </button>
            </div>
          )}

          {checkedSlots.has("active") && (
            <button
              type="button"
              onClick={handleReportReaction}
              className="w-full rounded-full border-2 border-primary bg-transparent hover:bg-primary/10 text-primary-text font-semibold py-3 transition-colors text-sm"
            >
              {t("dailySlots.reportReaction", locale)}
            </button>
          )}

          <button
            type="button"
            disabled={diary.conditions[day] !== undefined}
            onClick={() => {
              if (totalSelected > 0) {
                setShowConditionPrompt(true)
              }
            }}
            className={cn(
              "w-full rounded-full font-bold py-3 transition-colors text-sm",
              diary.conditions[day] !== undefined
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : "bg-primary hover:bg-primary/80 text-primary-foreground"
            )}
          >
            {diary.conditions[day] !== undefined ? t("dailySlots.recordButton.done", locale) : t("dailySlots.recordButton.default", locale)}
          </button>
        </div>
      </div>
    </section>
  )
}
