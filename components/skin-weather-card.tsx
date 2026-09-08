"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { useSkinWeather } from "@/lib/use-skin-weather"
import { computeSkinStress, weatherConditionKey, type StressLevel } from "@/lib/skin-weather"

/** 스트레스 단계별 색 — 라이트 카드 위에서 대비가 확보되는 값으로 고정 */
const LEVEL_COLOR: Record<StressLevel, { fill: string; track: string; text: string }> = {
  low: { fill: "#4CAF87", track: "#E4F3EC", text: "#2F7D5B" },
  moderate: { fill: "#E0A83D", track: "#FaF0DA", text: "#9A6F16" },
  high: { fill: "#E07A3D", track: "#FBE7DA", text: "#B0561F" },
  severe: { fill: "#D9534F", track: "#FADEDD", text: "#A63734" },
}

/** 지표 뱃지 색 — 초록(안심) → 노랑 → 주황 → 빨강(주의) */
type Tone = "green" | "amber" | "orange" | "red" | "neutral"
const TONE_COLOR: Record<Tone, { text: string; bg: string }> = {
  green: { text: "#2F7D5B", bg: "#E4F3EC" },
  amber: { text: "#9A6F16", bg: "#FAF0DA" },
  orange: { text: "#B0561F", bg: "#FBE7DA" },
  red: { text: "#A63734", bg: "#FADEDD" },
  neutral: { text: "#6B7280", bg: "#EDEFF1" },
}

