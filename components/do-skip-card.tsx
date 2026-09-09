"use client"

import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { useSkinWeather } from "@/lib/use-skin-weather"
import { useAgeGroup } from "@/lib/use-age-group"
import { getDoSkipPlan, type AgeGroup, type CarePlanItem } from "@/lib/skin-weather"
import { getTodayWeatherPicks, resolveAffiliateUrl, type TodayPick } from "@/lib/affiliate-picks"

/** 연령대 텍스트 탭 — '오늘 필수' 타이틀 우측. 2030 | 4050 두 갈래만 노출한다. */
const AGE_TABS: AgeGroup[] = ["2030", "4050"]

function AgeTabs({ value, onChange }: { value: AgeGroup; onChange: (g: AgeGroup) => void }) {
  const locale = useLocale()
  return (
    <div
      className="flex shrink-0 items-center gap-2 text-[13px]"
      role="tablist"
      aria-label={t("doSkip.ageSelectLabel", locale)}
    >
      {AGE_TABS.map((g, i) => (
        <span key={g} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-[#D8D0C2]" aria-hidden>
              |
            </span>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={value === g}
            onClick={() => onChange(g)}
            className={cn(
              "leading-none transition-colors",
              value === g
                ? "font-semibold text-[#2C2825]"
                : "font-medium text-[#A0988C] hover:text-[#7A746B]",
            )}
          >
            {t(`doSkip.age.${g}`, locale)}
          </button>
        </span>
      ))}
    </div>
  )
}

/**
 * 오늘 필수 케어 한 줄 — 매거진 넘버링(01·02·03) + 다크차콜 타이포.
 * 원색 이모지·연령대 뱃지·'+레이어' 뱃지는 모두 걷어냈다.
 */
function CareRow({ item, index }: { item: CarePlanItem; index: number }) {
  const locale = useLocale()
  return (
    <li className="flex items-baseline gap-3.5">
      <span className="font-display text-[15px] font-medium leading-none tabular-nums text-[#C0B8AB]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex flex-col">
        <span className="font-display text-[16px] font-bold leading-snug tracking-tight text-[#2C2825]">
          {t(`doSkip.item.${item.key}.label`, locale)}
        </span>
        <span className="mt-0.5 text-[13.5px] leading-relaxed text-[#6E675F]">
          {t(`doSkip.item.${item.key}.desc`, locale)}
        </span>
      </div>
    </li>
  )
}

/**
 * 오늘 날씨 맞춤 추천 — 29CM/킨포크 스타일 가로 스크롤 룩북.
 * 아코디언 없이 상시 노출. [오늘 날씨 지표 × 선택 연령대] 큐레이션 3~4개를
 * 카테고리 중복 없이 보여주며, 연령대 탭 전환 시 즉시 갱신된다.
 */
function PicksLookbook({ picks }: { picks: TodayPick[] }) {
  const locale = useLocale()
  if (picks.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {/* 섹션 헤더 — 영문 서브 + 세리프 타이틀 */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#A0988C]">
          {t("doSkip.pickEyebrow", locale)}
        </span>
        <h4 className="font-display text-[18px] leading-tight text-[#2C2825]">
          {t("doSkip.pickTitle", locale)}
        </h4>
      </div>

      {/* 가로 스크롤 룩북 캐러셀 */}
      <div
        className="no-scrollbar flex gap-3 overflow-x-auto pb-2"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
        onWheel={(e) => {
          // PC 세로 휠 → 가로 스크롤 변환
          if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY
        }}
      >
        {picks.map((pick, i) => (
          <a
            key={`${pick.slot}-${i}`}
            href={resolveAffiliateUrl(pick.affiliateUrl, locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-[180px] shrink-0 flex-col rounded-2xl border border-[#ECE6DC] bg-[#FAF8F5] p-3.5 transition-colors hover:border-[#DCD3C2]"
          >
            {/* 제품 이미지 영역 — 데이터에 이미지가 없어 미색 플레이스홀더 (브랜드 이니셜) */}
            <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-xl bg-white/70">
              <span className="font-display text-[24px] text-[#DAD1C1]" aria-hidden>
                {pick.brand.slice(0, 1)}
              </span>
            </div>

            <span className="text-[11px] font-medium text-[#8A8378]">
              {t(`doSkip.pickCategory.${pick.slot}`, locale)}
            </span>
            <span className="mt-0.5 text-[12px] font-semibold text-[#5A544B]">{pick.brand}</span>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="line-clamp-1 text-[14px] font-bold text-[#2C2825]">{pick.title}</span>
              <ArrowUpRight
                className="size-3 shrink-0 text-[#A0988C] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#7A746B]">
              {pick.description}
            </p>
          </a>
        ))}
      </div>

      {/* 쿠팡 파트너스 고지 — 룩북 바로 아래 은은한 각주 */}
      <p className="text-center text-[11px] leading-relaxed text-[#B0A89C]">
        {t("doSkip.coupangDisclosure", locale)}
      </p>
    </div>
  )
}

export function DoSkipCard() {
  const locale = useLocale()
  const { weather, status } = useSkinWeather()
  const [ageGroup, setAgeGroup] = useAgeGroup()

  // 카드 박스 없이 상단 1px 디바이더 + 여백으로만 앞 섹션과 구분한다(에디토리얼 무드).
  const shell = "border-t border-[#E5DECF] px-1 pt-6"

  if (status === "loading") {
    return (
      <div className={shell}>
        <p className="text-sm font-semibold text-muted-foreground">{t("skinWeather.loading", locale)}</p>
      </div>
    )
  }

  const ready = weather !== null && status === "ready"

  // 필수 처방 + 추천 픽 모두 [오늘 날씨 × 선택 연령대]로 계산 — 탭 전환 시 함께 갱신된다.
  const plan = ready
    ? getDoSkipPlan(weather, new Date(), ageGroup)
    : { doItems: [] as CarePlanItem[], skipItems: [] as CarePlanItem[] }
  const picks = ready ? getTodayWeatherPicks(weather, ageGroup) : []

  return (
    <div className={shell}>
      <div className="flex w-full min-w-0 flex-col gap-6">
        {status === "error" && (
          <p className="text-[12.5px] font-medium text-muted-foreground">{t("doSkip.unavailable", locale)}</p>
        )}

        {/* 오늘 필수 — 매거진 넘버링 처방 리스트 + 우측 연령대 텍스트 탭 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[20px] font-semibold text-[#2C2825]">{t("doSkip.doTitle", locale)}</h3>
            <AgeTabs value={ageGroup} onChange={setAgeGroup} />
          </div>
          <ul className="flex flex-col gap-4">
            {plan.doItems.map((item, i) => (
              <CareRow key={item.key} item={item} index={i} />
            ))}
          </ul>
        </div>

        {/* 오늘 날씨 맞춤 추천 — [날씨 × 연령대] 큐레이션 3~4개, 가로 스크롤 룩북 (상시 노출) */}
        {picks.length > 0 && <PicksLookbook picks={picks} />}
      </div>
    </div>
  )
}
