"use client"

import { useState } from "react"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { RecipeCard } from "@/components/recipe-card"
import { LockedPreview } from "@/components/locked-preview"
import { TOTAL_DAYS, CURRENT_DAY } from "@/lib/schedule"

export default function Page() {
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY)
  // Day 1 ~ 11 은 이미 완수한 상태로 시작
  const [completedDays, setCompletedDays] = useState<number[]>(
    Array.from({ length: CURRENT_DAY - 1 }, (_, i) => i + 1),
  )
  const [justStampedDay, setJustStampedDay] = useState<number | null>(null)

  function handleRecord() {
    if (completedDays.includes(CURRENT_DAY)) return
    setCompletedDays((prev) => [...prev, CURRENT_DAY])
    setJustStampedDay(CURRENT_DAY)
    setSelectedDay(CURRENT_DAY)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <ProgressHeader currentDay={CURRENT_DAY} totalDays={TOTAL_DAYS} completedCount={completedDays.length} />

      <CalendarGrid
        totalDays={TOTAL_DAYS}
        currentDay={CURRENT_DAY}
        selectedDay={selectedDay}
        completedDays={completedDays}
        justStampedDay={justStampedDay}
        onSelect={setSelectedDay}
      />

      <RecipeCard
        day={selectedDay}
        currentDay={CURRENT_DAY}
        isCompleted={completedDays.includes(selectedDay)}
        onRecord={handleRecord}
      />

      <LockedPreview />

      <p className="pt-1 text-center text-[11px] text-muted-foreground">
        호빵이 스킨 다이어리 · 무너진 장벽을 30일 동안 부드럽게 🐾
      </p>
    </main>
  )
}
