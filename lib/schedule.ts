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
  /** tailwind token base name used for tinting, e.g. "bha" -> bg-bha-soft / text-bha */
  color: RecipeType
}

export const RECIPES: Record<RecipeType, Recipe> = {
  bha: {
    type: "bha",
    color: "bha",
    emoji: "🧴",
    tag: "집중 케어",
    title: "BHA 집중 케어 데이",
    guide:
      "세안 후 BHA 토너를 화장솜에 적셔 T존과 모공이 두드러지는 부위 위주로 가볍게 닦아내듯 발라주세요. 이어서 유수분 밸런스를 잡아주는 수분 크림으로 마무리해요.",
    caution: "모공 속 피지·블랙헤드를 유동화하는 기능성 데이 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  retinol: {
    type: "retinol",
    color: "retinol",
    emoji: "🧪",
    tag: "집중 케어",
    title: "레티놀 집중 케어 데이",
    guide:
      "저녁 세안 후, 평소 쓰던 수분 크림에 레티놀(또는 바쿠치올)을 딱 쌀알 반 만큼만 섞어서 발라주세요. 천천히 적응하는 단계예요.",
    caution: "세로모공 탄력을 돕는 기능성 데이 · 이 시기엔 이 성분 하나만 사용하세요. 내일은 장벽·수분 위주로 쉬어가는 날이에요.",
  },
  defense_barrier: {
    type: "defense_barrier",
    color: "defense_barrier",
    emoji: "🛡️",
    tag: "장벽 잠금",
    title: "장벽 잠금 데이",
    guide:
      "순한 세안 후 세라마이드와 시카(마데카소사이드) 성분이 담긴 크림을 평소보다 도톰하게 발라주세요. 피부 보호막이 스스로 회복할 시간을 만들어주는 날이에요.",
    caution: "세라마이드+시카 크림으로 장벽 보호 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  defense_toning: {
    type: "defense_toning",
    color: "defense_toning",
    emoji: "🌤️",
    tag: "톤 정돈 케어",
    title: "톤 정돈 케어 데이",
    guide:
      "세안 후 비타민C와 나이아신아마이드 성분으로 톤과 유분 밸런스를 정돈해주세요. 마무리는 보습으로 가볍게 잡아주시면 돼요.",
    caution: "비타민C+나이아신아마이드로 톤 정돈 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  defense_hydration: {
    type: "defense_hydration",
    color: "defense_hydration",
    emoji: "💧",
    tag: "수분 충전",
    title: "수분 충전 데이",
    guide:
      "히알루론산 성분으로 속수분을 채워주세요. 수분감이 있는 제품을 결 따라 가볍게 덧발라, 당김 없이 편안한 상태를 유지해주세요.",
    caution: "히알루론산으로 속수분 채우기 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  barrier_lock: {
    type: "barrier_lock",
    color: "barrier_lock",
    emoji: "🔐",
    tag: "장벽 밀폐",
    title: "장벽 밀폐 데이",
    guide:
      "세라마이드 성분만 단독으로, 평소보다 조금 더 도톰하게 발라주세요. 다른 기능성 제품 없이 보호막을 다지는 데만 집중하는 날이에요.",
    caution: "세라마이드 단독 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  hydration_lock: {
    type: "hydration_lock",
    color: "hydration_lock",
    emoji: "💦",
    tag: "수분 잠금",
    title: "수분 잠금 데이",
    guide:
      "히알루론산으로 속수분을 채운 뒤, 세라마이드 크림으로 그 위를 덮어 수분이 날아가지 않도록 눌러주세요.",
    caution: "히알루론산+세라마이드 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  toning_solo: {
    type: "toning_solo",
    color: "toning_solo",
    emoji: "🍊",
    tag: "비타민C 케어",
    title: "비타민C 케어 데이",
    guide:
      "비타민C 성분만 단독으로 세안 후 결을 따라 가볍게 발라 톤을 정돈해주세요. 마무리는 보습으로 편안하게 잡아주세요.",
    caution: "비타민C 단독 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  sos_rest: {
    type: "sos_rest",
    color: "sos_rest",
    emoji: "🤍",
    tag: "SOS 진정",
    title: "SOS 진정 데이",
    guide:
      "오늘은 시카(마데카소사이드) 성분만 단독으로 사용해 피부를 쉬게 해주세요. 다른 기능성 제품은 잠시 쉬어가고, 순한 진정에만 집중하는 날이에요.",
    caution: "시카·어성초로 열감·자극 리셋 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
}

export const TOTAL_DAYS = 30

/**
 * 슬라이더로 조정 가능한 액티브 도입 간격(일). 유저가 아무것도 건드리지 않으면
 * 둘 다 워크북 기본값(7)을 그대로 쓴다.
 */
export interface ScheduleSettings {
  /** 레티놀/바쿠치올 간격(일). 기본 7, 권장 범위 5~10 */
  activeIntervalDays?: number
  /** BHA 간격(일). 기본 7, 권장 범위 5~10 */
  bhaIntervalDays?: number
}

export const DEFAULT_ACTIVE_INTERVAL_DAYS = 7
export const DEFAULT_BHA_INTERVAL_DAYS = 7

/** 가입일(Day 1) 기준으로 오늘이 며칠 차인지 계산 (1 ~ TOTAL_DAYS 로 clamp) */
export function dayFromJoinDate(joinISO: string, now: Date = new Date()): number {
  const start = new Date(joinISO)
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((nowMid.getTime() - startMid.getTime()) / 86_400_000)
  return Math.min(Math.max(diffDays + 1, 1), TOTAL_DAYS)
}
