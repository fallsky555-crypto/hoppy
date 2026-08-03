import { getRandomElement } from "@/lib/utils"
import type { SlotType } from "@/components/daily-slots"

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
    rain: "It looks like rain today, so keep your skin hydrated and moisturized.",
    snow: "Snow is expected, so keep your skin well moisturized.",
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
    rain: "비 소식이 있어요, 촉촉하게 보습 챙겨주세요.",
    snow: "눈 소식이 있어요, 촉촉하게 보습 챙겨주세요.",
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
  const temp = weather.temp ?? 20
  const humidity = weather.humidity ?? 50

  return {
    isRain: ["rain", "drizzle", "thunderstorm"].some((kw) => weather.weatherMain?.toLowerCase().includes(kw)) || false,
    isSnow: weather.weatherMain?.toLowerCase().includes("snow") || false,
    isCold: temp < 10,
    isCool: temp >= 10 && temp < 16,
    isHot: temp > 26,
    isHumid: humidity > 70,
    isDry: humidity < 30,
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

interface BuildCareCardCopyParams {
  weather: WeatherData
  recommendedSlot: SlotType | null
  hasSafetyIncident: boolean
  locale: string
}

interface CareCardCopy {
  title: string
  description: string
}

export function buildCareCardCopy(params: BuildCareCardCopyParams): CareCardCopy {
  const { weather, recommendedSlot, hasSafetyIncident, locale } = params
  const condition = analyzeWeather(weather)

  if (hasSafetyIncident) {
    return {
      title: locale === "ko" ? "피부 진정 케어" : "Calm Your Skin",
      description: locale === "ko"
        ? "최근 피부 트러블이 있었어요. 진정 케어에 집중해주세요."
        : "Your skin has been acting up recently. Focus on calming care.",
    }
  }

  const weatherSnippet = buildWeatherSnippet(condition, locale)

  if ((condition.isRain || condition.isSnow) && recommendedSlot === "prep") {
    return {
      title: locale === "ko" ? "화장수 & 에센스" : "Toner & Essence",
      description: locale === "ko"
        ? `습한 날씨에는 기초 단계부터 신경 써야 해요. ${weatherSnippet}`
        : `On humid days, focus on foundation. ${weatherSnippet}`,
    }
  }

  if (recommendedSlot === "prep") {
    return {
      title: locale === "ko" ? "화장수 & 에센스" : "Toner & Essence",
      description: locale === "ko"
        ? `기초 단계가 중요한 날이에요. ${weatherSnippet}`
        : `Foundation is key today. ${weatherSnippet}`,
    }
  }

  if (recommendedSlot === "active") {
    return {
      title: locale === "ko" ? "세럼 & 트리트먼트" : "Serum & Treatment",
      description: locale === "ko"
        ? `집중 케어가 필요한 날이에요. ${weatherSnippet}`
        : `Your skin needs targeted care. ${weatherSnippet}`,
    }
  }

  if (recommendedSlot === "hydration") {
    return {
      title: locale === "ko" ? "토너 & 에센스" : "Toner & Essence",
      description: locale === "ko"
        ? `수분 케어가 중요한 날이에요. ${weatherSnippet}`
        : `Hydration is key today. ${weatherSnippet}`,
    }
  }

  if (recommendedSlot === "barrier") {
    return {
      title: locale === "ko" ? "크림 & 에센스" : "Cream & Essence",
      description: locale === "ko"
        ? `피부 장벽 보호가 우선이에요. ${weatherSnippet}`
        : `Barrier protection comes first. ${weatherSnippet}`,
    }
  }

  if (recommendedSlot === "sun_care") {
    return {
      title: locale === "ko" ? "선케어" : "Sun Care",
      description: locale === "ko"
        ? `자외선 차단이 중요한 날이에요. ${weatherSnippet}`
        : `Sun protection is essential today. ${weatherSnippet}`,
    }
  }

  return {
    title: locale === "ko" ? "오늘의 피부 관리" : "Today's Skincare",
    description: weatherSnippet,
  }
}
