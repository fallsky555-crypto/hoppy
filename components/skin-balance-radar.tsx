"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t, interpolate, type Locale } from "@/lib/i18n"
import { SKIN_TYPE_LABEL_KEYS, type SkinType } from "@/lib/label-mappings"

const SKIN_TYPES: SkinType[] = ["sensitive", "dry", "combo", "oily"]

interface SkinBalanceRadarProps {
  skinType: SkinType | string | null
  locale: Locale
  onChangeSkinType: (skinType: SkinType) => void
}

export function SkinBalanceRadar({ skinType, locale, onChangeSkinType }: SkinBalanceRadarProps) {
  const [selecting, setSelecting] = useState(false)

  if (!skinType) return null

  const label = t(SKIN_TYPE_LABEL_KEYS[skinType as SkinType], locale)
  const headline = interpolate(t("skinBalanceRadar.headline", locale), { skinType: label })
  const imageSrc = locale === "en" ? `/radar/${skinType}-en.svg` : `/radar/${skinType}.svg`

  return (
    <div className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border">
      <p className="text-sm font-semibold leading-relaxed text-foreground">{headline}</p>

      <img src={imageSrc} alt={label} className="mt-4 w-full" />

      <div className="mt-3 flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSelecting((v) => !v)}
          className="rounded-full text-xs font-bold"
        >
          {t("skinBalanceRadar.changeButton", locale)}
        </Button>
      </div>

      {selecting && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-foreground">{t("skinBalanceRadar.selectTitle", locale)}</p>
          <div className="grid grid-cols-2 gap-2">
            {SKIN_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant={type === skinType ? "default" : "outline"}
                onClick={() => {
                  onChangeSkinType(type)
                  setSelecting(false)
                }}
                className="rounded-full text-xs font-bold"
              >
                {t(SKIN_TYPE_LABEL_KEYS[type], locale)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
