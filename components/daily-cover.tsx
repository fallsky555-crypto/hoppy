"use client"

import { useState, useEffect, useRef } from "react"
import { Heart } from "lucide-react"
import { t } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

interface DailyCoverProps {
  locale: Locale
  name: string | null
  joinDate: string
  onSaveName: (name: string | null) => void
  onClose: () => void
}

export function DailyCover({ locale, name, onSaveName, onClose }: DailyCoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"full" | "quick">("full")
  const [visible, setVisible] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const hasCheckedRef = useRef(false)

  // 하루 중 첫 진입인지 판별 — 첫 진입이면 풀버전, 이후 재진입이면 퀵 버전(자동 소멸)
  // hasCheckedRef로 감싸는 이유: 이 판별 로직 자체가 localStorage에 쓰는 부수효과라
  // React StrictMode의 effect 이중 실행(dev 전용) 시 두 번째 실행이 첫 번째가 방금 쓴
  // 값을 읽어버려 첫 진입인데도 quick으로 오판하는 문제가 있었다.
  useEffect(() => {
    if (hasCheckedRef.current) return
    hasCheckedRef.current = true

    const today = new Date().toISOString().split('T')[0]
    const lastShownDate = localStorage.getItem('hoppy-last-cover-shown-date')

    if (lastShownDate !== today) {
      setMode("full")
      setIsOpen(true)
      localStorage.setItem('hoppy-last-cover-shown-date', today)
    } else {
      setMode("quick")
      setIsOpen(true)
    }
  }, [])

  // 퀵 모드 페이드 인/아웃 + 자동 닫힘 타이밍
  useEffect(() => {
    if (!isOpen) return
    const raf = requestAnimationFrame(() => setVisible(true))

    if (mode === "quick") {
      const fadeOutTimer = setTimeout(() => setVisible(false), 1150)
      const unmountTimer = setTimeout(() => {
        setIsOpen(false)
        onClose()
      }, 1500)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(fadeOutTimer)
        clearTimeout(unmountTimer)
      }
    }

    return () => cancelAnimationFrame(raf)
  }, [isOpen, mode, onClose])

  const quote = t("onboarding.startToday.subtitle", locale)

  const displayLine = name
    ? `${name}${t("dailyCover.recordSuffix", locale)}`
    : `My Skin Journal`

  if (!isOpen) return null

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    onSaveName(trimmed.length > 0 ? trimmed : "")
  }

  // 퀵 버전: 같은 날 재진입 — 문구만 잠깐 페이드 인/아웃 후 자동으로 사라짐
  if (mode === "quick") {
    return (
      <div
        className={`fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      >
        <div className="flex flex-col items-center gap-8 text-center px-6">
          <img
            src="/onboarding/cover-cat-sleeping.png"
            alt=""
            className="h-64 w-64 object-contain"
          />
          <p className="text-3xl font-serif font-medium text-white drop-shadow">
            {quote}
          </p>
        </div>
      </div>
    )
  }

  // 풀 버전: 하루 첫 진입
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-md aspect-[1240/1748] rounded-3xl overflow-hidden bg-cover bg-center flex flex-col justify-center items-center relative"
        style={{
          backgroundImage: 'url(/onboarding/bg-page1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center p-6">
          <img
            src="/onboarding/cover-cat-sleeping.png"
            alt=""
            className="h-48 w-48 object-contain"
          />

          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-medium text-foreground leading-snug">
              {quote}
            </h2>

            {name === null ? (
              // 최초 진입: 밑줄형 인풋 + "저장하고 계속하기" 단일 액션 (저장과 동시에 닫힘)
              <div className="flex flex-col items-center gap-3 pt-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t("dailyCover.namePlaceholder", locale)}
                  className="w-full max-w-[200px] bg-transparent border-0 border-b border-[#B8C9D9] text-center text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#5FA8D3] py-1.5 transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  className="text-[13px] tracking-wide text-[#5FA8D3] hover:text-[#3d7fa8] transition-colors"
                >
                  {t("dailyCover.nameSave", locale)}
                </button>
              </div>
            ) : (
              // 재방문: 텍스트만 표시, 닫기는 아래 원형 버튼으로
              <p className="text-lg text-muted-foreground pt-1">
                {displayLine}
              </p>
            )}
          </div>

          {name !== null && (
            <button
              onClick={handleClose}
              aria-label={t("common.today", locale)}
              className="h-11 w-11 rounded-full border border-[#5FA8D3] flex items-center justify-center text-[#5FA8D3] hover:bg-[#5FA8D3]/10 transition-colors mt-2"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
