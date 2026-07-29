import type { CalendarEntry } from "@/lib/scheduling-engine"

/**
 * 상단 여정 카드 히어로 이미지 로테이션 — "스페셜케어 사이클" 단위로 교체된다.
 * 사이클 경계는 BHA가 새로 들어가는 날만 기준으로 한다(레티놀은 로테이션과 무관).
 * bhaIntervalDays 슬라이더(5~7일)가 그대로 이미지 교체 주기가 된다.
 *
 * 이미지 자산은 아직 연결하지 않는다 — 이 파일은 "몇 번째 사이클인지 → 이미지
 * 배열의 몇 번째 인덱스를 쓸지"만 계산한다. 실제 파일 경로는 다음 단계에서
 * TOTAL_HERO_IMAGES 크기의 배열을 채우면 된다.
 */

/**
 * 1단계(무료체험)에서 순서대로 쓰는 이미지 장수. MIN_INTERVAL_DAYS(5) 기준
 * 30일 코스에서 나올 수 있는 최대 사이클 수(6)와 같다 — bhaIntervalDays가
 * 5~7 범위로 clamp되므로 실제 사이클 수는 항상 5~6이다.
 */
export const TIER_1_HERO_IMAGE_SLOTS = 6

/** 전체 이미지 풀 크기. TIER_1_HERO_IMAGE_SLOTS 이후(나머지 14장)는 2단계(유료) 설계 때 이어서 쓴다 */
export const TOTAL_HERO_IMAGES = 20

/**
 * day 시점까지 BHA가 몇 번째로 들어갔는지를 0부터 세어 사이클 인덱스를 구한다.
 * BHA 첫 등장일(캘린더 생성 규칙상 항상 Day 1)부터 그 다음 BHA 등장일 전날까지가
 * 한 사이클이다. 인시던트/자극지연으로 날짜가 밀린 캘린더를 넘겨도, entry.day를
 * 그대로 기준 삼기 때문에 별도 보정 없이 정확하다.
 *
 * 아직 BHA가 한 번도 없는 날(이론상 발생하지 않음 — Day 1은 항상 BHA)엔 0을
 * 반환해 방어적으로 안전한 기본값을 준다.
 */
export function heroCycleIndexForDay(calendar: CalendarEntry[], day: number): number {
  const bhaDaysAtOrBefore = calendar.filter((entry) => entry.category === "bha" && entry.day <= day).length
  return Math.max(bhaDaysAtOrBefore - 1, 0)
}

/**
 * 사이클 인덱스를 실제 이미지 배열 인덱스로 매핑한다. 순서대로 배정하되(랜덤 아님),
 * TIER_1_HERO_IMAGE_SLOTS를 넘어가는 사이클이 생기면(향후 간격 설정이 더 좁아지는
 * 등의 변경에 대비) 처음(0번)부터 다시 순환해, 2단계용 예비 이미지를 침범하지
 * 않는다.
 */
export function heroImageIndexForDay(calendar: CalendarEntry[], day: number): number {
  const cycleIndex = heroCycleIndexForDay(calendar, day)
  return cycleIndex % TIER_1_HERO_IMAGE_SLOTS
}

/**
 * index → 실제 이미지 경로. 0~5(TIER_1_HERO_IMAGE_SLOTS)가 1단계에서 실제로 쓰이고,
 * 6~19는 2단계 설계 때 채워 넣을 예비 슬롯이다.
 */
export const HERO_IMAGES: readonly string[] = [
  "/hero/hero-01.jpeg",
  "/hero/hero-02.jpeg",
  "/hero/hero-03.jpeg",
  "/hero/hero-04.jpeg",
  "/hero/hero-05.jpeg",
  "/hero/hero-06.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
  "/hero/hero-01.jpeg",
]

/** heroImageIndexForDay + HERO_IMAGES를 합쳐, 해당 day에 보여줄 이미지 경로를 바로 반환한다 */
export function heroImageSrcForDay(calendar: CalendarEntry[], day: number): string {
  return HERO_IMAGES[heroImageIndexForDay(calendar, day)]
}
