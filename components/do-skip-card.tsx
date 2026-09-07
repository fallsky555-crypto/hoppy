"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { t } from "@/lib/i18n"
import { useSkinWeather } from "@/lib/use-skin-weather"
import { useAgeGroup } from "@/lib/use-age-group"
import { AGE_GROUPS, getDoSkipPlan, type AgeGroup, type CarePlanItem } from "@/lib/skin-weather"
import { getAffiliatePick } from "@/lib/affiliate-picks"
import type { SlotType } from "@/lib/slot-mapping"

const SLOT_EMOJI: Record<SlotType, string> = {
  sun_care: "☀️",
  hydration: "💧",
  exfoliation: "✨",
  active: "🎯",
  barrier: "🌿",
}

function CareRow({ item, tone }: { item: CarePlanItem; tone: "do" | "skip" }) {
  const locale = useLocale()
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 text-xl leading-none" aria-hidden>
        {SLOT_EMOJI[item.slot]}
      </span>
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5">
          <span
            className={
              "text-sm font-semibold " +
              (tone === "skip" ? "text-foreground line-through decoration-[#D9534F]/50" : "text-foreground")
            }
          >
            {t(`doSkip.item.${item.key}.label`, locale)}
          </span>
          {item.layer && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-text">
              {t("doSkip.layerBadge", locale)}
            </span>
          )}
        </span>
        <span className="text-[12.5px] leading-snug text-muted-foreground">
          {t(`doSkip.item.${item.key}.desc`, locale)}
        </span>
      </div>
    </li>
  )
}

function AffiliateBanner({ slot, ageGroup }: { slot: SlotType; ageGroup: AgeGroup }) {
  const locale = useLocale()
  const pick = getAffiliatePick(slot, ageGroup)
  if (!pick) return null

  return (
    <a
      href={pick.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="mt-2 ml-8 flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 px-3 py-2.5 transition-colors hover:bg-secondary"
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-primary-text">
          {t("doSkip.pickLabel", locale)}
        </span>
        <span className="truncate text-[13px] font-semibold text-foreground">
          {pick.brand} · {pick.title}
        </span>
        <span className="truncate text-[11.5px] text-muted-foreground">{pick.description}</span>
      </div>
      <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  )
}

function AgeTabs({ value, onChange }: { value: AgeGroup; onChange: (g: AgeGroup) => void }) {
  const locale = useLocale()
  return (
    <div className="flex gap-1.5 rounded-full bg-secondary p-1">
      {AGE_GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          aria-pressed={value === g}
          className={
            "flex-1 rounded-full py-1.5 text-[12.5px] font-bold transition-colors " +
            (value === g ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
          }
        >
          {t(`doSkip.age.${g}`, locale)}
        </button>
      ))}
    </div>
  )
}

export function DoSkipCard() {
  const locale = useLocale()
  const diary = useDiary()
  const { weather, status } = useSkinWeather()
  const [ageGroup, setAgeGroup] = useAgeGroup()

  const [toast, setToast] = useState(false)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(false), 2800)
    return () => clearTimeout(id)
  }, [toast])

  const shell = "rounded-4xl px-[22px] py-[26px] ring-1 bg-card ring-border"

  if (status === "loading") {
    return (
      <div className={shell}>
        <p className="text-sm font-semibold text-muted-foreground">{t("skinWeather.loading", locale)}</p>
      </div>
    )
  }

  const plan =
    weather && status === "ready"
      ? getDoSkipPlan(weather, new Date(), ageGroup)
      : { doItems: [] as CarePlanItem[], skipItems: [] as CarePlanItem[] }

  const alreadyDone = diary.loggedDays.includes(diary.currentDay)
  const pickSlot = plan.doItems.find((i) => getAffiliatePick(i.slot, ageGroup))?.slot ?? null

  const handleCheckin = () => {
    if (alreadyDone) return
    diary.recordLoggedDay(diary.currentDay)
    setToast(true)
  }

  return (
    <div className={shell}>
      <div className="flex flex-col gap-5">
        <AgeTabs value={ageGroup} onChange={setAgeGroup} />

        {status === "error" && (
          <p className="text-[12.5px] font-medium text-muted-foreground">{t("doSkip.unavailable", locale)}</p>
        )}

        {/* DO */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#4CAF87]" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("doSkip.doTitle", locale)}</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {plan.doItems.map((item) => (
              <div key={item.key}>
                <CareRow item={item} tone="do" />
                {pickSlot === item.slot && <AffiliateBanner slot={item.slot} ageGroup={ageGroup} />}
              </div>
            ))}
          </ul>
        </div>

        <div className="h-px bg-border" />

        {/* SKIP */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#D9534F]" aria-hidden />
            <h3 className="font-display text-lg font-semibold text-foreground">{t("doSkip.skipTitle", locale)}</h3>
          </div>
          {plan.skipItems.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {plan.skipItems.map((item) => (
                <CareRow key={item.key} item={item} tone="skip" />
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("doSkip.skipNone", locale)}</p>
          )}
        </div>

        {/* 원탭 체크인 */}
        <button
          type="button"
          onClick={handleCheckin}
          disabled={alreadyDone}
          className={
            "w-full rounded-full py-3.5 text-sm font-bold transition-colors " +
            (alreadyDone
              ? "cursor-default bg-secondary text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/80")
          }
        >
          {alreadyDone ? t("doSkip.checkin.done", locale) : t("doSkip.checkin.cta", locale)}
        </button>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg">
            {t("doSkip.checkin.toast", locale)}
          </div>
        </div>
      )}
    </div>
  )
}
