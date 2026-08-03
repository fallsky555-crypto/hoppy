"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
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

const renderSlotButton = (slot: Slot, isChecked: boolean, isRecommended: boolean, toggleSlot: (id: SlotType) => void, t: (key: string, locale: string) => string, locale: string) => (
  <button
    key={slot.id}
    type="button"
    onClick={() => toggleSlot(slot.id)}
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

interface DailySlotsProps {
  day?: number
  onConditionRecord?: (condition: "good" | "neutral" | "bad", linkedCategory: SlotType) => void
}

export function DailySlots({ day = 1, onConditionRecord }: DailySlotsProps) {
  const locale = useLocale()
  const diary = useDiary()
  const [checkedSlots, setCheckedSlots] = useState<Set<SlotType>>(new Set())
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)

  const toggleSlot = (slotId: SlotType) => {
    const newChecked = new Set(checkedSlots)
    const wasChecked = newChecked.has(slotId)

    if (wasChecked) {
      newChecked.delete(slotId)
    } else {
      newChecked.add(slotId)
      // 슬롯이 추가될 때만 로컬 기록
      diary.recordLoggedSlot(day, slotId, SLOT_TAGS[slotId])
    }
    setCheckedSlots(newChecked)

    // 로컬 진행도 기록 (로그인 여부 관계없이)
    diary.recordLoggedDay(day)

    // Fire-and-forget: saveUsageLog 호출 (탭 즉시 저장)
    if (diary.userId) {
      const recommendedCategory = TODAY_RECOMMENDED as SlotType
      const slotsPayload = Array.from(newChecked).map((id) => ({
        slot: id,
        tag: SLOT_TAGS[id],
      }))
      saveUsageLog(diary.userId, day, slotsPayload, recommendedCategory).catch(() => {
        // 에러는 무시하고 진행 (fire-and-forget)
      })
    }
  }

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
          {renderSlotButton(SUN_CARE_SLOT, checkedSlots.has(SUN_CARE_SLOT.id), false, toggleSlot, t, locale)}

          {/* 나머지 4개: 2열 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {OTHER_SLOTS.map((slot) => {
              const isChecked = checkedSlots.has(slot.id)
              const isRecommended = slot.id === TODAY_RECOMMENDED
              return renderSlotButton(slot, isChecked, isRecommended, toggleSlot, t, locale)
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
            <button
              type="button"
              onClick={() => setShowConditionPrompt(true)}
              className="w-full rounded-full bg-primary hover:bg-primary/85 text-white font-semibold py-3 transition-colors"
            >
              기록 완료
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
