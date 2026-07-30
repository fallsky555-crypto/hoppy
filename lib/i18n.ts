import koMessages from "@/locales/ko.json"
import enMessages from "@/locales/en.json"

export type Locale = "ko" | "en"

const messages: Record<Locale, typeof koMessages> = {
  ko: koMessages,
  en: enMessages,
}

export function getMessages(locale: Locale = "ko") {
  return messages[locale]
}

/**
 * 중첩된 객체에서 점 표기법으로 값 조회
 * t("routine.defense_barrier.caution") → messages.routine.defense_barrier.caution
 */
export function t(key: string, locale: Locale = "ko"): any {
  const msg = getMessages(locale)
  return key.split(".").reduce((obj, k) => obj?.[k], msg)
}

/**
 * {{name}} 같은 템플릿 변수 치환
 */
export function interpolate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)
}
