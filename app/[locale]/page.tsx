"use client"

import { use, useEffect, useRef } from "react"
import { ProgressHeader } from "@/components/progress-header"
// [스킨 웨더 개편] DailySlots는 메인에서 내렸다 — 컴포넌트/로직은 보존, 필요 시 복구.
// import { DailySlots } from "@/components/daily-slots"
import { WeeklyMiniInsight } from "@/components/weekly-mini-insight"
import { SkinWeatherCard } from "@/components/skin-weather-card"
import { DoSkipCard } from "@/components/do-skip-card"
import { SkinArchiveCalendar } from "@/components/skin-archive-calendar"
import { LoginBanner } from "@/components/login-banner"
import { InstallBanner } from "@/components/install-banner"
import { DiaryProvider, useDiary } from "@/lib/diary-context"
import { t } from "@/lib/i18n"

interface PageProps {
  params: Promise<{
    locale: 'ko' | 'en'
  }>
}

function PageContent({ locale }: { locale: 'ko' | 'en' }) {
  const diary = useDiary()

  const onboardingKicked = useRef(false)
  const autoCheckedIn = useRef(false)

  // 레거시 온보딩 스텝('결과지 정보동의' · '결과지 다시보기')을 제거했다 — 이제 다이어리
  // 커버가 곧 진입점이다. 온보딩 플래그가 없으면 화면 앞을 막지 않고 조용히 완료 처리한다.
  // (비식별 통계의 백엔드 저장은 completeOnboarding 내부에서 그대로 수행된다.)
  useEffect(() => {
    if (diary.hydrated && !diary.onboarded && !onboardingKicked.current) {
      onboardingKicked.current = true
      diary.completeOnboarding(true)
    }
  }, [diary.hydrated, diary.onboarded, diary])

  // 자동 출근 도장 — 수동 '완료' 버튼을 없앴다. 대시보드에 진입하면 오늘 날짜의 체크인이
  // 곧바로 캘린더에 기록된다. (state는 localStorage/원격에 자동 동기화된다.)
  useEffect(() => {
    if (!diary.hydrated || !diary.onboarded || autoCheckedIn.current) return
    autoCheckedIn.current = true
    if (!diary.loggedDays.includes(diary.currentDay)) {
      diary.recordLoggedDay(diary.currentDay)
    }
  }, [diary.hydrated, diary.onboarded, diary])

  // completeOnboarding()의 setState가 반영될 때까지(찰나) 빈 화면을 유지한다.
  if (!diary.hydrated || !diary.onboarded) return null

  // 온보딩 커버(DailyCover)는 제거됐다 — 접속하면 곧바로 홈(히어로 배너 + 스킨 웨더)이 뜬다.
  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-10 pt-5">
        <InstallBanner />

        {/* 상단 히어로 + 스킨 웨더 + 오늘 필수 = 카드 박스 없이 여백·1px 디바이더로만
            구획하는 에디토리얼 매거진 지면. 시선이 위에서 아래로 자연스레 흐른다. */}
        <section>
          <div className="overflow-hidden rounded-[20px]">
            <ProgressHeader heroImageSrc={diary.heroImageSrc} />
          </div>
          <SkinWeatherCard />
        </section>

        {/* id: 30일 결산 리포트 CTA가 스크롤로 되돌아오는 지점 */}
        <div id="today-picks" className="scroll-mt-4">
          <DoSkipCard />
        </div>

        <WeeklyMiniInsight />

        {/* [스킨 웨더 개편] 4개 슬롯 상세 입력 UI는 메인에서 제거. 오늘 필수 케어 + 자동 출석으로 대체.
            <div id="daily-slots-anchor">
              <DailySlots
                day={activeDay}
                onConditionRecord={(condition, linkedCategory) => diary.recordCondition(activeDay, condition)}
                onCollapse={() => setCalendarPulse((p) => p + 1)}
              />
            </div>
        */}

        {/* 체크인한 날짜만 잔잔하게 보여주는 아카이브형 미니 캘린더 (화면 하단) */}
        <SkinArchiveCalendar locale={locale} />

        {/* 매거진 맨 하단 각주 — 계정 연동 안내(1줄 텍스트 링크) + 태그라인.
            캘린더와 여백을 두고 자연스럽게 이어진다. */}
        <footer className="mt-3 flex flex-col gap-3">
          <LoginBanner />
          <p className="text-center text-[12.5px] font-semibold text-[#5C5648]">
            {t("metadata.tagline", locale)}
          </p>
        </footer>
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
