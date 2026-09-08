import type { Locale } from "@/lib/i18n"

/** 외부 피부 날씨 민감도 진단(체커) URL — 설정 화면의 "다시 진단하기" 링크 등에서 사용 */
export function getCheckerUrl(locale: Locale): string {
  return locale === "ko"
    ? "https://myroutinediet.com/checker.html"
    : "https://myroutinediet.com/checker-en.html"
}
