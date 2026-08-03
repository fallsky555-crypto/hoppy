interface WeatherData {
  temp: number | null
  humidity: number | null
  weatherMain: string | null
}

export async function GET(request: Request): Promise<Response> {
  try {
    let lat = 37.5665
    let lon = 126.978

    try {
      // @ts-ignore - @vercel/functions only available on Vercel
      const { geolocation } = await import("@vercel/functions")
      const geo = geolocation(request)
      if (geo?.latitude && geo?.longitude) {
        lat = geo.latitude
        lon = geo.longitude
      }
    } catch {
      // @vercel/functions not available in local dev, use default
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.warn("[weather/route] OPENWEATHER_API_KEY not set")
      return Response.json({ temp: null, humidity: null, weatherMain: null })
    }

    const url = new URL("https://api.openweathermap.org/data/2.5/weather")
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lon", String(lon))
    url.searchParams.set("appid", apiKey)
    url.searchParams.set("units", "metric")
    url.searchParams.set("lang", "kr")

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

    if (!res.ok) {
      console.warn(`[weather/route] OpenWeather API returned ${res.status}`)
      return Response.json({ temp: null, humidity: null, weatherMain: null })
    }

    const data = await res.json()

    const weatherData: WeatherData = {
      temp: Math.round(data.main?.temp ?? 20),
      humidity: data.main?.humidity ?? 50,
      weatherMain: data.weather?.[0]?.main ?? "",
    }

    return Response.json(weatherData)
  } catch (error) {
    console.warn("[weather/route] Error:", error instanceof Error ? error.message : String(error))
    return Response.json({ temp: null, humidity: null, weatherMain: null })
  }
}
