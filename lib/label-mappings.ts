import type { Concern, SupportId } from "@/lib/routine-copy"

export type SkinType = "sensitive" | "dry" | "combo" | "oily"
export type Age = "teen" | "20s" | "30s" | "40s" | "50s" | "60s_plus"
export type Gender = "female" | "male" | "other" | "unspecified"

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
 * Age → i18n locale key 매핑
 * 사용: const label = t(AGE_LABEL_KEYS[age], locale)
 */
export const AGE_LABEL_KEYS: Record<Age, string> = {
  teen: "settings.ageLabel.teen",
  "20s": "settings.ageLabel.twenties",
  "30s": "settings.ageLabel.thirties",
  "40s": "settings.ageLabel.forties",
  "50s": "settings.ageLabel.fifties",
  "60s_plus": "settings.ageLabel.sixtyPlus",
}

/**
 * Gender → i18n locale key 매핑
 * 사용: const label = t(GENDER_LABEL_KEYS[gender], locale)
 */
export const GENDER_LABEL_KEYS: Record<Gender, string> = {
  female: "settings.genderLabel.female",
  male: "settings.genderLabel.male",
  other: "settings.genderLabel.other",
  unspecified: "settings.genderLabel.unspecified",
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

/**
 * Age → i18n locale key 반환 (util)
 */
export function getAgeLabel(age: Age | string | null | undefined): string | null {
  if (!age || !Object.keys(AGE_LABEL_KEYS).includes(age)) return null
  return AGE_LABEL_KEYS[age as Age]
}

/**
 * concernTags 원본 코드값(체커/온보딩 Q2 공용) → 단문용 짧은 라벨 i18n key.
 * CONCERN_LABEL_KEYS(단일어)와 별개로, "오늘 하신 케어, {concern}엔 어땠어요?" 같은
 * 문장에 자연스럽게 들어가도록 기존 복합어 라벨(예: "오돌토돌 결·모공")에서
 * 핵심 단어만 뽑은 축약형.
 */
export const CONCERN_TAG_SHORT_LABEL_KEYS: Record<string, string> = {
  DRY: "concernShortLabel.DRY",
  TONE: "concernShortLabel.TONE",
  TEXTURE: "concernShortLabel.TEXTURE",
  TROUBLE: "concernShortLabel.TROUBLE",
  AGING: "concernShortLabel.AGING",
  BARRIER: "concernShortLabel.BARRIER",
}

/**
 * concernTags (콤마 구분 문자열) → 첫 번째 태그의 단문용 짧은 라벨 i18n key 반환
 * 예: "TEXTURE,TROUBLE" → CONCERN_TAG_SHORT_LABEL_KEYS["TEXTURE"]
 */
export function getFirstConcernTagShortLabelKey(concernTags: string | null | undefined): string | null {
  if (!concernTags) return null
  const firstTag = concernTags.split(",")[0]?.trim()
  if (!firstTag) return null
  return CONCERN_TAG_SHORT_LABEL_KEYS[firstTag] ?? null
}

/**
 * concernTags (콤마 구분 문자열) → 첫 번째 태그의 i18n locale key 반환
 * 예: "DRY,TONE" → CONCERN_LABEL_KEYS["dry"]
 */
export function getFirstConcernTagLabel(concernTags: string | null | undefined): string | null {
  if (!concernTags) return null
  const tags = concernTags.split(",").map(t => t.trim())
  if (tags.length === 0) return null

  // API 케이스별 매핑: API는 대문자 (DRY, TONE 등), concern은 소문자 (dry, flush 등)
  const tagToConcern: Record<string, Concern> = {
    "DRY": "dry",
    "TONE": "flush",
    "TEXTURE": "flaky",
    "TROUBLE": "trouble",
    "AGING": "flush", // aging → flush로 매핑
    "BARRIER": "dry", // barrier → dry로 매핑
  }

  const firstTag = tags[0]
  const concern = tagToConcern[firstTag] as Concern | undefined
  return concern ? CONCERN_LABEL_KEYS[concern] : null
}
