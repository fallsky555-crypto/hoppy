"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface SettingsPanelProps {
  onStartFresh: () => void
}

/**
 * 체커 재방문 흐름과 완전히 분리된, 유저가 직접 요청하는 명시적 초기화 버튼.
 * 실수로 누르는 걸 막기 위해 한 번 더 확인을 받는다.
 */
export function SettingsPanel({ onStartFresh }: SettingsPanelProps) {
  const locale = useLocale()
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    onStartFresh()
    setConfirming(false)
  }

  return (
    <section className="space-y-2.5 rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("settings.title", locale)}>
      <h2 className="text-[13px] font-semibold text-foreground">{t("settings.title", locale)}</h2>

      {confirming ? (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-destructive">
            {t("settings.restart_confirm", locale)}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="flex-1 rounded-full">
              {t("settings.cancel", locale)}
            </Button>
            <Button type="button" onClick={handleConfirm} className="flex-1 rounded-full">
              {t("settings.restart", locale)}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="w-full rounded-full text-xs font-bold"
        >
          {t("settings.restart_button", locale)}
        </Button>
      )}
    </section>
  )
}
