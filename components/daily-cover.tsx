"use client"

import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface DailyCoverProps {
  locale: Locale
  onClose: () => void
}

/**
 * 앱 진입 커버 — 이름 입력·하트 버튼 없이, '상자 속 호빵이' 이미지 +
 * 감성 세리프 카피 + 단일 진입 버튼으로 단순화했다.
 */
export function DailyCover({ locale, onClose }: DailyCoverProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#FAF9F6] p-5">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <img
          src="/onboarding/intro-02.jpeg"
          alt=""
          className="aspect-square w-full max-w-[300px] rounded-3xl object-cover shadow-sm"
        />

        <h1 className="whitespace-pre-line font-display text-[1.6rem] font-medium leading-relaxed text-[#2E2A26]">
          {t("dailyCover.title", locale)}
        </h1>

        <button
          type="button"
          onClick={onClose}
          className="w-full max-w-[300px] rounded-2xl bg-[#DCE8D2] py-4 text-[15px] font-bold text-[#244234] shadow-sm transition-all hover:opacity-90"
        >
          {t("dailyCover.enterCta", locale)}
        </button>
      </div>
    </div>
  )
}
