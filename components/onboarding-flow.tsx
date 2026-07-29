"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MAX_INTERVAL_DAYS, MIN_INTERVAL_DAYS } from "@/lib/schedule"
import { normalizeInterval } from "@/lib/scheduling-engine"

interface OnboardingFlowProps {
  /** 4단계 "시작하기" — 최종 clamp된 간격(일)을 넘긴다. useDiary().completeOnboarding에 그대로 연결한다 */
  onComplete: (intervalDays: number) => void
}

type Step = 1 | 2 | 3

/** "잘 안 써요"는 사실상 무한대 간격으로 보고, MAX_INTERVAL_DAYS 초과 구간(3단계 코멘트 분기)에 태운다 */
const NEVER_USES_RAW_DAYS = 999

function commentFor(rawDays: number): string {
  if (rawDays < MIN_INTERVAL_DAYS) return "지금보다 여유 있게 시작하는 게 피부에 더 좋아요"
  if (rawDays > MAX_INTERVAL_DAYS) return "지금보다 조금 더 자주 챙겨야 30일 안에 변화를 체감하기 쉬워요"
  return "지금 루틴이랑 비슷하게 시작해요"
}

/**
 * 온보딩 1~4단계. 3(매핑+코멘트)과 4(시작하기)는 별도로 보여줄 새 정보가 없어서
 * 한 화면으로 합쳤다. 완료 전까지는 가입일(Day 1)이 아직 찍히지 않은 상태다 —
 * 실제 스탬프는 onComplete를 호출하는 useDiary().completeOnboarding에서 한다.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [inputValue, setInputValue] = useState("")
  const [neverUses, setNeverUses] = useState(false)
  const [rawDays, setRawDays] = useState<number | null>(null)

  const parsedValue = Number(inputValue)
  const canSubmitHabit = neverUses || (inputValue.trim() !== "" && Number.isFinite(parsedValue) && parsedValue > 0)

  function handleHabitNext() {
    setRawDays(neverUses ? NEVER_USES_RAW_DAYS : Math.round(parsedValue))
    setStep(3)
  }

  const clampedDays = rawDays === null ? MIN_INTERVAL_DAYS : normalizeInterval(rawDays, MIN_INTERVAL_DAYS)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      {step === 1 && (
        <section className="relative min-h-[420px] flex flex-col justify-center" aria-label="프로그램 소개">
          <div className="space-y-4 text-center">
            <img src="/onboarding/intro-01.jpeg" alt="" className="mx-auto h-28 w-28 rounded-full object-cover" />
            <h1 className="font-display text-xl font-bold leading-snug text-foreground">
              모공 케어는 피부 기초 체력을 만드는 단계예요
            </h1>
            <p className="text-[15px] leading-relaxed text-[#4A4438]">
              미백·톤 개선 같은 다음 프로그램은, 이 기초 단계를 완주해야 열려요.<br />
              완주하시면 스케줄표 위 세 그림(동백·붉은장미·작약) 중 하나를 바탕화면용 원본으로 드려요.
            </p>
            <Button type="button" size="lg" onClick={() => setStep(2)} className="h-auto w-full rounded-full py-3 text-[15px]">
              다음
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5" aria-label="현재 습관 체크">
          <h1 className="font-display text-lg font-bold leading-snug text-foreground">
            지금 스킨케어할 때, 스페셜케어(각질제거/레티놀 등)는 보통 며칠에 한 번 하시나요?
          </h1>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="예: 7"
                value={inputValue}
                disabled={neverUses}
                onChange={(event) => setInputValue(event.target.value)}
                className="w-full bg-transparent text-base font-semibold text-foreground outline-none disabled:opacity-40"
              />
              <span className="shrink-0 text-sm font-medium text-muted-foreground">일마다</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setNeverUses((prev) => !prev)
                setInputValue("")
              }}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                neverUses ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
              )}
              aria-pressed={neverUses}
            >
              스페셜케어는 잘 안 써요
            </button>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={!canSubmitHabit}
            onClick={handleHabitNext}
            className="h-auto w-full rounded-full py-3 text-[15px]"
          >
            다음
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5 text-center" aria-label="매핑 결과">
          <p className="text-sm font-medium text-muted-foreground">
            {neverUses ? "스페셜케어를 잘 안 쓰신다고 하셨으니," : `${rawDays}일마다 쓰신다고 하셨으니,`}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">{clampedDays}일마다 시작할게요</h1>
          <p className="text-[15px] leading-relaxed text-[#4A4438]">{commentFor(rawDays ?? MIN_INTERVAL_DAYS)}</p>

          <Button
            type="button"
            size="lg"
            onClick={() => onComplete(clampedDays)}
            className="h-auto w-full rounded-full py-3 text-[15px]"
          >
            시작하기
          </Button>
        </section>
      )}
    </main>
  )
}
