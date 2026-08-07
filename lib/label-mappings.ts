import type { Concern, SupportId } from "@/lib/routine-copy"

export type SkinType = "sensitive" | "dry" | "combo" | "oily"

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
 * SkinType → i18n locale key 매핑
 * 사용: const label = t(SKIN_TYPE_LABEL_KEYS[skinType], locale)
 */
export const SKIN_TYPE_LABEL_KEYS: Record<SkinType, string> = {
  sensitive: "settings.skinTypeLabel.sensitive",
  dry: "settings.skinTypeLabel.dry",
  combo: "settings.skinTypeLabel.combo",
  oily: "settings.skinTypeLabel.oily",
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

/**
 * SkinType → 라벨 변환 (util)
 */
export function getSkinTypeLabel(skinType: SkinType | string | null | undefined, locale: string): string | null {
  if (!skinType || !Object.keys(SKIN_TYPE_LABEL_KEYS).includes(skinType)) return null
  const key = SKIN_TYPE_LABEL_KEYS[skinType as SkinType]
  return key ? key : null
}
