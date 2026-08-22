"use client"

import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Smile, Meh, Frown, ChevronDown, Pencil } from "lucide-react"
import { t, interpolate } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"
import { useDiary } from "@/lib/diary-context"
import { saveUsageLog } from "@/lib/supabase/sync"
import { getRecommendedSlot } from "@/lib/slot-mapping"
import { getFirstConcernTagShortLabelKey } from "@/lib/label-mappings"
import { DailyRewardCard, type RewardCardData } from "@/components/daily-reward-card"

export type SlotType = "exfoliation" | "hydration" | "active" | "barrier" | "sun_care"
type SpecialCareType = "mask" | "trouble"
type ConcernCareIngredient = "vitc" | "ret" | "nia" | "unknown"

const ALL_SLOT_IDS: SlotType[] = ["sun_care", "exfoliation", "hydration", "active", "barrier"]
const ALL_SPECIAL_CARE_IDS: SpecialCareType[] = ["mask", "trouble"]
const ALL_CONCERN_CARE_INGREDIENTS: ConcernCareIngredient[] = ["vitc", "ret", "nia", "unknown"]

interface Slot {
  id: SlotType
  emoji: string
  labelKey: string
}

const SLOT_TAGS: Record<SlotType, string> = {
  exfoliation: "Exfoliation",
  hydration: "Hydration",
  active: "Active/Stimulate",
  barrier: "Defense/Barrier",
  sun_care: "Sun",
}

const SPECIAL_CARE_TAGS: Record<SpecialCareType, string> = {
  mask: "Mask",
  trouble: "Trouble",
}

const CONCERN_CARE_TAGS: Record<ConcernCareIngredient, string> = {
  vitc: "VitaminC",
  ret: "Retinol",
  nia: "Niacinamide",
  unknown: "Unknown",
}

const CONCERN_CARE_EMOJI: Record<ConcernCareIngredient, string> = {
  vitc: "🍊",
  ret: "🌙",
  nia: "🤍",
  unknown: "❓",
}

/**
 * 하루 기록이 "완료되어 잠겨야 하는지" 판단한다. 오늘이 아닌 날짜(과거/미래, 기록 유무
 * 무관)는 무조건 잠근다 — 과거 날짜는 기록이 없어도 캐치업 입력을 허용하지 않는다.
 * "오늘"은 무드를 아직 안 골랐다면 계속 열려 있어야 정상적인 하루 기록 흐름(슬롯 체크 →
 * 나중에 무드 선택)이 끊기지 않고, 무드 선택까지 마치면 당연히 잠긴다.
 */
function isDayLocked(
  targetDay: number,
  conditions: Record<number, "good" | "neutral" | "bad">,
  currentDay: number,
): boolean {
  if (targetDay !== currentDay) return true
  return conditions[targetDay] !== undefined
}

const SUN_CARE_SLOT: Slot = { id: "sun_care", emoji: "☀️", labelKey: "dailySlots.slots.sun_care" }

/** 세로 리스트로 나열되는 기본 슬롯 5개 중 4개. "기능성제품(active)"은 성분 아코디언이라 별도 컴포넌트(ConcernCareCard)로 렌더링되지만 같은 리스트의 마지막 아이템으로 이어붙는다 */
const PRIMARY_SLOTS: Slot[] = [
  SUN_CARE_SLOT,
  { id: "hydration", emoji: "💧", labelKey: "dailySlots.slots.hydration" },
  { id: "exfoliation", emoji: "✨", labelKey: "dailySlots.slots.exfoliation" },
  { id: "barrier", emoji: "🌿", labelKey: "dailySlots.slots.barrier" },
]

/** 상단 2x2 그리드 아이템 — 아이콘, 라벨, 오른쪽 체크마크(선택 시에만) 순으로 가로 배치. 설명 텍스트는 표시하지 않음 */
function SlotCard({ slot, isChecked, toggleSlot, disabled }: { slot: Slot; isChecked: boolean; toggleSlot: (id: SlotType) => void; disabled?: boolean }) {
  const locale = useLocale()
  const handleClick = useCallback(() => {
    toggleSlot(slot.id)
  }, [slot.id, toggleSlot])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all",
        isChecked
          ? "border-primary bg-primary/10"
          : "border-border bg-card",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="flex-shrink-0 text-2xl">
        {slot.emoji}
      </div>
      <div className="flex-1 text-left text-sm font-semibold text-foreground">
        {t(slot.labelKey, locale)}
      </div>
      {isChecked && <Check className="size-5 flex-shrink-0 text-primary" aria-hidden />}
    </button>
  )
}

