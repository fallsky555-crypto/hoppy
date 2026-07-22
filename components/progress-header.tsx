interface ProgressHeaderProps {
  currentDay: number
  totalDays: number
  completedCount: number
}

export function ProgressHeader({ currentDay, totalDays, completedCount }: ProgressHeaderProps) {
  const percent = Math.round((currentDay / totalDays) * 100)

  return (
    <header className="rounded-4xl bg-card p-5 shadow-sm ring-1 ring-border">
      <p className="text-xs font-semibold text-primary">3개월 장벽 리셋 프로젝트</p>
      <h1 className="font-display text-lg font-bold leading-tight text-emphasis text-balance">
        1단계 · 초보자 코스 진행 중
      </h1>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-sm font-medium text-muted-foreground">오늘까지의 여정</span>
        <span className="font-display text-sm font-bold text-foreground">
          <span className="text-primary">{currentDay}일</span> / {totalDays}일
        </span>
      </div>

      <div
        className="mt-2 h-4 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={currentDay}
        aria-valuemin={0}
        aria-valuemax={totalDays}
        aria-label={`30일 중 ${currentDay}일 진행`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        지금까지 <span className="font-semibold text-foreground">{completedCount}일</span>의 루틴을 완수했어요. 딱{" "}
        <span className="font-semibold text-primary">{totalDays - currentDay}일</span> 남았어요.
      </p>
    </header>
  )
}
