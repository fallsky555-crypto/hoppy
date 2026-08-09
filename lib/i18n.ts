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
  return key.split(".").reduce((obj: any, k) => obj?.[k], msg)
}

/**
 * {{name}} 같은 템플릿 변수 치환
 */
export function interpolate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)
}

/** 한글 문자열 마지막 글자의 받침 유무 (체커 checker-ko.html의 동명 함수 이식) */
export function hasBatchim(str: string): boolean {
  if (!str) return false
  const code = str.charCodeAt(str.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

/** 받침 유무에 따라 조사를 고른다. 예: josa("모공", "이", "가") */
export function josa(str: string, withBatchim: string, noBatchim: string): string {
  return hasBatchim(str) ? withBatchim : noBatchim
}
