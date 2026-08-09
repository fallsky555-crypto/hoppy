import { getRandomElement } from "@/lib/utils"
import type { SlotType } from "@/components/daily-slots"

const INGREDIENT_LABELS_KO: Record<string, string> = {
  ret: "레티놀",
  vitc: "비타민C",
  nia: "나이아신아마이드",
}

function getActiveIngredientLabelKo(activeIngredients: string[]): string {
  const labels = activeIngredients.map((id) => INGREDIENT_LABELS_KO[id]).filter(Boolean)
  return labels.length > 0 ? labels.join(", ") : "레티놀 등"
}

interface WeatherData {
  temp: number | null
  humidity: number | null
  weatherMain: string | null
}

interface WeatherCondition {
  isRain: boolean
  isSnow: boolean
  isCold: boolean
  isCool: boolean
  isHot: boolean
  isHumid: boolean
  isDry: boolean
}

const weatherSnippets = {
  en: {
    rain: "It's raining today, so keep your skin hydrated and moisturized.",
    snow: "It's snowing today, so keep your skin well moisturized.",
    cold: [
      "It's cold today, so make sure to take care of your skin barrier.",
      "Bundle up and don't forget to moisturize your skin!",
    ],
    cool: "It's cool out, so your skin might need extra moisture.",
    hotHot: [
      "It's hot today!",
      "It's a scorcher out there!",
    ],
    sunWarning: "Remember to apply sunscreen generously.",
    humid: [
      "It's humid today, keep your skin clean and balanced.",
      "High humidity might make your skin feel sticky—gentle cleansing is key.",
    ],
    dry: [
      "It's dry today, so hydrate and moisturize well.",
      "Dry air can stress your skin barrier—boost hydration today.",
    ],
    nice: [
      "It's a nice day today, great for keeping up your routine.",
      "It's a clear and pleasant day.",
    ],
  },
  ko: {
    rain: "비가 오고 있어요, 촉촉하게 보습 챙겨주세요.",
    snow: "눈이 오고 있어요, 촉촉하게 보습 챙겨주세요.",
    cold: [
      "날씨가 차네요, 피부 장벽 관리에 신경 써주세요.",
      "추운 날씨일수록 보습이 중요해요.",
    ],
    cool: "선선한 날씨네요, 피부 보습을 충분히 해주세요.",
    hotHot: [
      "오늘 날씨가 정말 덥네요!",
      "한여름 날씨인가요!",
    ],
    sunWarning: "자외선 차단제를 충분히 발라주세요.",
    humid: [
      "습하네요, 피부를 깨끗하고 산뜻하게 관리해주세요.",
      "습도가 높으면 피부가 답답해질 수 있어요.",
    ],
    dry: [
      "건조한 날씨예요, 수분과 보습을 충분히 해주세요.",
      "건조함은 피부 장벽에 스트레스를 줄 수 있어요.",
    ],
    nice: [
      "오늘은 날씨가 좋네요, 컨디션 관리하기 좋은 날이에요.",
      "맑고 쾌적한 하루예요.",
    ],
  },
}

function analyzeWeather(weather: WeatherData): WeatherCondition {
  const temp = weather.temp
  const humidity = weather.humidity

  return {
    isRain: ["rain", "drizzle", "thunderstorm"].some((kw) => weather.weatherMain?.toLowerCase().includes(kw)) || false,
    isSnow: weather.weatherMain?.toLowerCase().includes("snow") || false,
    isCold: temp !== null && temp <= 5,
    isCool: temp !== null && temp > 5 && temp < 10,
    isHot: temp !== null && temp >= 28,
    isHumid: humidity !== null && humidity >= 70,
    isDry: humidity !== null && humidity < 40,
  }
}

function buildWeatherSnippet(condition: WeatherCondition, locale: string): string {
  const snippets = locale === "ko" ? weatherSnippets.ko : weatherSnippets.en

  // 우선순위: 눈 > 비 > 겨울 > 더위 > 습도 > 건조 > 좋은 날씨(fallback)
  if (condition.isSnow) {
    return snippets.snow
  }

  if (condition.isRain) {
    return snippets.rain
  }

  if (condition.isCold) {
    return getRandomElement(snippets.cold)
  } else if (condition.isCool) {
    return snippets.cool
  } else if (condition.isHot) {
    return `${getRandomElement(snippets.hotHot)} ${snippets.sunWarning}`
  } else if (condition.isHumid) {
    return getRandomElement(snippets.humid)
  } else if (condition.isDry) {
    return getRandomElement(snippets.dry)
  }

  return getRandomElement(snippets.nice)
}

