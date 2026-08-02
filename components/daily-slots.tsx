"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Check, Smile, Meh, Frown } from "lucide-react"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

type SlotType = "prep" | "hydration" | "active" | "barrier" | "sun_care"

interface Slot {
  id: SlotType
  emoji: string
  label: string
}

const SLOTS: Slot[] = [
  { id: "prep", emoji: "🧴", label: "클렌징" },
  { id: "hydration", emoji: "💧", label: "수분케어" },
  { id: "active", emoji: "⚡", label: "고민케어" },
  { id: "barrier", emoji: "🛡️", label: "진정케어" },
  { id: "sun_care", emoji: "☀️", label: "자외선차단" },
]

const TODAY_RECOMMENDED = "active"

interface DailySlotsProps {
  day?: number
  onConditionRecord?: (condition: "good" | "neutral" | "bad", linkedCategory: SlotType) => void
}

export function DailySlots({ day = 1, onConditionRecord }: DailySlotsProps) {
  const locale = useLocale()
  const [checkedSlots, setCheckedSlots] = useState<Set<SlotType>>(new Set())
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)

  const toggleSlot = (slotId: SlotType) => {
    const newChecked = new Set(checkedSlots)
    if (newChecked.has(slotId)) {
      newChecked.delete(slotId)
    } else {
      newChecked.add(slotId)
    }
    setCheckedSlots(newChecked)
  }

  return (
    <section
      className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border"
      aria-label="오늘의 슬롯 선택"
    >
      <div className="flex flex-col gap-4">
        <div>
          <span className="font-display text-[13px] font-semibold text-muted-foreground">
            Day {day} · 오늘
          </span>
          <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
            피부를 위해 오늘 무엇을 하셨나요?
          </h3>
        </div>

        {/* Slots List */}
        <div className="space-y-2.5">
          {SLOTS.map((slot) => {
            const isChecked = checkedSlots.has(slot.id)
            const isRecommended = slot.id === TODAY_RECOMMENDED

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-3xl px-4 py-3.5 transition-all border",
                  // Day 카드 방식: 선택 완료 시 흰 배경 + 왼쪽 세로 바
                  isChecked
                    ? "bg-card border-l-4 border-l-primary"
                    : isRecommended
                      ? "bg-accent border-primary"
                      : "bg-card border-border",
                )}
              >
                {/* 아이콘 원형 배경 — 통일색 */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg bg-background">
                  <span className="text-foreground">{slot.emoji}</span>
                </div>

                {/* 라벨 + 배지 */}
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span className="font-semibold text-foreground">
                    {slot.label}
                  </span>

                  {isRecommended && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full ml-2 whitespace-nowrap bg-primary text-white">
                      + 오늘의 추천
                    </span>
                  )}
                </div>

                {/* 체크마크 */}
                {isChecked && (
                  <div className="flex size-5 shrink-0 items-center justify-center">
                    <Check
                      className="size-5 text-primary"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 하단: 선택 상태 + 버튼 */}
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <p className="text-sm font-semibold text-center text-foreground">
            {checkedSlots.size === 0
              ? "오늘 하신 일을 선택해주세요"
              : `${checkedSlots.size}개 선택했어요`}
          </p>

          {showConditionPrompt ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">오늘 하신 케어, 피부 어땠어요?</p>
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
