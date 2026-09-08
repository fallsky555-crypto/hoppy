"use client"

import { use, useEffect, useRef, useState } from "react"
import { ProgressHeader } from "@/components/progress-header"
// [스킨 웨더 개편] DailySlots는 메인에서 내렸다 — 컴포넌트/로직은 보존, 필요 시 복구.
// import { DailySlots } from "@/components/daily-slots"
// 밸런스 레이더 / 캘린더는 RecordsPanel(접이식)로 묶어 하단 무게를 줄였다.
import { WeeklyMiniInsight } from "@/components/weekly-mini-insight"
import { PreviewInsightCard } from "@/components/preview-insight-card"
import { SkinWeatherCard } from "@/components/skin-weather-card"
import { DoSkipCard } from "@/components/do-skip-card"
import { RecordsPanel } from "@/components/records-panel"
import { SkinArchiveCalendar } from "@/components/skin-archive-calendar"
import { LoginBanner } from "@/components/login-banner"
import { SettingsPanel } from "@/components/settings-panel"
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

  const [coverConfirmed, setCoverConfirmed] = useState(() => hasSeenCoverToday())
  const onboardingKicked = useRef(false)

  // 레거시 온보딩 스텝('결과지 정보동의' · '결과지 다시보기')을 제거했다 — 이제 다이어리
  // 커버가 곧 진입점이다. 온보딩 플래그가 없으면 화면 앞을 막지 않고 조용히 완료 처리한다.
  // (비식별 통계의 백엔드 저장은 completeOnboarding 내부에서 그대로 수행된다.)
  useEffect(() => {
    if (diary.hydrated && !diary.onboarded && !onboardingKicked.current) {
      onboardingKicked.current = true
      diary.completeOnboarding(true)
    }
  }, [diary.hydrated, diary.onboarded, diary])

  // completeOnboarding()의 setState가 반영될 때까지(찰나) 빈 화면을 유지한다.
  if (!diary.hydrated || !diary.onboarded) return null

  // 커버는 하루 한 번, 날짜가 바뀌면 다시 보여준다(같은 날 재방문 시엔 건너뛴다).
  // 하트 버튼을 눌러야만 아래 홈 화면으로 넘어간다(자동 전환 없음). 단, 소유자 불일치로
  // 방금 원격 데이터를 복원한 경우(로그인 직후 등)는 예외 — "다이어리를 펼치는 의식"이
  // 아니라 로그인 성공을 확인하고 싶은 순간이라, 커버 대신 바로 홈으로 넘어간다.
  if (!coverConfirmed && !diary.justRestoredFromRemote) {
    return (
      <DailyCover
        locale={locale}
        onClose={() => {
          markCoverSeenToday()
          setCoverConfirmed(true)
        }}
      />
    )
  }

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
        <InstallBanner />

        <ProgressHeader heroImageSrc={diary.heroImageSrc} name={diary.name} />

        <SkinWeatherCard />

        {/* id: 30일 결산 리포트 CTA가 스크롤로 되돌아오는 지점 */}
        <div id="today-picks" className="scroll-mt-4">
          <DoSkipCard />
        </div>

        <WeeklyMiniInsight />

        {/* [스킨 웨더 개편] 4개 슬롯 상세 입력 UI는 메인에서 제거. DO & SKIP + 원탭 체크인으로 대체.
            <div id="daily-slots-anchor">
              <DailySlots
                day={activeDay}
                onConditionRecord={(condition, linkedCategory) => diary.recordCondition(activeDay, condition)}
                onCollapse={() => setCalendarPulse((p) => p + 1)}
              />
            </div>
        */}

        <PreviewInsightCard />

        <RecordsPanel locale={locale} />

        {/* 체크인한 날짜만 잔잔하게 보여주는 아카이브형 미니 캘린더 (화면 하단) */}
        <SkinArchiveCalendar locale={locale} />

        {/* 누적 방어 리포트 — 홈에는 슬림한 링크만, 터치 시 모달로 연다(홈 경량화) */}
        <ThirtyDayReport />

        <LoginBanner />

        <SettingsPanel />

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
