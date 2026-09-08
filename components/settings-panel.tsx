"use client"

import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { getCheckerUrl } from "@/lib/checker"

/**
 * 날씨 확인 앱에는 '루틴 리셋' 개념이 없어 초기화 버튼은 두지 않는다.
 * 남는 기능은 체커(피부 날씨 민감도 진단)로 다시 다녀오는 링크 하나.
 */
export function SettingsPanel() {
  const locale = useLocale()

  return (
    <section className="space-y-3 rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label={t("settings.title", locale)}>
      <h2 className="text-[13px] font-semibold text-foreground">{t("settings.title", locale)}</h2>

      <div className="pt-2 border-t border-border">
        <a
          href={getCheckerUrl(locale)}
          className="flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
        >
          {t("settings.reviewReportButton", locale)}
        </a>
      </div>
    </section>
  )
}
