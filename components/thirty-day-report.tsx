"use client"

import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { useAgeGroup } from "@/lib/use-age-group"
import { SKIN_TYPE_LABEL_KEYS, type SkinType } from "@/lib/label-mappings"

/** CTA가 스크롤로 이동할 대상 — app/[locale]/page.tsx의 DoSkipCard 래퍼 id와 일치 */
const PICKS_ANCHOR_ID = "today-picks"

/** 이 수보다 체크인이 적으면 결산 대신 "첫 방어 체크인" 안내 카드를 보여준다 */
const MIN_CHECKINS_FOR_SUMMARY = 2

function scrollToPicks() {
  document.getElementById(PICKS_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/**
 * 호빵이의 스킨 웨더 기록 — '30일 단기 챌린지'가 아니라 '일상 누적 방어'.
 * 체크인 데이터를 누적 집계해 방어 실천일수 + 계절/날씨 맞춤 처방 + 케어 픽 CTA로 보여준다.
 * 기록이 거의 없는(0~1일) 유저에게는 달성률 카드 대신 첫 체크인 안내 카드를 노출한다.
 */
export function ThirtyDayReport() {
  const locale = useLocale()
  const diary = useDiary()
  const [ageGroup] = useAgeGroup()

  const attended = diary.loggedDays.length

  const subtitle = diary.name
    ? interpolate(t("report30day.subtitle", locale), { name: diary.name })
    : t("report30day.subtitleNoName", locale)

  // ── 기록이 거의 없는 유저: 첫 방어 체크인 안내 ──
  if (attended < MIN_CHECKINS_FOR_SUMMARY) {
    return (
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-b from-[#E6F4EE] via-[#EEF6FA] to-card ring-1 ring-border">
        <div className="flex flex-col gap-5 px-7 py-9">
          <header className="flex flex-col gap-1.5">
            <h2 className="font-display text-[22px] font-semibold leading-snug text-foreground">
              {t("report30day.title", locale)}
            </h2>
            <p className="text-[13px] font-medium text-muted-foreground">{subtitle}</p>
          </header>

          <div className="flex flex-col gap-2.5">
            <p className="font-display text-[17px] font-semibold text-foreground">
              {t("report30day.firstCheckinTitle", locale)}
            </p>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {t("report30day.firstCheckinBody", locale)}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToPicks}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {t("report30day.firstCheckinCta", locale)} →
          </button>
        </div>
      </div>
    )
  }

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

        {/* ── 누적 방어 실천일수 ── */}
        <section className="flex flex-col gap-3">
          <span className="text-[13px] font-semibold text-foreground">
            {t("report30day.logCountLabel", locale)}
          </span>

          <div className="flex items-end gap-2">
            <span className="font-display text-4xl font-semibold leading-none text-[#2F7D5B]">{attended}</span>
            <span className="pb-1 text-lg font-semibold text-[#2F7D5B]/70">{locale === "ko" ? "일" : "days"}</span>
          </div>

          <p className="text-[12px] font-medium text-muted-foreground">
            {interpolate(t("report30day.attendance", locale), { attended: String(attended) })}
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
