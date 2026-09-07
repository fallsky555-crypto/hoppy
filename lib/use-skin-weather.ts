"use client"

import { useEffect, useState } from "react"
import { fetchSkinWeather, type SkinWeather } from "@/lib/skin-weather"

type Status = "loading" | "ready" | "error"

/**
 * /api/weather를 앱 전체에서 한 번만 부르기 위한 모듈 레벨 캐시.
 * 스킨 웨더 카드와 데일리 슬롯 뱃지가 같은 결과를 공유한다.
 * (revalidate는 서버 라우트에서 30분으로 잡혀 있어 세션 캐시로 충분)
 */
let cache: SkinWeather | null = null
let inflight: Promise<SkinWeather> | null = null

export function useSkinWeather(): { weather: SkinWeather | null; status: Status } {
  const [weather, setWeather] = useState<SkinWeather | null>(cache)
  const [status, setStatus] = useState<Status>(cache ? "ready" : "loading")

  useEffect(() => {
    if (cache) return
    let cancelled = false

    if (!inflight) {
      inflight = fetchSkinWeather().then((data) => {
        cache = data
        return data
      })
    }

    inflight
      .then((data) => {
        if (cancelled) return
        setWeather(data)
        setStatus(data.source === "unavailable" ? "error" : "ready")
      })
      .catch((err) => {
        console.warn("[useSkinWeather] failed:", err)
        inflight = null // 다음 마운트에서 재시도 허용
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { weather, status }
}
