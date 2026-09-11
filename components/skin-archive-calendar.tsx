"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { t, interpolate, type Locale } from "@/lib/i18n"
import { useDiary } from "@/lib/diary-context"

/** 이번에 맞춘 세이지/틸 그린 테마 */
const ACCENT = "#5B9A97"
const DAY_MS = 86_400_000

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}
function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * 스킨 다이어리 기록 — D-카운트다운·압박성 문구 없이, 내가 날씨 방어를 체크인한
 * 날짜만 세이지 그린 점으로 잔잔하게 보여주는 아카이브형 미니 캘린더.
 * 가입월 ~ 이번 달 범위에서만 앞뒤로 넘길 수 있다.
 */
export function SkinArchiveCalendar({ locale }: { locale: Locale }) {
  const diary = useDiary()

  const today = useMemo(() => startOfDay(new Date()), [])
  const joinStart = useMemo(() => startOfDay(new Date(diary.joinDate)), [diary.joinDate])
  const minMonth = useMemo(() => startOfMonth(joinStart), [joinStart])
  const maxMonth = useMemo(() => startOfMonth(today), [today])

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today))

  const loggedSet = useMemo(() => new Set(diary.loggedDays), [diary.loggedDays])
  const totalLogged = diary.loggedDays.length

  /** 실제 날짜 → 프로그램 day 번호(가입일=1, 건너뛰는 날 없음) */
  const programDayForDate = (date: Date) =>
    Math.round((startOfDay(date).getTime() - joinStart.getTime()) / DAY_MS) + 1

  const cells = useMemo(() => {
    const gridStart = new Date(viewMonth)
    gridStart.setDate(gridStart.getDate() - viewMonth.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [viewMonth])

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" }),
    [locale],
  )

  const atMinMonth = isSameMonth(viewMonth, minMonth)
  const atMaxMonth = isSameMonth(viewMonth, maxMonth)

  const goPrev = () =>
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      return next < minMonth ? minMonth : next
    })
  const goNext = () =>
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      return next > maxMonth ? maxMonth : next
    })

  return (
    <section
      className="border-t border-[#E7E4DD] px-1 pt-6"
      aria-label={t("archiveCalendar.ariaLabel", locale)}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[13px] font-semibold text-foreground">{t("archiveCalendar.title", locale)}</h2>
          <p className="text-[11px] font-medium text-muted-foreground">
            {interpolate(
              t(totalLogged === 1 ? "archiveCalendar.subtitleOne" : "archiveCalendar.subtitle", locale),
              { count: String(totalLogged) },
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={atMinMonth}
            aria-label={t("archiveCalendar.prevMonth", locale)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors",
              atMinMonth ? "cursor-not-allowed opacity-30" : "hover:bg-secondary",
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="min-w-[92px] text-center text-[12px] font-semibold tabular-nums text-foreground">
            {monthFormatter.format(viewMonth)}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={atMaxMonth}
            aria-label={t("archiveCalendar.nextMonth", locale)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors",
              atMaxMonth ? "cursor-not-allowed opacity-30" : "hover:bg-secondary",
            )}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {(t("calendar.weekdays", locale) as string[]).map((label, i) => (
          <div
            key={i}
            className="flex h-7 items-center justify-center text-[11px] font-semibold text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((date) => {
          const inMonth = isSameMonth(date, viewMonth)
          const programDay = programDayForDate(date)
          const inRange = programDay >= 1 && startOfDay(date).getTime() <= today.getTime()
          const done = inRange && loggedSet.has(programDay)
          const isToday = isSameDate(date, today)

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-[12px] tabular-nums transition-colors",
                !inMonth && "opacity-40",
                done
                  ? "border-transparent font-semibold text-white"
                  : isToday
                    ? "border-[#5B9A97]/45 font-bold"
                    : "border-[#EBE8E1] bg-[#F6F5F1] font-semibold text-muted-foreground",
              )}
              style={
                done
                  ? { backgroundColor: ACCENT }
                  : isToday
                    ? { backgroundColor: "#E4EEEC", color: "#2F6360" }
                    : undefined
              }
            >
              {date.getDate()}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
        <span className="text-[11px] font-medium text-muted-foreground">
          {t("archiveCalendar.legend", locale)}
        </span>
      </div>
    </section>
  )
}
