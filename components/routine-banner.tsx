"use client"

import { cn } from "@/lib/utils"
import type { RoutineCopy } from "@/lib/routine-copy"
import { PartyPopper, Sparkles, X } from "lucide-react"

interface RoutineBannerProps {
  copy: RoutineCopy
  tone?: "info" | "celebrate"
  onDismiss?: () => void
}

/** 주차 오리엔테이션 / 완주 화면처럼, 특정 날에만 뜨는 상단 배너 */
export function RoutineBanner({ copy, tone = "info", onDismiss }: RoutineBannerProps) {
  const isCelebrate = tone === "celebrate"

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-4xl px-[22px] py-5 ring-1",
        isCelebrate ? "bg-card ring-primary/40" : "bg-secondary ring-border",
      )}
      aria-label={isCelebrate ? "완주 안내" : "주차 오리엔테이션"}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            isCelebrate ? "bg-primary text-primary-foreground" : "bg-card text-primary",
          )}
        >
          {isCelebrate ? <PartyPopper className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-semibold text-foreground">{copy.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#6B6558]">{copy.detail}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="닫기"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/70"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </section>
  )
}
