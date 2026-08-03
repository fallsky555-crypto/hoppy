"use client"

import { useEffect, useState } from "react"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/use-diary"
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

const SLOT_TAG_LABELS: Record<string, Record<"ko" | "en", string>> = {
  "Prep": { ko: "클렌징", en: "Cleansing" },
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

  return (
    <div className="bg-card rounded-3xl ring-1 ring-border overflow-hidden">
      <div className="px-6 py-8 space-y-8">
        {/* ── 메인 제목 ── */}
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{t("report30day.title", locale)}</h1>
        </div>

        {/* ── 섹션 1: 이번 달 목표 ── */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">{t("report30day.section_goal", locale)}</h2>
          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("report30day.stage1_goal", locale)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("report30day.stage1_detail", locale)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("report30day.stage2_goal", locale)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("report30day.stage2_detail", locale)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("report30day.stage3_goal", locale)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("report30day.stage3_detail", locale)}</p>
            </div>
          </div>
        </section>

        {/* 구분선 */}
        <div className="h-px bg-border" />

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
          <div className="space-y-4 opacity-50 pointer-events-none">
            <div className="rounded-2xl bg-secondary/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("report30day.products_used", locale)}</p>
              {diary.usedProducts && diary.usedProducts.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {diary.usedProducts.map((product) => (
                    <li key={product.id} className="text-muted-foreground">
                      {product.brand} {product.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">{t("report30day.products_none", locale)}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t("report30day.next_routine_suggest", locale)}</p>
          </div>
          <div className="flex items-center justify-center py-6">
            <p className="text-xs font-semibold text-muted-foreground text-center">
              {t("report30day.paywall_locked", locale)}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
