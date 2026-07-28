import type { Recipe, RecipeType } from "@/lib/schedule"

/**
 * 2026-07-27 재설계 스펙 반영. 카테고리별로 4개씩 확정된 "리추얼 헤드라인"을 day
 * 기준으로 순환 노출하고, 그 아래에 실제 사용법을 안내하는 detail을 붙인다.
 * lib/scheduling-engine.ts는 건드리지 않는다 — 이 파일은 화면에 보여줄 문구만
 * 담당하고, 어떤 카테고리·날짜인지는 기존 엔진(getRecipeForDay, dayFromJoinDate
 * 등)이 그대로 정한다.
 *
 * 카피 톤 방향: 은유·역설 구조 대신 "지금 뭘 하는지 + 왜 필요한지"를 담백하게
 * 말해주는 격려형. 관념어(균형/완벽함/리듬) 대신 몸으로 느껴지는 말(당김/촉촉함/
 * 편안함) 사용. 명령형("~하세요") 대신 "~하고 있어요/해줘요" 톤 유지. 과장 표현
 * 금지, 브랜드/제품명 대신 성분 카테고리명만 사용, "건강검진 리포트" 톤 유지.
 */

export interface RoutineCopy {
  title: string
  detail: string
}

/** 체커의 오늘 피부 상태(symptom) 문항에서 넘어오는 관심사 */
export type Concern = "dry" | "flush" | "flaky" | "trouble" | "none"
/** 유저가 이미 갖고 있다고 답한 성분 id (콤마 구분 URL 파라미터) */
export type SupportId = "hya" | "cica" | "nia" | "cer"

interface ConcernIngredient {
  supportId: SupportId
  /** 문장에 그대로 들어가는 성분 표기명 */
  name: string
  /** "{효과}해주세요" / "{효과}에 도움을 줄 수 있어요" 양쪽에 공통으로 쓰이는 명사형 효능 */
  effect: string
}

const CONCERN_INGREDIENT: Record<Exclude<Concern, "none">, ConcernIngredient> = {
  dry: { supportId: "hya", name: "히알루론산", effect: "보습" },
  flush: { supportId: "cica", name: "시카", effect: "진정" },
  flaky: { supportId: "cer", name: "세라마이드", effect: "결 정돈" },
  trouble: { supportId: "nia", name: "나이아신아마이드", effect: "트러블 진정" },
}

