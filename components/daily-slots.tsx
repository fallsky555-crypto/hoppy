"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Check } from "lucide-react"

type SlotType = "prep" | "hydration" | "active" | "barrier" | "sun_care"

interface Slot {
  id: SlotType
  emoji: string
  label: string
}

const SLOTS: Slot[] = [
  { id: "prep", emoji: "🧴", label: "Prep" },
  { id: "hydration", emoji: "💧", label: "Hydration" },
  { id: "active", emoji: "⚡", label: "Active" },
  { id: "barrier", emoji: "🛡️", label: "Barrier" },
  { id: "sun_care", emoji: "☀️", label: "Sun Care" },
]

const TODAY_RECOMMENDED = "active" // 하드코딩된 오늘의 추천 슬롯
const CORAL_DARK = "#D85A30"
const CORAL_LIGHT = "#FFF0E8"
const CORAL_BORDER = "#E8B8A0"

interface DailySlotsProps {
  day?: number
}

export function DailySlots({ day = 1 }: DailySlotsProps) {
  const [checkedSlots, setCheckedSlots] = useState<Set<SlotType>>(new Set())

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
            어떤 케어를 했나요?
          </h3>
        </div>

        {/* Slots List */}
        <div className="space-y-2.5">
          {SLOTS.map((slot) => {
            const isChecked = checkedSlots.has(slot.id)
            const isRecommended = slot.id === TODAY_RECOMMENDED

            // 상태 결정
            let bgColor = "bg-background"
            let borderColor = "border-border"
            let borderWidth = "border"
            let textColor = "text-foreground"
            let iconBgColor = "bg-gray-200"
            let iconColor = "text-gray-600"

            if (isChecked && isRecommended) {
              // 상태 3: 추천 + 선택 완료
              bgColor = "bg-white" // 옅은 배경
              borderColor = ""
              borderWidth = ""
              textColor = "text-white"
              iconBgColor = "bg-white/30"
              iconColor = "text-white"
              // 실제로는 배경색을 코랄로 채우려면 인라인 스타일 사용
            } else if (isRecommended && !isChecked) {
              // 상태 2: 오늘의 추천 (미선택)
              bgColor = "bg-white"
              borderColor = "border-[#E8B8A0]"
              borderWidth = "border"
              textColor = "text-foreground"
              iconBgColor = "bg-orange-100"
              iconColor = "text-orange-600"
            } else {
              // 상태 1: 기본 (미추천/미선택)
              bgColor = "bg-background"
              borderColor = "border-border"
              borderWidth = "border"
              textColor = "text-foreground"
              iconBgColor = "bg-gray-200"
              iconColor = "text-gray-600"
            }

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                style={isChecked && isRecommended ? { backgroundColor: CORAL_DARK } : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-3xl px-4 py-3.5 transition-all",
                  borderWidth,
                  borderColor,
                  !isChecked || !isRecommended ? bgColor : "",
                )}
              >
                {/* 아이콘 원형 배경 */}
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-lg",
                    isChecked && isRecommended ? "bg-white/20" : iconBgColor,
                  )}
                >
                  <span className={isChecked && isRecommended ? "text-white" : iconColor}>
                    {slot.emoji}
                  </span>
                </div>

                {/* 라벨 + 배지 */}
                <div className="flex flex-1 items-center justify-between min-w-0">
                  <span
                    className={cn(
                      "font-semibold",
                      isChecked && isRecommended ? "text-white" : textColor,
                    )}
                  >
                    {slot.label}
                  </span>

                  {isRecommended && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-full ml-2 whitespace-nowrap",
                        isChecked && isRecommended
                          ? "bg-white/25 text-white"
                          : "bg-[#D85A30] text-white",
                      )}
                    >
                      + 오늘의 추천
                    </span>
                  )}
                </div>

                {/* 체크마크 */}
                {isChecked && (
                  <div className="flex size-5 shrink-0 items-center justify-center">
                    <Check
                      className={cn(
                        "size-5",
                        isRecommended ? "text-white" : "text-foreground",
                      )}
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
              ? "슬롯을 선택해주세요"
              : `${checkedSlots.size}개 슬롯 선택됨`}
          </p>

          <button
            type="button"
            className="w-full rounded-full bg-[#5A7D6F] hover:bg-[#4A6D5F] text-white font-semibold py-3 transition-colors"
          >
            기록 완료
          </button>
        </div>
      </div>
    </section>
  )
}
