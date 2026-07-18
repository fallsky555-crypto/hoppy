"use client"

import { useId, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { BarrierScorePoint } from "@/lib/scheduling-engine"
import { TrendingUp } from "lucide-react"

interface BarrierScoreChartProps {
  log: BarrierScorePoint[]
  /** 그래프가 열리는 Day (2주차 시작일) */
  unlockDay: number
}

const VIEW_W = 300
const VIEW_H = 120
const PAD = { top: 14, right: 10, bottom: 18, left: 26 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom

function scoreToY(score: number) {
  return PAD.top + (1 - score / 100) * PLOT_H
}

export function BarrierScoreChart({ log, unlockDay }: BarrierScoreChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const points = useMemo(
    () =>
      log.map((point, i) => ({
        ...point,
        x: PAD.left + (log.length === 1 ? PLOT_W / 2 : (i / (log.length - 1)) * PLOT_W),
        y: scoreToY(point.score),
      })),
    [log],
  )

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD.top + PLOT_H} L${points[0].x.toFixed(1)},${PAD.top + PLOT_H} Z`
      : ""

  const latest = log[log.length - 1]
  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (points.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VIEW_W
    let nearest = 0
    let nearestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  if (log.length === 0) {
    return (
      <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border" aria-label="장벽 점수">
        <h2 className="mb-1 flex items-center gap-1.5 font-display text-base font-bold text-foreground">
          <TrendingUp className="size-4 text-primary" aria-hidden />
          장벽 점수
        </h2>
        <p className="rounded-2xl bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
          🔒 2주차(Day {unlockDay})부터 장벽 점수 그래프가 열려요. 꾸준히 기록하면서 조금만 기다려주세요!
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-4xl bg-card p-4 shadow-sm ring-1 ring-border" aria-label="장벽 점수 그래프">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-base font-bold text-foreground">
          <TrendingUp className="size-4 text-primary" aria-hidden />
          장벽 점수
        </h2>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          {showTable ? "그래프로 보기" : "표로 보기"}
        </button>
      </div>

      <p className="mb-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-primary">{latest.score}</span>
        <span className="text-sm font-bold text-muted-foreground">점</span>
        <span className="ml-1 text-[11px] text-muted-foreground">Day {latest.day} 기준</span>
      </p>

      {showTable ? (
        <div className="max-h-40 overflow-y-auto rounded-2xl ring-1 ring-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-3 py-2 font-bold">Day</th>
                <th className="px-3 py-2 font-bold">점수</th>
              </tr>
            </thead>
            <tbody>
              {log.map((point) => (
                <tr key={point.day} className="border-t border-border">
                  <td className="px-3 py-1.5 tabular-nums text-foreground/80">Day {point.day}</td>
                  <td className="px-3 py-1.5 tabular-nums font-bold text-foreground">{point.score}점</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="h-28 w-full touch-none"
            role="img"
            aria-label={`Day ${log[0].day}부터 Day ${latest.day}까지 장벽 점수 추이, 최근 점수 ${latest.score}점`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 리셋시브 그리드라인: 0 / 50 / 100 */}
            {[0, 50, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={VIEW_W - PAD.right}
                  y1={scoreToY(tick)}
                  y2={scoreToY(tick)}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text x={PAD.left - 6} y={scoreToY(tick) + 3} textAnchor="end" fontSize={8} fill="var(--color-muted-foreground)">
                  {tick}
                </text>
              </g>
            ))}

            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            {linePath && (
              <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* 끝점 마커 */}
            {points.length > 0 && (
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth={2} />
            )}

            {/* 크로스헤어 */}
            {hovered && (
              <>
                <line x1={hovered.x} x2={hovered.x} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="var(--color-border)" strokeWidth={1} />
                <circle cx={hovered.x} cy={hovered.y} r={4} fill="var(--color-primary)" stroke="var(--color-card)" strokeWidth={2} />
              </>
            )}

            {/* x축: 첫날 / 마지막날 */}
            <text x={PAD.left} y={VIEW_H - 4} fontSize={8} fill="var(--color-muted-foreground)">
              Day {log[0].day}
            </text>
            <text x={VIEW_W - PAD.right} y={VIEW_H - 4} textAnchor="end" fontSize={8} fill="var(--color-muted-foreground)">
              Day {latest.day}
            </text>
          </svg>

          {hovered && (
            <div
              className={cn(
                "pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[10px] font-bold text-background shadow-sm",
              )}
              style={{ left: `${(hovered.x / VIEW_W) * 100}%` }}
            >
              Day {hovered.day} · {hovered.score}점
            </div>
          )}
        </div>
      )}
    </section>
  )
}
