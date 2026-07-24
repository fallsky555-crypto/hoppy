"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { RecipeCard } from "@/components/recipe-card"
import { DailyHabits } from "@/components/daily-habits"
import { BarrierScoreChart } from "@/components/barrier-score-chart"
import { IncidentPanel } from "@/components/incident-panel"
import { LockedPreview } from "@/components/locked-preview"
import { RoutineBanner } from "@/components/routine-banner"
import { LoginBanner } from "@/components/login-banner"
import { BARRIER_SCORE_START_DAY, useDiary } from "@/lib/use-diary"
import type { IncidentType } from "@/lib/scheduling-engine"
import { getCompletionCopy, getOrientationCopy } from "@/lib/routine-copy"

export default function Page() {
  const diary = useDiary()
  const { currentDay, totalDays, completedDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [justStampedDay, setJustStampedDay] = useState<number | null>(null)
  const [dismissedOrientationDay, setDismissedOrientationDay] = useState<number | null>(null)

  // 선택된 날이 없으면 오늘을 기본값으로 사용
  const activeDay = selectedDay ?? currentDay

  // Day 1/8/15/22/29... 마다, 오늘 카테고리 그룹이 처음 시작되는 경우에만 오리엔테이션을 보여준다
  const isOrientationDay = currentDay % 7 === 1
  const orientationCopy = isOrientationDay ? getOrientationCopy(diary.getRecipeForDay, currentDay) : null
  const showWeekOrientation = orientationCopy !== null && dismissedOrientationDay !== currentDay
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

  // 로그인 계정에 이미 진행 중인 루틴이 있는데 체커에서 새 진단을 들고 돌아온 경우 —
  // 조용히 덮어쓰지 않고 먼저 확인을 받는다. 이 화면이 해소되기 전까지는 캘린더를
  // 포함한 나머지 화면(의료 상담 안내 포함)을 렌더링하지 않는다.
  if (diary.pendingReDiagnosis) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <h1 className="font-display text-lg font-bold text-foreground">이미 진행 중인 루틴이 있어요</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Day {currentDay}/{totalDays}까지 기록해두셨어요. 새 진단 결과로 다시 시작하시겠어요?
        </p>
        <div className="mt-2 flex w-full flex-col gap-2">
          <Button type="button" onClick={diary.confirmKeepExistingRoutine} className="w-full rounded-full">
            기존 루틴 계속하기
          </Button>
          <Button type="button" variant="outline" onClick={diary.confirmStartFreshRoutine} className="w-full rounded-full">
            새로 시작하기
          </Button>
        </div>
        <p className="text-xs font-medium text-destructive">새로 시작하면 지금까지 기록한 Day와 기록이 모두 사라져요.</p>
      </main>
    )
  }

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

      {isCourseComplete && <RoutineBanner copy={getCompletionCopy(totalDays)} tone="celebrate" />}

      {showWeekOrientation && orientationCopy && (
        <RoutineBanner copy={orientationCopy} onDismiss={() => setDismissedOrientationDay(currentDay)} />
      )}

      {(diary.pregnant || diary.prescriptionMeds) && (
        <div className="space-y-1.5 rounded-4xl bg-secondary/60 p-4 text-xs leading-relaxed text-secondary-foreground ring-1 ring-border">
          {diary.pregnant && <p>🤰 임신·수유 중으로 확인됐어요. 레티놀 성분은 이 코스에서 제외돼요.</p>}
          {diary.prescriptionMeds && <p>💊 처방약을 사용 중이시군요. 담당 병원의 처방 지도가 이 앱의 가이드보다 항상 우선이에요.</p>}
        </div>
      )}

      <LoginBanner />

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
        concern={diary.concern}
        supportOwned={diary.supportOwned}
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

      <p className="mt-1.5 text-center text-[12.5px] font-semibold text-[#5C5648]">
        myroutinediet · 가입한 날부터 30일, 나만의 속도로
      </p>
    </main>
  )
}
