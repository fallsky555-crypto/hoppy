"use client"

import { useEffect, useState } from "react"
import { useDiary } from "@/lib/diary-context"
import { useLocale } from "@/lib/locale-context"
import { getRecommendedSlot } from "@/lib/slot-mapping"
import { buildCareCardCopy } from "@/lib/care-card-copy"
import type { SlotType } from "@/components/daily-slots"

interface WeatherData {
  temp: number | null
  humidity: number | null
  weatherMain: string | null
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

  const todayRecipe = diary.getRecipeForDay(diary.currentDay)
  const hasRecentIncident = diary.hasRecentSafetyIncident(diary.currentDay)
  const recommendedSlot: SlotType | null = hasRecentIncident ? "barrier" : (getRecommendedSlot(todayRecipe.type) as SlotType | null)

  const copy = buildCareCardCopy({
    weather,
    recommendedSlot,
    hasSafetyIncident: hasRecentIncident,
    locale,
  })

  return (
    <div className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border">
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-xl font-semibold text-foreground">{copy.title}</h3>
        <p className="text-sm leading-relaxed text-foreground">{copy.description}</p>
      </div>
    </div>
  )
}
