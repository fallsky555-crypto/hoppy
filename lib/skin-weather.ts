/**
 * 스킨 웨더 도메인 로직 — API 응답 타입, 피부 스트레스 지수 계산,
 * 날씨 → 슬롯 추천/주의 매핑. UI와 분리해 테스트·재사용이 쉽게.
 */

import type { SlotType } from "@/lib/slot-mapping"

/** 오늘 0~23시 시간대별 시리즈 — 스킨 웨더 바텀시트의 미니 그래프용 */
export interface HourlySeries {
  /** 0~23 (사용자 로컬 시간) */
  hour: number[]
  humidity: (number | null)[]
  uv: (number | null)[]
  pm25: (number | null)[]
}

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
  /** 오늘 시간대별 시리즈 (없으면 null) */
  hourly: HourlySeries | null
  source: "open-meteo" | "unavailable"
}

/** 스킨 웨더 지표 3종 공통 키 */
export type MetricKey = "humidity" | "uv" | "pm25"

/**
 * 지표별 "피부 기준선" — 바텀시트 미니 그래프에 점선으로 겹쳐 그린다.
 *  - 습도 50% 미만: 속당김 시작
 *  - 자외선 3.0: 손상 시작 / 6.0: 광노화 위험
 *  - 초미세먼지 35: 장벽 자극 시작 (WHO 24h 권고 상한)
 */
