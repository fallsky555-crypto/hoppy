"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { t, interpolate, type Locale } from "@/lib/i18n"
import { SKIN_TYPE_LABEL_KEYS, type SkinType } from "@/lib/label-mappings"
import { useDiary } from "@/lib/diary-context"

const SKIN_TYPES: SkinType[] = ["sensitive", "dry", "combo", "oily"]

/** 실제 비율 오버레이를 보여주기 시작하는 최소 기록 일수 */
const RADAR_MIN_LOGGED_DAYS = 7

/**
 * public/radar/*.svg 에셋과 동일한 좌표계 — center(350,225), 반지름 150 = 100%.
 * 축 순서는 SVG의 라벨 배치와 동일: 12시 방향(수분케어)에서 시계방향으로 60도씩
 * 각질케어(AHA) → 진정케어(세라마이드) → 비타민C → 레티놀 → 나이아신아마이드.
 */
const RADAR_CENTER = { x: 350, y: 225 }
const RADAR_MAX_RADIUS = 150
const RADAR_AXIS_TAGS = ["Hydration", "Exfoliation", "Defense/Barrier", "vitc", "ret", "nia"]

/** 30일 기준 항목별 이상적 사용 횟수 — 축마다 독립적인 분모이며 합이 100%일 필요는 없다 */
const RADAR_IDEAL_COUNTS: Record<string, number> = {
  ret: 10,
  vitc: 25,
  nia: 28,
  Hydration: 30,
  Exfoliation: 6,
  "Defense/Barrier": 10,
}

/** ratio는 0~1 — axisPoint 안에서 그대로 반지름(0~150)에 매핑한다 */
function axisPoint(index: number, ratio: number): { x: number; y: number } {
  const r = Math.max(0, Math.min(ratio, 1)) * RADAR_MAX_RADIUS
  const theta = (index * 60 * Math.PI) / 180
  return {
    x: RADAR_CENTER.x + r * Math.sin(theta),
    y: RADAR_CENTER.y - r * Math.cos(theta),
  }
}

/**
 * 전체 누적 loggedSlots에서 특정 tag가 몇 번 기록됐는지 — 레이더 오버레이와 30일 리포트
 * 4장 요약 카드가 함께 재사용하는 원시 카운트 로직.
 */
export function countLoggedSlotsByTag(
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>,
  tag: string
): number {
  return Object.values(loggedSlots).flat().filter((s) => s.tag === tag).length
}

/**
 * 전체 누적 loggedSlots 기준 6개 카테고리의 실제 사용 비율(0~1). 항목마다 RADAR_IDEAL_COUNTS의
 * 30일 기준 이상적 횟수를 각자 다른 분모로 써서 독립적으로 계산한다 — 실제 사용 횟수 /
 * 이상적 횟수, 1.0(100%) 초과 시 캡. 새 데이터 파이프라인 없이 기존 loggedSlots만 사용.
 */
function calculateActualRadarRatios(
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>
): number[] {
  return RADAR_AXIS_TAGS.map((tag) => {
    const count = countLoggedSlotsByTag(loggedSlots, tag)
    return Math.min(count / RADAR_IDEAL_COUNTS[tag], 1)
  })
}

interface SkinBalanceRadarProps {
  skinType: SkinType | string | null
  locale: Locale
  onChangeSkinType: (skinType: SkinType) => void
}

export function SkinBalanceRadar({ skinType, locale, onChangeSkinType }: SkinBalanceRadarProps) {
  const [selecting, setSelecting] = useState(false)
  const diary = useDiary()

  if (!skinType) return null

  const label = t(SKIN_TYPE_LABEL_KEYS[skinType as SkinType], locale)
  const headline = interpolate(t("skinBalanceRadar.headline", locale), { skinType: label })
  const imageSrc = locale === "en" ? `/radar/${skinType}-en.svg` : `/radar/${skinType}.svg`

  const hasEnoughData = (diary.loggedDays?.length ?? 0) >= RADAR_MIN_LOGGED_DAYS
  const actualPoints = hasEnoughData
    ? calculateActualRadarRatios(diary.loggedSlots)
        .map((ratio, i) => {
          const { x, y } = axisPoint(i, ratio)
          return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(" ")
    : null

  return (
    <div className="rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border">
      <p className="text-sm font-semibold leading-relaxed text-foreground">{headline}</p>

      <div className="relative mt-4 w-full">
        <img src={imageSrc} alt={label} className="w-full" />
        {actualPoints && (
          <svg viewBox="0 0 700 460" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <polygon
              points={actualPoints}
              fill="#2A2A2A"
              fillOpacity="0.16"
              stroke="#2A2A2A"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          </svg>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {t(hasEnoughData ? "skinBalanceRadar.actualLegend" : "skinBalanceRadar.promise", locale)}
      </p>

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
