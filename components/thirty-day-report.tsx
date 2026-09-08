"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { useAgeGroup } from "@/lib/use-age-group"
import { SKIN_TYPE_LABEL_KEYS, type SkinType } from "@/lib/label-mappings"

/** CTA가 스크롤로 이동할 대상 — app/[locale]/page.tsx의 DoSkipCard 래퍼 id와 일치 */
const PICKS_ANCHOR_ID = "today-picks"

/** 이 수보다 체크인이 적으면 결산 대신 "첫 방어 체크인" 안내 카드를 보여준다 */
const MIN_CHECKINS_FOR_SUMMARY = 2

/**
 * 리포트 본문 — 첫 체크인 안내 / 누적 방어 결산 두 갈래. 모달 안에서만 렌더된다.
 * onCta: 하단 CTA(오늘의 픽 보기)를 눌렀을 때 — 모달을 닫고 픽 섹션으로 스크롤한다.
 */
function ReportContent({ onCta }: { onCta: () => void }) {
  const locale = useLocale()
  const diary = useDiary()
  const [ageGroup] = useAgeGroup()

  const attended = diary.loggedDays.length

  const subtitle = diary.name
    ? interpolate(t("report30day.subtitle", locale), { name: diary.name })
    : t("report30day.subtitleNoName", locale)

  const ctaClass =
    "w-full rounded-full bg-[#5B9A97] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#4E8A87]"

  // ── 기록이 거의 없는 유저: 첫 방어 체크인 안내 ──
  if (attended < MIN_CHECKINS_FOR_SUMMARY) {
    return (
      <div className="flex flex-col gap-5 px-7 pb-8 pt-9">
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

        <button type="button" onClick={onCta} className={ctaClass}>
          {t("report30day.firstCheckinCta", locale)} →
        </button>
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
    <div className="flex flex-col gap-8 px-7 pb-8 pt-9">
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
      <button type="button" onClick={onCta} className={ctaClass}>
        {t("report30day.cta", locale)} →
      </button>
    </div>
  )
}

/**
 * 메인 홈에서는 슬림한 텍스트 링크 하나만 노출하고, 눌렀을 때만 바텀시트/모달로
 * 누적 방어 리포트를 연다. (거대한 리포트 카드 상시 노출 제거 — 홈 화면 경량화)
 */
export function ThirtyDayReport() {
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const handleCta = () => {
    setOpen(false)
    // 모달이 닫힌 뒤 배경 페이지의 픽 섹션으로 스크롤
    setTimeout(() => {
      document.getElementById(PICKS_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center rounded-2xl bg-secondary/60 px-4 py-3.5 text-[13px] font-semibold text-[#5B9A97] transition-colors hover:bg-secondary"
      >
        {t("report30day.openLink", locale)}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-gradient-to-b from-[#E7F1EE] via-[#F4F1E9] to-card shadow-xl ring-1 ring-border animate-in fade-in slide-in-from-bottom-4 sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("report30day.close", locale)}
              className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-card/80 text-[#5B9A97] transition-colors hover:bg-card"
            >
              <X className="size-4" aria-hidden />
            </button>

            <ReportContent onCta={handleCta} />

            <div className="px-7 pb-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-full border border-[#5B9A97]/40 py-3 text-sm font-bold text-[#5B9A97] transition-colors hover:bg-[#5B9A97]/10"
              >
                {t("report30day.close", locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
