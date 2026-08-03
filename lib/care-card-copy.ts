import type { SlotType } from "@/components/daily-slots"

interface WeatherData {
  temp: number | null
  humidity: number | null
  weatherMain: string | null
}

interface CareCardCopyParams {
  weather: WeatherData
  recommendedSlot: SlotType | null
  hasSafetyIncident: boolean
  locale: "ko" | "en"
}

interface CareCardCopy {
  title: string
  description: string
}

const weatherSnippets = {
  ko: {
    hotHot: ["오늘 너무 덥죠?", "푹푹 찌는 날씨예요."],
    humid: ["습해서 끈적할 수 있어요.", "눅눅한 하루예요."],
    dry: ["많이 건조한 날이에요.", "수분이 금방 날아갈 것 같아요."],
    cold: ["오늘 많이 춥죠? 건조하기 쉬우니 장벽 관리 신경 써주세요.", "칼바람 부는 날이에요. 건조하기 쉬우니 장벽 관리 신경 써주세요."],
    cool: "쌀쌀한 날씨예요.",
    sunWarning: "자외선이 강할 것 같으니 자외선차단을 꼭 챙겨보세요.",
    rain: "비 소식이 있어요, 외출 후 클렌징 신경 써주세요.",
  },
  en: {
    hotHot: ["It's really hot today, isn't it?", "It's a sweltering day."],
    humid: ["It's humid and might feel sticky.", "It's a muggy day."],
    dry: ["It's quite dry today.", "Moisture will evaporate quickly."],
    cold: ["It's quite cold today, isn't it? It tends to be dry, so focus on barrier care.", "It's a biting cold day. It tends to be dry, so focus on barrier care."],
    cool: "It's a chilly day.",
    sunWarning: "Make sure to apply sunscreen as UV rays are strong.",
    rain: "Rain is expected, so cleanse carefully after going outside.",
  },
}

const slotMessages = {
  ko: {
    active: "저녁에 고민케어에 집중해보세요.",
    barrier: "저녁에 진정케어 한번 해보세요.",
    hydration: "수분 보충 잊지 마세요.",
    prep: "클렌징부터 꼼꼼히 챙겨보세요.",
  },
  en: {
    active: "Focus on targeted care this evening.",
    barrier: "Try some soothing care this evening.",
    hydration: "Don't forget to hydrate.",
    prep: "Start with thorough cleansing.",
  },
}

const specialSlotMessages = {
  ko: {
    dryActive: "고민케어 하신다면 보습도 꼭 함께 챙겨주세요.",
  },
  en: {
    dryActive: "If you're doing targeted care, make sure to hydrate as well.",
  },
}

const safetyMessages = {
  ko: {
    title: "오늘은 지키는 날이에요",
    description: "무언가를 더하기보다, 가진 걸 지키는 날이에요. 진정케어로 장벽을 든든하게 감싸주세요.",
  },
  en: {
    title: "Today is a day to protect",
    description: "Instead of adding more, focus on protecting what you have. Wrap your skin barrier with soothing care.",
  },
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface WeatherCondition {
  isRain: boolean
  isDry: boolean
  isHumid: boolean
  isHot: boolean
  isCold: boolean
  isCool: boolean
}

function analyzeWeather(weather: WeatherData): WeatherCondition {
  const temp = weather.temp
  return {
    isRain: weather.weatherMain?.toLowerCase().includes("rain") || weather.weatherMain?.toLowerCase().includes("snow") || false,
    isDry: weather.humidity !== null && weather.humidity < 40,
    isHumid: weather.humidity !== null && weather.humidity >= 70,
    isHot: temp !== null && temp >= 28,
    isCold: temp !== null && temp <= 5,
    isCool: temp !== null && temp > 5 && temp < 10,
  }
}

function buildWeatherSnippet(weather: WeatherData, locale: "ko" | "en"): string {
  const snippets = weatherSnippets[locale]
  const condition = analyzeWeather(weather)

  // 우선순위: 비/눈 > 겨울 > 더위 > 습도
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

  return ""
}

export function buildCareCardCopy({
  weather,
  recommendedSlot,
  hasSafetyIncident,
  locale,
}: CareCardCopyParams): CareCardCopy {
  if (hasSafetyIncident) {
    return {
      title: safetyMessages[locale].title,
      description: safetyMessages[locale].description,
    }
  }

  const condition = analyzeWeather(weather)
  const weatherSnippet = buildWeatherSnippet(weather, locale)

  // 중복 방지 로직
  let slotMessage = ""

  if (recommendedSlot) {
    // 건조한 날씨 + hydration → 슬롯 문장 생략
    if (condition.isDry && recommendedSlot === "hydration") {
      slotMessage = ""
    }
    // 비/눈 + prep → 슬롯 문장 생략
    else if (condition.isRain && recommendedSlot === "prep") {
      slotMessage = ""
    }
    // 건조한 날씨 + active → 특수 메시지
    else if (condition.isDry && recommendedSlot === "active") {
      slotMessage = specialSlotMessages[locale].dryActive
    }
    // 일반적인 경우
    else if (recommendedSlot in slotMessages[locale]) {
      slotMessage = slotMessages[locale][recommendedSlot as keyof typeof slotMessages.ko]
    }
  }

  let description = ""
  if (weatherSnippet && slotMessage) {
    description = `${weatherSnippet}\n${slotMessage}`
  } else if (weatherSnippet) {
    description = weatherSnippet
  } else if (slotMessage) {
    description = slotMessage
  }

  return {
    title: locale === "ko" ? "오늘의 케어" : "Today's Care",
    description,
  }
}
