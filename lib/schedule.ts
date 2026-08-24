import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

export type RecipeType =
  // 액티브 (기능성 공격일)
  | "bha"
  | "retinol"
  // 6단계 서브 로테이션 (방어일) — 순서 고정: ①②③④⑤⑥
  | "defense_barrier"
  | "defense_toning"
  | "defense_hydration"
  | "barrier_lock"
  | "hydration_lock"
  | "toning_solo"
  // 인시던트/자극신고 전용 — 일반 로테이션에서는 배정되지 않는다
  | "sos_rest"

export interface Recipe {
  type: RecipeType
  emoji: string
  tag: string
  title: string
  guide: string
  caution?: string
  /** 바르는 순서 스텝 (2~4단계) */
  steps: string[]
  /** tailwind token base name used for tinting, e.g. "bha" -> bg-bha-soft / text-bha */
  color: RecipeType
}

export const RECIPES: Record<RecipeType, Recipe> = {
  bha: {
    type: "bha",
    color: "bha",
    emoji: "🧴",
    ...t("schedule.bha"),
  },
  retinol: {
    type: "retinol",
    color: "retinol",
    emoji: "🧪",
    ...t("schedule.retinol"),
  },
  defense_barrier: {
    type: "defense_barrier",
    color: "defense_barrier",
    emoji: "🛡️",
    ...t("schedule.defense_barrier"),
  },
  defense_toning: {
    type: "defense_toning",
    color: "defense_toning",
    emoji: "🌤️",
    ...t("schedule.defense_toning"),
  },
  defense_hydration: {
    type: "defense_hydration",
    color: "defense_hydration",
    emoji: "💧",
    ...t("schedule.defense_hydration"),
  },
  barrier_lock: {
    type: "barrier_lock",
    color: "barrier_lock",
    emoji: "🔐",
    ...t("schedule.barrier_lock"),
  },
  hydration_lock: {
    type: "hydration_lock",
    color: "hydration_lock",
    emoji: "💦",
    ...t("schedule.hydration_lock"),
  },
  toning_solo: {
    type: "toning_solo",
    color: "toning_solo",
    emoji: "🍊",
    ...t("schedule.toning_solo"),
  },
  sos_rest: {
    type: "sos_rest",
    color: "sos_rest",
    emoji: "🤍",
    ...t("schedule.sos_rest"),
  },
}

export function getRecipes(locale: Locale = "ko"): Record<RecipeType, Recipe> {
  return {
    bha: { type: "bha", color: "bha", emoji: "🧴", ...t("schedule.bha", locale) },
    retinol: { type: "retinol", color: "retinol", emoji: "🧪", ...t("schedule.retinol", locale) },
    defense_barrier: { type: "defense_barrier", color: "defense_barrier", emoji: "🛡️", ...t("schedule.defense_barrier", locale) },
    defense_toning: { type: "defense_toning", color: "defense_toning", emoji: "🌤️", ...t("schedule.defense_toning", locale) },
    defense_hydration: { type: "defense_hydration", color: "defense_hydration", emoji: "💧", ...t("schedule.defense_hydration", locale) },
    barrier_lock: { type: "barrier_lock", color: "barrier_lock", emoji: "🔐", ...t("schedule.barrier_lock", locale) },
    hydration_lock: { type: "hydration_lock", color: "hydration_lock", emoji: "💦", ...t("schedule.hydration_lock", locale) },
    toning_solo: { type: "toning_solo", color: "toning_solo", emoji: "🍊", ...t("schedule.toning_solo", locale) },
    sos_rest: { type: "sos_rest", color: "sos_rest", emoji: "🤍", ...t("schedule.sos_rest", locale) },
  }
}

export const TOTAL_DAYS = 30

/**
 * 슬라이더로 조정 가능한 액티브 도입 간격(일). 유저가 아무것도 건드리지 않으면
 * 둘 다 기본값(5)을 그대로 쓴다. 온보딩 설계에서 확정한 강제 범위는
 * [MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS] — generateCalendar()가 이 범위 밖 값을
 * 받으면 가까운 쪽 경계값으로 clamp한다(사용자에게 에러를 보여주지 않는다).
 */
export interface ScheduleSettings {
  /** 레티놀/바쿠치올 간격(일). 기본 5, 강제 범위 5~7 */
  activeIntervalDays?: number
  /** BHA 간격(일). 기본 5, 강제 범위 5~7 */
  bhaIntervalDays?: number
}

export const DEFAULT_ACTIVE_INTERVAL_DAYS = 5
export const DEFAULT_BHA_INTERVAL_DAYS = 5
export const MIN_INTERVAL_DAYS = 5
export const MAX_INTERVAL_DAYS = 7

/**
 * 가입일(Day 1) 기준으로 오늘이 며칠 차인지 계산 — 하한 1일 뿐, TOTAL_DAYS 상한 clamp는
 * 없다. 30일이 지나도 day가 31, 32...로 계속 늘어나야 loggedSlots가 day 30 슬롯에
 * 계속 덮어써지지 않고(무제한 로깅), 리포트도 30일 단위로 반복해서 새로 열린다.
 * "이번 사이클의 며칠째"가 필요하면 cycleDayFromElapsed()를 같이 쓴다.
 */
export function dayFromJoinDate(joinISO: string, now: Date = new Date()): number {
  const start = new Date(joinISO)
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((nowMid.getTime() - startMid.getTime()) / 86_400_000)
  return Math.max(diffDays + 1, 1)
}

/** 경과일(1, 2, ... 무제한)을 30일 사이클 내 상대 day(1~30)로 환산한다 */
export function cycleDayFromElapsed(elapsedDay: number): number {
  return ((elapsedDay - 1) % TOTAL_DAYS) + 1
}

/** 경과일이 몇 번째 30일 사이클인지(0-based: 첫 사이클이 0) */
export function cycleIndexFromElapsed(elapsedDay: number): number {
  return Math.floor((elapsedDay - 1) / TOTAL_DAYS)
}
