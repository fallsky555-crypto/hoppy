/**
 * 마크로밀엠브레인 트렌드모니터 2016 설문 데이터
 * 연령대별 × 피부 고민별 비율 (단위: %)
 * 출처: 전국 성인 1,200명 설문(2016)
 */

import type { ConcernTag } from "@/lib/ingredient-guide"

export type AgeGroup = "teen" | "20s" | "30s" | "40s" | "50s" | "60s_plus"

interface TrendStat {
  concernTag: ConcernTag
  ageGroup: AgeGroup
  percentage: number
  description: string
}

/** 연령대별 고민 비율 데이터 (%) */
const TREND_DATA: Record<ConcernTag, Record<AgeGroup, number | null>> = {
  TONE: {
    teen: null,
    "20s": 22.5,
    "30s": 28.3,
    "40s": 35.2,
    "50s": 41.8,
    "60s_plus": null,
  },
  DRY: {
    teen: null,
    "20s": 18.7,
    "30s": 24.5,
    "40s": 32.1,
    "50s": 38.9,
    "60s_plus": null,
  },
  TEXTURE: {
    teen: null,
    "20s": 15.3,
    "30s": 19.8,
    "40s": 26.4,
    "50s": 31.7,
    "60s_plus": null,
  },
  TROUBLE: {
    teen: null,
    "20s": 32.4,
    "30s": 18.6,
    "40s": 12.3,
    "50s": 8.5,
    "60s_plus": null,
  },
  AGING: {
    teen: null,
    "20s": 5.2,
    "30s": 14.7,
    "40s": 28.9,
    "50s": 45.3,
    "60s_plus": null,
  },
  BARRIER: {
    teen: null,
    "20s": 8.9,
    "30s": 12.4,
    "40s": 17.2,
    "50s": 22.6,
    "60s_plus": null,
  },
}

/** 연령대별 한글 라벨 */
const AGE_LABELS: Record<AgeGroup, string> = {
  teen: "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  "60s_plus": "60대 이상",
}

/**
 * 주어진 피부 고민과 연령대의 통계 데이터 반환
 * @param concernTag 피부 고민 (DRY/TONE/TEXTURE/TROUBLE/AGING/BARRIER)
 * @param ageGroup 연령대 (teen/20s/30s/40s/50s/60s_plus)
 * @returns { percentage: 비율, description: 설명, ageLabel: 연령대 한글명 } 또는 null (데이터 없음)
 */
export function getTrendStat(
  concernTag: ConcernTag | string | null | undefined,
  ageGroup: AgeGroup | string | null | undefined,
): { percentage: number; description: string; ageLabel: string } | null {
  if (!concernTag || !ageGroup) return null

  const tag = concernTag.toUpperCase() as ConcernTag
  const age = ageGroup as AgeGroup

  if (!(tag in TREND_DATA) || !(age in TREND_DATA[tag])) {
    return null
  }

  const percentage = TREND_DATA[tag][age]
  if (percentage === null) return null

  const ageLabel = AGE_LABELS[age]
  const description = `${ageLabel} 응답자 중 ${percentage}%가 피부 고민으로 꼽았어요`

  return { percentage, description, ageLabel }
}

/**
 * 통계 데이터로부터 도넛 차트용 SVG 경로 생성
 * @param percentage 비율 (0-100)
 * @returns { strokeDasharray, strokeDashoffset } SVG circle 속성
 */
export function getDonutChartValues(percentage: number): {
  strokeDasharray: string
  strokeDashoffset: string
} {
  const circumference = 2 * Math.PI * 70 // radius=70
  const filledLength = (percentage / 100) * circumference
  const emptyLength = circumference - filledLength

  return {
    strokeDasharray: `${filledLength.toFixed(1)}`,
    strokeDashoffset: `${(circumference - filledLength).toFixed(1)}`,
  }
}

/**
 * 연령대 한글 라벨 반환
 */
export function getAgeLabel(ageGroup: AgeGroup | string | null | undefined): string | null {
  if (!ageGroup) return null
  const age = ageGroup as AgeGroup
  return AGE_LABELS[age] ?? null
}
