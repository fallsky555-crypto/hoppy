"use client"

import { use, useState } from "react"
import { ProgressBar30 } from "@/components/progress-bar-30"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { DailySlots } from "@/components/daily-slots"
import { WeeklyMiniInsight } from "@/components/weekly-mini-insight"
import { TodayCareCard } from "@/components/today-care-card"
import { LoginBanner } from "@/components/login-banner"
import { SettingsPanel } from "@/components/settings-panel"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { ThirtyDayReport } from "@/components/thirty-day-report"
import { InstallBanner } from "@/components/install-banner"
import { DiaryProvider, useDiary } from "@/lib/diary-context"
import type { IncidentType } from "@/lib/scheduling-engine"
import { t } from "@/lib/i18n"

interface PageProps {
  params: {
    locale: 'ko' | 'en'
  }
}

function PageContent({ locale }: { locale: 'ko' | 'en' }) {
  const diary = useDiary()
  const { currentDay, totalDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  if (!diary.hydrated) return null

  if (!diary.onboarded) return <OnboardingFlow locale={locale} onComplete={diary.completeOnboarding} />

  const activeDay = selectedDay ?? currentDay

  const isCourseComplete = currentDay >= totalDays

  function handleReportIncident(incidentType: IncidentType) {
    diary.reportIncident(currentDay, incidentType)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <InstallBanner />

      {/* <ProgressBar30 loggedDays={diary.loggedDays} /> */}

      <ProgressHeader
        currentDay={currentDay}
        totalDays={totalDays}
        loggedDays={diary.loggedDays}
        heroImageSrc={diary.heroImageSrc}
      />

      <DailySlots
        day={activeDay}
        onConditionRecord={(condition, linkedCategory) => diary.recordCondition(activeDay, condition)}
      />

      <TodayCareCard />

      <WeeklyMiniInsight />

      {isCourseComplete && (
        <>
          <ThirtyDayReport isReady={isCourseComplete && diary.loggedDays.length > 0} />
        </>
      )}


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
        completedDays={diary.loggedDays}
        justStampedDay={null}
        onSelect={setSelectedDay}
        getRecipe={diary.getRecipeForDay}
        conditions={diary.conditions}
      />

      <LoginBanner />

      <SettingsPanel onStartFresh={diary.startFresh} />

      <p className="mt-1.5 text-center text-[12.5px] font-semibold text-[#5C5648]">
        {t("metadata.tagline", locale)}
      </p>
    </main>
  )
}

export default function Page({ params }: PageProps) {
  const locale = use(params).locale as 'ko' | 'en'

  return (
    <DiaryProvider>
      <PageContent locale={locale} />
    </DiaryProvider>
  )
}
