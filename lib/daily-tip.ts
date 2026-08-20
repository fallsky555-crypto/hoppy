import { calculateConditionCorrelation, calculatePeriodicity, calculateUsagePattern } from "@/lib/report-analytics"

/** components/thirty-day-report.tsx의 SLOT_TAG_LABELS와 동일한 매핑 */
const TAG_LABELS: Record<string, Record<"ko" | "en", string>> = {
  "Exfoliation": { ko: "각질케어", en: "Exfoliation" },
  "Hydration": { ko: "수분케어", en: "Hydration" },
  "Active/Stimulate": { ko: "고민케어", en: "Concern Care" },
  "Defense/Barrier": { ko: "진정케어", en: "Soothing Care" },
  "Sun": { ko: "자외선차단", en: "Sun Care" },
}

const INGREDIENT_LABELS: Record<string, Record<"ko" | "en", string>> = {
  ret: { ko: "레티놀", en: "Retinol" },
  vit_c: { ko: "비타민C", en: "Vitamin C" },
  nia: { ko: "나이아신아마이드", en: "Niacinamide" },
}

function getCategoryLabel(category: string, locale: "ko" | "en"): string {
  return TAG_LABELS[category]?.[locale] ?? INGREDIENT_LABELS[category]?.[locale] ?? category
}

/** 수분케어 → 각질케어 → 진정케어 → 레티놀 → 비타민C → 나이아신아마이드 순 */
const WEEKLY_BALANCE_PRIORITY = ["Hydration", "Exfoliation", "Defense/Barrier", "ret", "vit_c", "nia"]

function pickFirstMissingByPriority(missingCategories: string[]): string {
  for (const category of WEEKLY_BALANCE_PRIORITY) {
    if (missingCategories.includes(category)) return category
  }
  return missingCategories[0]
}

export interface Stage0Tip {
  day: number
  text_ko: string
  text_en: string
}

export function getDailyTipStage(loggedDaysCount: number): 0 | 1 | 2 | 3 {
  if (loggedDaysCount <= 6) return 0
  if (loggedDaysCount <= 13) return 1
  if (loggedDaysCount <= 20) return 2
  return 3
}

