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

/** 오늘 24시간 시간대별 시리즈 (스킨 웨더 바텀시트의 미니 그래프용) */
interface HourlySeries {
  /** 0~23 (사용자 로컬 시간) */
  hour: number[]
  humidity: (number | null)[]
  uv: (number | null)[]
  pm25: (number | null)[]
}

interface SkinWeatherResponse {
  temp: number | null
  humidity: number | null
  uvIndex: number | null
  pm25: number | null
  pm10: number | null
  weatherCode: number | null
  hourly: HourlySeries | null
  source: "open-meteo" | "unavailable"
}

const UNAVAILABLE: SkinWeatherResponse = {
  temp: null,
  humidity: null,
  uvIndex: null,
  pm25: null,
  pm10: null,
  weatherCode: null,
  hourly: null,
  source: "unavailable",
}

/** Open-Meteo hourly 응답(시각 배열 + 값 배열)을 시각별 숫자로 정리한다 */
function toHourMap(times: unknown, values: unknown): Map<number, number> {
  const out = new Map<number, number>()
  if (!Array.isArray(times) || !Array.isArray(values)) return out
  for (let i = 0; i < times.length; i++) {
    const ts = times[i]
    const v = values[i]
    if (typeof ts !== "string" || typeof v !== "number" || !Number.isFinite(v)) continue
    // "2026-09-09T14:00" → 14
    const hour = Number(ts.slice(11, 13))
    if (Number.isInteger(hour)) out.set(hour, v)
  }
  return out
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
    forecastUrl.searchParams.set("hourly", "relative_humidity_2m,uv_index")
    forecastUrl.searchParams.set("forecast_days", "1")
    forecastUrl.searchParams.set("timezone", "auto")

    const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality")
    airUrl.searchParams.set("latitude", String(lat))
    airUrl.searchParams.set("longitude", String(lon))
    airUrl.searchParams.set("current", "pm2_5,pm10")
    airUrl.searchParams.set("hourly", "pm2_5")
    airUrl.searchParams.set("forecast_days", "1")
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
    let humidityByHour = new Map<number, number>()
    let uvByHour = new Map<number, number>()

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
      humidityByHour = toHourMap(data.hourly?.time, data.hourly?.relative_humidity_2m)
      uvByHour = toHourMap(data.hourly?.time, data.hourly?.uv_index)
    } else {
      console.warn("[weather/route] Open-Meteo forecast unavailable")
    }

    let pm25: number | null = null
    let pm10: number | null = null
    let pm25ByHour = new Map<number, number>()

    if (airRes.status === "fulfilled" && airRes.value.ok) {
      const data = await airRes.value.json()
      const p25 = data.current?.pm2_5
      const p10 = data.current?.pm10
      pm25 = typeof p25 === "number" ? Math.round(p25 * 10) / 10 : null
      pm10 = typeof p10 === "number" ? Math.round(p10 * 10) / 10 : null
      pm25ByHour = toHourMap(data.hourly?.time, data.hourly?.pm2_5)
    } else {
      console.warn("[weather/route] Open-Meteo air-quality unavailable")
    }

    if (temp === null && humidity === null && uvIndex === null && pm25 === null) {
      return Response.json(UNAVAILABLE)
    }

    // 0~23시 시리즈. 값이 없는 시각은 null.
    const round1 = (v: number) => Math.round(v * 10) / 10
    const pick = (m: Map<number, number>, hour: number) => (m.has(hour) ? round1(m.get(hour) as number) : null)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourly: HourlySeries | null =
      humidityByHour.size || uvByHour.size || pm25ByHour.size
        ? {
            hour: hours,
            humidity: hours.map((h) => pick(humidityByHour, h)),
            uv: hours.map((h) => pick(uvByHour, h)),
            pm25: hours.map((h) => pick(pm25ByHour, h)),
          }
        : null

    const payload: SkinWeatherResponse = {
      temp,
      humidity,
      uvIndex,
      pm25,
      pm10,
      weatherCode,
      hourly,
      source: "open-meteo",
    }
    return Response.json(payload)
  } catch (error) {
    console.warn("[weather/route] Error:", error instanceof Error ? error.message : String(error))
    return Response.json(UNAVAILABLE)
  }
}
