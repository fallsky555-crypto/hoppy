"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { IncidentLogEntry, IncidentType } from "@/lib/scheduling-engine"

/** 5-2. 선번/시술 버튼 클릭 시 함께 노출해야 하는 필수 고지 문구 */
const MEDICAL_NOTICE =
  "화상이 심하거나 시술 직후 통증이 있다면 앱의 루틴보다 담당 병원·피부과의 안내를 우선하세요. 이 루틴은 진료를 대체하지 않습니다."

const INCIDENT_META: Record<IncidentType, { label: string; emoji: string; needsNotice: boolean }> = {
  period: { label: "생리 시작", emoji: "🩸", needsNotice: false },
  sunburn: { label: "선번", emoji: "☀️", needsNotice: true },
  treatment: { label: "시술 후", emoji: "💉", needsNotice: true },
}

interface IncidentPanelProps {
  currentDay: number
  incidentLog: IncidentLogEntry[]
  onReportIncident: (incidentType: IncidentType) => void
}

export function IncidentPanel({ currentDay, incidentLog, onReportIncident }: IncidentPanelProps) {
  const [pending, setPending] = useState<IncidentType | null>(null)

  const activeIncident = incidentLog.find((entry) => currentDay >= entry.day && currentDay < entry.resumesNormalAtDay)

  function handleClick(type: IncidentType) {
    if (INCIDENT_META[type].needsNotice) {
      setPending(type)
      return
    }
    onReportIncident(type)
  }

  function confirmPending() {
    if (!pending) return
    onReportIncident(pending)
    setPending(null)
  }

  return (
    <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border" aria-label="스킨 인시던트">
      <h2 className="mb-1 font-display text-base font-bold text-foreground">특별한 일이 있었나요?</h2>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        선택하면 오늘부터 응급 진정 루틴으로 자동 전환되고, 남은 일정은 그만큼 뒤로 밀려요.
      </p>

      {activeIncident ? (
        <div className="rounded-2xl bg-moist-soft p-3 text-xs leading-relaxed text-foreground/80 ring-1 ring-moist/30">
          {INCIDENT_META[activeIncident.incidentType].emoji} {INCIDENT_META[activeIncident.incidentType].label} 진정
          루틴 진행 중이에요. Day {activeIncident.resumesNormalAtDay}부터 원래 캘린더가 다시 시작돼요.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(INCIDENT_META) as IncidentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleClick(type)}
              aria-pressed={pending === type}
              className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-2 py-3 text-xs font-bold text-secondary-foreground transition-colors hover:bg-accent"
            >
              <span aria-hidden className="text-lg">
                {INCIDENT_META[type].emoji}
              </span>
              {INCIDENT_META[type].label}
            </button>
          ))}
        </div>
      )}

      {pending && (
        <div className="mt-3 rounded-2xl bg-accent/60 p-3">
          <p className="text-xs leading-relaxed text-foreground/80">{MEDICAL_NOTICE}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setPending(null)}>
              취소
            </Button>
            <Button type="button" size="sm" className="flex-1 rounded-full" onClick={confirmPending}>
              확인, 진정 루틴 시작
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
