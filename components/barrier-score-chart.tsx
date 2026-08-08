import { t, interpolate, type Locale } from "@/lib/i18n"

interface BarrierScoreChartProps {
  currentDay: number
  totalDays: number
  locale: Locale
}

/**
 * 주차가 끝나는 날(Day 7/14/21/totalDays)에만 나타나는 짧은 완주 격려 카드.
 * 그래프/표는 걷어냈다 — 장벽 점수 자체의 계산·저장(buildBarrierScoreLog,
 * saveBarrierScoreLog)은 lib/use-diary.ts에 그대로 남아있고, 이 컴포넌트는
 * currentDay/totalDays만으로 노출 여부와 카피를 정한다.
 *
 * totalDays를 30으로 하드코딩하지 않는 이유: 인시던트/자극신고로 일정이
 * 밀리면 totalDays가 30보다 커지는데(예: 생리 인시던트 1회면 36일), 그
 * 경우에도 "코스 마지막 날"이 정확히 걸리게 하려면 totalDays 기준이어야 한다.
 */

export function BarrierScoreChart({ currentDay, totalDays, locale }: BarrierScoreChartProps) {
  const isCourseEnd = currentDay === totalDays
  const isWeeklyBoundary = currentDay === 7 || currentDay === 14 || currentDay === 21

  if (!isCourseEnd && !isWeeklyBoundary) return null

  const copy = isCourseEnd
    ? {
        title: t("barrierScoreChart.course_complete_title", locale),
        detail: t("barrierScoreChart.course_complete_detail", locale),
      }
    : {
        title: interpolate(t("barrierScoreChart.weekly_title", locale), { week: String(Math.floor(currentDay / 7)) }),
        detail: interpolate(t("barrierScoreChart.weekly_detail", locale), { week: String(Math.floor(currentDay / 7)) }),
      }

  return (
    <section className="rounded-4xl bg-card px-5 py-[22px] ring-1 ring-border" aria-label={t("common.weeklyEncourage", locale)}>
      <h2 className="font-display text-base font-bold text-foreground">{copy.title}</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A4438]">{copy.detail}</p>
    </section>
  )
}
