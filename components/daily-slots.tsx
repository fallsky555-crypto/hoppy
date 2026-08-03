"use client"

import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Smile, Meh, Frown } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/use-diary"
import { saveUsageLog } from "@/lib/supabase/sync"

type SlotType = "prep" | "hydration" | "active" | "barrier" | "sun_care"

interface Slot {
  id: SlotType
  emoji: string
  labelKey: string
}

const SLOT_TAGS: Record<SlotType, string> = {
  prep: "Prep",
  hydration: "Hydration",
  active: "Active/Stimulate",
  barrier: "Defense/Barrier",
  sun_care: "Sun",
}

const SUN_CARE_SLOT: Slot = { id: "sun_care", emoji: "☀️", labelKey: "dailySlots.slots.sun_care" }

const OTHER_SLOTS: Slot[] = [
  { id: "prep", emoji: "🧴", labelKey: "dailySlots.slots.prep" },
  { id: "hydration", emoji: "💧", labelKey: "dailySlots.slots.hydration" },
  { id: "active", emoji: "⚡", labelKey: "dailySlots.slots.active" },
  { id: "barrier", emoji: "🛡️", labelKey: "dailySlots.slots.barrier" },
]

const TODAY_RECOMMENDED = "active"

function SlotButton({ slot, isChecked, isRecommended, toggleSlot, locale }: { slot: Slot; isChecked: boolean; isRecommended: boolean; toggleSlot: (id: SlotType) => void; locale: string }) {
  const handleClick = useCallback(() => {
    toggleSlot(slot.id)
  }, [slot.id, toggleSlot])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 rounded-2xl px-2.5 py-3 transition-all border",
        isChecked
          ? "bg-accent border-2 border-primary"
          : isRecommended
            ? "bg-accent border border-primary"
            : "bg-card border border-border",
      )}
    >
      <div className="flex size-8 items-center justify-center text-lg">
        {slot.emoji}
      </div>

      <div className="flex flex-col items-center min-h-8">
        <span className="text-xs font-semibold text-foreground text-center leading-tight">
          {t(slot.labelKey, locale)}
        </span>
        {isChecked && (
          <Check className="size-3 text-primary mt-0.5" strokeWidth={3} aria-hidden />
        )}
      </div>

      {isRecommended && (
        <div className="absolute top-1 left-1 text-sm" aria-label={t("dailySlots.todayBadge", locale)}>
          ⭐
        </div>
      )}

      {isChecked && (
        <div className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary">
          <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden />
        </div>
      )}
    </button>
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
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)
  const [hasRecordedCondition, setHasRecordedCondition] = useState(false)

  useEffect(() => {
    diaryRef.current = diary
    // 초기화: 이 day에 이미 condition이 있으면 hasRecordedCondition을 true로 설정
    setHasRecordedCondition(!!diary.conditions[day])
  }, [diary, day])

  const toggleSlot = useCallback((slotId: SlotType) => {
    setCheckedSlots((prev) => {
      const newChecked = new Set(prev)
      const wasChecked = newChecked.has(slotId)

      if (wasChecked) {
        newChecked.delete(slotId)
      } else {
        newChecked.add(slotId)
        diaryRef.current.recordLoggedSlot(day, slotId, SLOT_TAGS[slotId])
      }

      if (diaryRef.current.userId) {
        const recommendedCategory = TODAY_RECOMMENDED as SlotType
        const slotsPayload = Array.from(newChecked).map((id) => ({
          slot: id,
          tag: SLOT_TAGS[id],
        }))
        saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
          console.error("[saveUsageLog] error:", err)
        })
      }

      return newChecked
    })
  }, [day])

  return (
    <section
      className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border"
      aria-label={t("dailySlots.ariaLabel", locale)}
    >
      <div className="flex flex-col gap-4">
        {/* 헤더: Day */}
        <div>
          <span className="font-display text-[13px] font-semibold text-muted-foreground">
            Day {day} · {t("common.today", locale)}
          </span>
        </div>

        {/* 슬롯 선택 섹션 */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground text-left">
              {t("dailySlots.headline", locale)}
            </h3>
            <p className="font-display text-base text-left text-muted-foreground mt-1">
              {t("dailySlots.selectPrompt", locale)} {t("dailySlots.selectHint", locale)}
            </p>
          </div>

          {/* 자외선차단: 독립된 풀폭 카드 */}
          <SlotButton slot={SUN_CARE_SLOT} isChecked={checkedSlots.has(SUN_CARE_SLOT.id)} isRecommended={false} toggleSlot={toggleSlot} locale={locale} />

          {/* 나머지 4개: 2열 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {OTHER_SLOTS.map((slot) => {
              const isChecked = checkedSlots.has(slot.id)
              const isRecommended = slot.id === TODAY_RECOMMENDED
              return <SlotButton key={slot.id} slot={slot} isChecked={isChecked} isRecommended={isRecommended} toggleSlot={toggleSlot} locale={locale} />
            })}
          </div>
        </div>

        {/* 하단: 선택 상태 + 버튼 */}
        <div className="mt-2 pt-4 border-t border-border space-y-3">
          {checkedSlots.size > 0 && (
            <p className="text-sm font-semibold text-center text-foreground">
              {interpolate(t("dailySlots.selectedCount", locale), { count: String(checkedSlots.size) })}
            </p>
          )}

          {showConditionPrompt ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("dailySlots.conditionQuestion", locale)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const linkedCategory = checkedSlots.has(TODAY_RECOMMENDED as SlotType)
                      ? (TODAY_RECOMMENDED as SlotType)
                      : (Array.from(checkedSlots)[0] || (TODAY_RECOMMENDED as SlotType))
                    onConditionRecord?.("good", linkedCategory)
                    setShowConditionPrompt(false)
                    setHasRecordedCondition(true)
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
                    const linkedCategory = checkedSlots.has(TODAY_RECOMMENDED as SlotType)
                      ? (TODAY_RECOMMENDED as SlotType)
                      : (Array.from(checkedSlots)[0] || (TODAY_RECOMMENDED as SlotType))
                    onConditionRecord?.("neutral", linkedCategory)
                    setShowConditionPrompt(false)
                    setHasRecordedCondition(true)
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
                    const linkedCategory = checkedSlots.has(TODAY_RECOMMENDED as SlotType)
                      ? (TODAY_RECOMMENDED as SlotType)
                      : (Array.from(checkedSlots)[0] || (TODAY_RECOMMENDED as SlotType))
                    onConditionRecord?.("bad", linkedCategory)
                    setShowConditionPrompt(false)
                    setHasRecordedCondition(true)
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
            !hasRecordedCondition && !diaryRef.current.conditions[day] ? (
              <button
                type="button"
                onClick={() => setShowConditionPrompt(true)}
                className="w-full rounded-full bg-primary hover:bg-primary/85 text-white font-semibold py-3 transition-colors"
              >
                기록 완료
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCheckedSlots(new Set())
                  setShowConditionPrompt(false)
                  setHasRecordedCondition(false)
                }}
                className="w-full rounded-full bg-primary/60 hover:bg-primary/70 text-white font-semibold py-3 transition-colors"
              >
                기록 완료 ✓
              </button>
            )
          )}
        </div>
      </div>
    </section>
  )
}
