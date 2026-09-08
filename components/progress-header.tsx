"use client"

import Image from "next/image"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface ProgressHeaderProps {
  /** 상단 여정 카드 히어로 이미지 — "스페셜케어 사이클"마다 바뀐다(lib/hero-image.ts 참고) */
  heroImageSrc: string
  /** 다이어리 커버에서 입력한 이름 — 있으면 타이틀에 반영, 없으면 기본 타이틀 */
  name?: string | null
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

function todayLabel(locale: "ko" | "en"): string {
  const now = new Date()
  if (locale === "ko") {
    return `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS_KO[now.getDay()]}요일`
  }
  return now.toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long" })
}

/**
 * 상단 여정 카드. 카운트다운·달성률 통계는 스킨 웨더 개편으로 제거하고,
 * 오늘 날짜 + 다정한 감성 카피 한 줄로 대체했다.
 */
export function ProgressHeader({ heroImageSrc, name }: ProgressHeaderProps) {
  const locale = useLocale()

  const title = name
    ? interpolate(t("progressHeader.titleWithName", locale), { name })
    : t("progressHeader.title", locale)

  return (
    <header className="overflow-hidden rounded-4xl bg-card ring-1 ring-border">
      {/* 텍스트와 겹치지 않는 별도 배너 영역 */}
      <div className="relative h-48 w-full">
        <Image
          src={heroImageSrc}
          alt=""
          fill
          className="object-cover object-[center_top]"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="px-6 py-7">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("progressHeader.tagline", locale)}
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <h1 className="flex-1 truncate font-display text-lg font-semibold leading-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="mt-5 rounded-2xl bg-secondary px-4 py-3.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-primary-text">
            {todayLabel(locale)}
          </p>
          <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-foreground">
            {t("progressHeader.greeting", locale)}
          </p>
        </div>
      </div>
    </header>
  )
}
