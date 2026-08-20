"use client"

import { useEffect, useState } from "react"
import { useDiary } from "@/lib/diary-context"
import { useLocale } from "@/lib/locale-context"
import { buildCareCardCopy } from "@/lib/care-card-copy"
import { t } from "@/lib/i18n"
import { CONCERN_LABEL_KEYS } from "@/lib/label-mappings"
import { normalizeIngredient } from "@/lib/ingredient-warnings"

interface WeatherData {
  temp: number | null
  humidity: number | null
  weatherMain: string | null
}

/** day → 값 레코드에서 (currentDay - windowSize, currentDay] 범위만 골라낸다 */
function pickRecentWindow<T>(record: Record<number, T>, currentDay: number, windowSize: number): Record<number, T> {
  const result: Record<number, T> = {}
  for (const [dayStr, value] of Object.entries(record)) {
    const day = Number(dayStr)
    if (day > currentDay - windowSize && day <= currentDay) {
      result[day] = value
    }
  }
  return result
}

export function TodayCareCard() {
  const locale = useLocale()
  const diary = useDiary()
  const [weather, setWeather] = useState<WeatherData>({
    temp: null,
    humidity: null,
    weatherMain: null,
  })

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather")
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch (error) {
        console.warn("[TodayCareCard] Failed to fetch weather:", error)
      }
    }

    fetchWeather()
  }, [])

  if (!diary.activeIngredients || diary.activeIngredients.length === 0) {
    console.warn("[TodayCareCard] active_ingredients not found, falling back to default copy")
  }

  const loggedDaysCount = diary.loggedDays.length
  const currentDay = diary.currentDay
  const todaySlots = diary.loggedSlots[currentDay] ?? []
  const normalizedActiveIngredients = (diary.activeIngredients ?? []).map(normalizeIngredient)

  const todayConcernCareSlots = todaySlots.filter((s) => s.slot.startsWith("concern_care_"))
  const todayActiveIngredient =
    todayConcernCareSlots.length > 0
      ? normalizeIngredient(todayConcernCareSlots[todayConcernCareSlots.length - 1].tag)
      : null

  const recentWindowSize = loggedDaysCount >= 14 ? 14 : 7
  const recentLoggedSlots = pickRecentWindow(diary.loggedSlots, currentDay, recentWindowSize)
  const recentConditions = pickRecentWindow(diary.conditions, currentDay, recentWindowSize)

  const concernLabel =
    diary.concern && diary.concern !== "none" ? t(CONCERN_LABEL_KEYS[diary.concern], locale) : null

  const copy = buildCareCardCopy({
    weather,
    locale,
    loggedDaysCount,
    currentDay,
    todaySlots,
    todayActiveIngredient,
    recentLoggedSlots,
    recentConditions,
    recentActiveIngredients: normalizedActiveIngredients,
    concernLabel,
  })

  return (
    <div className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border">
      <div className="flex flex-row-reverse items-start gap-3">
        <img
          src="/onboarding/cover-cat-camera.png"
          alt=""
          className="h-11 w-11 shrink-0 object-contain"
        />
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-xl font-semibold text-foreground">{copy.title}</h3>
          <p className="text-sm leading-relaxed text-foreground">{copy.description}</p>
        </div>
      </div>
    </div>
  )
}
