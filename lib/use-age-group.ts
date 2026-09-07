"use client"

import { useEffect, useState } from "react"
import { AGE_GROUPS, DEFAULT_AGE_GROUP, type AgeGroup } from "@/lib/skin-weather"

const STORAGE_KEY = "hoppy-skin-weather-age"

/**
 * 메인 화면 연령대 탭 상태. 온보딩 설문 없이 로컬에만 기억한다
 * (진단 프로필의 age와는 별개 — 어디까지나 '오늘 이 화면을 어떻게 볼지' 선택).
 */
export function useAgeGroup(): [AgeGroup, (g: AgeGroup) => void] {
  const [group, setGroup] = useState<AgeGroup>(DEFAULT_AGE_GROUP)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (AGE_GROUPS as string[]).includes(saved)) {
        setGroup(saved as AgeGroup)
      }
    } catch {
      // 프라이빗 모드 등 — 기본값 유지
    }
  }, [])

  const update = (g: AgeGroup) => {
    setGroup(g)
    try {
      localStorage.setItem(STORAGE_KEY, g)
    } catch {
      // 저장 실패해도 이번 세션 선택은 반영됨
    }
  }

  return [group, update]
}