export const STAGE0_CONTENT: Stage0Tip[] = [
  {
    day: 0,
    text_ko:
      "에센스 vs 세럼, 고객분들이 제일 많이 헷갈려 하는 조합이에요. 정답은 '둘 다 필요할 수도 있다'예요 — 역할이 달라서요. 에센스가 먼저 스며들어야 세럼이 일을 해요.",
    text_en:
      "Essence vs serum — the mix-up we hear most. The real answer: you might need both, since they do different jobs. Essence sinks in first so the serum can actually work.",
  },
  {
    day: 1,
    text_ko:
      "\"피부는 28일마다 새로 태어난다\"는 말 들어보셨죠? 사실 20대도 28~40일은 걸려요. 그러니 새 제품 효과, 최소 한 달은 기다려주세요 — 조급해하지 않아도 돼요.",
    text_en:
      "Heard that skin renews itself every 28 days? Even in your 20s, it's really 28-40 days. So give a new product at least a month before judging it — no need to rush.",
  },
  {
    day: 2,
    text_ko:
      "제품 하나 바르고 바로 다음 거 바르지 마세요. 30초~1분만 기다려주면 흡수될 시간을 주는 거예요 — 급하게 겹치면 밀리기만 하고 제대로 안 스며들어요.",
    text_en:
      "Don't layer the next product on right away. Waiting 30 seconds to a minute gives it time to actually absorb — rush it and you're just pilling product instead of letting it sink in.",
  },
  {
    day: 3,
    text_ko:
      "순서 헷갈리시죠? 묽은 것부터 두꺼운 것 순이에요 — 스킨 같은 묽은 것 먼저, 크림처럼 걸쭉한 건 마지막에. 반대로 하면 뒤에 바른 게 앞의 걸 막아버려요.",
    text_en:
      "Mixed up on the order? Thinnest to thickest — watery toners first, thick creams last. Do it backwards and the heavier product just blocks the lighter one from getting in.",
  },
  {
    day: 4,
    text_ko:
      "새 제품 쓰실 때 얼굴 전체에 바로 바르지 마세요. 팔 안쪽에 이틀 정도 발라보고 반응 없으면 그때 얼굴에 쓰세요 — 이게 자극 반응을 미리 걸러내는 제일 확실한 방법이에요.",
    text_en:
      "Don't put a new product all over your face right away. Patch test on your inner arm for a couple of days first, and only move to your face once there's no reaction — it's the most reliable way to catch irritation early.",
  },
  {
    day: 5,
    text_ko:
      "레티놀이랑 비타민C, 각질케어까지 한 밤에 다 몰아넣지 마세요. 활성 성분은 하나씩 밤을 나눠서 쓰는 게 자극도 적고 결과적으로 오래 써요.",
    text_en:
      "Don't stack retinol, vitamin C, and exfoliation into one night. Spreading active ingredients across different nights means less irritation — and you'll actually keep using them longer.",
  },
  {
    day: 6,
    text_ko:
      "문지르지 말고 두드려 발라주세요. 특히 눈가나 얇은 부위는 문지르면 자극만 늘고 흡수는 딱히 안 좋아져요.",
    text_en:
      "Pat it in, don't rub. Around the eyes and other thin areas especially, rubbing just adds irritation without actually improving absorption.",
  },
  {
    day: 7,
    text_ko:
      "자외선차단제, 동전 크기만큼은 바르셔야 해요. 그보다 적게 바르면 표시된 SPF의 절반도 안 나와요.",
    text_en:
      "Use a coin-sized amount of sunscreen. Any less and you're getting under half the SPF listed on the bottle.",
  },
  {
    day: 8,
    text_ko:
      "베개커버, 생각보다 자주 안 바꾸시죠? 일주일에 한 번은 바꿔주세요 — 자는 동안 얼굴이 계속 닿는 부분이라 트러블이랑 은근 관련 있어요.",
    text_en:
      "Pillowcases don't get changed as often as you'd think. Swap yours out once a week — it's in contact with your face all night, and it's more tied to breakouts than people realize.",
  },
  {
    day: 9,
    text_ko:
      "뚜껑 열고 6개월~1년 지난 제품, 특히 비타민C나 레티놀 계열은 효과가 확 떨어져 있을 수 있어요. 향이나 색이 변했으면 그건 버리셔도 돼요.",
    text_en:
      "Products open for 6 months to a year — vitamin C and retinol especially — can lose a lot of their effectiveness. If the scent or color has changed, it's fine to just toss it.",
  },
  {
    day: 10,
    text_ko:
      "손 씻고 시작하세요. 별거 아닌 것 같아도, 하루종일 만진 손으로 얼굴 만지면 그게 트러블의 절반이에요.",
    text_en:
      "Wash your hands before you start. It sounds minor, but touching your face with hands that have been everywhere all day is behind more breakouts than you'd expect.",
  },
  {
    day: 11,
    text_ko:
      "히알루론산은 마른 피부에 바르면 오히려 건조해져요. 세안 직후 물기가 살짝 남은 상태에서 발라야 수분을 제대로 붙잡아요.",
    text_en:
      "Hyaluronic acid on dry skin can actually backfire and dry you out more. Apply it right after cleansing, while your skin's still a little damp, so it has moisture to actually hold onto.",
  },
  {
    day: 12,
    text_ko:
      "목이랑 손, 얼굴 바를 때 같이 챙기세요. 얼굴만 관리하고 목은 그대로 두면 나중에 티가 확 나요.",
    text_en:
      "Bring your neck and hands along when you do your face. Take care of just your face and skip the neck, and the difference shows up later.",
  },
  {
    day: 13,
    text_ko:
      "세안 브러쉬나 퍼프, 주기적으로 씻어주세요. 안 씻은 도구가 세균 번식시켜서 트러블 원인이 되는 경우, 생각보다 많아요.",
    text_en:
      "Wash your cleansing brush or puff regularly. An unwashed tool breeding bacteria is behind more breakouts than people expect.",
  },
  {
    day: 14,
    text_ko:
      "운동하고 나서 땀 난 얼굴, 바로 씻어주세요. 땀이 오래 얼굴에 남아있으면 모공 막히는 지름길이에요.",
    text_en:
      "Wash your face right after you sweat from exercise. Sweat sitting on your skin too long is a fast track to clogged pores.",
  },
  {
    day: 15,
    text_ko:
      "실내에 있어도 창가 자리면 자외선차단 다시 챙기세요. 유리도 자외선을 다 막아주진 않아요.",
    text_en:
      "Even indoors, reapply sunscreen if you're near a window. Glass doesn't block all UV rays.",
  },
  {
    day: 16,
    text_ko:
      "마사지할 때 아래에서 위로 쓸어올리세요. 중력 반대 방향으로 발라야 처짐 방지에 도움이 돼요.",
    text_en:
      "When you massage product in, sweep upward from the bottom. Working against gravity helps fight sagging.",
  },
  {
    day: 17,
    text_ko:
      "화장솜으로 토너 쓸 때 너무 세게 문지르지 마세요. 자극만 주고 흡수엔 도움 안 돼요, 손으로 가볍게 두드리는 게 나아요.",
    text_en:
      "Don't scrub too hard with a cotton pad when applying toner. It just irritates without helping absorption — a light pat with your hands works better.",
  },
]

