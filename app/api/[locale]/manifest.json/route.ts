import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: 'ko' | 'en' }> }
) {
  const { locale } = await params

  const manifests: Record<'ko' | 'en', object> = {
    ko: {
      name: "Hoppy 스킨 다이어리",
      short_name: "Hoppy",
      description: "30일 도자기 피부 루틴을 매일 기록하는 스킨 다이어리",
      start_url: "/ko",
      lang: "ko",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#33452F",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    en: {
      name: "Hoppy Skin Diary",
      short_name: "Hoppy",
      description: "Track your daily skincare routine and observe the changes in your skin over time. Log each step, note what works for you, and learn your own skin.",
      start_url: "/en",
      lang: "en",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#33452F",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
  }

  const manifest = manifests[locale] || manifests.ko

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}
