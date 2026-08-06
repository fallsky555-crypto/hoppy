"use client"

import { useEffect, useState } from "react"
import { NotebookPen } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function BridgeInterstitial() {
  const locale = useLocale()
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // 'hoppy-bridge-seen' 플래그 확인
    if (localStorage.getItem("hoppy-bridge-seen")) {
      return
    }

    // 처음 진입일 때만 표시
    setShow(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("hoppy-bridge-seen", "true")
    setShow(false)
  }

  if (!mounted || !show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={cn(
          "w-full max-w-sm rounded-3xl p-8",
          "bg-secondary/80 backdrop-blur-sm",
          "flex flex-col items-center gap-6 text-center",
          "ring-1 ring-border shadow-lg",
        )}
      >
        {/* 아이콘 */}
        <div className="rounded-full bg-primary/10 p-4">
          <NotebookPen className="size-8 text-primary" strokeWidth={1.5} />
        </div>

        {/* 헤드카피 */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground whitespace-pre-line leading-snug">
            {t("bridgeInterstitial.head", locale)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("bridgeInterstitial.sub", locale)}
          </p>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleDismiss}
          className={cn(
            "w-full rounded-full bg-primary px-6 py-3",
            "text-sm font-semibold text-primary-foreground",
            "transition-colors hover:bg-primary/90 active:scale-95",
          )}
        >
          {t("bridgeInterstitial.button", locale)}
        </button>
      </div>
    </div>
  )
}
