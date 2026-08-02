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
      <div className="flex flex-col gap-3">
        <div>
          <span className="font-display text-[13px] font-semibold text-muted-foreground">
            Day {day} · 오늘
          </span>
          <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
            어떤 케어를 했나요?
          </h3>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {SLOTS.map((slot) => {
            const isChecked = checkedSlots.has(slot.id)
            const isRecommended = slot.id === TODAY_RECOMMENDED

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                className={cn(
                  "group relative rounded-3xl border px-4 py-3.5 text-left transition-all",
                  isChecked
                    ? "border-transparent bg-foreground"
                    : isRecommended
                      ? "border-foreground/30 bg-background hover:border-foreground/50 hover:bg-foreground/5"
                      : "border-border bg-background hover:border-foreground/30 hover:bg-foreground/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className={cn(
                      "text-2xl leading-none",
                      isChecked ? "" : ""
                    )}>
                      {slot.emoji}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isChecked ? "text-white" : "text-foreground",
                      )}
                    >
                      {slot.label}
                    </span>
                  </div>

                  {isChecked && (
                    <div className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                      "bg-white/20"
                    )}>
                      <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
                    </div>
                  )}
                </div>

                {isRecommended && !isChecked && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-1">
                    <span className="text-xs font-semibold text-foreground">
                      💡 오늘 바르는 날
                    </span>
                  </div>
                )}

                {isRecommended && isChecked && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1">
                    <span className="text-xs font-semibold text-white">
                      💡 오늘 바르는 날
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {checkedSlots.size === 0
              ? "케어한 슬롯을 선택해주세요"
              : `${checkedSlots.size}개 슬롯 선택됨`}
          </p>
        </div>
      </div>
    </section>
  )
}
