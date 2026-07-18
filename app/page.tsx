"use client"

import { useState } from "react"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { RecipeCard } from "@/components/recipe-card"
import { DailyHabits } from "@/components/daily-habits"
import { BarrierScoreChart } from "@/components/barrier-score-chart"
import { IncidentPanel } from "@/components/incident-panel"
import { LockedPreview } from "@/components/locked-preview"
import { BARRIER_SCORE_START_DAY, useDiary } from "@/lib/use-diary"
import type { IncidentType } from "@/lib/scheduling-engine"

export default function Page() {
  const diary = useDiary()
  const { currentDay, totalDays, completedDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [justStampedDay, setJustStampedDay] = useState<number | null>(null)

  // 선택된 날이 없으면 오늘을 기본값으로 사용
  const activeDay = selectedDay ?? currentDay

  function handleRecord() {
    if (completedDays.includes(currentDay)) return
    diary.complete(currentDay)
    setJustStampedDay(currentDay)
    setSelectedDay(currentDay)
  }

  function handleReportIncident(incidentType: IncidentType) {
    diary.reportIncident(currentDay, incidentType)
  }

  function handleReportReaction() {
    diary.reportReaction(currentDay, diary.getRecipeForDay(currentDay).type)
  }

  const hasReportedReactionToday = diary.reactionLog.some((entry) => entry.day === currentDay)

  // 9-2. symptom === 'bad'인 경우 캘린더 대신 의료 상담 안내만 노출한다
  if (diary.medicalReferral) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <span aria-hidden className="text-4xl">
          🏥
        </span>
        <h1 className="font-display text-lg font-bold text-foreground">피부과 방문을 권장합니다</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          현재 증상은 앱의 셀프 케어 루틴만으로 관리하기 어려울 수 있어요. 호빵이 스킨 다이어리는 진료를 대체하지
          않으니, 가까운 피부과에서 먼저 상담받아 보세요.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <ProgressHeader currentDay={currentDay} totalDays={totalDays} completedCount={completedDays.length} />

      <CalendarGrid
        totalDays={totalDays}
        currentDay={currentDay}
        selectedDay={activeDay}
        completedDays={completedDays}
        justStampedDay={justStampedDay}
        onSelect={setSelectedDay}
        getRecipe={diary.getRecipeForDay}
      />

      <RecipeCard
        day={activeDay}
        currentDay={currentDay}
        isCompleted={completedDays.includes(activeDay)}
        onRecord={handleRecord}
        getRecipe={diary.getRecipeForDay}
        hasReportedReaction={hasReportedReactionToday}
        onReportReaction={handleReportReaction}
      />

      <DailyHabits
        day={activeDay}
        habit={diary.getHabit(activeDay)}
        maxWater={diary.maxWater}
        onToggleSunscreen={() => diary.toggleSunscreen(activeDay)}
        onWater={(delta) => diary.setWater(activeDay, delta)}
      />

      {/* 진단(Tier/Type)이 있어야 개인화 캘린더가 있고, 인시던트·장벽 점수가 실제로 반영된다 */}
      {diary.tier !== null && (
        <>
          <BarrierScoreChart log={diary.barrierScoreLog} unlockDay={BARRIER_SCORE_START_DAY} />
          <IncidentPanel currentDay={currentDay} incidentLog={diary.incidentLog} onReportIncident={handleReportIncident} />
        </>
      )}

      <LockedPreview skinType={diary.skinType} />

      <p className="pt-1 text-center text-[11px] text-muted-foreground">
        호빵이 스킨 다이어리 · 가입한 날부터 30일, 나만의 속도로 🐾
      </p>
    </main>
  )
}
