"use client"

import { ProgressHeader } from "@/components/progress-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { RoutineBanner } from "@/components/routine-banner"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { getRecipes } from "@/lib/schedule"
import type { Recipe, RecipeType } from "@/lib/schedule"

const testRoutine: RecipeType = "defense_barrier"

function getTestRecipe(day: number): Recipe {
  return { type: testRoutine, isRest: false }
}

export default function ComponentsTestPage() {
  const locale = useLocale()
  const recipes = getRecipes(locale)
  const testRecipe = recipes[testRoutine]

  // 테스트 상태: 현재 day 1, 완료된 날은 1-3일, 조건은 1일=good, 2일=neutral, 3일=bad
  const currentDay = 1
  const totalDays = 30
  const completedDays = [1, 2, 3]
  const conditions = { 1: "good" as const, 2: "neutral" as const, 3: "bad" as const }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">컴포넌트 테스트</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          CSS 변수 검증: text-primary-text (#2A6E93), bg-today-accent (#4C9E7A)
        </p>
      </div>

      {/* ProgressHeader 테스트 */}
      <section className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">ProgressHeader</h2>
        <p className="text-xs text-muted-foreground">line 47: text-primary-text (남은 날수)</p>
        <ProgressHeader
          currentDay={currentDay}
          totalDays={totalDays}
          completedCount={completedDays.length}
          heroImageSrc="https://via.placeholder.com/400x160?text=Hero+Image"
        />
      </section>

      {/* CalendarGrid 테스트 */}
      <section className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">CalendarGrid</h2>
        <p className="text-xs text-muted-foreground">
          line 78: text-primary-text (오늘 숫자)
          <br />
          line 94: bg-today-accent (완료 배경 - condition=good)
        </p>
        <CalendarGrid
          totalDays={totalDays}
          currentDay={currentDay}
          selectedDay={currentDay}
          completedDays={completedDays}
          justStampedDay={1}
          onSelect={() => {}}
          getRecipe={getTestRecipe}
          conditions={conditions}
          joinDate={new Date().toISOString()}
        />
      </section>

      {/* RoutineBanner 테스트 */}
      <section className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">RoutineBanner</h2>
        <p className="text-xs text-muted-foreground">
          line 55, 76, 87: text-primary-text, text-primary-text-foreground
        </p>
        <RoutineBanner
          copy={{
            title: "주간 오리엔테이션",
            detail: "이번 주는 장벽 강화에 집중합니다.",
          }}
          tone="info"
        />
      </section>

      {/* Button 테스트 */}
      <section className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Button.tsx</h2>
        <p className="text-xs text-muted-foreground">line 11, 20: text-primary-text</p>
        <div className="space-y-3">
          <Button size="lg" className="w-full">
            Default Variant (text-primary-text)
          </Button>
          <Button variant="link" className="w-full">
            Link Variant (text-primary-text)
          </Button>
        </div>
      </section>

      <div className="rounded-lg border border-border bg-card p-4 text-xs text-foreground">
        <p className="font-semibold mb-2">테스트 데이터:</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• currentDay: {currentDay}</li>
          <li>• completedDays: {completedDays.join(", ")}</li>
          <li>• 조건: Day 1=good (초록), Day 2=neutral, Day 3=bad</li>
        </ul>
      </div>
    </main>
  )
}
