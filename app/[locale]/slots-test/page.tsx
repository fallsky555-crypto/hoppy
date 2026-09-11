"use client"

import { DailySlots } from "@/components/daily-slots"
import { t } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

export default function SlotsTestPage() {
  const locale = useLocale()
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Daily Slots UI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("devTest.slotsSubtitle", locale)}
          </p>
        </div>

        <DailySlots day={1} />
      </div>
    </main>
  )
}
