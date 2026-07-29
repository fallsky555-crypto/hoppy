"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { RoutineCopy } from "@/lib/routine-copy"
import { PartyPopper, Sparkles, X, Download } from "lucide-react"

interface RoutineBannerProps {
  copy: RoutineCopy
  tone?: "info" | "celebrate"
  onDismiss?: () => void
}

const WALLPAPERS = [
  { name: "동백", path: "/wallpapers/동백.jpeg" },
  { name: "붉은장미", path: "/wallpapers/붉은장미.jpeg" },
  { name: "작약", path: "/wallpapers/작약.jpeg" },
]

/** 주차 오리엔테이션 / 완주 화면처럼, 특정 날에만 뜨는 상단 배너 */
export function RoutineBanner({ copy, tone = "info", onDismiss }: RoutineBannerProps) {
  const isCelebrate = tone === "celebrate"
  const [selectedWallpaper, setSelectedWallpaper] = useState(0)

  const handleDownload = (wallpaper: { name: string; path: string }) => {
    const link = document.createElement("a")
    link.href = wallpaper.path
    link.download = `hoppy-${wallpaper.name}.jpeg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-4xl px-[22px] py-5 ring-1",
        isCelebrate ? "bg-card ring-primary/40" : "bg-secondary ring-border",
      )}
      aria-label={isCelebrate ? "완주 안내" : "주차 오리엔테이션"}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            isCelebrate ? "bg-primary text-primary-foreground" : "bg-card text-primary",
          )}
        >
          {isCelebrate ? <PartyPopper className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-semibold text-foreground">{copy.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#6B6558]">{copy.detail}</p>

          {isCelebrate && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-foreground">완주 기념 배경화면</p>
              <div className="flex gap-2">
                {WALLPAPERS.map((wallpaper, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWallpaper(idx)}
                    className={cn(
                      "rounded-lg border-2 px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      selectedWallpaper === idx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border/70",
                    )}
                  >
                    {wallpaper.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleDownload(WALLPAPERS[selectedWallpaper])}
                className="flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-3.5" aria-hidden />
                다운로드
              </button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="닫기"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </section>
  )
}
