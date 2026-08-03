"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useDiary as useUseDiary } from "@/lib/use-diary"

// useDiary() 훅이 반환하는 타입 추출
type DiaryContextType = ReturnType<typeof useUseDiary>

const DiaryContext = createContext<DiaryContextType | undefined>(undefined)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const diary = useUseDiary()

  return <DiaryContext.Provider value={diary}>{children}</DiaryContext.Provider>
}

export function useDiary(): DiaryContextType {
  const context = useContext(DiaryContext)
  if (context === undefined) {
    throw new Error("useDiary must be used within DiaryProvider")
  }
  return context
}
