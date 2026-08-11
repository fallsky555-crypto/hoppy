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
  const recommendedSlot: SlotType | null = getRecommendedSlot(todayRecipe.type) as SlotType | null

  const activeIngredients = diary.activeIngredients ?? []
  if (!diary.activeIngredients || diary.activeIngredients.length === 0) {
    console.warn("[TodayCareCard] active_ingredients not found, falling back to default copy")
  }

  const copy = buildCareCardCopy({
    weather,
    recommendedSlot,
    locale,
    activeIngredients,
  })

  return (
    <div className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border">
      <div className="flex flex-row items-start gap-3">
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
