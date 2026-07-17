"use client"

import { useCallback, useEffect, useState } from "react"
import { dayFromJoinDate, TOTAL_DAYS } from "@/lib/schedule"

export interface DailyHabit {
  sunscreen: boolean
  water: number // 0 ~ 8
}

interface DiaryState {
  /** 가입일(Day 1) — ISO 문자열 */
  joinDate: string
  completedDays: number[]
  habits: Record<number, DailyHabit>
}

const STORAGE_KEY = "hoppy-skin-diary-v1"
const MAX_WATER = 8

function todayISO() {
  return new Date().toISOString()
}

function loadState(): DiaryState {
  const fresh: DiaryState = { joinDate: todayISO(), completedDays: [], habits: {} }
  if (typeof window === "undefined") return fresh
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    return {
      joinDate: parsed.joinDate ?? fresh.joinDate,
      completedDays: parsed.completedDays ?? [],
      habits: parsed.habits ?? {},
    }
  } catch {
    return fresh
  }
}

export function useDiary() {
  // 하이드레이션 불일치를 피하기 위해 초기엔 기본값, 마운트 후 localStorage 로드
  const [state, setState] = useState<DiaryState>({ joinDate: todayISO(), completedDays: [], habits: {} })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 저장 실패는 무시 (사파리 프라이빗 모드 등)
    }
  }, [state, hydrated])

  const currentDay = dayFromJoinDate(state.joinDate)

  const complete = useCallback((day: number) => {
    setState((prev) =>
      prev.completedDays.includes(day) ? prev : { ...prev, completedDays: [...prev.completedDays, day] },
    )
  }, [])

  const getHabit = useCallback(
    (day: number): DailyHabit => state.habits[day] ?? { sunscreen: false, water: 0 },
    [state.habits],
  )

  const toggleSunscreen = useCallback((day: number) => {
    setState((prev) => {
      const cur = prev.habits[day] ?? { sunscreen: false, water: 0 }
      return { ...prev, habits: { ...prev.habits, [day]: { ...cur, sunscreen: !cur.sunscreen } } }
    })
  }, [])

  const setWater = useCallback((day: number, delta: number) => {
    setState((prev) => {
      const cur = prev.habits[day] ?? { sunscreen: false, water: 0 }
      const water = Math.min(Math.max(cur.water + delta, 0), MAX_WATER)
      return { ...prev, habits: { ...prev.habits, [day]: { ...cur, water } } }
    })
  }, [])

  return {
    hydrated,
    currentDay,
    totalDays: TOTAL_DAYS,
    completedDays: state.completedDays,
    complete,
    getHabit,
    toggleSunscreen,
    setWater,
    maxWater: MAX_WATER,
  }
}
