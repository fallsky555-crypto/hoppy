import type { CalendarEntry } from "@/lib/scheduling-engine"

/**
 * 상단 여정 카드 히어로 이미지 로테이션 — 7일 고정 주기로 교체된다.
 * Day 1-7: cycle 0, Day 8-14: cycle 1, ... 식으로 진행.
 * 30일 코스에서는 cycle 0~4(총 5개) 또는 최대 cycle 0~5(6개)가 나타난다.
 *
 * 이미지 자산은 아직 연결하지 않는다 — 이 파일은 "몇 번째 사이클인지 → 이미지
 * 배열의 몇 번째 인덱스를 쓸지"만 계산한다. 실제 파일 경로는 다음 단계에서
 * TOTAL_HERO_IMAGES 크기의 배열을 채우면 된다.
 */

/**
 * 1단계(무료체험)에서 순서대로 쓰는 이미지 장수.
 * 7일 주기 기준 30일 코스에서 나올 수 있는 최대 사이클 수(5-6개)와 맞춘다.
 */
export const TIER_1_HERO_IMAGE_SLOTS = 6

/** 전체 이미지 풀 크기. TIER_1_HERO_IMAGE_SLOTS 이후(나머지 14장)는 2단계(유료) 설계 때 이어서 쓴다 */
export const TOTAL_HERO_IMAGES = 20

/**
 * 7일 고정 주기 기준으로 사이클 인덱스를 구한다.
 * Day 1-7은 cycle 0, Day 8-14는 cycle 1, ... 식으로 계산된다.
 */
export function heroCycleIndexForDay(calendar: CalendarEntry[], day: number): number {
  return Math.floor((day - 1) / 7)
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
