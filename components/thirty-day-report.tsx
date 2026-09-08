"use client"

import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { useAgeGroup } from "@/lib/use-age-group"
import { SKIN_TYPE_LABEL_KEYS, type SkinType } from "@/lib/label-mappings"
import { TOTAL_DAYS } from "@/lib/schedule"

interface Report30DayProps {
  isReady: boolean
}

/** CTA가 스크롤로 이동할 대상 — app/[locale]/page.tsx의 DoSkipCard 래퍼 id와 일치 */
const PICKS_ANCHOR_ID = "today-picks"

/**
 * 30일 스킨 웨더 결산 — 통계표·주기성·페이월 없이, 체크인 데이터 기반의
 * '피부 방어율' + 계절/날씨 맞춤 처방 3줄 + 케어 픽 CTA로 이뤄진 단일 카드.
 */
export function ThirtyDayReport({ isReady }: Report30DayProps) {
  const locale = useLocale()
  const diary = useDiary()
  const [ageGroup] = useAgeGroup()

  if (!isReady) return null

  // 가장 최근에 완료된 30일 블록의 체크인(출석) 일수
  //  currentDay 30~59 → 블록 0 (Day 1~30), 60~89 → 블록 1 (Day 31~60) ...
  const blockIndex = Math.max(0, Math.floor(diary.currentDay / TOTAL_DAYS) - 1)
  const blockStart = blockIndex * TOTAL_DAYS + 1
  const blockEnd = blockStart + TOTAL_DAYS - 1
  const attended = Math.min(
    diary.loggedDays.filter((d) => d >= blockStart && d <= blockEnd).length,
    TOTAL_DAYS,
  )
  const defenseRate = Math.round((attended / TOTAL_DAYS) * 100)

  const subtitle = diary.name
    ? interpolate(t("report30day.subtitle", locale), { name: diary.name })
    : t("report30day.subtitleNoName", locale)

  // "{연령대} · {피부타입} 맞춤 방어 처방"
  const ageLabel = t(`doSkip.age.${ageGroup}`, locale) as string
  const skinLabel =
    diary.skinType && diary.skinType in SKIN_TYPE_LABEL_KEYS
      ? (t(SKIN_TYPE_LABEL_KEYS[diary.skinType as SkinType], locale) as string)
      : null
  const profile = skinLabel ? `${ageLabel} · ${skinLabel}` : ageLabel
  const prescriptionTitle = interpolate(t("report30day.prescriptionTitle", locale), { profile })

  const tips = [
    { emoji: "☀️", label: t("report30day.tipDayLabel", locale), body: t("report30day.tipDay", locale) },
    { emoji: "🌙", label: t("report30day.tipNightLabel", locale), body: t("report30day.tipNight", locale) },
    { emoji: "🌡️", label: t("report30day.tipWeatherLabel", locale), body: t("report30day.tipWeather", locale) },
  ]

  const scrollToPicks = () => {
    document.getElementById(PICKS_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="overflow-hidden rounded-[28px] bg-gradient-to-b from-[#E6F4EE] via-[#EEF6FA] to-card ring-1 ring-border">
      <div className="flex flex-col gap-8 px-7 py-9">
        {/* ── 헤더 ── */}
        <header className="flex flex-col gap-1.5">
          <h2 className="font-display text-[22px] font-semibold leading-snug text-foreground">
            {t("report30day.title", locale)}
          </h2>
          <p className="text-[13px] font-medium text-muted-foreground">{subtitle}</p>
        </header>

        {/* ── 피부 방어율 ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              {t("report30day.defenseRateLabel", locale)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("report30day.defenseRateSub", locale)}
            </span>
          </div>

          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-semibold leading-none text-[#2F7D5B]">{defenseRate}</span>
            <span className="pb-1 text-lg font-semibold text-[#2F7D5B]/70">%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-[#E4F3EC]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8FD8B9] to-[#3FA97F] transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(defenseRate, 3)}%` }}
            />
          </div>

          <p className="text-[12px] font-medium text-muted-foreground">
            {interpolate(t("report30day.attendance", locale), {
              attended: String(attended),
              total: String(TOTAL_DAYS),
            })}
          </p>

          <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">
            {interpolate(t("report30day.defenseComment", locale), { days: String(attended) })}
          </p>
        </section>

        {/* ── 계절/날씨 맞춤 방어 처방 ── */}
        <section className="flex flex-col gap-3.5">
          <h3 className="text-[13px] font-semibold text-foreground">{prescriptionTitle}</h3>
          <ul className="flex flex-col gap-3">
            {tips.map((tip) => (
              <li key={tip.label} className="flex gap-3">
                <span className="mt-0.5 text-base leading-none" aria-hidden>
                  {tip.emoji}
                </span>
                <p className="text-[13px] leading-relaxed text-foreground">
                  <span className="font-semibold">{tip.label}</span>
                  <span className="text-muted-foreground"> — {tip.body}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ── */}
        <button
          type="button"
          onClick={scrollToPicks}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          {t("report30day.cta", locale)} →
        </button>
      </div>
    </div>
  )
}
