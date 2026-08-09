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
import { DailyCover } from "@/components/daily-cover"
import { DiaryProvider, useDiary } from "@/lib/diary-context"
import { getAgeLabel, getFirstConcernTagLabel } from "@/lib/label-mappings"
import { t } from "@/lib/i18n"

interface PageProps {
  params: Promise<{
    locale: 'ko' | 'en'
  }>
}

function PageContent({ locale }: { locale: 'ko' | 'en' }) {
  const diary = useDiary()
  const { currentDay, totalDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [coverClosed, setCoverClosed] = useState(false)

  if (!diary.hydrated) return null

  if (!diary.onboarded) {
    const handleOnboardingComplete = (activeIngredients: string[], dataConsent: boolean, condition: "good" | "neutral" | "bad") => {
      diary.completeOnboarding(activeIngredients, dataConsent, condition)
    }
    return <OnboardingFlow locale={locale} diary={diary} onComplete={handleOnboardingComplete} />
  }

  const activeDay = selectedDay ?? currentDay

  const isCourseComplete = currentDay >= totalDays

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
        {!coverClosed && <DailyCover locale={locale} onClose={() => setCoverClosed(true)} />}
        <InstallBanner />

        {/* <ProgressBar30 loggedDays={diary.loggedDays} /> */}

        <ProgressHeader
          currentDay={currentDay}
          totalDays={totalDays}
          loggedDays={diary.loggedDays}
          heroImageSrc={diary.heroImageSrc}
          ageLabel={getAgeLabel(diary.age) ?? undefined}
          firstConcernTagLabel={getFirstConcernTagLabel(diary.concernTags) ?? undefined}
        />

        <TodayCareCard />

        <DailySlots
          day={activeDay}
          onConditionRecord={(condition, linkedCategory) => diary.recordCondition(activeDay, condition)}
        />

        <WeeklyMiniInsight />

        <CalendarGrid
          totalDays={totalDays}
          currentDay={currentDay}
          selectedDay={activeDay}
          completedDays={diary.loggedDays}
          justStampedDay={null}
          onSelect={setSelectedDay}
          loggedSlots={diary.loggedSlots}
          conditions={diary.conditions}
          joinDate={diary.joinDate}
        />

        {isCourseComplete && (
          <>
            <ThirtyDayReport isReady={isCourseComplete && diary.loggedDays.length > 0} />
          </>
        )}

        <LoginBanner />

        <SettingsPanel onStartFresh={diary.startFresh} />

        <p className="mt-1.5 text-center text-[12.5px] font-semibold text-[#5C5648]">
          {t("metadata.tagline", locale)}
        </p>
      </main>
    </>
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
