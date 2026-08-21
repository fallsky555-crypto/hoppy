"use client"

import { use, useState } from "react"
import { ProgressBar30 } from "@/components/progress-bar-30"
import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { DailySlots } from "@/components/daily-slots"
import { WeeklyMiniInsight } from "@/components/weekly-mini-insight"
import { TodayCareCard } from "@/components/today-care-card"
import { SkinBalanceRadar } from "@/components/skin-balance-radar"
import { LoginBanner } from "@/components/login-banner"
import { SettingsPanel } from "@/components/settings-panel"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { ThirtyDayReport } from "@/components/thirty-day-report"
import { InstallBanner } from "@/components/install-banner"
import { DailyCover } from "@/components/daily-cover"
import { DiaryProvider, useDiary } from "@/lib/diary-context"
import { todayISO } from "@/lib/use-diary"
import { t } from "@/lib/i18n"

interface PageProps {
  params: Promise<{
    locale: 'ko' | 'en'
  }>
}

/** DailyCover를 마지막으로 확인한 날짜(YYYY-MM-DD)를 저장하는 localStorage 키 */
const COVER_LAST_SEEN_KEY = "hoppy-cover-last-seen"

function todayDateKey(): string {
  return todayISO().slice(0, 10)
}

function hasSeenCoverToday(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(COVER_LAST_SEEN_KEY) === todayDateKey()
  } catch {
    return false
  }
}

function markCoverSeenToday(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(COVER_LAST_SEEN_KEY, todayDateKey())
  } catch {
    // 저장 실패해도 이번 세션은 이미 홈으로 넘어간 상태라 무시
  }
}

function PageContent({ locale }: { locale: 'ko' | 'en' }) {
  const diary = useDiary()
  const { currentDay, totalDays } = diary

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [coverConfirmed, setCoverConfirmed] = useState(() => hasSeenCoverToday())
  const [calendarPulse, setCalendarPulse] = useState(0)

  if (!diary.hydrated) return null

  if (!diary.onboarded) {
    const handleOnboardingComplete = (dataConsent: boolean) => {
      diary.completeOnboarding(dataConsent)
    }
    return <OnboardingFlow locale={locale} diary={diary} onComplete={handleOnboardingComplete} />
  }

  // 온보딩 완료 후, 하루 한 번, 날짜가 바뀌면 다시 보여준다(같은 날 재방문 시엔 건너뛴다).
  // 하트 버튼을 눌러야만 아래 홈 화면으로 넘어간다(자동 전환 없음). 단, 소유자 불일치로
  // 방금 원격 데이터를 복원한 경우(로그인 직후 등)는 예외 — "다이어리를 펼치는 의식"이
  // 아니라 로그인 성공을 확인하고 싶은 순간이라, 커버 대신 바로 홈으로 넘어간다.
  if (!coverConfirmed && !diary.justRestoredFromRemote) {
    return (
      <DailyCover
        locale={locale}
        name={diary.name}
        joinDate={diary.joinDate}
        onSaveName={diary.setName}
        onClose={() => {
          markCoverSeenToday()
          setCoverConfirmed(true)
        }}
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
          name={diary.name}
        />

        <TodayCareCard />

        <SkinBalanceRadar skinType={diary.skinType} locale={locale} onChangeSkinType={diary.setSkinType} />

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