/** 한글 완성형 음절의 받침 유무에 따라 "으로/로" 조사를 고른다 (로마자 등은 받침 없는 것으로 취급) */
function withOro(name: string): string {
  const lastChar = name.at(-1) ?? ""
  const code = lastChar.charCodeAt(0)
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${name}${hasBatchim ? "으로" : "로"}`
}

/**
 * 방어/락 계열 문구 뒤에 이어 붙일 concern 맞춤 한 문장.
 * concern이 "none"이면 강조하지 않고 null(기존 기본 문구 그대로).
 * support_owned에 해당 성분이 있으면 "갖고 계신 성분으로" 소유 언급, 없으면 완곡한 제안.
 */
function getConcernAddendum(concern: Concern, supportOwned: SupportId[]): string | null {
  if (concern === "none") return null
  const ingredient = CONCERN_INGREDIENT[concern]
  const owned = supportOwned.includes(ingredient.supportId)
  return owned
    ? `오늘은 갖고 계신 ${withOro(ingredient.name)} ${ingredient.effect}해주세요.`
    : `오늘 같은 날엔 ${ingredient.name} 성분이 ${ingredient.effect}에 도움을 줄 수 있어요.`
}

/** 헤드라인을 순환시킬 그룹 단위 — RecipeType보다 성긴 7종 */
type HeadlineGroup = "barrier_lock" | "hydration_lock" | "active_open" | "defense_barrier" | "toning" | "defense_hydration" | "sos_rest"

function headlineGroup(category: RecipeType): HeadlineGroup {
  switch (category) {
    case "bha":
    case "retinol":
      return "active_open"
    case "barrier_lock":
      return "barrier_lock"
    case "hydration_lock":
      return "hydration_lock"
    case "defense_barrier":
      return "defense_barrier"
    case "defense_toning":
    case "toning_solo":
      return "toning"
    case "defense_hydration":
      return "defense_hydration"
    case "sos_rest":
      return "sos_rest"
  }
}

/** 카테고리 그룹별 리추얼 헤드라인 4종. day 기준으로 순환 노출한다 */
const HEADLINES: Record<HeadlineGroup, readonly [string, string, string, string]> = {
  barrier_lock: [
    "오늘은 쉬어가는 날이에요",
    "아무것도 안 해도, 피부는 스스로 회복하고 있어요",
    "매일 안 해도 괜찮아요, 쉬는 것도 루틴이에요",
    "오늘 하루 비워두면, 내일 더 잘 받아들여요",
  ],
  hydration_lock: [
    "지금 촉촉하게 채우는 중이에요",
    "마른 피부에 물을 주는 시간이에요",
    "10분만 있으면 확 달라져요",
    "오늘은 흠뻑 적셔주는 날이에요",
  ],
  active_open: [
    "오늘부터 천천히 시작해봐요",
    "처음이라 서툴러도 괜찮아요, 익숙해질 거예요",
    "조금씩 늘려가면 돼요, 서두르지 않아도 돼요",
    "오늘 한 방울이, 한 달 뒤 달라진 피부를 만들어요",
  ],
  defense_barrier: [
    "오늘은 지키는 게 우선이에요",
    "자극받은 피부, 오늘은 편안하게만 해줘요",
    "든든하게 막아주는 날이에요",
    "무리한 케어보다, 오늘은 보호가 먼저예요",
  ],
  toning: [
    "오늘은 결을 다듬는 날이에요",
    "조금씩, 매일 정돈해가는 중이에요",
    "급하게 안 해도 돼요, 꾸준히가 답이에요",
    "오늘도 한 걸음 더 맑아지고 있어요",
  ],
  defense_hydration: [
    "오늘 유독 당긴다면, 더 채워줘요",
    "수분 충전 중이에요",
    "목마른 피부엔 한 겹 더 얹어줘요",
    "채워야 할 땐, 채워도 괜찮아요",
  ],
  sos_rest: [
    "오늘은 진정이 먼저예요",
    "예민해진 피부, 잠깐 쉬어가요",
    "무리하지 않아도 돼요, 오늘은 최소한만",
    "힘든 날엔, 최소한의 케어로도 충분해요",
  ],
}

function pickHeadline(category: RecipeType, day: number): string {
  const variants = HEADLINES[headlineGroup(category)]
  const index = ((day - 1) % variants.length + variants.length) % variants.length
  return variants[index]
}

/** ACTIVE_OPEN 문구의 "가이드에 지정된 활성 성분 제품" 자리에 들어갈 실제 성분 이름 */
const ACTIVE_LABEL: Record<"bha" | "retinol", string> = {
  bha: "BHA",
  retinol: "레티놀",
}

/** 방어/락 6종의 사용법 안내 detail — concern 강조가 적용되는 카테고리만 withConcernAddendum을 거친다 */
const DETAIL: Record<
  "defense_barrier" | "defense_toning" | "defense_hydration" | "barrier_lock" | "hydration_lock" | "toning_solo",
  string
> = {
  defense_barrier:
    "세라마이드와 시카(마데카소사이드) 성분으로 피부 보호막을 다지는 날이에요. 순한 세안 후 진정 성분이 담긴 크림을 평소보다 넉넉히 발라, 피부가 스스로 회복할 시간을 만들어주세요.",
  defense_toning:
    "비타민C와 나이아신아마이드로 톤과 유분 밸런스를 정돈하는 날이에요. 세안 후 토너로 결을 가볍게 다듬고, 마무리는 보습으로 잡아주세요.",
  defense_hydration:
    "히알루론산으로 속수분을 채우는 날이에요. 수분감이 있는 제품을 결 따라 가볍게 덧발라, 당김 없이 편안한 상태를 유지해주세요.",
  barrier_lock:
    "세라마이드 성분만 단독으로, 평소보다 조금 더 도톰하게 얹어주세요. 외부 자극을 물리적으로 막아주고, 장벽이 편안해질 시간을 만들어주는 과정이에요.",
  hydration_lock:
    "자극이 없는 토너나 앰플로 속수분을 채운 뒤, 세라마이드 크림을 가볍게 펴 발라 채워진 수분이 날아가지 않도록 잡아주는 단계예요.",
  toning_solo:
    "비타민C 성분만 단독으로 세안 후 결을 따라 가볍게 발라주세요. 다른 기능성 제품과 섞이지 않도록 오늘은 이 성분에만 집중해주세요.",
}

/** concern 강조 없이 항상 고정 문구만 노출하는 카테고리 — SOS Rest는 응급 진정 목적이라 그날의 관심사 강조를 붙이지 않는다 */
const SOS_REST_DETAIL =
  "오늘은 시카(마데카소사이드) 성분만 단독으로 사용해 피부를 쉬게 하는 날이에요. 다른 기능성 제품은 잠시 쉬어가고, 순한 진정 케어에만 집중해주세요."

/**
 * day(또는 보고 있는 날)의 카테고리에 맞는 루틴 문구. title은 헤드라인 순환,
 * detail은 실제 사용법 안내다. 방어/락 6종에는 concern/supportOwned에 맞춘 문장을
 * 이어 붙인다. sos_rest와 bha/retinol(ACTIVE_OPEN)은 concern과 무관하다.
 */
export function getCategoryCopy(category: RecipeType, day: number, concern: Concern = "none", supportOwned: SupportId[] = []): RoutineCopy {
  const title = pickHeadline(category, day)

  if (category === "sos_rest") {
    return { title, detail: SOS_REST_DETAIL }
  }

  if (category === "bha" || category === "retinol") {
    const name = ACTIVE_LABEL[category]
    return {
      title,
      detail: `오늘 밤에는 ${name} 제품을 딱 한 방울만 루틴에 추가합니다. 다른 기능성 제품과 섞이지 않도록 단독으로 사용해주세요.`,
    }
  }

  return withConcernAddendum({ title, detail: DETAIL[category] }, concern, supportOwned)
}

function withConcernAddendum(base: RoutineCopy, concern: Concern, supportOwned: SupportId[]): RoutineCopy {
  const addendum = getConcernAddendum(concern, supportOwned)
  return addendum ? { ...base, detail: `${base.detail} ${addendum}` } : base
}

/** 오리엔테이션 배너는 방어/락 계열 ↔ 액티브 계열을 오갈 때만 보여준다. SOS Rest는 응급 상황이라 대상 아님 */
type OrientationGroup = "DEFENSE" | "ACTIVE"

function orientationGroup(category: RecipeType): OrientationGroup | null {
  if (category === "bha" || category === "retinol") return "ACTIVE"
  if (category === "sos_rest") return null
  return "DEFENSE"
}

const GROUP_WEEKLY_GUIDE: Record<OrientationGroup, RoutineCopy> = {
  DEFENSE: {
    title: "반갑습니다, 당신의 피부 아군입니다.",
    detail: "이번 코스에서는 화장대에 있는 진정·보습 성분을 활용해 장벽의 기초 체력을 다지는 데 집중합니다.",
  },
  ACTIVE: {
    title: "장벽의 기초 체력이 다져졌어요.",
    detail:
      "이제 쌓여있는 각질과 피지를 정돈할 타이밍입니다. 성분 충돌을 막기 위해 BHA·레티놀은 정해진 간격으로, 안전 구역 안에서만 번갈아 시작해요.",
  },
}

/**
 * day % 7 === 1 (Day 1/8/15/22/29...)에 호출한다. 오늘 카테고리가 속한 그룹이
 * 이전 주차 체크포인트(Day 1/8/15/22...)에서는 한 번도 나온 적 없는, 이번이 "처음
 * 시작"하는 그룹일 때만 오리엔테이션 문구를 반환한다. 이미 어느 체크포인트에선가
 * 보여준 적 있는 그룹이거나 SOS Rest면 null을 반환한다.
 */
export function getOrientationCopy(getRecipeForDay: (day: number) => Recipe, day: number): RoutineCopy | null {
  const group = orientationGroup(getRecipeForDay(day).type)
  if (!group) return null

  for (let past = day - 7; past >= 1; past -= 7) {
    if (orientationGroup(getRecipeForDay(past).type) === group) return null
  }
  return GROUP_WEEKLY_GUIDE[group]
}

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number): RoutineCopy {
  return {
    title: "장벽 리셋 코스를 완주했어요",
    detail: `${totalDays}일간의 기록을 기반으로 장벽 점수 변화를 정리했어요. 꾸준히 함께해주셔서 감사해요. 다음 단계로 이어가고 싶다면 아래에서 확인해보세요.`,
  }
}
