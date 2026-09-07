"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { useDiary } from "@/lib/diary-context"
import { SkinBalanceRadar } from "@/components/skin-balance-radar"
import { CalendarGrid } from "@/components/calendar-grid"

const OPEN_KEY = "hoppy-records-panel-open"
type RecordTab = "balance" | "calendar"

/**
 * '피부 밸런스'와 '30일 기록 캘린더'를 하나의 접이식 패널로 묶는다.
 * 스킨 웨더 개편의 목적이 "매일 1초 확인"이라, 기본은 접힌 상태로 두고
 * 날씨 + DO/SKIP 카드가 첫 화면에서 돋보이게 한다. 펼침 여부는 로컬에 기억.
 */
export function RecordsPanel({ locale }: { locale: Locale }) {
  const diary = useDiary()

  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(OPEN_KEY) === "1"
    } catch {
      return false
    }
  })
  const [tab, setTab] = useState<RecordTab>("balance")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(OPEN_KEY, next ? "1" : "0")
      } catch {
        // 저장 실패해도 이번 세션 토글은 반영됨
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{t("recordsPanel.title", locale)}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <div className="flex gap-1.5 rounded-full bg-secondary p-1">
            {(["balance", "calendar"] as RecordTab[]).map((tb) => (
              <button
                key={tb}
                type="button"
                onClick={() => setTab(tb)}
                aria-pressed={tab === tb}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-[12.5px] font-bold transition-colors",
                  tab === tb ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`recordsPanel.tab.${tb}`, locale)}
              </button>
            ))}
          </div>

          {tab === "balance" ? (
            <SkinBalanceRadar skinType={diary.skinType} locale={locale} onChangeSkinType={diary.setSkinType} />
          ) : (
            <CalendarGrid
              totalDays={diary.totalDays}
              currentDay={diary.currentDay}
              selectedDay={selectedDay ?? diary.currentDay}
              completedDays={diary.loggedDays}
              justStampedDay={null}
              onSelect={setSelectedDay}
              loggedSlots={diary.loggedSlots}
              conditions={diary.conditions}
              joinDate={diary.joinDate}
              revealPulse={false}
            />
          )}
        </>
      )}
    </div>
  )
}
