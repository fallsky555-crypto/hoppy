"use client"

import { InstallBanner } from "@/components/install-banner"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"

export default function ColorTestPage() {
  const locale = useLocale()

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("devTest.colorTestTitle", locale)}</h1>
          <p className="text-muted-foreground">Primary: #85B7EB, Foreground: #042C53</p>
        </div>

        {/* 1. InstallBanner */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">{t("devTest.section1", locale)}</h2>
          <div className="rounded-lg border border-border p-4 bg-card">
            <InstallBanner />
          </div>
        </div>

        {/* 2. RecipeCard 완료 버튼 */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">{t("devTest.section2", locale)}</h2>
          <div className="rounded-lg border border-border p-4 bg-card">
            <Button
              size="lg"
              className="h-auto w-full rounded-full bg-primary text-primary-foreground p-[14px] text-[14px] font-bold tracking-[0.01em]"
            >
              {t("devTest.recordComplete", locale)}
            </Button>
          </div>
        </div>

        {/* 3. 기본 Button variant */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">{t("devTest.section3", locale)}</h2>
          <div className="rounded-lg border border-border p-4 bg-card">
            <Button size="lg" className="w-full">
              {t("devTest.next", locale)}
            </Button>
          </div>
        </div>

        {/* 비교용: 추가 상태들 */}
        <div className="space-y-4 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground">{t("devTest.additionalVariants", locale)}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Outline</p>
              <Button variant="outline" size="lg" className="w-full">
                {t("devTest.outlineButton", locale)}
              </Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Secondary</p>
              <Button variant="secondary" size="lg" className="w-full">
                {t("devTest.secondaryButton", locale)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
