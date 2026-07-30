"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

interface LockedStageProps {
  badge: string
  title: string
  description: string
  unlockNote: string
  buttonLabel?: string
}

function LockedStage({ badge, title, description, unlockNote, buttonLabel }: LockedStageProps) {
  return (
    <div className="flex gap-3 rounded-4xl border-[1.5px] border-[#D8D3C4] bg-card px-5 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent">
        <Lock className="size-[13px] text-[#5C5648]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5C5648]">{badge}</span>
        <h3 className="mt-0.5 font-display text-base font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4438]">{description}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{unlockNote}</p>
        {buttonLabel && (
          <Button disabled className="mt-3 w-full rounded-full" size="sm">
            {buttonLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * 2026-07-27 재설계: 피부타입(A/B/C)은 스케줄 생성에도, 다음 단계 프로그램
 * 분기에도 관여하지 않는다 — 전 유저가 동일한 워크북을 따르므로 미리보기도 하나다.
 */
export function LockedPreview() {
  const locale = useLocale()
  return (
    <section aria-label={t("lockedPreview.title", locale)} className="space-y-2.5">
      <h2 className="px-0.5 text-[13px] font-semibold text-foreground">{t("lockedPreview.title", locale)}</h2>

      <LockedStage
        badge={t("lockedPreview.stage2", locale)}
        title={t("lockedPreview.stage2_title", locale)}
        description={t("lockedPreview.stage2_desc", locale)}
        unlockNote={t("lockedPreview.stage2_unlock", locale)}
        buttonLabel="Unlock Full Access"
      />

      <LockedStage
        badge={t("lockedPreview.stage3", locale)}
        title={t("lockedPreview.stage3_title", locale)}
        description={t("lockedPreview.stage3_desc", locale)}
        unlockNote={t("lockedPreview.stage3_unlock", locale)}
        buttonLabel="Premium Care Module"
      />
    </section>
  )
}
