"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Send } from "lucide-react"

interface CompletionFeedbackProps {
  onSubmit: (feedback: string) => Promise<void>
}

export function CompletionFeedback({ onSubmit }: CompletionFeedbackProps) {
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(feedback)
      setIsSubmitted(true)
      setFeedback("")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-4xl bg-secondary/60 p-4 text-center text-sm font-medium text-secondary-foreground ring-1 ring-border">
        <p>소감 감사합니다! 다음 단계도 함께하길 기대할게요 🤍</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-4xl bg-card p-4 ring-1 ring-border">
      <h3 className="text-sm font-semibold text-foreground">이 30일, 어떠셨어요?</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="가장 기억에 남는 하루가 있었나요?"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        rows={3}
        disabled={isSubmitting}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || isSubmitting}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
            feedback.trim() && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <Send className="size-3.5" aria-hidden />
          보내기
        </button>
        <button
          onClick={() => setFeedback("")}
          disabled={isSubmitting}
          className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-card/70 transition-colors"
        >
          건너뛰기
        </button>
      </div>
    </div>
  )
}
