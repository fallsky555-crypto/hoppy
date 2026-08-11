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
  const [coverConfirmed, setCoverConfirmed] = useState(false)
  const [calendarPulse, setCalendarPulse] = useState(0)

  if (!diary.hydrated) return null

  if (!diary.onboarded) {
    const handleOnboardingComplete = (activeIngredients: string[], dataConsent: boolean, condition: "good" | "neutral" | "bad") => {
      diary.completeOnboarding(activeIngredients, dataConsent, condition)
    }
    return <OnboardingFlow locale={locale} diary={diary} onComplete={handleOnboardingComplete} />
  }

  // 온보딩 완료 후, 앱을 켤 때마다(당일 첫 방문 여부와 무관하게) 매번 커버를 먼저 보여준다.
  // 하트 버튼을 눌러야만 아래 홈 화면으로 넘어간다(자동 전환 없음).
  if (!coverConfirmed) {
    return (
      <DailyCover
        locale={locale}
        name={diary.name}
        joinDate={diary.joinDate}
        onSaveName={diary.setName}
        onClose={() => setCoverConfirmed(true)}
      />
    )
  }

  const activeDay = selectedDay ?? currentDay

  const isCourseComplete = currentDay >= totalDays

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
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
          onCollapse={() => setCalendarPulse((p) => p + 1)}
        />

        <WeeklyMiniInsight />

        {/* key로 강제 remount하여 calendarPulse 증가 시마다 진입 연출을 재생한다 */}
        <div key={calendarPulse} className={calendarPulse > 0 ? "animate-calendar-reveal rounded-4xl" : ""}>
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
            revealPulse={calendarPulse > 0}
          />
        </div>

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
