"use client"

import { useState } from "react"
import { Heart, Pencil } from "lucide-react"
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
  const [isEditingName, setIsEditingName] = useState(name === null)
  const [nameInput, setNameInput] = useState(name ?? "")

  const quote = t("onboarding.startToday.subtitle", locale)

  const displayLine = name
    ? `${name}${t("dailyCover.recordSuffix", locale)}`
    : `My Skin Journal`

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    onSaveName(trimmed.length > 0 ? trimmed : "")
    setIsEditingName(false)
  }

  const handleEditName = () => {
    setNameInput(name ?? "")
    setIsEditingName(true)
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 bg-background">
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
            <h2 className="text-[1.47rem] font-sans font-medium text-foreground leading-snug">
              {quote}
            </h2>

            {isEditingName ? (
              // 이름 입력/수정: 밑줄형 인풋 + "저장하고 계속하기"
              <div className="flex flex-col items-center gap-3 pt-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t("dailyCover.namePlaceholder", locale)}
                  className="w-full max-w-[200px] bg-transparent border-0 border-b border-[#B8C9D9] text-center text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#5FA8D3] py-1.5 transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-[13px] font-semibold tracking-wide text-[#5FA8D3] bg-[#5FA8D3]/10 rounded-full px-4 py-1.5 hover:bg-[#5FA8D3]/20 transition-colors"
                >
                  {t("dailyCover.nameSave", locale)}
                </button>
              </div>
            ) : (
              // 이름 표시: 탭하면 다시 인풋으로 전환해 수정 가능 (연필 아이콘도 같은 클릭 영역)
              <button
                onClick={handleEditName}
                className="inline-flex items-center gap-1.5 text-lg text-muted-foreground pt-1 underline decoration-dotted underline-offset-4 hover:text-foreground transition-colors"
              >
                {displayLine}
                <Pencil className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label={t("common.today", locale)}
            className="h-11 w-11 rounded-full border border-[#5FA8D3] flex items-center justify-center text-[#5FA8D3] hover:bg-[#5FA8D3]/10 transition-colors mt-2"
          >
            <Heart className="h-4 w-4" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  )
}
