/**
 * "오늘의 추천"(영문 로케일 아마존 픽) 오늘의 선정 결과.
 *
 * 선정 로직 자체는 순수 함수(lib/data/amazon-picks.ts의 selectTodayAmazonRecommendation)라
 * 여기서는 I/O만 담당한다: 최근 7일 노출 이력을 Supabase에서 읽어 선정에 넘기고, 오늘 고른
 * 3개를 같은 테이블에 기록한다. 노출 이력은 유저별이 아닌 전체 공통(2026-09-15 스펙 결정)이라
 * 인증 없이 공개 테이블(amazon_pick_exposures)을 그대로 쓴다.
 *
 * weather는 이미 클라이언트가 useSkinWeather로 가져온 값을 쿼리 파라미터로 그대로 넘겨받는다
 * (같은 요청을 서버에서 중복으로 다시 하지 않기 위함).
 */
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  buildTodaysPickReason,
  selectTodayAmazonRecommendation,
  type AmazonPick,
} from "@/lib/data/amazon-picks"
import type { SkinWeather } from "@/lib/skin-weather"

function parseWeatherFromQuery(url: URL): SkinWeather {
  const num = (key: string): number | null => {
    const v = url.searchParams.get(key)
    if (v === null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return {
    temp: num("temp"),
    humidity: num("humidity"),
    uvIndex: num("uvIndex"),
    pm25: num("pm25"),
    pm10: null,
    weatherCode: null,
    hourly: null,
    source: "open-meteo",
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export interface AmazonPicksResponse {
  todaysPick: AmazonPick
  regularPicks: AmazonPick[]
  reason: string
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const weather = parseWeatherFromQuery(url)
    const now = new Date()
    const today = toDateStr(now)

    const supabase = getSupabaseClient()
    let recentlyExposedIds = new Set<string>()

    if (supabase) {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data, error } = await supabase
        .from("amazon_pick_exposures")
        .select("product_id")
        .gte("exposed_date", toDateStr(sevenDaysAgo))
        .lt("exposed_date", today)
      if (error) {
        console.warn("[amazon-picks/route] exposure read failed:", error.message)
      } else {
        recentlyExposedIds = new Set((data ?? []).map((r: { product_id: string }) => r.product_id))
      }
    }

    const { todaysPick, regularPicks } = selectTodayAmazonRecommendation(weather, now, recentlyExposedIds)
    const reason = buildTodaysPickReason(todaysPick, weather, now)

    if (supabase) {
      const rows = [todaysPick, ...regularPicks].map((p) => ({ product_id: p.id, exposed_date: today }))
      // 같은 날 여러 방문자가 동시에 로드해도 안전하도록 (product_id, exposed_date) 중복은 무시.
      const { error } = await supabase
        .from("amazon_pick_exposures")
        .upsert(rows, { onConflict: "product_id,exposed_date", ignoreDuplicates: true })
      if (error) {
        console.warn("[amazon-picks/route] exposure write failed:", error.message)
      }
    }

    const payload: AmazonPicksResponse = { todaysPick, regularPicks, reason }
    return Response.json(payload)
  } catch (error) {
    console.warn("[amazon-picks/route] Error:", error instanceof Error ? error.message : String(error))
    return Response.json({ error: "unavailable" }, { status: 500 })
  }
}
