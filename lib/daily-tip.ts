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
      "많은 분들이 성분을 하나씩 모으다가 정작 순서를 놓쳐요. 오늘부터 딱 하나만 기억하세요 — 수분(히알루론산)이 먼저입니다. 나머지는 이 위에 쌓는 거예요.",
    text_en:
      "A lot of people collect ingredients one by one and lose track of the order. Just remember one thing today — hydration (hyaluronic acid) comes first. Everything else builds on top of it.",
  },
  {
    day: 1,
    text_ko:
      "에센스 vs 세럼, 고객분들이 제일 많이 헷갈려 하는 조합이에요. 정답은 '둘 다 필요할 수도 있다'예요 — 역할이 달라서요. 에센스가 먼저 스며들어야 세럼이 일을 해요.",
    text_en:
      "Essence vs serum — the mix-up we hear most. The real answer: you might need both, since they do different jobs. Essence sinks in first so the serum can actually work.",
  },
  {
    day: 2,
    text_ko:
      "각질케어를 매일 하시나요? 사실 매일 하면 오히려 피부가 얇아져요. 주 2~3회가 적당해요 — '더'가 항상 좋은 건 아니에요.",
    text_en:
      "Doing exfoliation every day? That can actually thin your skin out. 2-3 times a week is plenty — more isn't always better.",
  },
  {
    day: 3,
    text_ko:
      "\"피부는 28일마다 새로 태어난다\"는 말 들어보셨죠? 사실 20대도 28~40일은 걸려요. 그러니 새 제품 효과, 최소 한 달은 기다려주세요 — 조급해하지 않아도 돼요.",
    text_en:
      "Heard that skin renews itself every 28 days? Even in your 20s, it's really 28-40 days. So give a new product at least a month before judging it — no need to rush.",
  },
  {
    day: 4,
    text_ko:
      "세라마이드, 이름은 어려워도 하는 일은 단순해요 — 벽돌처럼 피부장벽을 쌓아주는 것. 이게 튼튼해야 위에 뭘 발라도 소용이 있어요.",
    text_en:
      "Ceramide sounds complicated, but its job is simple — it's like a brick building up your skin barrier. That barrier needs to be solid for anything else you apply to actually work.",
  },
  {
    day: 5,
    text_ko:
      "레티놀, 궁금해하는 분 많으시죠. 처음부터 매일 쓰면 오히려 역효과예요. 주 1~2회로 시작해서, 피부가 적응하면 늘려가세요 — 조급함이 제일 큰 적이에요.",
    text_en:
      "Retinol — the one everyone asks about. Using it daily from day one usually backfires. Start with once or twice a week, and build up as your skin adjusts. Patience matters more than speed here.",
  },
  {
    day: 6,
    text_ko:
      "나이아신아마이드는 이 6가지 성분 중에 제일 '무난한 우등생'이에요. 진정도 되고 보습도 되고, 웬만하면 다 잘 맞아요. 뭘 써야 할지 모르겠으면 이것부터예요.",
    text_en:
      "Niacinamide is the reliable all-rounder of these six ingredients. It soothes, it hydrates, and it plays well with almost everything. If you're not sure where to start, start here.",
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
