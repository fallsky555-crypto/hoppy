"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { IncidentLogEntry, IncidentType } from "@/lib/scheduling-engine"
import { t, interpolate } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { Droplet, Sun, Syringe } from "lucide-react"

interface IncidentPanelProps {
  currentDay: number
  incidentLog: IncidentLogEntry[]
  onReportIncident: (incidentType: IncidentType) => void
}

export function IncidentPanel({ currentDay, incidentLog, onReportIncident }: IncidentPanelProps) {
  const locale = useLocale()
  const [pending, setPending] = useState<IncidentType | null>(null)

  const INCIDENT_META: Record<IncidentType, { label: string; icon: typeof Droplet; needsNotice: boolean }> = {
    period: { label: t("incident.labels.period", locale), icon: Droplet, needsNotice: false },
    sunburn: { label: t("incident.labels.sunburn", locale), icon: Sun, needsNotice: true },
    treatment: { label: t("incident.labels.treatment", locale), icon: Syringe, needsNotice: true },
  }

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
    <section className="rounded-4xl bg-card px-5 py-[22px] ring-1 ring-border" aria-label={t("incident.ariaLabel", locale)}>
      <h2 className="mb-1 text-base font-bold text-foreground">{t("incident.title", locale)}</h2>
      <p className="mb-3.5 text-[13.5px] leading-relaxed text-muted-foreground">
        {t("incident.description", locale)}
      </p>

      {activeIncident ? (
        <div className="rounded-2xl bg-secondary p-3.5 text-xs leading-relaxed text-foreground/80">
          {interpolate(t("incident.active", locale), { label: INCIDENT_META[activeIncident.incidentType].label, resumeDay: String(activeIncident.resumesNormalAtDay) })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(INCIDENT_META) as IncidentType[]).map((type) => {
            const Icon = INCIDENT_META[type].icon
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleClick(type)}
                aria-pressed={pending === type}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-1.5 py-3.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <Icon className="size-4 text-foreground" aria-hidden strokeWidth={1.6} />
                {INCIDENT_META[type].label}
              </button>
            )
          })}
        </div>
      )}

      {pending && (
        <div className="mt-3 rounded-2xl bg-secondary p-3.5">
          <p className="text-xs leading-relaxed text-foreground/80">{t("incident.medical_notice", locale)}</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setPending(null)}>
              {t("incident.cancel", locale)}
            </Button>
            <Button type="button" size="sm" className="flex-1 rounded-full" onClick={confirmPending}>
              {t("incident.confirm", locale)}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
