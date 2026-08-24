"use client"

import { useEffect, useState } from "react"
import { Check, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { countLoggedSlotsByTag } from "@/components/skin-balance-radar"
import {
  calculateUsagePattern,
  calculateBalanceRatio,
  calculatePeriodicity,
  calculateConditionCorrelation,
  getTopTagFromLoggedSlots,
  type UsagePattern,
  type BalanceRatio,
  type PeriodicityStat,
  type ConditionCorrelation,
} from "@/lib/report-analytics"

const MIN_LOGGED_DAYS_FOR_FULL_REPORT = 10

type DayType = "attack" | "device" | "mask" | "nightReset"

/** calendar.weekdays 인덱스(일=0~토=6) 기준 요일별 데이 타입 — 일:나이트리셋, 월/수/토:공격일, 화/금:기기케어, 목:리셋마스크 */
const DAY_TYPE_BY_WEEKDAY: Record<number, DayType> = {
  0: "nightReset",
  1: "attack",
  2: "device",
  3: "attack",
  4: "mask",
  5: "device",
  6: "attack",
}

const DAY_TYPE_LOCALE_KEYS: Record<DayType, { title: string; steps: string }> = {
  attack: { title: "report30day.compact.attackDayTitle", steps: "report30day.compact.attackDaySteps" },
  device: { title: "report30day.compact.deviceDayTitle", steps: "report30day.compact.deviceDaySteps" },
  mask: { title: "report30day.compact.maskDayTitle", steps: "report30day.compact.maskDaySteps" },
  nightReset: { title: "report30day.compact.nightResetDayTitle", steps: "report30day.compact.nightResetDaySteps" },
}

const SLOT_TAG_LABELS: Record<string, Record<"ko" | "en", string>> = {
  "Exfoliation": { ko: "각질케어", en: "Exfoliation" },
  "Hydration": { ko: "수분케어", en: "Hydration" },
  "Active/Stimulate": { ko: "고민케어", en: "Concern Care" },
  "Defense/Barrier": { ko: "진정케어", en: "Soothing Care" },
  "Sun": { ko: "자외선차단", en: "Sun Care" },
}

interface Report30DayProps {
  isReady: boolean
}

export function ThirtyDayReport({ isReady }: Report30DayProps) {
  const locale = useLocale()
  const diary = useDiary()
  const [activeWeekdayTab, setActiveWeekdayTab] = useState(0)
  const [showFullText, setShowFullText] = useState(false)
  const [data, setData] = useState<{
    patterns: UsagePattern[]
    balance: BalanceRatio
    periodicity: PeriodicityStat
    condition: ConditionCorrelation[]
  } | null>(null)

  useEffect(() => {
    if (!isReady || !diary.loggedSlots || Object.keys(diary.loggedSlots).length === 0) {
      return
    }

    const allSlots = Object.values(diary.loggedSlots).flat()
    const patterns = calculateUsagePattern(allSlots)
    const balance = calculateBalanceRatio(allSlots)
    const periodicity = calculatePeriodicity(diary.loggedDays)
    const condition = calculateConditionCorrelation(diary.loggedSlots, diary.conditions)

    setData({ patterns, balance, periodicity, condition })
  }, [isReady, diary.loggedSlots, diary.loggedDays, diary.conditions])

  if (!isReady || !data) {
    return null
  }

  const getTagLabel = (tag: string): string => SLOT_TAG_LABELS[tag]?.[locale] || tag
  const isLowDataMode = diary.loggedDays.length < MIN_LOGGED_DAYS_FOR_FULL_REPORT

  /**
   * 4장 요약 카드 전용 Active:Defense — 2장 "밸런스" 섹션의 calculateBalanceRatio(Active/Stimulate
   * vs Defense/Barrier 태그만 봄)와는 다른, skin-balance-radar.tsx의 원시 카운트 로직을
   * 재사용한 별도 정의: Active = ret+vitc+Exfoliation, Defense = Hydration+Defense/Barrier+nia.
   */
  const summaryActiveCount =
    countLoggedSlotsByTag(diary.loggedSlots, "ret") +
    countLoggedSlotsByTag(diary.loggedSlots, "vitc") +
    countLoggedSlotsByTag(diary.loggedSlots, "Exfoliation")
  const summaryDefenseCount =
    countLoggedSlotsByTag(diary.loggedSlots, "Hydration") +
    countLoggedSlotsByTag(diary.loggedSlots, "Defense/Barrier") +
    countLoggedSlotsByTag(diary.loggedSlots, "nia")
  const summaryTotalCount = summaryActiveCount + summaryDefenseCount
  const summaryActivePercentage = summaryTotalCount > 0 ? Math.round((summaryActiveCount / summaryTotalCount) * 100) : 50
  const summaryDefensePercentage = summaryTotalCount > 0 ? 100 - summaryActivePercentage : 50
  const summaryCommentKey =
    summaryActivePercentage >= 65
      ? "report30day.compact.summaryCommentHigh"
      : summaryActivePercentage < 35
        ? "report30day.compact.summaryCommentLow"
        : "report30day.compact.summaryCommentBalanced"

  return (
    <div className="bg-card rounded-3xl ring-1 ring-border overflow-hidden">
      <div className="px-6 py-8 space-y-8">
        {/* ── 메인 제목 ── */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{t("report30day.title", locale)}</h1>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-border" />

        {isLowDataMode ? (
          <>
            {/* ── 저데이터 모드: 사용 패턴만 표시 ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("report30day.lowData.title", locale)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {interpolate(t("report30day.lowData.subtitle", locale), {
                    days: String(diary.loggedDays.length),
                  })}
                </p>
              </div>
              <div className="space-y-3">
                {data.patterns
                  .filter((pattern) => pattern.count > 0)
                  .map((pattern) => (
                    <div key={pattern.tag} className="flex items-baseline justify-between text-sm">
                      <span className="text-foreground font-medium">{getTagLabel(pattern.tag)}</span>
                      <span className="font-semibold text-foreground">
                        {pattern.count} {t("report30day.lowData.countSuffix", locale)}
                      </span>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-muted-foreground pt-4">{t("report30day.lowData.note", locale)}</p>
            </section>
          </>
        ) : (
          <>
            {/* ── 섹션 2: 사용 패턴 ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("report30day.section_usage_pattern", locale)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("report30day.usage_pattern_intro", locale)}</p>
              </div>
              <div className="space-y-3">
                {data.patterns.map((pattern) => (
                  <div key={pattern.tag} className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground font-medium">{getTagLabel(pattern.tag)}</span>
                    <div className="flex gap-2 items-baseline">
                      <span className="font-semibold text-foreground tabular-nums">{pattern.percentage}%</span>
                      <span className="text-xs text-muted-foreground">
                        {locale === "ko" ? "권장" : "rec."} {pattern.recommendedPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">{t("report30day.usage_recommendation_hint", locale)}</p>
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border" />

            {/* ── 섹션 3: 밸런스 ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t("report30day.section_balance", locale)}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("report30day.balance_intro", locale)}</p>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {interpolate(t("report30day.balance_ratio_template", locale), {
                    active: String(data.balance.activePercentage),
                    defense: String(data.balance.defensePercentage),
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{t("report30day.balance_recommended", locale)}</p>
              </div>
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border" />

            {/* ── 섹션 4: 주기성 ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t("report30day.section_periodicity", locale)}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("report30day.periodicity_intro", locale)}</p>
              </div>
              {data.periodicity.gaps.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {data.periodicity.variance < 2
                      ? interpolate(t("report30day.periodicity_regular", locale), {
                          variance: String(data.periodicity.variance),
                        })
                      : interpolate(t("report30day.periodicity_varied", locale), {
                          average: String(data.periodicity.average),
                          variance: String(data.periodicity.variance),
                        })}
                  </p>
                  <p className="text-sm text-muted-foreground break-words">
                    {interpolate(t("report30day.periodicity_detail", locale), {
                      gaps: data.periodicity.gaps.join(" → "),
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {locale === "ko" ? "충분한 데이터가 없어요." : "Not enough data."}
                </p>
              )}
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border" />

            {/* ── 섹션 5: 컨디션 상관 ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("report30day.section_condition", locale)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("report30day.condition_intro", locale)}</p>
              </div>
              <div className="space-y-4">
                {data.condition.map((corr) => (
                  <div key={corr.tag} className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{getTagLabel(corr.tag)}</p>
                    <div className="grid grid-cols-3 gap-3 pl-3 border-l border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{locale === "ko" ? "좋음" : "good"}</p>
                        <p className="font-semibold text-foreground">{corr.goodPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{locale === "ko" ? "보통" : "neutral"}</p>
                        <p className="font-semibold text-foreground">{corr.neutralPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{locale === "ko" ? "안 좋음" : "bad"}</p>
                        <p className="font-semibold text-foreground">{corr.badPercentage}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-2">{t("report30day.condition_note", locale)}</p>
            </section>

            {/* 구분선 */}
            <div className="h-px bg-border" />

            {/* ── 섹션 6: 다음 달 제안 (페이월) ── */}
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("report30day.section_next", locale)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("report30day.next_intro", locale)}</p>
              </div>
              {/*
                압축 리포트 스켈레톤 — 실제 카피/개인화 데이터(calculateBalanceRatio 등) 연결과
                결제 로직은 이번 스코프 아님. 아래 텍스트는 전부 report30day.compact.* placeholder이며
                나중에 실제 콘텐츠로 교체 예정. opacity-50 pointer-events-none로 계속 잠금 유지.
              */}
              <div className="space-y-4 opacity-50 pointer-events-none">
                {/* 1장 — 체크리스트 카드 */}
                <div className="rounded-2xl bg-secondary/50 p-4 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {t("report30day.compact.chapterLabel1", locale)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {t("report30day.compact.checklistTitle", locale)}
                  </p>
                  <ul className="space-y-1.5">
                    {(t("report30day.compact.checklistSteps", locale) as { name: string; detail: string }[]).map(
                      (step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border">
                            <Check className="size-2.5" aria-hidden />
                          </span>
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{step.name}</span>
                            {step.detail && <span> — {step.detail}</span>}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* 2장 — 요일 탭: 각 탭 안에 그날 루틴(DAY_TYPE_BY_WEEKDAY로 요일별 분기) */}
                <div className="rounded-2xl bg-secondary/50 p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {t("report30day.compact.chapterLabel2", locale)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {t("report30day.compact.scheduleTitle", locale)}
                  </p>
                  <div className="flex gap-1">
                    {(t("calendar.weekdays", locale) as string[]).map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveWeekdayTab(i)}
                        className={cn(
                          "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                          i === activeWeekdayTab
                            ? "bg-card text-foreground ring-1 ring-border"
                            : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5 rounded-xl bg-card p-3 ring-1 ring-border">
                    {(() => {
                      const dayType = DAY_TYPE_BY_WEEKDAY[activeWeekdayTab]
                      const dayTypeKeys = DAY_TYPE_LOCALE_KEYS[dayType]
                      return (
                        <>
                          <p className="text-xs font-semibold text-foreground">{t(dayTypeKeys.title, locale)}</p>
                          <ul className="space-y-1.5">
                            {(t(dayTypeKeys.steps, locale) as { name: string; detail: string }[]).map((step, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border">
                                  <Check className="size-2.5" aria-hidden />
                                </span>
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{step.name}</span>
                                  {step.detail && <span> — {step.detail}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* 3장 — 경고 박스: 병행 금지 원칙 강조 */}
                <div className="space-y-1.5 rounded-2xl bg-destructive/10 p-4 ring-1 ring-destructive/20">
                  <p className="text-[11px] font-semibold text-destructive/70">
                    {t("report30day.compact.chapterLabel3", locale)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <TriangleAlert className="size-3.5 shrink-0 text-destructive" aria-hidden />
                    <p className="text-xs font-semibold text-destructive">
                      {t("report30day.compact.warningTitle", locale)}
                    </p>
                  </div>
                  <ul className="space-y-0.5">
                    {(t("report30day.compact.warningLines", locale) as string[]).map((line, i) => (
                      <li key={i} className="text-xs leading-relaxed text-destructive/80">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4장 — 요약 카드: Active:Defense 비율(ret+vitc+Exfoliation : Hydration+Defense/Barrier+nia) */}
                <div className="space-y-1.5 rounded-2xl bg-secondary/50 p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {t("report30day.compact.chapterLabel4", locale)}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {t("report30day.compact.summaryTitle", locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("report30day.compact.summaryBridge", locale)}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {interpolate(t("report30day.balance_ratio_template", locale), {
                      active: String(summaryActivePercentage),
                      defense: String(summaryDefensePercentage),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(summaryCommentKey, locale)}</p>
                </div>

                {/* 전체 텍스트 보기 토글 — 지금은 빈 자리만, 컴팩트 리포트 전체 텍스트는 추후 연결 */}
                <button
                  type="button"
                  onClick={() => setShowFullText((v) => !v)}
                  className="w-full rounded-full border border-border py-2 text-xs font-semibold text-foreground"
                >
                  {t(showFullText ? "report30day.compact.toggleHide" : "report30day.compact.toggleShow", locale)}
                </button>
                {showFullText && (
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      {t("report30day.compact.fullTextPlaceholder", locale)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center py-6">
                <p className="text-xs font-semibold text-muted-foreground text-center">
                  {t("report30day.paywall_locked", locale)}
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
