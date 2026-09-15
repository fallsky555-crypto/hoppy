"use client"

import { useEffect, useState } from "react"
import type { SkinWeather } from "@/lib/skin-weather"
import type { AmazonPicksResponse } from "@/app/api/amazon-picks/route"

type Status = "loading" | "ready" | "error"

/**
 * /api/amazon-picks를 호출해 오늘의 Today's Pick 1개 + 일반 추천 2개를 가져온다.
 * weather가 null이면(로딩 중이거나 locale !== "en") 아무것도 하지 않는다.
 */
export function useAmazonPicks(weather: SkinWeather | null): { result: AmazonPicksResponse | null; status: Status } {
  const [result, setResult] = useState<AmazonPicksResponse | null>(null)
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    if (!weather) return
    let cancelled = false
    setStatus("loading")

    const params = new URLSearchParams()
    if (weather.temp !== null) params.set("temp", String(weather.temp))
    if (weather.humidity !== null) params.set("humidity", String(weather.humidity))
    if (weather.uvIndex !== null) params.set("uvIndex", String(weather.uvIndex))
    if (weather.pm25 !== null) params.set("pm25", String(weather.pm25))

    fetch(`/api/amazon-picks?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((data: AmazonPicksResponse) => {
        if (cancelled) return
        setResult(data)
        setStatus("ready")
      })
      .catch((err) => {
        console.warn("[useAmazonPicks] failed:", err)
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [weather])

  return { result, status }
}
