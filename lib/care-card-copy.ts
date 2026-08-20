import { getRandomElement } from "@/lib/utils"
import type { Locale } from "@/lib/i18n"
import {
  STAGE0_CONTENT,
  checkWeeklyBalance,
  getDailyTipStage,
  getStage1Tip,
  getStage2Tip,
  getStage3Tip,
  getWeeklyBalanceTip,
} from "@/lib/daily-tip"

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

/** 메인 문구 뒤에 덧붙는 한 줄 — 폭염(condition.isHot && temp>=32) / 비 올 때만 */
const weatherAddendumSnippets = {
  en: {
    rain: "It's raining today, so keep your skin hydrated and moisturized.",
    hotHot: [
      "It's hot today!",
      "It's a scorcher out there!",
    ],
    sunWarning: "Remember to apply sunscreen generously.",
  },
  ko: {
    rain: "비가 오고 있어요, 촉촉하게 보습 챙겨주세요.",
    hotHot: [
      "오늘 날씨가 정말 덥네요!",
      "한여름 날씨인가요!",
    ],
    sunWarning: "자외선 차단제를 충분히 발라주세요.",
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

function buildWeatherAddendum(condition: WeatherCondition, weather: WeatherData, locale: Locale): string | null {
  const snippets = locale === "ko" ? weatherAddendumSnippets.ko : weatherAddendumSnippets.en

  if (condition.isRain) {
    return snippets.rain
  }

  if (condition.isHot && weather.temp !== null && weather.temp >= 32) {
    return `${getRandomElement(snippets.hotHot)} ${snippets.sunWarning}`
  }

  return null
}

interface BuildCareCardCopyParams {
  weather: WeatherData
  locale: Locale
  loggedDaysCount: number
  todaySlots: { slot: string; tag: string }[]
  todayActiveIngredient: string | null
  recentLoggedSlots: Record<number, { slot: string; tag: string }[]>
  recentConditions: Record<number, "good" | "neutral" | "bad">
  recentActiveIngredients: string[]
  concernLabel: string | null
}

interface CareCardCopy {
  title: string
  description: string
}

export function buildCareCardCopy(params: BuildCareCardCopyParams): CareCardCopy {
  const {
    weather,
    locale,
    loggedDaysCount,
    todaySlots,
    todayActiveIngredient,
    recentLoggedSlots,
    recentConditions,
    recentActiveIngredients,
    concernLabel,
  } = params

  const title = locale === "ko" ? "오늘의 팁" : "Today's Tip"

  const weeklyBalance = checkWeeklyBalance(recentLoggedSlots, recentActiveIngredients, loggedDaysCount)

  let mainCopy: string
  if (weeklyBalance) {
    // 7일차/14일차 결산이 최우선
    mainCopy = getWeeklyBalanceTip(weeklyBalance, locale)
  } else {
    const stage = getDailyTipStage(loggedDaysCount)

    if (stage === 0) {
      const content = STAGE0_CONTENT[loggedDaysCount]
      mainCopy = locale === "ko" ? content.text_ko : content.text_en
    } else if (stage === 1) {
      const stage1Tip = getStage1Tip(todaySlots, todayActiveIngredient, locale)
      if (stage1Tip) {
        mainCopy = stage1Tip
      } else {
        const fallback = STAGE0_CONTENT[loggedDaysCount % 7]
        mainCopy = locale === "ko" ? fallback.text_ko : fallback.text_en
      }
    } else if (stage === 2) {
      mainCopy = getStage2Tip(recentLoggedSlots, recentConditions, concernLabel, locale)
    } else {
      const loggedDays = Object.keys(recentLoggedSlots).map(Number)
      mainCopy = getStage3Tip(loggedDays, locale)
    }
  }

  const condition = analyzeWeather(weather)
  const weatherAddendum = buildWeatherAddendum(condition, weather, locale)

  return {
    title,
    description: weatherAddendum ? `${mainCopy} ${weatherAddendum}` : mainCopy,
  }
}
