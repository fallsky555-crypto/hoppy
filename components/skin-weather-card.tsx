"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { useSkinWeather } from "@/lib/use-skin-weather"
import {
  computeSkinStress,
  getTimeOfDay,
  getWeatherSlotHints,
  type StressLevel,
} from "@/lib/skin-weather"

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

function MetricPill({
  icon,
  label,
  value,
  status,
}: {
  icon: string
  label: string
  value: string
  status: MetricStatus
}) {
  const tone = TONE_COLOR[status.tone]
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-3">
      <span className="text-lg leading-none" aria-hidden>
        {icon}
      </span>
      <span className="font-display text-xl font-semibold leading-none text-foreground">{value}</span>
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <span
        className="mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none"
        style={{ color: tone.text, backgroundColor: tone.bg }}
      >
        {status.label}
      </span>
    </div>
  )
}

export function SkinWeatherCard() {
  const locale = useLocale()
  const { weather, status } = useSkinWeather()

  const shell = "rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border"

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-semibold text-foreground">{t("skinWeather.title", locale)}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("skinWeather.unavailable", locale)}</p>
          </div>
          <img src="/onboarding/cover-cat-camera.png" alt="" className="h-12 w-12 shrink-0 object-contain" />
        </div>
      </div>
    )
  }

  const stress = computeSkinStress(weather)
  const hints = getWeatherSlotHints(weather)
  const color = LEVEL_COLOR[stress.level]
  const isNight = getTimeOfDay() === "night"

  // 처방 문구 — 기여도 상위 2개 요인. 밤에는 UV 요인을 "진정·회복" 관점 문구로 바꾼다.
  const driverCopyKey = (key: string) => (isNight && key === "uv" ? "uvNight" : key)
  const lines =
    stress.drivers.length > 0
      ? stress.drivers.slice(0, 2).map((d) => t(`skinWeather.driver.${driverCopyKey(d.key)}`, locale) as string)
      : [t("skinWeather.allClear", locale) as string]

  const fmt = {
    humidity: weather.humidity !== null ? `${weather.humidity}%` : "—",
    uv: weather.uvIndex !== null ? String(weather.uvIndex) : "—",
    pm25: weather.pm25 !== null ? String(Math.round(weather.pm25)) : "—",
  }

  return (
    <div className={shell}>
      <div className="flex flex-col gap-4">
        {/* 헤더 — 텍스트(좌) / 호빵이(우), 겹침 없이 세로 중앙 정렬 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
              {t("skinWeather.title", locale)}
            </h3>
            <p className="text-[12px] font-semibold text-muted-foreground">
              {t("skinWeather.locationDefault", locale)}
            </p>
          </div>
          <img
            src="/onboarding/cover-cat-camera.png"
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
        </div>

        {/* 오늘 환경 지표 — 아이콘 + 큰 수치 + 상태 뱃지 */}
        <div className="flex gap-2">
          <MetricPill
            icon="💧"
            label={t("skinWeather.metric.humidity", locale)}
            value={fmt.humidity}
            status={humidityStatus(weather.humidity, locale)}
          />
          <MetricPill
            icon="☀️"
            label={t("skinWeather.metric.uv", locale)}
            value={fmt.uv}
            status={uvStatus(weather.uvIndex, locale)}
          />
          <MetricPill
            icon="😷"
            label={t("skinWeather.metric.pm25", locale)}
            value={fmt.pm25}
            status={pm25Status(weather.pm25, locale)}
          />
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

        {/* 처방 문구 */}
        <ul className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
              <span aria-hidden style={{ color: color.fill }}>•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* 슬롯 추천 요약 — 실제 뱃지는 아래 데일리 슬롯에 표시됨 */}
        {(hints.boost.length > 0 || hints.caution.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {hints.boost.map((s) => (
              <span
                key={`b-${s}`}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-text"
              >
                {t("skinWeather.slotShort." + s, locale)} {t("slotHint.boost", locale)}
              </span>
            ))}
            {hints.caution.map((s) => (
              <span
                key={`c-${s}`}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: LEVEL_COLOR.high.track, color: LEVEL_COLOR.high.text }}
              >
                {t("skinWeather.slotShort." + s, locale)} {t("slotHint.caution", locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
