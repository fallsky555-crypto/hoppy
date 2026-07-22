export type RecipeType =
  | "rest"
  | "aha"
  | "moist"
  | "retinol"
  | "bha"
  // v1.5 성분 로테이션(11번) — 방어일 3종 + SOS Rest. rest/moist는 미진단(기본 스케줄) 하위 호환용으로 유지한다
  | "defense_barrier"
  | "defense_toning"
  | "defense_hydration"
  | "sos_rest"

export interface Recipe {
  type: RecipeType
  emoji: string
  tag: string
  title: string
  guide: string
  caution?: string
  /** tailwind token base name used for tinting, e.g. "rest" -> bg-rest-soft / text-rest */
  color: RecipeType
}

export const RECIPES: Record<RecipeType, Recipe> = {
  rest: {
    type: "rest",
    color: "rest",
    emoji: "🌿",
    tag: "장벽 휴식",
    title: "장벽 휴식 데이",
    guide:
      "오늘은 아무것도 더하지 않아요. 순한 세안 후 평소 쓰던 수분 크림만 도톰하게 발라 장벽이 스스로 회복할 시간을 주세요.",
    caution: "각질 제거·기능성 성분은 오늘 쉬어갑니다. 자극 = 0 이 목표예요!",
  },
  aha: {
    type: "aha",
    color: "aha",
    emoji: "🧼",
    tag: "집중 케어",
    title: "AHA 집중 케어 데이",
    guide:
      "화장솜에 AHA 토너를 적셔 얼굴 결을 따라 가볍게 한 번만 정돈해 주세요. 사용 후에는 꼭 수분 크림으로 마무리!",
    caution: "피지 녹이고 모공 조이는 기능성 데이 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  moist: {
    type: "moist",
    color: "moist",
    emoji: "💦",
    tag: "수분팩",
    title: "수분팩 데이",
    guide:
      "세안 후 수분팩(혹은 마스크팩)을 10~15분 올려 속당김을 채워주세요. 팩을 뗀 뒤 남은 에센스는 가볍게 두드려 흡수시켜요.",
    caution: "20분 이상 방치하면 오히려 수분이 증발해요. 시간을 꼭 지켜주세요.",
  },
  retinol: {
    type: "retinol",
    color: "retinol",
    emoji: "🧪",
    tag: "집중 케어",
    title: "레티놀 집중 케어 데이",
    guide:
      "저녁 세안 후, 평소 쓰던 수분 크림에 레티놀을 딱 쌀알 반 만큼만 섞어서 발라주세요. 주 1회로 천천히 적응하는 단계예요.",
    caution: "피지 녹이고 모공 조이는 기능성 데이 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  bha: {
    type: "bha",
    color: "bha",
    emoji: "🧴",
    tag: "집중 케어",
    title: "BHA 집중 케어 데이",
    guide:
      "세안 후 BHA 토너를 화장솜에 적셔 T존과 모공이 두드러지는 부위 위주로 가볍게 닦아내듯 발라주세요. 이어서 유수분 밸런스를 잡아주는 수분 크림으로 마무리해요.",
    caution: "피지 녹이고 모공 조이는 기능성 데이 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  defense_barrier: {
    type: "defense_barrier",
    color: "defense_barrier",
    emoji: "🛡️",
    tag: "장벽 잠금",
    title: "장벽 잠금 데이",
    guide:
      "순한 세안 후 세라마이드와 시카(마데카소사이드) 성분이 담긴 크림을 평소보다 도톰하게 발라주세요. 피부 보호막이 스스로 회복할 시간을 만들어주는 날이에요.",
    caution: "세라마이드 크림으로 장벽 보호 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  defense_toning: {
    type: "defense_toning",
    color: "defense_toning",
    emoji: "🌤️",
    tag: "톤 정돈 케어",
    title: "톤 정돈 케어 데이",
    guide:
      "세안 후 비타민C와 나이아신아마이드 성분으로 톤과 유분 밸런스를 정돈해주세요. 마무리는 보습으로 가볍게 잡아주시면 돼요.",
    caution: "비타민C·나이아신아마이드로 톤 정돈 · 이 시기엔 이 성분 하나만 사용하세요.",
  },
  defense_hydration: {
    type: "defense_hydration",
    color: "defense_hydration",
    emoji: "💧",
    tag: "수분 충전",
    title: "수분 충전 데이",
    guide:
      "히알루론산과 세라마이드 성분으로 속수분을 채워주세요. 수분감이 있는 제품을 결 따라 가볍게 덧발라, 당김 없이 편안한 상태를 유지해주세요.",
    caution: "히알루론산 앰플만 · 이 시기엔 이 성분 하나만 사용하세요.",
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
 * 1단계(30일) 액티브 도입 스케줄 — Day 기준(1부터 시작)
 *
 * - Day 1~9 : 액티브 없음. 장벽 휴식 / 수분팩만 번갈아 진행
 * - Day 10~ : AHA 주 1회 도입  (Day 10, 17, 24)
 * - Day 15~ : 레티놀 주 1회 추가 (Day 15, 22, 29)
 *   → AHA와 레티놀은 항상 최소 2일 간격을 유지
 * - 그 외의 날 : 장벽 휴식 / 수분팩 (홀수일=휴식, 짝수일=수분팩)
 */
export const AHA_DAYS = [10, 17, 24]
export const RETINOL_DAYS = [15, 22, 29]

export function recipeForDay(day: number): Recipe {
  if (AHA_DAYS.includes(day)) return RECIPES.aha
  if (RETINOL_DAYS.includes(day)) return RECIPES.retinol
  // 액티브가 없는 날은 장벽 휴식과 수분팩을 번갈아 진행
  return day % 2 === 1 ? RECIPES.rest : RECIPES.moist
}

/** 가입일(Day 1) 기준으로 오늘이 며칠 차인지 계산 (1 ~ TOTAL_DAYS 로 clamp) */
export function dayFromJoinDate(joinISO: string, now: Date = new Date()): number {
  const start = new Date(joinISO)
  const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((nowMid.getTime() - startMid.getTime()) / 86_400_000)
  return Math.min(Math.max(diffDays + 1, 1), TOTAL_DAYS)
}