interface SpecialCareCardProps {
  isExpanded: boolean
  onToggle: () => void
  selectedSpecialCare: Set<SpecialCareType>
  onToggleSpecialCare: (id: SpecialCareType) => void
  locale: Locale
  disabled?: boolean
}

function SpecialCareCard({ isExpanded, onToggle, selectedSpecialCare, onToggleSpecialCare, locale, disabled }: SpecialCareCardProps) {

  return (
    <div className="border-2 border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.title", locale)}</div>
            <div className="text-xs text-muted-foreground">{t("dailySlots.specialCare.subtitle", locale)}</div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-5 text-muted-foreground transition-transform",
            isExpanded ? "rotate-180" : "",
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-secondary p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => onToggleSpecialCare("mask")}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
              selectedSpecialCare.has("mask")
                ? "border-primary bg-primary/10"
                : "border-border bg-card",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <span>🫙</span>
            <span className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.option_mask", locale)}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleSpecialCare("trouble")}
            disabled={disabled}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
              selectedSpecialCare.has("trouble")
                ? "border-primary bg-primary/10"
                : "border-border bg-card",
              disabled && "opacity-60 cursor-not-allowed",
            )}
          >
            <span>🩹</span>
            <span className="text-sm font-semibold text-foreground">{t("dailySlots.specialCare.option_trouble", locale)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface ConcernCareCardProps {
  isExpanded: boolean
  onToggle: () => void
  selectedConcernCare: Set<ConcernCareIngredient>
  onToggleConcernCare: (id: ConcernCareIngredient) => void
  locale: Locale
  disabled?: boolean
}

/** 다른 슬롯 리스트 아이템과 동일한 모양(아이콘·라벨·체크마크)이지만, 탭하면 토글이 아니라 성분 선택지 아코디언을 펼친다 */
function ConcernCareCard({ isExpanded, onToggle, selectedConcernCare, onToggleConcernCare, locale, disabled }: ConcernCareCardProps) {
  const isChecked = selectedConcernCare.size > 0

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 transition-colors",
        isChecked ? "border-primary bg-primary/10" : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">{t("dailySlots.slots.active", locale)}</div>
            <div className="text-xs text-muted-foreground">{t("dailySlots.slotDescriptions.active", locale)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isChecked && <Check className="size-5 text-primary" aria-hidden />}
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              isExpanded ? "rotate-180" : "",
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-secondary p-4 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
          {ALL_CONCERN_CARE_INGREDIENTS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggleConcernCare(id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                selectedConcernCare.has(id)
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              <span>{CONCERN_CARE_EMOJI[id]}</span>
              <span className="text-sm font-semibold text-foreground">{t(`dailySlots.concernCare.option_${id}`, locale)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface FreeInputCardProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  locale: Locale
  disabled?: boolean
}

/** 항상 펼쳐진 한 줄 입력 — 다른 카드처럼 탭해서 펼치는 아코디언이 아니라 인풋에서 포커스가 빠질 때(blur) 저장한다 */
function FreeInputCard({ value, onChange, onSave, locale, disabled }: FreeInputCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3">
      <Pencil className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        placeholder={t("dailySlots.freeInput.placeholder", locale)}
        disabled={disabled}
        className="w-full flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:font-semibold placeholder:text-foreground focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  )
}

interface DailySlotsProps {
  day?: number
  onConditionRecord?: (condition: "good" | "neutral" | "bad", linkedCategory: SlotType) => void
  onCollapse?: () => void
}

export function DailySlots({ day = 1, onConditionRecord, onCollapse }: DailySlotsProps) {
  const locale = useLocale()
  const diary = useDiary()
  const diaryRef = useRef(diary)
  const [checkedSlots, setCheckedSlots] = useState<Set<SlotType>>(new Set())
  const [selectedSpecialCare, setSelectedSpecialCare] = useState<Set<SpecialCareType>>(new Set())
  const [specialCareExpanded, setSpecialCareExpanded] = useState(false)
  const [selectedConcernCare, setSelectedConcernCare] = useState<Set<ConcernCareIngredient>>(new Set())
  const [concernCareExpanded, setConcernCareExpanded] = useState(false)
  const [showConditionPrompt, setShowConditionPrompt] = useState(false)
  const [freeInputText, setFreeInputText] = useState("")
  const [collapsed, setCollapsed] = useState(() =>
    isDayLocked(day, diary.conditions, diary.currentDay),
  )
  const [rewardData, setRewardData] = useState<RewardCardData | null>(null)
  const [collapseMaxHeight, setCollapseMaxHeight] = useState<string>(() =>
    isDayLocked(day, diary.conditions, diary.currentDay) ? "0px" : "none",
  )

  const checkedSlotsRef = useRef<Set<SlotType>>(new Set())
  const selectedSpecialCareRef = useRef<Set<SpecialCareType>>(new Set())
  const selectedConcernCareRef = useRef<Set<ConcernCareIngredient>>(new Set())
  const restoredDayRef = useRef<number | null>(null)
  const collapseContentRef = useRef<HTMLDivElement>(null)
  // 마지막으로 애니메이션을 재생한 collapsed 값. 초기값을 collapsed의 초기값과 동일하게
  // 잡아, React StrictMode의 effect 이중 실행에도 "값이 실제로 바뀌었을 때"만 반응한다.
  const lastAnimatedCollapsedRef = useRef(collapsed)

  const todayRecipe = diary.getRecipeForDay(day)
  const recommendedSlot: SlotType | null = getRecommendedSlot(todayRecipe.type) as SlotType | null

  const concernShortLabelKey = getFirstConcernTagShortLabelKey(diary.concernTags)
  const conditionQuestion = concernShortLabelKey
    ? interpolate(t("dailySlots.conditionQuestionDynamic", locale), {
        concern: t(concernShortLabelKey, locale),
      })
    : t("dailySlots.conditionQuestion", locale)

  useEffect(() => {
    diaryRef.current = diary
  }, [diary])

  useEffect(() => {
    checkedSlotsRef.current = checkedSlots
  }, [checkedSlots])

  useEffect(() => {
    selectedSpecialCareRef.current = selectedSpecialCare
  }, [selectedSpecialCare])

  useEffect(() => {
    selectedConcernCareRef.current = selectedConcernCare
  }, [selectedConcernCare])

  // day가 바뀌거나(달력에서 다른 날짜 선택) 마운트될 때, 저장된 loggedSlots[day]로부터
  // 체크 표시와 접힘 상태를 복원한다. 새로고침 시 체크 표시가 사라지던 버그 수정.
  useEffect(() => {
    if (restoredDayRef.current === day) return
    restoredDayRef.current = day

    const entries = diaryRef.current.loggedSlots[day] ?? []
    const loggedIds = new Set(entries.map((e) => e.slot))

    setCheckedSlots(new Set(ALL_SLOT_IDS.filter((id) => loggedIds.has(id))))
    setSelectedSpecialCare(
      new Set(ALL_SPECIAL_CARE_IDS.filter((id) => loggedIds.has(`special_care_${id}`))),
    )
    setSelectedConcernCare(
      new Set(ALL_CONCERN_CARE_INGREDIENTS.filter((id) => loggedIds.has(`concern_care_${id}`))),
    )
    setCollapsed(isDayLocked(day, diaryRef.current.conditions, diaryRef.current.currentDay))
    setShowConditionPrompt(false)
    setRewardData(null)
    setFreeInputText(diaryRef.current.freeInputs[day] ?? "")
  }, [day])

  // collapsed 전환 시 max-height를 실측해 애니메이션한다. CSS grid-template-rows의
  // 0fr/1fr 트릭은 부모가 auto-height(고유 높이)일 때 실제로 줄어들지 않는 문제가 있어
  // (컨테이너 높이가 정해져 있지 않으면 fr 트랙이 content 기준으로 계산됨) 실측 방식으로 대체.
  // collapsed 값이 실제로 바뀐 경우에만 애니메이션한다 (마운트 시 이미 올바른 초기값으로
  // 렌더되어 있고, dev 모드 StrictMode의 effect 이중 실행에도 오탐하지 않도록 값 비교 사용).
  useEffect(() => {
    if (lastAnimatedCollapsedRef.current === collapsed) return
    lastAnimatedCollapsedRef.current = collapsed

    const el = collapseContentRef.current
    if (!el) return

    if (collapsed) {
      const current = el.scrollHeight
      setCollapseMaxHeight(`${current}px`)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setCollapseMaxHeight("0px"))
      })
      return () => cancelAnimationFrame(raf)
    }

    const target = el.scrollHeight
    setCollapseMaxHeight(`${target}px`)
    const timer = setTimeout(() => setCollapseMaxHeight("none"), 320)
    return () => clearTimeout(timer)
  }, [collapsed])

  const toggleSlot = useCallback((slotId: SlotType) => {
    if (isDayLocked(day, diaryRef.current.conditions, diaryRef.current.currentDay)) return

    const newChecked = new Set(checkedSlotsRef.current)
    if (newChecked.has(slotId)) {
      newChecked.delete(slotId)
    } else {
      newChecked.add(slotId)
      diaryRef.current.recordLoggedSlot(day, slotId, SLOT_TAGS[slotId])
    }

    setCheckedSlots(newChecked)

    if (diaryRef.current.userId) {
      const recommendedCategory = recommendedSlot || ("active" as SlotType)
      const slotsPayload = [
        ...Array.from(newChecked).map((id) => ({
          slot: id,
          tag: SLOT_TAGS[id],
        })),
        ...Array.from(selectedSpecialCareRef.current).map((id) => ({
          slot: `special_care_${id}`,
          tag: SPECIAL_CARE_TAGS[id],
        })),
        ...Array.from(selectedConcernCareRef.current).map((id) => ({
          slot: `concern_care_${id}`,
          tag: CONCERN_CARE_TAGS[id],
        })),
      ]
      saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
        console.error("[saveUsageLog] error:", err)
      })
    }
  }, [day, recommendedSlot])

  const toggleSpecialCare = useCallback((specialCareId: SpecialCareType) => {
    if (isDayLocked(day, diaryRef.current.conditions, diaryRef.current.currentDay)) return

    const newSet = new Set(selectedSpecialCareRef.current)
    if (newSet.has(specialCareId)) {
      newSet.delete(specialCareId)
    } else {
      newSet.add(specialCareId)
      diaryRef.current.recordLoggedSlot(day, `special_care_${specialCareId}` as SlotType, SPECIAL_CARE_TAGS[specialCareId])
    }

    setSelectedSpecialCare(newSet)

    if (diaryRef.current.userId) {
      const recommendedCategory = recommendedSlot || ("active" as SlotType)
      const slotsPayload = [
        ...Array.from(checkedSlotsRef.current).map((id) => ({
          slot: id,
          tag: SLOT_TAGS[id],
        })),
        ...Array.from(newSet).map((id) => ({
          slot: `special_care_${id}`,
          tag: SPECIAL_CARE_TAGS[id],
        })),
        ...Array.from(selectedConcernCareRef.current).map((id) => ({
          slot: `concern_care_${id}`,
          tag: CONCERN_CARE_TAGS[id],
        })),
      ]
      saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
        console.error("[saveUsageLog] error:", err)
      })
    }
  }, [day, recommendedSlot])

  /**
   * 고민케어 성분 선택은 그 자체로 "고민케어(active)" 슬롯 완료를 겸한다 — 토글과 성분선택이
   * 분리된 두 액션이 아니라 하나의 액션. 성분을 하나라도 골라두면 active 슬롯이 완료 처리되고,
   * 전부 해제하면 다시 미완료로 돌아간다. active라는 슬롯 id 자체는 그대로 유지되므로 캘린더
   * 표시/추천배지 등 기존 로직은 손대지 않아도 계속 정상 동작한다.
   */
  const toggleConcernCare = useCallback((ingredientId: ConcernCareIngredient) => {
    if (isDayLocked(day, diaryRef.current.conditions, diaryRef.current.currentDay)) return
    const newConcernSet = new Set(selectedConcernCareRef.current)
    if (newConcernSet.has(ingredientId)) {
      newConcernSet.delete(ingredientId)
    } else {
      newConcernSet.add(ingredientId)
      // 성분 경고 카드 등에서 참고하는 diary_profiles.active_ingredients에도 누적 반영
      diaryRef.current.addActiveIngredient(ingredientId)
      // tag는 CONCERN_CARE_TAGS의 영문 라벨이 아니라 원본 id를 그대로 넣는다 —
      // daily-tip.ts에서 "vitc"/"ret"/"nia"로 바로 매칭하기 위함
      diaryRef.current.recordLoggedSlot(day, `concern_care_${ingredientId}`, ingredientId)
    }

    const shouldBeActive = newConcernSet.size > 0
    const newChecked = new Set(checkedSlotsRef.current)
    if (shouldBeActive && !newChecked.has("active")) {
      newChecked.add("active")
      diaryRef.current.recordLoggedSlot(day, "active", SLOT_TAGS.active)
    } else if (!shouldBeActive && newChecked.has("active")) {
      newChecked.delete("active")
    }

    setSelectedConcernCare(newConcernSet)
    setCheckedSlots(newChecked)

    if (diaryRef.current.userId) {
      const recommendedCategory = recommendedSlot || ("active" as SlotType)
      const slotsPayload = [
        ...Array.from(newChecked).map((id) => ({
          slot: id,
          tag: SLOT_TAGS[id],
        })),
        ...Array.from(selectedSpecialCareRef.current).map((id) => ({
          slot: `special_care_${id}`,
          tag: SPECIAL_CARE_TAGS[id],
        })),
        ...Array.from(newConcernSet).map((id) => ({
          slot: `concern_care_${id}`,
          tag: CONCERN_CARE_TAGS[id],
        })),
      ]
      saveUsageLog(diaryRef.current.userId, day, slotsPayload, recommendedCategory).catch((err) => {
        console.error("[saveUsageLog] error:", err)
      })
    }
  }, [day, recommendedSlot])

  const handleSaveFreeInput = useCallback(() => {
    if (isDayLocked(day, diaryRef.current.conditions, diaryRef.current.currentDay)) return
    const content = freeInputText.trim()
    if (!content) return
    diaryRef.current.recordFreeInput(day, content)
  }, [day, freeInputText])

  const handleConditionSelect = useCallback(
    (condition: "good" | "neutral" | "bad") => {
      const linkedCategory = recommendedSlot && checkedSlots.has(recommendedSlot)
        ? recommendedSlot
        : (Array.from(checkedSlots)[0] || ("active" as SlotType))

      onConditionRecord?.(condition, linkedCategory)
      setShowConditionPrompt(false)
      setRewardData({
        specialCare: Array.from(selectedSpecialCare),
        hasActive: checkedSlots.has("active"),
        hasBarrier: checkedSlots.has("barrier"),
        freeInput: freeInputText.trim(),
      })
    },
    [checkedSlots, selectedSpecialCare, freeInputText, recommendedSlot, onConditionRecord],
  )

  // "active" 슬롯은 그리드에 직접 토글 버튼이 없다 — toggleConcernCare()가 성분을
  // 하나라도 선택하면 부수적으로 checkedSlots에 추가하는 파생 상태일 뿐이다(위 주석
  // 참고). 그대로 더하면 고민케어 성분을 N개 고를 때마다 "active" 1개가 겹쳐 세어져
  // 카운트가 항상 실제 선택 개수보다 1 많게 표시된다 — active를 제외하고 센다.
  const totalSelected =
    (checkedSlots.has("active") ? checkedSlots.size - 1 : checkedSlots.size) +
    selectedSpecialCare.size +
    selectedConcernCare.size
  const isDone = isDayLocked(day, diary.conditions, diary.currentDay)

  return (
    <section
      className="rounded-3xl px-6 py-8 bg-card ring-1 ring-border"
      aria-label={t("dailySlots.ariaLabel", locale)}
    >
      <div className="flex flex-col gap-4">
        {/* 헤더 — 오늘 기록을 이미 완료했다면 탭으로 접기/펼치기가 가능한 토글로 동작 */}
        {isDone ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full text-left"
          >
            {collapsed ? (
              <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                <span className="text-sm font-semibold text-foreground">
                  {t(day === diary.currentDay ? "dailySlots.summaryBar.label" : "dailySlots.summaryBar.labelPast", locale)}
                </span>
                <ChevronDown className="size-5 text-muted-foreground -rotate-90" aria-hidden />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {t("dailySlots.headline", locale)}
                </h2>
                <ChevronDown className="size-5 text-muted-foreground" aria-hidden />
              </div>
            )}
          </button>
        ) : (
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("dailySlots.headline", locale)}
          </h2>
        )}

        {/* 기록 완료 후: 슬롯 전체 UI를 접어 한 줄 요약 바로 축소 (재탭하면 다시 펼쳐짐) */}
        <div
          ref={collapseContentRef}
          style={{ maxHeight: collapseMaxHeight }}
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        >
          <div className="flex flex-col gap-4">
            {isDone && !collapsed && (
              <p className="text-xs text-center text-muted-foreground">
                {t("dailySlots.editHint", locale)}
              </p>
            )}

            {/* 슬롯 선택 — 상단 2x2 그리드(선크림/스킨·로션/필링제품/재생크림) + 하단 세로 리스트(기능성제품/특별관리/자유입력).
                모든 요소 간 세로 간격을 gap-3(12px)로 통일 — 2x2 그리드의 행 간격과 동일한 값을
                부모 컨테이너 하나에만 적용해 개별 margin 없이 리듬을 맞춘다. */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {PRIMARY_SLOTS.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    isChecked={checkedSlots.has(slot.id)}
                    toggleSlot={toggleSlot}
                    disabled={isDone}
                  />
                ))}
              </div>

              {/* 고민케어 성분 아코디언 — 성분 선택이 곧 고민케어(active) 슬롯 완료 처리 */}
              <ConcernCareCard
                isExpanded={concernCareExpanded}
                onToggle={() => setConcernCareExpanded(!concernCareExpanded)}
                selectedConcernCare={selectedConcernCare}
                onToggleConcernCare={toggleConcernCare}
                locale={locale}
                disabled={isDone}
              />

              {/* 특별관리 아코디언 */}
              <SpecialCareCard
                isExpanded={specialCareExpanded}
                onToggle={() => setSpecialCareExpanded(!specialCareExpanded)}
                selectedSpecialCare={selectedSpecialCare}
                onToggleSpecialCare={toggleSpecialCare}
                locale={locale}
                disabled={isDone}
              />

              {/* 자유입력 — raw text 그대로 저장, 정량 분석 대상 아님 */}
              <FreeInputCard
                value={freeInputText}
                onChange={setFreeInputText}
                onSave={handleSaveFreeInput}
                locale={locale}
                disabled={isDone}
              />

              {/* 하단 섹션 */}
              <div className="space-y-2">
                {totalSelected > 0 && (
                  <p className="text-sm font-bold text-center text-foreground">
                    {locale === "ko" ? `${totalSelected}개 선택됨` : `${totalSelected} selected`}
                  </p>
                )}

                {showConditionPrompt && (
                  <div className="space-y-3 bg-secondary p-4 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">{conditionQuestion}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConditionSelect("good")}
                        className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                      >
                        <Smile className="size-4" aria-hidden />
                        {t("onboarding.mappingResult.condition_good", locale)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConditionSelect("neutral")}
                        className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                      >
                        <Meh className="size-4" aria-hidden />
                        {t("onboarding.mappingResult.condition_neutral", locale)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConditionSelect("bad")}
                        className="flex-1 rounded-xl border border-border bg-card text-foreground px-3 py-2 text-xs font-semibold transition-colors flex flex-col items-center gap-1 hover:bg-secondary"
                      >
                        <Frown className="size-4" aria-hidden />
                        {t("onboarding.mappingResult.condition_bad", locale)}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConditionPrompt(false)}
                      className="w-full text-xs font-medium text-muted-foreground py-2 hover:text-foreground"
                    >
                      {t("common.later", locale)}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isDone}
                  onClick={() => {
                    if (totalSelected > 0) {
                      setShowConditionPrompt(true)
                    }
                  }}
                  className={cn(
                    "w-full rounded-full font-bold py-3 transition-colors text-sm",
                    isDone
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      : "bg-primary hover:bg-primary/80 text-primary-foreground"
                  )}
                >
                  {isDone ? t("dailySlots.recordButton.done", locale) : t("dailySlots.recordButton.default", locale)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {rewardData && (
        <DailyRewardCard
          data={rewardData}
          locale={locale}
          onDone={() => {
            setRewardData(null)
            setCollapsed(true)
            onCollapse?.()
          }}
        />
      )}
    </section>
  )
}
