"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface DailyCoverProps {
  locale: Locale
  onClose: () => void
}

export function DailyCover({ locale, onClose }: DailyCoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastShownDate = localStorage.getItem('hoppy-last-cover-shown-date')

    if (lastShownDate !== today) {
      setIsOpen(true)
      localStorage.setItem('hoppy-last-cover-shown-date', today)
    }
  }, [])

  if (!isOpen) return null

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden bg-cover bg-center flex flex-col justify-center items-center min-h-[600px] relative"
        style={{
          backgroundImage: 'url(/onboarding/bg-page1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center p-6">
          <img
            src="/onboarding/cover-cat-sleeping.png"
            alt=""
            className="h-48 w-48 object-contain"
          />

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {t("onboarding.startToday.subtitle", locale)}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("onboarding.startToday.title", locale)}
            </p>
          </div>

          <Button
            onClick={handleClose}
            size="lg"
            className="h-auto w-full rounded-full py-3 text-[15px] mt-4"
          >
            {t("common.today", locale)}
          </Button>
        </div>
      </div>
    </div>
  )
}