const nightIntros: Record<"ko" | "en", Record<"hot" | "dry" | "rain", string>> = {
  ko: {
    hot: "저녁엔 열에 지친 피부를 위해",
    dry: "건조한 하루를 보낸 밤엔",
    rain: "비를 맞은 저녁엔",
  },
  en: {
    hot: "After a warm day tonight,",
    dry: "After such a dry day tonight,",
    rain: "With today's rain tonight,",
  },
}

function getNightTip(recommendedSlot: SlotType | null, locale: string): string {
  if (locale === "ko") {
    switch (recommendedSlot) {
      case "active": return "진정케어로 마무리해주세요"
      case "hydration": return "수분을 한 번 더 채워주시면 좋아요"
      case "barrier": return "오늘 밤은 가볍게 쉬어가 주세요"
      case "sun_care": return "진정케어로 하루 동안 받은 자극을 달래주세요"
      default: return "가벼운 진정케어로 하루를 마무리해보세요"
    }
  }
  switch (recommendedSlot) {
    case "active": return "finish up with some soothing care."
    case "hydration": return "it's worth adding one more layer of hydration."
    case "barrier": return "your skin could use a little extra rest tonight."
    case "sun_care": return "let some soothing care calm away the day's stress."
    default: return "wind down with a bit of gentle, soothing care."
  }
}

function getNightTipKey(condition: WeatherCondition): "hot" | "dry" | "rain" | null {
  // 우선순위: rain > hot > dry
  if (condition.isRain) return "rain"
  if (condition.isHot) return "hot"
  if (condition.isDry) return "dry"
  return null
}

interface BuildCareCardCopyParams {
  weather: WeatherData
  recommendedSlot: SlotType | null
  locale: string
  activeIngredients?: string[]
}

interface CareCardCopy {
  title: string
  description: string
}

export function buildCareCardCopy(params: BuildCareCardCopyParams): CareCardCopy {
  const { weather, recommendedSlot, locale, activeIngredients = [] } = params
  const condition = analyzeWeather(weather)
  const title = locale === "ko" ? "오늘의 케어" : "Today's Care"

  const weatherSnippet = buildWeatherSnippet(condition, locale)
  let dayDescription = ""

  if (recommendedSlot === "active") {
    const baseDescription = locale === "ko"
      ? `고민케어가 필요한 날이에요. ${weatherSnippet}`
      : `Your skin needs targeted care. ${weatherSnippet}`
    dayDescription = condition.isDry
      ? locale === "ko"
        ? `${baseDescription} 고민케어 하신다면 보습도 꼭 함께 챙겨주세요.`
        : `${baseDescription} If you're doing targeted care, make sure to hydrate as well.`
      : baseDescription
  } else if (recommendedSlot === "hydration") {
    if (condition.isRain) {
      dayDescription = locale === "ko"
        ? "비 오는 날엔 우산이나 마찰로 피부가 예민해지기 쉬워요. 수분케어로 촉촉하게 채워주세요."
        : "Rainy days can leave skin sensitive from friction and umbrellas. Keep it hydrated and calm."
    } else if (condition.isDry) {
      dayDescription = weatherSnippet
    } else {
      dayDescription = locale === "ko"
        ? `수분케어가 중요한 날이에요. ${weatherSnippet}`
        : `Hydration is key today. ${weatherSnippet}`
    }
  } else if (recommendedSlot === "barrier") {
    dayDescription = locale === "ko"
      ? `피부 장벽 보호가 우선이에요. ${weatherSnippet}`
      : `Barrier protection comes first. ${weatherSnippet}`
  } else if (recommendedSlot === "sun_care") {
    dayDescription = locale === "ko"
      ? `자외선 차단이 중요한 날이에요. ${weatherSnippet}`
      : `Sun protection is essential today. ${weatherSnippet}`
  } else {
    dayDescription = weatherSnippet
  }

  let finalDescription = dayDescription
  const nightTipKey = getNightTipKey(condition)
  if (nightTipKey) {
    const nightTip = getNightTip(recommendedSlot, locale)
    const intro = nightIntros[locale === "ko" ? "ko" : "en"][nightTipKey]
    finalDescription = locale === "ko"
      ? `${dayDescription} ${intro} ${nightTip}.`
      : `${dayDescription} ${intro} ${nightTip}`
  }

  return {
    title,
    description: finalDescription,
  }
}