interface MetricStatus {
  label: string
  tone: Tone
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"]

/** 오늘 날짜 캡션 (예: "2026년 9월 8일 화요일" / "Monday, September 8, 2026") */
function todayLabel(locale: "ko" | "en"): string {
  const now = new Date()
  if (locale === "ko") {
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS_KO[now.getDay()]}요일`
  }
  return now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
}

/** 습도 → 건조/촉촉 상태. 낮을수록 건조(주의). */
function humidityStatus(v: number | null, locale: "ko" | "en"): MetricStatus {
  const k = (s: string) => t(`skinWeather.metricStatus.humidity.${s}`, locale) as string
  if (v === null) return { label: t("skinWeather.metricStatus.unknown", locale), tone: "neutral" }
  if (v < 40) return { label: k("veryDry"), tone: "red" }
  if (v < 55) return { label: k("dry"), tone: "amber" }
  return { label: k("comfortable"), tone: "green" }
}

/** 자외선 지수 → 낮음/보통/높음/매우 높음 */
function uvStatus(v: number | null, locale: "ko" | "en"): MetricStatus {
  const k = (s: string) => t(`skinWeather.metricStatus.uv.${s}`, locale) as string
  if (v === null) return { label: t("skinWeather.metricStatus.unknown", locale), tone: "neutral" }
  if (v < 3) return { label: k("low"), tone: "green" }
  if (v < 6) return { label: k("moderate"), tone: "amber" }
  if (v < 8) return { label: k("high"), tone: "orange" }
  return { label: k("veryHigh"), tone: "red" }
}

/** 초미세먼지(PM2.5) → 좋음/보통/나쁨/매우 나쁨 (WHO 권고 구간) */
function pm25Status(v: number | null, locale: "ko" | "en"): MetricStatus {
  const k = (s: string) => t(`skinWeather.metricStatus.pm25.${s}`, locale) as string
  if (v === null) return { label: t("skinWeather.metricStatus.unknown", locale), tone: "neutral" }
  if (v < 15) return { label: k("good"), tone: "green" }
  if (v < 35) return { label: k("moderate"), tone: "amber" }
  if (v < 75) return { label: k("bad"), tone: "orange" }
  return { label: k("veryBad"), tone: "red" }
}

const TILE_FACE =
  "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#F0EBE1] bg-[#FAF8F5]"

/**
 * 지표 타일 — 탭하면 3D 플립. 앞면은 수치/상태, 뒷면은 기준점 + 즉각 솔루션 2줄.
 * perspective + preserve-3d + backface-visibility(둘 다 인라인 스타일)로 구현.
 */
function MetricPill({
  metricKey,
  label,
  value,
  status,
}: {
  metricKey: "humidity" | "uv" | "pm25"
  label: string
  value: string
  status: MetricStatus
}) {
  const locale = useLocale()
  const [flipped, setFlipped] = useState(false)
  const tone = TONE_COLOR[status.tone]
  const backTitle = t(`skinWeather.metricBack.${metricKey}.title`, locale) as string
  const backBody = t(`skinWeather.metricBack.${metricKey}.body`, locale) as string

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={`${label} ${value}`}
      className="flex-1"
      style={{ perspective: "900px" }}
    >
      <div
        className="relative h-[124px] w-full transition-transform duration-500 ease-out"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        {/* 앞면 */}
        <div
          className={`${TILE_FACE} gap-1.5 px-1`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <span className="font-display text-[30px] font-semibold leading-none tracking-tight text-[#2E2A26]">
            {value}
          </span>
          <span className="text-[12px] font-semibold text-foreground/65">{label}</span>
          <span
            className="rounded-full px-2.5 py-1 text-[10.5px] font-bold leading-none"
            style={{ color: tone.text, backgroundColor: tone.bg }}
          >
            {status.label}
          </span>
        </div>

        {/* 뒷면 — 기준점 + 즉각 솔루션 */}
        <div
          className={`${TILE_FACE} gap-1 px-2.5 text-center`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-[11px] font-bold leading-tight text-[#2E2A26]">{backTitle}</p>
          <p className="text-[10px] leading-snug text-muted-foreground">{backBody}</p>
        </div>
      </div>
    </button>
  )
}

export function SkinWeatherCard() {
  const locale = useLocale()
  const { weather, status } = useSkinWeather()

  // 상단 히어로 배너와 한 장의 카드로 결합되므로, 카드 자체 라운딩·테두리 없이 패딩만.
  const shell = "bg-card px-[22px] pb-6 pt-5"

  if (status === "loading") {
    return (
      <div className={shell}>
        <p className="text-sm font-semibold text-muted-foreground">{t("skinWeather.loading", locale)}</p>
      </div>
    )
  }

  if (status === "error" || !weather) {
    return (
      <div className={shell}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-[#8A8378]">{todayLabel(locale)}</p>
          <h3 className="font-display text-xl font-semibold text-foreground">{t("skinWeather.title", locale)}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("skinWeather.unavailable", locale)}</p>
        </div>
      </div>
    )
  }

  const stress = computeSkinStress(weather)
  const color = LEVEL_COLOR[stress.level]
  const conditionKey = weatherConditionKey(weather.weatherCode)

  // "🌤️ 대체로 맑음 · 24°C" — 데이터 없는 조각은 빼고 이어붙인다
  const weatherLine = [
    conditionKey ? (t(`skinWeather.condition.${conditionKey}`, locale) as string) : null,
    weather.temp !== null ? `${weather.temp}°C` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const fmt = {
    humidity: weather.humidity !== null ? `${weather.humidity}%` : "—",
    uv: weather.uvIndex !== null ? String(weather.uvIndex) : "—",
    pm25: weather.pm25 !== null ? String(Math.round(weather.pm25)) : "—",
  }

  return (
    <div className={shell}>
      <div className="flex flex-col gap-4">
        {/* 헤더 — 오늘 날짜 · 타이틀 · 날씨 상태 텍스트(선명하게) */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-[#8A8378]">{todayLabel(locale)}</p>
          <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
            {t("skinWeather.title", locale)}
          </h3>
          {weatherLine && (
            <p className="text-[15px] font-semibold text-foreground">{weatherLine}</p>
          )}
          <p className="text-[11px] font-medium text-muted-foreground">
            {t("skinWeather.locationDefault", locale)}
          </p>
        </div>

        {/* 오늘 환경 지표 — 탭하면 3D 플립(앞: 수치/상태, 뒤: 기준점+솔루션) */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-muted-foreground">{t("skinWeather.flipHint", locale)}</p>
          <div className="flex gap-2">
            <MetricPill
              metricKey="humidity"
              label={t("skinWeather.metric.humidity", locale)}
              value={fmt.humidity}
              status={humidityStatus(weather.humidity, locale)}
            />
            <MetricPill
              metricKey="uv"
              label={t("skinWeather.metric.uv", locale)}
              value={fmt.uv}
              status={uvStatus(weather.uvIndex, locale)}
            />
            <MetricPill
              metricKey="pm25"
              label={t("skinWeather.metric.pm25", locale)}
              value={fmt.pm25}
              status={pm25Status(weather.pm25, locale)}
            />
          </div>
        </div>

        {/* 피부 스트레스 지수 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-foreground">{t("skinWeather.subtitle", locale)}</span>
            <span className="font-display text-sm font-semibold" style={{ color: color.text }}>
              {stress.score} · {t(`skinWeather.level.${stress.level}`, locale)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: color.track }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(stress.score, 4)}%`, backgroundColor: color.fill }}
            />
          </div>
        </div>

        {/* 오늘 날씨 감성 한 줄 요약 — 구체적 행동 가이드는 아래 '오늘 필수' 리스트가 전담 */}
        <p className="text-sm leading-relaxed text-foreground">
          {t(`skinWeather.summary.${stress.level}`, locale)}
        </p>
      </div>
    </div>
  )
}
