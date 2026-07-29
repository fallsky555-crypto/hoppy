import { Lock } from "lucide-react"

interface LockedStageProps {
  badge: string
  title: string
  description: string
  unlockNote: string
}

function LockedStage({ badge, title, description, unlockNote }: LockedStageProps) {
  return (
    <div className="flex gap-3 rounded-4xl border-[1.5px] border-[#D8D3C4] bg-card px-5 py-[18px]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent">
        <Lock className="size-[13px] text-[#5C5648]" aria-hidden />
      </span>
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5C5648]">{badge}</span>
        <h3 className="mt-0.5 font-display text-base font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4438]">{description}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{unlockNote}</p>
      </div>
    </div>
  )
}

/**
 * 2026-07-27 재설계: 피부타입(A/B/C)은 스케줄 생성에도, 다음 단계 프로그램
 * 분기에도 관여하지 않는다 — 전 유저가 동일한 워크북을 따르므로 미리보기도 하나다.
 */
export function LockedPreview() {
  return (
    <section aria-label="다음 단계 미리보기" className="space-y-2.5">
      <h2 className="px-0.5 text-[13px] font-semibold text-foreground">다음 단계 미리보기</h2>

      <LockedStage
        badge="2단계"
        title="미백 · 톤 케어"
        description="피부 결이 정돈되면, 미백과 톤 개선에 중점을 둔 다음 단계의 케어를 시작할 수 있어요."
        unlockNote="1단계를 꾸준히 마치면 미백 · 톤 케어가 열려요. 내 피부 속도에 맞춰 진행하시면 됩니다."
      />

      <LockedStage
        badge="3단계"
        title="탄력 재생 프로그램"
        description="장벽이 자리를 잡으면, 탄력을 돕는 재생 케어를 천천히 시작해 볼 수 있어요."
        unlockNote="2단계까지 마치면 탄력 재생 프로그램이 열려요. 서두르지 않아도 괜찮습니다."
      />
    </section>
  )
}
