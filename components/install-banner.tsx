"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallBanner() {
  const locale = useLocale()
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // 이미 설치된 상태 확인
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return
    }

    // dismissed 플래그 확인
    if (localStorage.getItem("install-banner-dismissed")) {
      return
    }

    // iOS 감지
    const userAgent = navigator.userAgent
    const isAppleDevice = /iPhone|iPad|iPod/.test(userAgent)
    setIsIos(isAppleDevice)

    if (isAppleDevice) {
      setShow(true)
    } else {
      // beforeinstallprompt 이벤트 처리
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShow(true)
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      // 설치 성공: 배너 영구 숨김
      localStorage.setItem("install-banner-dismissed", "true")
    }
    // outcome === "dismissed": 취소됨 — 배너만 일시 숨김, 다음 방문에 다시 표시

    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem("install-banner-dismissed", "true")
  }

  if (!show) return null

  return (
    <div className="rounded-3xl bg-secondary/30 p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">
            {t("installBanner.title", locale)}
          </h3>
          {isIos ? (
            <p className="text-xs text-muted-foreground">
              {t("installBanner.iosInstruction", locale)}
            </p>
          ) : (
            <button
              onClick={handleInstall}
              className={cn(
                "w-fit rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground",
                "transition-colors hover:bg-primary/90",
              )}
            >
              {t("installBanner.installButton", locale)}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="mt-0.5 flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t("installBanner.dismiss", locale)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
