"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { METRIC_THRESHOLDS, type HourlySeries, type MetricKey } from "@/lib/skin-weather"

interface MetricBottomSheetProps {
  /** null이면 시트를 닫는다 */
  metricKey: MetricKey | null
  hourly: HourlySeries | null
  /** 헤더에 크게 보여줄 현재 수치 (예: "73%") */
  valueText: string
  /** 상태 뱃지 문구 (예: "건조") */
  statusLabel: string
  /** 막대·뱃지 강조색 (상태 tone에서 계산) */
  accent: string
  onClose: () => void
}

/** 그래프에 그릴 시간 구간 — 하루 활동 시간대(06시~24시)만 */
const START_HOUR = 6
const END_HOUR = 24

/** 06·12·18·24시에만 x축 눈금 라벨 */
const AXIS_TICKS = [6, 12, 18, 24]

/** 지표별 단위 (기준선 라벨용) */
const METRIC_UNIT: Record<MetricKey, string> = {
  humidity: "%",
  uv: "",
  pm25: "㎍/㎥",
}

const clampN = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** 지표별 그래프 Y축 상한 — 데이터 최댓값·기준선이 여유 있게(하지만 너무 비지 않게) 들어오도록 */
function niceAxisMax(metricKey: MetricKey, dataMax: number): number {
  const topThreshold = Math.max(...METRIC_THRESHOLDS[metricKey])
  const target = Math.max(dataMax * 1.15, topThreshold * 1.15)
  if (metricKey === "humidity") return clampN(Math.ceil(target / 10) * 10, 70, 100)
  if (metricKey === "uv") return clampN(Math.ceil(target), 8, 14)
  return clampN(Math.ceil(target / 10) * 10, 45, 150) // pm25
}

export function MetricBottomSheet({
  metricKey,
  hourly,
  valueText,
  statusLabel,
  accent,
  onClose,
}: MetricBottomSheetProps) {
  const locale = useLocale()

  // ESC 닫기 + 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!metricKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [metricKey, onClose])

  if (!metricKey) return null

  const title = t(`skinWeather.metricSheet.${metricKey}.title`, locale) as string
  const prescription = t(`skinWeather.metricSheet.${metricKey}.prescription`, locale) as string
  const nowHour = new Date().getHours()

  const series = hourly?.[metricKey] ?? null
  const points =
    series != null
      ? series
          .map((value, hour) => ({ hour, value }))
          .filter((p) => p.hour >= START_HOUR && p.hour < END_HOUR)
      : []
  const hasChart = points.some((p) => p.value != null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[88vh] min-h-[64vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[26px] bg-[#FAF7F1] px-6 pb-10 pt-3 shadow-[0_-10px_44px_rgba(46,42,38,0.18)] animate-in slide-in-from-bottom-8 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* 드래그 핸들 */}
        <div className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-[#DBD3C4]" aria-hidden />

        {/* 헤더 */}
        <div className="mt-4 flex shrink-0 items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-[19px] font-semibold leading-tight text-[#2E2A26]">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="font-display text-[30px] font-semibold leading-none tracking-tight text-[#2E2A26]">
                {valueText}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold leading-none"
                style={{ color: "#fff", backgroundColor: accent }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={locale === "ko" ? "닫기" : "Close"}
            className="-mr-1.5 -mt-1 rounded-full p-1.5 text-[#8A8378] transition-colors hover:bg-[#2E2A26]/5 hover:text-[#2E2A26]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* 미니 그래프 */}
        <div className="mt-7 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8378]">
              {t("skinWeather.metricSheet.chartTitle", locale)}
            </p>
            {hasChart && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#C9412E]">
                <span className="inline-block w-4 border-t border-dashed border-[#C9412E]" aria-hidden />
                {t("skinWeather.metricSheet.thresholdLabel", locale)}{" "}
                {METRIC_THRESHOLDS[metricKey].join(" · ")}
                {METRIC_UNIT[metricKey]}
              </span>
            )}
          </div>
          <div className="mt-4">
            {hasChart ? (
              <HourlyChart
                metricKey={metricKey}
                points={points}
                nowHour={nowHour}
                accent={accent}
                nowLabel={t("skinWeather.metricSheet.nowLabel", locale) as string}
              />
            ) : (
              <p className="pt-4 text-[13px] leading-relaxed text-[#8A8378]">
                {t("skinWeather.metricSheet.noChart", locale)}
              </p>
            )}
          </div>
        </div>

        {/* 전문가 처방 — 넉넉한 폰트·행간 */}
        <div className="mt-auto shrink-0 border-t border-[#E5DECF] pt-6">
          <p className="text-[15px] font-semibold leading-relaxed text-[#2E2A26]">{prescription}</p>
        </div>
      </div>
    </div>
  )
}

/** 순수 SVG 막대 그래프 — 외부 차트 라이브러리 없이 Tailwind + SVG로만 */
function HourlyChart({
  metricKey,
  points,
  nowHour,
  accent,
  nowLabel,
}: {
  metricKey: MetricKey
  points: Array<{ hour: number; value: number | null }>
  nowHour: number
  accent: string
  nowLabel: string
}) {
  const W = 320
  const H = 168
  const padTop = 14
  const padBottom = 20
  const baseline = H - padBottom
  const thresholds = METRIC_THRESHOLDS[metricKey]
  const dataMax = Math.max(0, ...points.map((p) => p.value ?? 0))
  const axisMax = niceAxisMax(metricKey, dataMax)

  const n = points.length
  const slot = W / n
  const barW = Math.min(slot * 0.5, 12)

  const yOf = (v: number) => baseline - (Math.min(v, axisMax) / axisMax) * (baseline - padTop)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-hidden>
      {/* 기준선 (점선) */}
      {thresholds.map((thr) => (
        <line
          key={thr}
          x1={0}
          x2={W}
          y1={yOf(thr)}
          y2={yOf(thr)}
          stroke="#C9412E"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
      ))}

      {/* 막대 */}
      {points.map((p, i) => {
        if (p.value == null) return null
        const x = i * slot + slot / 2
        const y = yOf(p.value)
        const isNow = p.hour === nowHour
        return (
          <g key={p.hour}>
            <rect
              x={x - barW / 2}
              y={y}
              width={barW}
              height={Math.max(baseline - y, 1.5)}
              rx={2}
              fill={isNow ? accent : "#D8CFBE"}
            />
            {isNow && (
              <text x={x} y={y - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={accent}>
                {nowLabel}
              </text>
            )}
          </g>
        )
      })}

      {/* x축 눈금 */}
      {points.map((p, i) => {
        if (!AXIS_TICKS.includes(p.hour)) return null
        const x = i * slot + slot / 2
        return (
          <text
            key={`tick-${p.hour}`}
            x={x}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#8A8378"
          >
            {p.hour}
          </text>
        )
      })}
    </svg>
  )
}