export const METRIC_THRESHOLDS: Record<MetricKey, number[]> = {
  humidity: [50],
  uv: [3, 6],
  pm25: [35],
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

/** 메인 화면 연령대 탭. 온보딩 설문 없이 1초 전환용 */
export type AgeGroup = "2030" | "4050" | "60plus"
export const AGE_GROUPS: AgeGroup[] = ["2030", "4050", "60plus"]
export const DEFAULT_AGE_GROUP: AgeGroup = "4050"

/**
 * DO / SKIP 케어 아이템. key는 i18n 문구(doSkip.item.<key>)와
 * 어필리에이트 픽 매핑(slot)에 함께 쓰인다.
 */
export interface CarePlanItem {
  key: string
  /** 연관 슬롯 — 아이콘·추천 제품 매핑용 */
  slot: SlotType
  /** 연령대 보강으로 추가된 "+1 단계" 레이어인지 (기본 날씨 DO가 아님) */
  layer?: boolean
}

export interface DoSkipPlan {
  /** 오늘 꼭 챙길 것 (날씨 기본 최대 2 + 연령대 레이어) */
  doItems: CarePlanItem[]
  /** 오늘 생략할 것 (최대 2) */
  skipItems: CarePlanItem[]
}

/**
 * 날씨/시간대로 만든 기본 DO(최대 2)에 연령대별 보강 레이어를 얹는다.
 *
 *  2030  — 보강 없음. 유수분 밸런스 중심의 산뜻한 2단계.
 *  4050  — +1 필수 레이어. 건조/환절기·밤이면 세라마이드·판테놀 밀폐,
 *          낮이면 항산화 앰플, 밤이면 펩타이드·아이케어.
 *  60+   — +1~2 영양 밀폐 레이어. 고영양 리치 크림 + (건조·저온·밤이면) 페이스 오일 밀폐.
 */
function ageLayers(ageGroup: AgeGroup, ctx: { time: TimeOfDay; dryish: boolean }): CarePlanItem[] {
  const { time, dryish } = ctx
  const layer = (key: string, slot: SlotType): CarePlanItem => ({ key, slot, layer: true })

  if (ageGroup === "2030") return []

  if (ageGroup === "4050") {
    if (dryish) return [layer("ceramide_seal", "barrier")]
    return time === "night" ? [layer("peptide_eye", "active")] : [layer("antioxidant_serum", "active")]
  }

  // 60plus
  const out: CarePlanItem[] = [layer("rich_nutrition_cream", "barrier")]
  if (dryish || time === "night") out.push(layer("face_oil_seal", "barrier"))
  return out
}

/**
 * 오늘 날씨 + 시간대 + 연령대 → [오늘 필수(DO) / 오늘 생략(SKIP)] 처방.
 *
 *  DO(날씨)
 *   - 낮: 선크림은 항상. 건조/자외선이면 판테놀·수분 진정. 미세먼지/저온이면 장벽 크림.
 *   - 밤: 낮 UV가 강했으면 수분 진정팩. 건조/저온/미세먼지면 장벽 크림. 해당 없으면 가벼운 수분.
 *  DO(연령대) — 위 ageLayers() 참고.
 *
 *  SKIP
 *   - 미세먼지·강한 자외선·폭염·스트레스 '매우 높음' → 각질제거
 *   - 폭염·고습도(70%+)·미세먼지 → 무거운 오일·리치 밤
 *   - 낮에 자외선/폭염 → 레티놀·고농도 액티브
 *   - 밤엔 스트레스 '매우 높음' 또는 UV 8+ 일 때만 레티놀 생략(밤은 원래 액티브 타임)
 */
export function getDoSkipPlan(
  w: SkinWeather,
  now: Date = new Date(),
  ageGroup: AgeGroup = DEFAULT_AGE_GROUP,
): DoSkipPlan {
  const { drivers, level } = computeSkinStress(w)
  const has = (k: StressDriverKey) => drivers.some((d) => d.key === k)
  const time = getTimeOfDay(now)

  const doItems: CarePlanItem[] = []
  const skipItems: CarePlanItem[] = []
  const addDo = (key: string, slot: SlotType) => {
    if (!doItems.some((i) => i.key === key)) doItems.push({ key, slot })
  }
  const addSkip = (key: string, slot: SlotType) => {
    if (!skipItems.some((i) => i.key === key)) skipItems.push({ key, slot })
  }

  if (time === "day") {
    addDo("sunscreen", "sun_care")
    if (has("dry") || has("uv")) addDo("panthenol", "hydration")
    if (has("pm") || has("cold")) addDo("barrier_cream", "barrier")
  } else {
    if (has("uv")) addDo("soothing_pack", "hydration")
    if (has("dry") || has("cold") || has("pm")) addDo("barrier_cream", "barrier")
    if (doItems.length === 0) addDo("gentle_hydration", "hydration")
  }

  if (has("pm") || has("uv") || has("heat") || level === "severe") {
    addSkip("exfoliant", "exfoliation")
  }
  if (has("heat") || has("pm") || (w.humidity !== null && w.humidity >= 70)) {
    addSkip("heavy_oil", "barrier")
  }
  if (time === "day") {
    if (has("uv") || has("heat")) addSkip("retinoid", "active")
  } else if (level === "severe" || (w.uvIndex !== null && w.uvIndex >= 8)) {
    addSkip("retinoid", "active")
  }

  // 건조 계열: 건조 driver, 저온, 또는 습도 45% 미만
  const dryish = has("dry") || has("cold") || (w.humidity !== null && w.humidity < 45)
  const layers = ageLayers(ageGroup, { time, dryish })

  return {
    doItems: [...doItems.slice(0, 2), ...layers],
    skipItems: skipItems.slice(0, 2),
  }
}

/** WMO 날씨코드 → 비/눈 여부 (문구 보조용) */
export function precipFromWeatherCode(code: number | null): { isRain: boolean; isSnow: boolean } {
  if (code === null) return { isRain: false, isSnow: false }
  const isRain =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86
  return { isRain, isSnow }
}

/** WMO 날씨코드 → 직관적 상태 키 (skinWeather.condition.<key> i18n와 매핑) */
export type WeatherConditionKey = "clear" | "mostlyClear" | "cloudy" | "fog" | "rain" | "snow" | "storm"

export function weatherConditionKey(code: number | null): WeatherConditionKey | null {
  if (code === null) return null
  if (code === 0) return "clear"
  if (code === 1 || code === 2) return "mostlyClear"
  if (code === 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code >= 71 && code <= 77) return "snow"
  if (code === 85 || code === 86) return "snow"
  if (code >= 95) return "storm"
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain"
  return "cloudy"
}

/** 클라이언트에서 /api/weather 호출 */
export async function fetchSkinWeather(): Promise<SkinWeather> {
  const res = await fetch("/api/weather")
  if (!res.ok) throw new Error(`weather ${res.status}`)
  return (await res.json()) as SkinWeather
}
