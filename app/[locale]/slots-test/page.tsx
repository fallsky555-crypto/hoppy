"use client"

import { DailySlots } from "@/components/daily-slots"

export default function SlotsTestPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Daily Slots UI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            새로운 코랄 테마 디자인
          </p>
        </div>

        <DailySlots day={1} />
      </div>
    </main>
  )
}
