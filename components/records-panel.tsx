"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"
import { useDiary } from "@/lib/diary-context"
import { SkinBalanceRadar } from "@/components/skin-balance-radar"

const OPEN_KEY = "hoppy-records-panel-open"

/**
 * '피부 밸런스' 레이더를 접이식으로 묶는다. 기록 캘린더는 홈 하단의
 * SkinArchiveCalendar로 분리했다(중복 제거). 스킨 웨더 개편의 목적이
 * "매일 1초 확인"이라 기본은 접힌 상태. 펼침 여부는 로컬에 기억.
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
        <SkinBalanceRadar skinType={diary.skinType} locale={locale} onChangeSkinType={diary.setSkinType} />
      )}
    </div>
  )
}