export function getStage1Tip(
  todaySlots: { slot: string; tag: string }[],
  todayActiveIngredient: string | null,
  locale: "ko" | "en"
): string | null {
  if (todayActiveIngredient === "ret") {
    return locale === "ko"
      ? "오늘은 레티놀을 기록하셨네요. 6가지 중에 제일 예민한 친구라 처음엔 주 1~2회로 시작하시라고 했던 거, 기억하시죠? 잘 지키고 계세요."
      : "You logged retinol today. It's the most sensitive of the six, so we said to start with once or twice a week — remember? You're doing great sticking to that."
  }
  if (todayActiveIngredient === "vit_c") {
    return locale === "ko"
      ? "오늘 비타민C 기록하셨네요. 톤 정돈이랑 항산화, 비타민C가 6가지 균형에서 맡는 역할이에요."
      : "You logged vitamin C today. Tone brightening and antioxidant protection — that's the role vitamin C plays in the balance of six."
  }
  if (todayActiveIngredient === "nia") {
    return locale === "ko"
      ? "나이아신아마이드 챙기셨네요. 6가지 중 제일 무난한 우등생이라고 말씀드렸었죠 — 믿고 계속 쓰셔도 돼요."
      : "You kept up with niacinamide. We said it's the most reliable all-rounder of the six — you can keep trusting it."
  }

  const slotTags = todaySlots.map((s) => s.tag)

  if (slotTags.includes("Hydration")) {
    return locale === "ko"
      ? "수분케어 기록하셨네요. 첫날 말씀드렸던 원칙, 수분이 먼저라는 거 오늘도 지키셨어요."
      : "You logged hydration today. The rule from day one — hydration comes first — you kept it again today."
  }
  if (slotTags.includes("Exfoliation")) {
    return locale === "ko"
      ? "각질케어 기록하셨네요. 매일 안 하는 게 맞다고 했던 거 기억하시면, 오늘 타이밍이 딱 좋아요."
      : "You logged exfoliation today. If you remember we said not to do it every day, today's timing is just right."
  }
  if (slotTags.includes("Defense/Barrier")) {
    return locale === "ko"
      ? "진정케어 기록하셨네요. 세라마이드 벽돌 얘기, 오늘도 하나 쌓으셨어요."
      : "You logged soothing/barrier care today. Remember the ceramide brick analogy? You laid down another one today."
  }

  return null
}

export function getStage2Tip(
  recentLoggedSlots: Record<number, { slot: string; tag: string }[]>,
  recentConditions: Record<number, "good" | "neutral" | "bad">,
  concernLabel: string | null,
  locale: "ko" | "en"
): string {
  const flatSlots = Object.values(recentLoggedSlots).flat()
  const pattern = calculateUsagePattern(flatSlots)

  let topDeviationTag = pattern[0]
  let topDeviation = topDeviationTag.percentage - topDeviationTag.recommendedPercentage
  for (const p of pattern) {
    const deviation = p.percentage - p.recommendedPercentage
    if (Math.abs(deviation) > Math.abs(topDeviation)) {
      topDeviation = deviation
      topDeviationTag = p
    }
  }

  if (Math.abs(topDeviation) < 15) {
    let topCountTag = pattern[0]
    for (const p of pattern) {
      if (p.count > topCountTag.count) {
        topCountTag = p
      }
    }

    const label = TAG_LABELS[topCountTag.tag]?.[locale] ?? topCountTag.tag
    return locale === "ko"
      ? `이번 주는 ${label} 위주로 기록하셨어요.`
      : `This week you mostly logged ${label}.`
  }

  const correlations = calculateConditionCorrelation(recentLoggedSlots, recentConditions)
  const correlation = correlations.find((c) => c.tag === topDeviationTag.tag)
  const badPercentage = correlation?.badPercentage ?? 0
  const label = TAG_LABELS[topDeviationTag.tag]?.[locale] ?? topDeviationTag.tag

  if (badPercentage >= 40) {
    if (topDeviation < 0) {
      return locale === "ko"
        ? concernLabel
          ? `${label} 기록이 적었던 주엔 ${concernLabel} 컨디션이 안 좋다는 응답이 더 많았어요.`
          : `${label} 기록이 적었던 주엔 컨디션이 안 좋다는 응답이 더 많았어요.`
        : concernLabel
          ? `In weeks you logged less ${label}, "not great" condition check-ins for ${concernLabel} were more common.`
          : `In weeks you logged less ${label}, "not great" condition check-ins were more common.`
    }
    return locale === "ko"
      ? concernLabel
        ? `${label}를 많이 쓴 주엔 ${concernLabel} 컨디션이 안 좋다는 응답이 더 많았어요.`
        : `${label}를 많이 쓴 주엔 컨디션이 안 좋다는 응답이 더 많았어요.`
      : concernLabel
        ? `In weeks you used a lot of ${label}, "not great" condition check-ins for ${concernLabel} were more common.`
        : `In weeks you used a lot of ${label}, "not great" condition check-ins were more common.`
  }

  if (topDeviation < 0) {
    return locale === "ko"
      ? `이번 주는 ${label} 기록이 평소보다 적었어요.`
      : `This week you logged less ${label} than usual.`
  }
  return locale === "ko"
    ? `이번 주는 ${label} 기록이 평소보다 많았어요.`
    : `This week you logged more ${label} than usual.`
}

