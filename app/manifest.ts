import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hoppy Skin Diary",
    short_name: "Hoppy",
    description: "30일 도자기 피부 루틴을 매일 기록하는 스킨 다이어리",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#33452F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
