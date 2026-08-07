"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { CONCERN_LABEL_KEYS, SUPPORT_LABEL_KEYS, SKIN_TYPE_LABEL_KEYS } from "@/lib/label-mappings"

interface SettingsPanelProps {
  onStartFresh: () => void
}

/**
 * 체커 재방문 흐름과 완전히 분리된, 유저가 직접 요청하는 명시적 초기화 버튼.
 * 실수로 누르는 걸 막기 위해 한 번 더 확인을 받는다.
 */
export function SettingsPanel({ onStartFresh }: SettingsPanelProps) {
  const locale = useLocale()
  const diary = useDiary()
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    onStartFresh()
    setConfirming(false)
  }

  return (
    <section className="space-y-3 rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("settings.title", locale)}>
      <h2 className="text-[13px] font-semibold text-foreground">{t("settings.title", locale)}</h2>

      {/* 내 정보 다시보기 섹션 */}
      <div className="space-y-2.5 text-xs text-foreground/80">
        <div className="pt-2 border-t border-border">
          <p className="font-semibold text-foreground mb-2">내 정보 다시보기</p>
          <div className="space-y-1.5 text-[12px]">
            <p>
              <span className="font-medium">관심사:</span>{" "}
              {diary.concern && diary.concern !== "none"
                ? t(CONCERN_LABEL_KEYS[diary.concern], locale)
                : "미설정"}
            </p>
            <p>
              <span className="font-medium">보유 성분:</span>{" "}
              {diary.supportOwned && diary.supportOwned.length > 0
                ? diary.supportOwned
                    .map((id) => t(SUPPORT_LABEL_KEYS[id], locale))
                    .join(", ")
                : "미설정"}
            </p>
            <p>
              <span className="font-medium">고민케어:</span>{" "}
              {diary.activeIngredients && diary.activeIngredients.length > 0
                ? diary.activeIngredients.join(", ")
                : "미설정"}
            </p>
            <p>
              <span className="font-medium">사용 제품:</span>{" "}
              {diary.usedProducts && diary.usedProducts.length > 0
                ? diary.usedProducts
                    .map((p) => `${p.brand} ${p.name}`)
                    .join("; ")
                : "미설정"}
            </p>
            <p>
              <span className="font-medium">피부 타입:</span>{" "}
              {diary.skinType && SKIN_TYPE_LABEL_KEYS[diary.skinType as keyof typeof SKIN_TYPE_LABEL_KEYS]
                ? t(SKIN_TYPE_LABEL_KEYS[diary.skinType as keyof typeof SKIN_TYPE_LABEL_KEYS], locale)
                : "미설정"}
            </p>
          </div>
        </div>
      </div>

      {/* 루틴 초기화 섹션 */}
      <div className="pt-2 border-t border-border">
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
      </div>
    </section>
  )
}
