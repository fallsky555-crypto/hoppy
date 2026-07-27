"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SettingsPanelProps {
  onStartFresh: () => void
}

/**
 * 체커 재방문 흐름과 완전히 분리된, 유저가 직접 요청하는 명시적 초기화 버튼.
 * 실수로 누르는 걸 막기 위해 한 번 더 확인을 받는다.
 */
export function SettingsPanel({ onStartFresh }: SettingsPanelProps) {
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    onStartFresh()
    setConfirming(false)
  }

  return (
    <section className="space-y-2.5 rounded-4xl bg-card px-5 py-6 ring-1 ring-border" aria-label="설정">
      <h2 className="text-[13px] font-semibold text-foreground">설정</h2>

      {confirming ? (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-destructive">
            새로 시작하면 지금까지 기록한 Day와 기록이 모두 사라져요. 정말 처음부터 다시 시작할까요?
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} className="flex-1 rounded-full">
              취소
            </Button>
            <Button type="button" onClick={handleConfirm} className="flex-1 rounded-full">
              새로 시작하기
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="w-full rounded-full text-xs font-bold"
        >
          루틴 처음부터 다시 시작하기
        </Button>
      )}
    </section>
  )
}
