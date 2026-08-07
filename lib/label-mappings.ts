import type { Concern, SupportId } from "@/lib/routine-copy"

/**
 * Concern → i18n locale key 매핑
 * 사용: const label = t(CONCERN_LABEL_KEYS[concern], locale)
 */
export const CONCERN_LABEL_KEYS: Record<Concern, string> = {
  dry: "onboarding.concernLabel.dry",
  flush: "onboarding.concernLabel.flush",
  flaky: "onboarding.concernLabel.flaky",
  trouble: "onboarding.concernLabel.trouble",
  none: "onboarding.concernLabel.none",
}

/**
 * SupportId → i18n locale key 매핑
 * 사용: const label = t(SUPPORT_LABEL_KEYS[supportId], locale)
 */
export const SUPPORT_LABEL_KEYS: Record<SupportId, string> = {
  hya: "onboarding.supportLabel.hya",
  cica: "onboarding.supportLabel.cica",
  nia: "onboarding.supportLabel.nia",
  cer: "onboarding.supportLabel.cer",
}

/**
 * Concern 배열 → 한글 라벨 배열 변환 (util)
 */
export function getConcernLabel(concern: Concern | null | undefined, locale: string): string | null {
  if (!concern) return null
  const key = CONCERN_LABEL_KEYS[concern]
  return key ? key : null
}

/**
 * SupportId 배열 → 한글 라벨 배열 변환 (util)
 */
export function getSupportLabels(supportIds: SupportId[], locale: string): string[] {
  return supportIds.map((id) => SUPPORT_LABEL_KEYS[id]).filter(Boolean)
}
