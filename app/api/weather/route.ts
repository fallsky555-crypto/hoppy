/**
 * 스킨 웨더용 날씨/대기질 데이터.
 *
 * Open-Meteo(무료, API 키 불필요)에서 가져온다:
 *   - forecast API: 기온, 상대습도, WMO 날씨코드, 오늘 UV 최대치
 *   - air-quality API: 초미세먼지(PM2.5), 미세먼지(PM10)
 *
 * 좌표는 Vercel 엣지 지오로케이션 → 실패 시 서울 시청 기준.
 * 어느 단계에서 실패해도 200 + null 필드로 응답한다(클라이언트가 폴백 루틴을 보여줌).
 */

interface SkinWeatherResponse {
  temp: number | null
  humidity: number | null
  uvIndex: number | null
  pm25: number | null
  pm10: number | null
  weatherCode: number | null
  source: "open-meteo" | "unavailable"
}

const UNAVAILABLE: SkinWeatherResponse = {
  temp: null,
  humidity: null,
  uvIndex: null,
  pm25: null,
  pm10: null,
  weatherCode: null,
  source: "unavailable",
}

/** 서울 시청 */
const DEFAULT_LAT = 37.5665
const DEFAULT_LON = 126.978

export async function GET(request: Request): Promise<Response> {
  try {
    let lat = DEFAULT_LAT
    let lon = DEFAULT_LON

    // Vercel 엣지가 붙여주는 지오로케이션 헤더 (로컬에선 없음 → 서울 기준)
    const headerLat = Number(request.headers.get("x-vercel-ip-latitude"))
    const headerLon = Number(request.headers.get("x-vercel-ip-longitude"))
    if (Number.isFinite(headerLat) && Number.isFinite(headerLon) && (headerLat !== 0 || headerLon !== 0)) {
      lat = headerLat
      lon = headerLon
    }

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast")
    forecastUrl.searchParams.set("latitude", String(lat))
    forecastUrl.searchParams.set("longitude", String(lon))
    forecastUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code")
    forecastUrl.searchParams.set("daily", "uv_index_max")
    forecastUrl.searchParams.set("forecast_days", "1")
    forecastUrl.searchParams.set("timezone", "auto")

    const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality")
    airUrl.searchParams.set("latitude", String(lat))
    airUrl.searchParams.set("longitude", String(lon))
    airUrl.searchParams.set("current", "pm2_5,pm10")
    airUrl.searchParams.set("timezone", "auto")

    // 대기질 호출이 실패해도 날씨는 살리기 위해 allSettled
    const [forecastRes, airRes] = await Promise.allSettled([
      fetch(forecastUrl.toString(), { next: { revalidate: 1800 } }),
      fetch(airUrl.toString(), { next: { revalidate: 1800 } }),
    ])

    let temp: number | null = null
    let humidity: number | null = null
    let uvIndex: number | null = null
    let weatherCode: number | null = null

    if (forecastRes.status === "fulfilled" && forecastRes.value.ok) {
      const data = await forecastRes.value.json()
      const t = data.current?.temperature_2m
      const h = data.current?.relative_humidity_2m
      const w = data.current?.weather_code
      const uv = data.daily?.uv_index_max?.[0]
      temp = typeof t === "number" ? Math.round(t) : null
      humidity = typeof h === "number" ? Math.round(h) : null
      weatherCode = typeof w === "number" ? w : null
      uvIndex = typeof uv === "number" ? Math.round(uv * 10) / 10 : null
    } else {
      console.warn("[weather/route] Open-Meteo forecast unavailable")
    }

    let pm25: number | null = null
    let pm10: number | null = null

    if (airRes.status === "fulfilled" && airRes.value.ok) {
      const data = await airRes.value.json()
      const p25 = data.current?.pm2_5
      const p10 = data.current?.pm10
      pm25 = typeof p25 === "number" ? Math.round(p25 * 10) / 10 : null
      pm10 = typeof p10 === "number" ? Math.round(p10 * 10) / 10 : null
    } else {
      console.warn("[weather/route] Open-Meteo air-quality unavailable")
    }

    if (temp === null && humidity === null && uvIndex === null && pm25 === null) {
      return Response.json(UNAVAILABLE)
    }

    const payload: SkinWeatherResponse = {
      temp,
      humidity,
      uvIndex,
      pm25,
      pm10,
      weatherCode,
      source: "open-meteo",
    }
    return Response.json(payload)
  } catch (error) {
    console.warn("[weather/route] Error:", error instanceof Error ? error.message : String(error))
    return Response.json(UNAVAILABLE)
  }
}
