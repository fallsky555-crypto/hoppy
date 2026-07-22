import { Lock } from "lucide-react"
import type { SkinType } from "@/lib/scheduling-engine"

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

/** 유형별 2단계 프로그램 이름·문구 — 단정적 표현("100% 개선" 등) 대신 완곡한 톤 유지 */
const STAGE_2_BY_TYPE: Record<"A" | "B" | "C", { title: string; description: string; unlockNote: string }> = {
  A: {
    title: "장벽 안정 케어",
    description: "장벽이 편안해지는 걸 느끼면, 자극 없는 선에서 결을 다듬는 케어를 조금씩 더해볼 수 있어요.",
    unlockNote: "1단계를 꾸준히 마치면 장벽 안정 케어가 열려요. 내 피부 속도에 맞춰 진행하시면 됩니다.",
  },
  B: {
    title: "광피부 프로그램",
    description: "장벽이 편안해지면, 결을 정돈하는 턴오버 케어를 조금씩 더해볼 수 있어요.",
    unlockNote: "1단계를 꾸준히 마치면 광피부 프로그램이 열려요. 내 피부 속도에 맞춰 진행하시면 됩니다.",
  },
  C: {
    title: "모공 타이트닝 프로그램",
    description: "피지·모공이 편해지면, 유수분 밸런스를 잡아주는 케어를 이어가 볼 수 있어요.",
    unlockNote: "1단계를 꾸준히 마치면 모공 타이트닝 프로그램이 열려요. 무리하지 않는 속도로 진행하시면 됩니다.",
  },
}

interface LockedPreviewProps {
  /** 진단이 아직 없으면 null — 이때는 유형에 치우치지 않은 기본 문구를 보여준다 */
  skinType: SkinType | null
}

export function LockedPreview({ skinType }: LockedPreviewProps) {
  const stage2 = STAGE_2_BY_TYPE[skinType ?? "A"]

  return (
    <section aria-label="다음 단계 미리보기" className="space-y-3">
      <h2 className="px-1 font-display text-base font-bold text-foreground">다음 단계 미리보기</h2>

      <LockedStage
        badge="2단계"
        title={stage2.title}
        description={stage2.description}
        unlockNote={stage2.unlockNote}
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
