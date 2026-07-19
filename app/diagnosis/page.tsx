"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { SkinType } from "@/lib/scheduling-engine"

/** 9-1. strong.length(선택된 강한 액티브 개수)에 대응하는 체크리스트 */
const ACTIVE_OPTIONS = [
  { id: "aha", label: "AHA (글라이콜릭산·락틱산 등)" },
  { id: "bha", label: "BHA (살리실산)" },
  { id: "retinol", label: "레티놀 · 레티노이드" },
  { id: "vitaminC", label: "고농도 비타민C" },
  { id: "bpo", label: "벤조일퍼옥사이드" },
  { id: "tonerPad", label: "각질 토너패드" },
] as const

/** 9-1. dry/flush/flaky/trouble → 자극 보고, bad → Tier X(의료 상담) */
const SYMPTOM_OPTIONS = [
  { id: "dry", label: "건조하고 당겨요" },
  { id: "flush", label: "화끈거리거나 붉어요" },
  { id: "flaky", label: "각질이 일어나요" },
  { id: "trouble", label: "트러블이 났어요" },
  { id: "bad", label: "진물이 나거나 통증이 심해요" },
] as const

const SKIN_TYPES: { type: SkinType; title: string; description: string }[] = [
  { type: "A", title: "A. 장벽 붕괴형", description: "자극에 민감하고 예민한 편이에요" },
  { type: "B", title: "B. 턴오버 정체형", description: "각질이 쌓이고 칙칙한 편이에요" },
  { type: "C", title: "C. 피지·모공 정체형", description: "유분·모공 트러블이 고민이에요" },
]

export default function DiagnosisPage() {
  const router = useRouter()
  const [actives, setActives] = useState<Set<string>>(new Set())
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set())
  const [skinType, setSkinType] = useState<SkinType | null>(null)
  const [pregnant, setPregnant] = useState(false)
  const [prescriptionMeds, setPrescriptionMeds] = useState(false)

  function toggle(setSet: Dispatch<SetStateAction<Set<string>>>, id: string) {
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (!skinType) return
    const isSerious = symptoms.has("bad")
    const irritationReported = !isSerious && symptoms.size > 0

    // 9-4. URL 파라미터 규격 그대로 사용 — "/" 의 useDiary()가 이미 이 형식을 읽어 캘린더를 만든다
    const params = new URLSearchParams()
    params.set("overlap", String(actives.size))
    params.set("irritation", String(irritationReported))
    params.set("type", skinType)
    if (isSerious) params.set("symptom", "bad")
    params.set("preg", pregnant ? "1" : "0")
    params.set("rx", prescriptionMeds ? "1" : "0")

    router.push(`/?${params.toString()}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-10 pt-6">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="뒤로 가기"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/70"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold text-foreground">피부 진단하기</h1>
          <p className="text-xs text-muted-foreground">몇 가지만 체크하면 내 피부에 맞는 캘린더를 만들어드려요</p>
        </div>
      </div>

      <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-display text-sm font-bold text-foreground">지금 쓰고 있는 성분을 모두 골라주세요</h2>
        <div className="space-y-2">
          {ACTIVE_OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.id}
              label={opt.label}
              checked={actives.has(opt.id)}
              onToggle={() => toggle(setActives, opt.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-display text-sm font-bold text-foreground">오늘 피부 상태는 어떤가요?</h2>
        <div className="space-y-2">
          {SYMPTOM_OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.id}
              label={opt.label}
              checked={symptoms.has(opt.id)}
              onToggle={() => toggle(setSymptoms, opt.id)}
            />
          ))}
        </div>
        {symptoms.has("bad") && (
          <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-[11px] leading-relaxed text-destructive">
            이 항목을 선택하면 캘린더 대신 병원 방문 안내를 보여드려요.
          </p>
        )}
      </section>

      <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-display text-sm font-bold text-foreground">내 피부는 어떤 편인가요? (하나만 선택)</h2>
        <div className="space-y-2">
          {SKIN_TYPES.map((t) => (
            <SkinTypeCard
              key={t.type}
              title={t.title}
              description={t.description}
              selected={skinType === t.type}
              onSelect={() => setSkinType(t.type)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border">
        <h2 className="mb-3 font-display text-sm font-bold text-foreground">추가로 확인할게요</h2>
        <div className="space-y-2">
          <CheckboxRow label="임신 중이거나 수유 중이에요" checked={pregnant} onToggle={() => setPregnant((v) => !v)} />
          <CheckboxRow
            label="병원에서 처방받은 약을 바르고 있어요"
            checked={prescriptionMeds}
            onToggle={() => setPrescriptionMeds((v) => !v)}
          />
        </div>
      </section>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!skinType}
        size="lg"
        className="w-full rounded-full text-base font-bold shadow-sm"
      >
        내 30일 캘린더 시작하기
      </Button>
      {!skinType && <p className="text-center text-[11px] text-muted-foreground">피부 타입을 선택하면 시작할 수 있어요</p>}
    </main>
  )
}

function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
        checked ? "bg-primary/10 ring-1 ring-primary/40" : "bg-secondary/60 ring-1 ring-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked ? "border-primary bg-primary text-white" : "border-border bg-card",
        )}
      >
        {checked && <Check className="size-3.5" />}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  )
}

function SkinTypeCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-2xl p-3 text-left transition-colors",
        selected ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary/60 ring-1 ring-border",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-primary bg-primary text-white" : "border-border bg-card",
          )}
        >
          {selected && <Check className="size-3.5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  )
}