export function getStage3Tip(loggedDays: number[], locale: "ko" | "en"): string {
  const { gaps, average, variance } = calculatePeriodicity(loggedDays)

  if (gaps.length === 0) {
    return locale === "ko"
      ? "아직 간격을 볼 만큼 기록이 쌓이진 않았어요."
      : "There isn't enough logged yet to see a pattern in your gaps."
  }

  // TODO: variance 기준값 2가 적절한지 실제 데이터로 검토 필요
  const isRegular = variance < 2

  if (isRegular) {
    return locale === "ko"
      ? `최근엔 ${average}일 간격으로 꾸준히 기록하고 계세요.`
      : `You've been logging steadily, about every ${average} days lately.`
  }

  // 불규칙할 땐 average를 언급하지 않는다 — 평균 숫자가 오히려 오해를 줄 수 있음
  return locale === "ko"
    ? "최근 기록 간격이 들쭉날쭉해요."
    : "Your recent logging gaps have been pretty uneven."
}

/**
 * recentLoggedSlots/recentActiveIngredients는 호출부에서 이미 "최근 7일" 또는
 * "최근 14일" 범위로 걸러서 넘겨준다는 전제 — 이 함수는 필터링하지 않고 받은 데이터를 그대로 쓴다.
 */
export function checkWeeklyBalance(
  recentLoggedSlots: Record<number, { slot: string; tag: string }[]>,
  recentActiveIngredients: string[],
  loggedDaysCount: number
): { missingCategories: string[]; isFirstWarning: boolean } | null {
  if (loggedDaysCount !== 7 && loggedDaysCount !== 14) return null

  const recentTags = Object.values(recentLoggedSlots)
    .flat()
    .map((s) => s.tag)

  const categoryPresence: Record<string, boolean> = {
    ret: recentActiveIngredients.includes("ret"),
    vit_c: recentActiveIngredients.includes("vit_c"),
    nia: recentActiveIngredients.includes("nia"),
    Hydration: recentTags.includes("Hydration"),
    Exfoliation: recentTags.includes("Exfoliation"),
    "Defense/Barrier": recentTags.includes("Defense/Barrier"),
  }

  const missingCategories = Object.entries(categoryPresence)
    .filter(([, present]) => !present)
    .map(([category]) => category)

  return {
    missingCategories,
    isFirstWarning: loggedDaysCount === 7,
  }
}

export function getWeeklyBalanceTip(
  result: { missingCategories: string[]; isFirstWarning: boolean },
  locale: "ko" | "en"
): string {
  const { missingCategories, isFirstWarning } = result
  const weekCount = isFirstWarning ? 1 : 2

  if (missingCategories.length === 0) {
    return locale === "ko"
      ? `${weekCount}주 동안 6가지 다 챙기셨어요. 이 정도면 균형 잡힌 거예요.`
      : `You've covered all six for ${weekCount} week${weekCount > 1 ? "s" : ""} straight. That's a solid balance.`
  }

  if (missingCategories.length === 1) {
    const label = getCategoryLabel(missingCategories[0], locale)
    if (isFirstWarning) {
      return locale === "ko"
        ? `6가지 중에 ${label}만 이번 주엔 한 번도 안 나왔어요. 다음 주엔 이 자리도 한 번 챙겨보세요.`
        : `Out of the six, only ${label} didn't show up this week. Try to make room for it next week.`
    }
    return locale === "ko"
      ? `2주째 ${label}가 안 보여요. 계속 이렇게 가면 6가지 균형에서 이 부분만 계속 비어있게 돼요 — 이번엔 한번 넣어보세요.`
      : `${label} hasn't shown up for two weeks now. Keep going like this and it'll stay the one gap in your balance — try fitting it in this time.`
  }

  const firstLabel = getCategoryLabel(pickFirstMissingByPriority(missingCategories), locale)
  if (isFirstWarning) {
    return locale === "ko"
      ? `몇 가지가 비어있어요. 그 중에서도 ${firstLabel}부터 챙겨보세요 — 나머지 성분들이 자리 잡으려면 이게 먼저거든요.`
      : `A few categories are missing. Start with ${firstLabel} — the rest fall into place once this one's covered.`
  }
  return locale === "ko"
    ? `2주째 몇 가지가 비어있어요. ${firstLabel}부터 다시 챙겨보세요.`
    : `A few categories have been missing for two weeks. Start again with ${firstLabel}.`
}
