/**
 * 스킨 웨더 도메인 로직 — API 응답 타입, 피부 스트레스 지수 계산,
 * 날씨 → 슬롯 추천/주의 매핑. UI와 분리해 테스트·재사용이 쉽게.
 */

import type { SlotType } from "@/lib/slot-mapping"

export interface SkinWeather {
  /** °C, 정수 반올림 */
  temp: number | null
  /** 상대습도 %, 정수 */
  humidity: number | null
  /** 오늘 UV 최대치 (0 ~ 11+) */
  uvIndex: number | null
  /** 초미세먼지 µg/m³ */
  pm25: number | null
  /** 미세먼지 µg/m³ */
  pm10: number | null
  /** WMO 날씨코드 */
  weatherCode: number | null
  source: "open-meteo" | "unavailable"
}

export type StressLevel = "low" | "moderate" | "high" | "severe"

/** 스트레스에 기여한 요인 — 문구·슬롯 매핑의 공통 근거 */
export type StressDriverKey = "dry" | "uv" | "pm" | "cold" | "heat"

export interface StressDriver {
  key: StressDriverKey
  /** 이 요인이 더한 점수 (0~) */
  points: number
}

export interface SkinStress {
  /** 0 ~ 100 */
  score: number
  level: StressLevel
  /** 점수 기여도 내림차순 */
  drivers: StressDriver[]
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * 피부 스트레스 지수 (0~100). 각 환경 요인의 가중 합.
 *
 *  - 건조: 습도 55% 이상 0점, 그 아래로 선형 증가해 20%에서 30점 만점
 *  - 자외선: UV × 5, 35점 상한 (UV 7 이상은 만점)
 *  - 미세먼지(PM2.5): WHO 권고 기준 구간별 계단식 (0 / 12 / 25 / 35)
 *  - 저온: 5°C 이하 +12
 *  - 고온: 30°C 이상 +10
 *
 * 데이터가 없는 요인은 그냥 제외한다(누락이 곧 저스트레스는 아니므로 score만 낮아짐).
 */
export function computeSkinStress(w: SkinWeather): SkinStress {
  const drivers: StressDriver[] = []

  if (w.humidity !== null && w.humidity < 55) {
    const points = Math.round(clamp((55 - w.humidity) / (55 - 20), 0, 1) * 30)
    if (points > 0) drivers.push({ key: "dry", points })
  }

  if (w.uvIndex !== null && w.uvIndex > 0) {
    const points = Math.round(clamp(w.uvIndex * 5, 0, 35))
    if (points > 0) drivers.push({ key: "uv", points })
  }

  if (w.pm25 !== null) {
    let points = 0
    if (w.pm25 >= 75) points = 35
    else if (w.pm25 >= 35) points = 25
    else if (w.pm25 >= 15) points = 12
    if (points > 0) drivers.push({ key: "pm", points })
  }

  if (w.temp !== null && w.temp <= 5) {
    drivers.push({ key: "cold", points: 12 })
  } else if (w.temp !== null && w.temp >= 30) {
    drivers.push({ key: "heat", points: 10 })
  }

  const score = clamp(
    drivers.reduce((sum, d) => sum + d.points, 0),
    0,
    100,
  )

  drivers.sort((a, b) => b.points - a.points)

  return { score, level: stressLevel(score), drivers }
}

export function stressLevel(score: number): StressLevel {
  if (score < 25) return "low"
  if (score < 50) return "moderate"
  if (score < 75) return "high"
  return "severe"
}

export type TimeOfDay = "day" | "night"

/** 낮 루틴이 밤 루틴으로 넘어가는 기준 시각 (사용자 로컬 시간) */
export const NIGHT_START_HOUR = 17
/** 이 시각 전(새벽)도 밤으로 본다 — 자외선이 없고 케어 성격이 밤과 같음 */
const NIGHT_END_HOUR = 5

/**
 * 지금이 낮인지 밤인지. 17:00 이후 또는 05:00 이전은 "밤"으로 보고,
 * 자외선 경고/선크림 추천 대신 진정·나이트 보습 위주로 슬롯을 매핑한다.
 * uvIndex는 API에서 "오늘 UV 최대치"라 밤에도 값이 남지만, 노출은 이미 끝났으므로
 * 밤에는 예방(차단)이 아니라 회복(진정·수분) 관점으로 해석한다.
 */
export function getTimeOfDay(now: Date = new Date()): TimeOfDay {
  const h = now.getHours()
  return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR ? "night" : "day"
}

export interface WeatherSlotHints {
  /** 오늘 특히 챙기면 좋은 슬롯 */
  boost: SlotType[]
  /** 오늘은 자극이 될 수 있어 미루는 게 나은 슬롯 */
  caution: SlotType[]
}

/**
 * 날씨 → 슬롯 추천/주의. drivers + 시간대(낮/밤)를 근거로 매핑한다.
 *
 *  공통
 *   - 건조     → 수분·장벽 챙기기
 *   - 미세먼지 → 장벽·수분 챙기기(꼼꼼한 저녁 세안 전제), 각질 주의
 *   - 저온     → 장벽 챙기기
 *   - 고온     → 각질·기능성 주의(자극 최소화)
 *
 *  낮(05:00~16:59)
 *   - 자외선 3+ → 선크림 추천, 6+ → 각질·기능성 주의
 *
 *  밤(17:00~04:59)
 *   - 선크림 추천/자외선 주의 없음. 대신 낮 동안 UV가 강했으면(5+)
 *     진정·나이트 보습 관점에서 수분·장벽 추천
 */
export function getWeatherSlotHints(w: SkinWeather, now: Date = new Date()): WeatherSlotHints {
  const boost = new Set<SlotType>()
  const caution = new Set<SlotType>()

  const { drivers } = computeSkinStress(w)
  const has = (k: StressDriverKey) => drivers.some((d) => d.key === k)
  const time = getTimeOfDay(now)

  if (has("dry")) {
    boost.add("hydration")
    boost.add("barrier")
  }

  if (time === "day") {
    if (w.uvIndex !== null && w.uvIndex >= 3) {
      boost.add("sun_care")
    }
    if (w.uvIndex !== null && w.uvIndex >= 6) {
      caution.add("exfoliation")
      caution.add("active")
    }
  } else {
    // 밤: 낮 동안 자극받은 피부 진정 + 나이트 보습
    if (w.uvIndex !== null && w.uvIndex >= 5) {
      boost.add("hydration")
      boost.add("barrier")
    }
  }

  if (has("pm")) {
    boost.add("barrier")
    boost.add("hydration")
    caution.add("exfoliation")
  }
  if (has("cold")) {
    boost.add("barrier")
  }
  if (has("heat")) {
    caution.add("exfoliation")
    caution.add("active")
  }

  // 같은 슬롯이 boost와 caution에 동시에 걸리면 caution을 우선한다(안전 쪽).
  for (const s of caution) boost.delete(s)

  return { boost: [...boost], caution: [...caution] }
}

/**
 * 단일 "오늘의 추천 슬롯" — 기존 daily-slots의 recipe 기반 recommendedSlot을
 * 날씨 기준으로 덮어쓸 때 쓴다.
 * 우선순위: 미세먼지 > 건조 > (낮)자외선 / (밤)UV 후 진정 > 저온.
 */
export function getWeatherRecommendedSlot(w: SkinWeather, now: Date = new Date()): SlotType | null {
  const { drivers } = computeSkinStress(w)
  const has = (k: StressDriverKey) => drivers.some((d) => d.key === k)
  const time = getTimeOfDay(now)

  if (has("pm")) return "barrier"
  if (has("dry")) return "hydration"
  if (time === "day" && w.uvIndex !== null && w.uvIndex >= 3) return "sun_care"
  if (time === "night" && w.uvIndex !== null && w.uvIndex >= 5) return "barrier"
  if (has("cold")) return "barrier"
  return null
}

/** WMO 날씨코드 → 비/눈 여부 (문구 보조용) */
export function precipFromWeatherCode(code: number | null): { isRain: boolean; isSnow: boolean } {
  if (code === null) return { isRain: false, isSnow: false }
  const isRain =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86
  return { isRain, isSnow }
}

/** 클라이언트에서 /api/weather 호출 */
export async function fetchSkinWeather(): Promise<SkinWeather> {
  const res = await fetch("/api/weather")
  if (!res.ok) throw new Error(`weather ${res.status}`)
  return (await res.json()) as SkinWeather
}
