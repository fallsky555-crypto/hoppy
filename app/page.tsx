"use client"

import { useState } from "react"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { RecipeCard } from "@/components/recipe-card"
import { DailyHabits } from "@/components/daily-habits"
import { BarrierScoreChart } from "@/components/barrier-score-chart"
import { IncidentPanel } from "@/components/incident-panel"
import { LockedPreview } from "@/components/locked-preview"
import { RoutineBanner } from "@/components/routine-banner"
import { LoginBanner } from "@/components/login-banner"
import { SettingsPanel } from "@/components/settings-panel"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { CompletionFeedback } from "@/components/completion-feedback"
import { useDiary } from "@/lib/use-diary"
import type { IncidentType } from "@/lib/scheduling-engine"
import { getCompletionCopy } from "@/lib/routine-copy"

export default function Page() {
  const diary = useDiary()
  const { currentDay, totalDays, completedDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [justStampedDay, setJustStampedDay] = useState<number | null>(null)

  // 하이드레이션 전엔 아무것도 그리지 않는다 — localStorage/원격 상태를 아직 못 읽은 채로
  // 온보딩 화면을 잠깐 보여줬다가 메인 화면으로 튀는 깜빡임을 피하기 위해서다.
  if (!diary.hydrated) return null

  // 아직 온보딩(간격 슬라이더 질문)을 마치지 않았으면 메인 화면 대신 온보딩만 보여준다.
  // 온보딩을 마치기 전까지는 가입일(Day 1)도 아직 찍히지 않은 상태다.
  if (!diary.onboarded) return <OnboardingFlow onComplete={diary.completeOnboarding} />

  // 선택된 날이 없으면 오늘을 기본값으로 사용
  const activeDay = selectedDay ?? currentDay

  const isCourseComplete = currentDay >= totalDays

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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <ProgressHeader
        currentDay={currentDay}
        totalDays={totalDays}
        completedCount={completedDays.length}
        heroImageSrc={diary.heroImageSrc}
      />

      {/* "오늘 뭘 해야 하는지"가 최대한 빨리 보이도록 스페셜케어 카드를 배너들보다 위로 끌어올린다 */}
      <RecipeCard
        day={activeDay}
        currentDay={currentDay}
        isCompleted={completedDays.includes(activeDay)}
        onRecord={handleRecord}
        getRecipe={diary.getRecipeForDay}
        calendar={diary.calendar}
        hasReportedReaction={hasReportedReactionToday}
        onReportReaction={handleReportReaction}
        concern={diary.concern}
        supportOwned={diary.supportOwned}
      />

      {isCourseComplete && (
        <>
          <RoutineBanner copy={getCompletionCopy(totalDays)} tone="celebrate" />
          <CompletionFeedback onSubmit={diary.submitFeedback} />
        </>
      )}

      <IncidentPanel currentDay={currentDay} incidentLog={diary.incidentLog} onReportIncident={handleReportIncident} />

      {(diary.pregnant || diary.prescriptionMeds) && (
        <div className="space-y-1.5 rounded-4xl bg-secondary/60 p-4 text-xs leading-relaxed text-secondary-foreground ring-1 ring-border">
          {diary.pregnant && <p>🤰 임신·수유 중으로 확인됐어요. 레티놀 성분은 이 코스에서 제외돼요.</p>}
          {diary.prescriptionMeds && <p>💊 처방약을 사용 중이시군요. 담당 병원의 처방 지도가 이 앱의 가이드보다 항상 우선이에요.</p>}
        </div>
      )}

      <CalendarGrid
        totalDays={totalDays}
        currentDay={currentDay}
        selectedDay={activeDay}
        completedDays={completedDays}
        justStampedDay={justStampedDay}
        onSelect={setSelectedDay}
        getRecipe={diary.getRecipeForDay}
      />

      <DailyHabits
        day={activeDay}
        habit={diary.getHabit(activeDay)}
        maxWater={diary.maxWater}
        onToggleSunscreen={() => diary.toggleSunscreen(activeDay)}
        onWater={(delta) => diary.setWater(activeDay, delta)}
      />

      <BarrierScoreChart currentDay={currentDay} totalDays={totalDays} />

      <LoginBanner />

      <LockedPreview />

      <SettingsPanel onStartFresh={diary.startFresh} />

      <p className="mt-1.5 text-center text-[12.5px] font-semibold text-[#5C5648]">
        myroutinediet · 가입한 날부터 30일, 나만의 속도로
      </p>
    </main>
  )
}
