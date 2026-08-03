import type { CalendarEntry } from "@/lib/scheduling-engine"

/**
 * 상단 여정 카드 히어로 이미지 — 실제 달력 월(1~12) 기준으로 매달 다른 이미지를 보여준다.
 * 시스템 날짜의 현재 월에 해당하는 /calendar/{2자리월}.jpeg를 반환한다.
 */

/**
 * 해당 day에 보여줄 이미지 경로를 반환한다.
 * day/calendar 파라미터는 함수 시그니처 호환성을 위해 유지되지만,
 * 실제로는 시스템의 현재 월(new Date().getMonth())을 사용해 경로를 결정한다.
 */
export function heroImageSrcForDay(calendar: CalendarEntry[], day: number): string {
  const month = new Date().getMonth() + 1 // 0-indexed → 1-indexed (1~12)
  const monthStr = String(month).padStart(2, "0") // "01" ~ "12"
  return `/calendar/${monthStr}.jpeg`
}
