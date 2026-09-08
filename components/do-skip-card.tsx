"use client"

import { useRef, useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { t } from "@/lib/i18n"
import { useSkinWeather } from "@/lib/use-skin-weather"
import { useAgeGroup } from "@/lib/use-age-group"
import { AGE_GROUPS, getDoSkipPlan, type AgeGroup, type CarePlanItem } from "@/lib/skin-weather"
import { getAffiliatePicks, resolveAffiliateUrl } from "@/lib/affiliate-picks"
import type { SlotType } from "@/lib/slot-mapping"

const SLOT_EMOJI: Record<SlotType, string> = {
  sun_care: "☀️",
  hydration: "💧",
  exfoliation: "✨",
  active: "🎯",
  barrier: "🌿",
}

/** 추천 픽 카테고리 탭 아이콘 — 사용자 요청 표기(장벽은 🛡️) */
const CATEGORY_EMOJI: Record<SlotType, string> = {
  sun_care: "☀️",
  hydration: "💧",
  exfoliation: "✨",
  active: "🎯",
  barrier: "🛡️",
}

function CareRow({ item }: { item: CarePlanItem }) {
  const locale = useLocale()
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 text-xl leading-none" aria-hidden>
        {SLOT_EMOJI[item.slot]}
      </span>
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">
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

/**
 * 추천 픽 서랍 — 첫 진입 시 거대한 제품 카드가 바로 노출되지 않도록,
 * 슬림한 "추천 픽 보기 ▼" 버튼으로 접어두고 터치 시 부드럽게 펼친다.
 * 오늘 DO로 잡힌 모든 슬롯(선크림·수분·장벽 등)의 추천 제품을 한 줄
 * 가로 롤링(캐러셀)으로 묶어 충분히 탐색할 수 있게 한다.
 */
function PicksDrawer({ slots, ageGroup }: { slots: SlotType[]; ageGroup: AgeGroup }) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<SlotType | "all">("all")
  const contentRef = useRef<HTMLDivElement>(null)

  // 슬롯별 픽 (탭 필터의 소스). 표시할 땐 brand+title로 중복 제거한다.
  const perSlot = slots.map((s) => ({ slot: s, picks: getAffiliatePicks(s, ageGroup) }))
  if (perSlot.every((x) => x.picks.length === 0)) return null

  // 연령대 변경 등으로 현재 탭이 더 이상 유효하지 않으면 '전체'로 폴백
  const effectiveCat = activeCat !== "all" && slots.includes(activeCat) ? activeCat : "all"

  const seen = new Set<string>()
  const picks = (effectiveCat === "all" ? perSlot.flatMap((x) => x.picks) : perSlot.find((x) => x.slot === effectiveCat)?.picks ?? [])
    .filter((p) => {
      const k = `${p.brand}|${p.title}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  const contentHeight = contentRef.current?.scrollHeight ?? 0

  const catTabClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11.5px] font-bold transition-colors",
      active ? "border-transparent bg-[#DCE8D2] text-[#244234]" : "border-border text-muted-foreground hover:text-foreground",
    )
  const cats: Array<SlotType | "all"> = ["all", ...slots]

  return (
    <div className="flex w-full min-w-0 flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-full bg-secondary px-4 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-secondary/70"
      >
        <span>{t("doSkip.picksToggle", locale)}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {/* 높이 트랜지션으로 부드럽게 펼침 (서랍형). max-height는 인라인 스타일로
          측정값을 넣어 Tailwind 유틸 생성 여부에 의존하지 않는다. */}
      <div
        className="w-full min-w-0 overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: open ? contentHeight || 720 : 0,
          opacity: open ? 1 : 0,
          marginTop: open ? 10 : 0,
        }}
      >
        <div ref={contentRef} className="w-full min-w-0">
          <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wide text-primary-text">
            {t("doSkip.pickLabel", locale)}
          </span>

          {/* 카테고리 미니 세그먼트 탭 */}
          <div className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                aria-pressed={effectiveCat === cat}
                className={catTabClass(effectiveCat === cat)}
              >
                {cat !== "all" && <span aria-hidden>{CATEGORY_EMOJI[cat]}</span>}
                <span>{t(`doSkip.pickCategory.${cat}`, locale)}</span>
              </button>
            ))}
          </div>

          <div
            className="flex w-full select-none gap-3 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
            onWheel={(e) => {
              // PC 세로 휠 → 가로 스크롤 변환
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY
              }
            }}
          >
            {picks.map((pick, i) => (
              <a
                key={i}
                href={resolveAffiliateUrl(pick.affiliateUrl, locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-[220px] min-w-[220px] max-w-[220px] shrink-0 flex-col gap-1 rounded-2xl border border-border bg-secondary/60 px-3.5 py-3 transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between">
                  {pick.tag ? (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9.5px] font-bold leading-none text-primary-text">
                      {pick.tag}
                    </span>
                  ) : (
                    <span />
                  )}
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </div>
                <span className="text-[12.5px] font-semibold leading-tight text-foreground">
                  {pick.brand} {pick.title}
                </span>
                <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{pick.description}</span>
              </a>
            ))}
          </div>

          {/* 쿠팡 파트너스 고지 — 서랍이 열렸을 때 캐러셀 아래에만 노출 */}
          <p className="mt-2.5 text-center text-[11px] leading-relaxed text-[#8A8378]">
            {t("doSkip.coupangDisclosure", locale)}
          </p>
        </div>
      </div>
    </div>
  )
}

/** '오늘 필수' 헤더 우측에 붙는 콤팩트 연령대 선택기 (기존 큰 3분할 토글 대체) */
function AgeSelect({ value, onChange }: { value: AgeGroup; onChange: (g: AgeGroup) => void }) {
  const locale = useLocale()
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AgeGroup)}
        aria-label={t("doSkip.ageSelectLabel", locale)}
        className="appearance-none rounded-full bg-secondary py-1 pl-3 pr-6 text-[11.5px] font-bold text-foreground focus:outline-none"
      >
        {AGE_GROUPS.map((g) => (
          <option key={g} value={g}>
            {t(`doSkip.age.${g}`, locale)}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
}

export function DoSkipCard() {
  const locale = useLocale()
  const diary = useDiary()
  const { weather, status } = useSkinWeather()
  const [ageGroup, setAgeGroup] = useAgeGroup()

  // 체크인 완료 축하 모달
  const [celebrate, setCelebrate] = useState(false)

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
  // 오늘 DO로 잡힌 슬롯 중 추천 픽이 있는 슬롯 전부 → 캐러셀에서 함께 탐색
  const pickSlots = Array.from(new Set(plan.doItems.map((i) => i.slot))).filter(
    (s) => getAffiliatePicks(s, ageGroup).length > 0,
  )

  const handleCheckin = () => {
    if (alreadyDone) return
    diary.recordLoggedDay(diary.currentDay)
    setCelebrate(true)
  }

  return (
    <div className={shell}>
      <div className="flex w-full min-w-0 flex-col gap-5">
        {status === "error" && (
          <p className="text-[12.5px] font-medium text-muted-foreground">{t("doSkip.unavailable", locale)}</p>
        )}

        {/* 오늘 필수 — 처방 리스트에 화력 집중 ('오늘 생략' 섹션은 제거) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#4CAF87]" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-foreground">{t("doSkip.doTitle", locale)}</h3>
            </div>
            <AgeSelect value={ageGroup} onChange={setAgeGroup} />
          </div>
          <ul className="flex flex-col gap-3">
            {plan.doItems.map((item) => (
              <CareRow key={item.key} item={item} />
            ))}
          </ul>
        </div>

        {/* 오늘 날씨 맞춤 추천템 — 기본 접힘, 터치 시 서랍형으로 펼침 + 가로 롤링.
            쿠팡 고지 문구는 서랍 내부(캐러셀 아래)에 있어 열렸을 때만 보인다. */}
        {pickSlots.length > 0 && <PicksDrawer slots={pickSlots} ageGroup={ageGroup} />}

        {/* 원탭 체크인 */}
        <button
          type="button"
          onClick={handleCheckin}
          disabled={alreadyDone}
          className={
            "w-full rounded-2xl py-3.5 text-sm font-bold shadow-sm transition-all " +
            (alreadyDone
              ? "cursor-default bg-secondary text-muted-foreground"
              : "bg-[#DCE8D2] text-[#244234] hover:opacity-90")
          }
        >
          {alreadyDone ? t("doSkip.checkin.done", locale) : t("doSkip.checkin.cta", locale)}
        </button>
      </div>

      {celebrate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
          onClick={() => setCelebrate(false)}
        >
          <div
            className="flex w-full max-w-[300px] flex-col items-center gap-3 rounded-3xl bg-card p-7 text-center shadow-xl ring-1 ring-border animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/onboarding/cover-cat-sleeping.png" alt="" className="size-20 object-contain" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              {t("doSkip.checkin.modalTitle", locale)}
            </h3>
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {t("doSkip.checkin.modalBody", locale)}
            </p>
            <button
              type="button"
              onClick={() => setCelebrate(false)}
              className="mt-2 w-full rounded-full bg-[#5B9A97] py-3 text-sm font-bold text-white transition-colors hover:bg-[#4E8A87]"
            >
              {t("doSkip.checkin.modalClose", locale)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
