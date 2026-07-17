import { Lock } from "lucide-react"

interface LockedStageProps {
  badge: string
  title: string
  description: string
  unlockNote: string
}

function LockedStage({ badge, title, description, unlockNote }: LockedStageProps) {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-card/70 p-5 ring-1 ring-border">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Lock className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{badge}</span>
          <h3 className="font-display text-base font-bold text-foreground/70">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <p className="mt-2 rounded-xl bg-secondary/70 px-3 py-2 text-[11px] font-medium leading-relaxed text-secondary-foreground">
            {unlockNote}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LockedPreview() {
  return (
    <section aria-label="다음 단계 미리보기" className="space-y-3">
      <h2 className="px-1 font-display text-base font-bold text-foreground">다음 단계 미리보기</h2>

      <LockedStage
        badge="🔒 2단계 · 중급자 코스"
        title="AHA/BHA 주 2회 적응 코스"
        description="장벽이 튼튼해지면 각질 관리 빈도를 한 단계 높여요."
        unlockNote="1단계 코스를 모두 완수하면 'AHA/BHA 주 2회 적응 코스'가 자동으로 열립니다!"
      />

      <LockedStage
        badge="🔒 3단계 · 숙련자 코스"
        title="레티놀 데일리 루틴 코스"
        description="탄탄해진 피부로 본격적인 재생·안티에이징 루틴에 도전해요."
        unlockNote="2단계까지 완주하면 나만의 데일리 레티놀 루틴이 열려요. 조금만 힘내요! 🐱"
      />
    </section>
  )
}
