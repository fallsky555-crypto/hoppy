interface ProgressHeaderProps {
  currentDay: number
  totalDays: number
  completedCount: number
}

export function ProgressHeader({ currentDay, totalDays, completedCount }: ProgressHeaderProps) {
  const percent = Math.round((currentDay / totalDays) * 100)

  return (
    <header className="rounded-4xl bg-card px-6 py-7 ring-1 ring-border">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">SKIN DIET DIARY</p>
      <h1 className="mt-2.5 font-display text-lg font-semibold leading-tight text-foreground text-balance">
        30일 도자기 피부 프로젝트
      </h1>

      <div className="mt-[22px] flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">오늘까지의 여정</span>
        <span className="font-display text-[30px] font-semibold text-foreground">
          {currentDay}
          <span className="font-sans text-[15px] font-medium text-muted-foreground"> / {totalDays}일</span>
        </span>
      </div>

      <div
        className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-accent"
        role="progressbar"
        aria-valuenow={currentDay}
        aria-valuemin={0}
        aria-valuemax={totalDays}
        aria-label={`30일 중 ${currentDay}일 진행`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-[#6B6558]">
        지금까지 <span className="font-semibold text-foreground">{completedCount}일</span>의 루틴을 완수했어요 · 딱{" "}
        <span className="font-semibold text-primary">{totalDays - currentDay}일</span> 남았어요
      </p>
    </header>
  )
}
