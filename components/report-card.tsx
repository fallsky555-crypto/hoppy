"use client"

import { useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { getIngredientGuide } from "@/lib/ingredient-guide"
import { getTrendStat, getDonutChartValues, getAgeLabel } from "@/lib/trend-stats"
import { getIngredientWarning } from "@/lib/ingredient-warnings"
import { cn } from "@/lib/utils"

interface ReportCardProps {
  mode: "onboarding" | "revisit"
  age?: string | null
  skinType?: string | null
  concernTags?: string | null // 쉼표 구분 또는 배열 형태
  activeIngredients?: string[] | null
  onCTAClick?: () => void
}

export function ReportCard({
  mode,
  age,
  skinType,
  concernTags,
  activeIngredients,
  onCTAClick,
}: ReportCardProps) {
  // concern tags를 배열로 정규화
  const concernTagArray = useMemo(() => {
    if (!concernTags) return []
    if (typeof concernTags === "string") {
      return concernTags.split(",").map((tag) => tag.trim().toUpperCase())
    }
    return Array.isArray(concernTags) ? concernTags : []
  }, [concernTags])

  // 첫 번째 concern tag 사용 (시안에서는 하나씩 표시)
  const primaryConcern = concernTagArray[0] ?? null

  // 트렌드 통계
  const trendStat = useMemo(() => {
    if (!primaryConcern || !age) return null
    return getTrendStat(primaryConcern, age)
  }, [primaryConcern, age])

  // 성분 가이드
  const ingredients = useMemo(() => {
    if (!primaryConcern || !skinType) return []
    return getIngredientGuide(primaryConcern, skinType)
  }, [primaryConcern, skinType])

  // 성분 경고
  const warning = useMemo(() => {
    return getIngredientWarning(activeIngredients)
  }, [activeIngredients])

  const ageLabel = getAgeLabel(age)

  // revisit 모드에서 핵심 데이터 부재 시 안내 UI 표시
  const hasCoreData = age && skinType && concernTags
  if (mode === "revisit" && !hasCoreData) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <img
            src="/onboarding/intro-02.jpeg"
            alt="호빵이"
            className="w-16 h-16 rounded-full object-cover mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              아직 진단 정보가 부족해요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              검사지에서 답변을 추가하면<br />
              더 정확한 정보를 볼 수 있어요
            </p>
          </div>
          <a
            href="/"
            className="inline-block bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            검사지 다시 보기
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-6">
      {/* 헤더: 사용자 정보 */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src="/onboarding/intro-02.jpeg"
          alt="호빵이"
          className="w-10 h-10 rounded-full object-cover border border-card shadow-sm"
        />
        <div className="text-xs text-ink-3 leading-tight">
          <div className="text-sm font-bold text-ink-2">호빵이</div>
          <div>당신의 기록을 함께 정리했어요</div>
        </div>
      </div>

      {/* 타이틀 섹션 */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-primary-text mb-2">
          My Skin Diagnosis
        </div>
        <h1 className="text-2xl font-bold leading-tight text-ink mb-2">
          {ageLabel && primaryConcern ? (
            <>
              {ageLabel} · {primaryConcern}
              <br />
            </>
          ) : null}
          기록을 정리했어요
        </h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          검사지에서 답해주신 내용을 바탕으로
          <br />
          참고할 만한 정보를 모아봤어요
        </p>
      </div>

      {/* 트렌드 통계 도넛 */}
      {trendStat && (
        <div className="bg-primary-fg text-white rounded-3xl p-8 mb-5 shadow-lg text-center">
          <svg width="164" height="164" viewBox="0 0 164 164" className="mx-auto mb-4">
            <circle
              cx="82"
              cy="82"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,.12)"
              strokeWidth="14"
            />
            <circle
              cx="82"
              cy="82"
              r="70"
              fill="none"
              stroke="#85B7EB"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={getDonutChartValues(trendStat.percentage).strokeDasharray}
              strokeDashoffset={getDonutChartValues(trendStat.percentage).strokeDashoffset}
              transform="rotate(-90 82 82)"
            />
            <text
              x="82"
              y="76"
              textAnchor="middle"
              fontFamily="Pretendard, sans-serif"
              fontSize="38"
              fontWeight="800"
              fill="#fff"
            >
              {trendStat.percentage.toFixed(1)}%
            </text>
            <text
              x="82"
              y="100"
              textAnchor="middle"
              fontFamily="Pretendard, sans-serif"
              fontSize="12"
              fill="rgba(255,255,255,.65)"
            >
              {ageLabel} 응답 비율
            </text>
          </svg>
          <p className="text-sm font-bold leading-relaxed mb-2">
            {ageLabel} 응답자 10명 중 약 {Math.round(trendStat.percentage / 10)}명이
            <br />
            {primaryConcern} 피부를 고민으로 꼽았어요
          </p>
          <p className="text-xs text-white/55">
            출처: 마크로밀엠브레인 트렌드모니터, 전국 성인 1,200명 설문(2016)
          </p>
        </div>
      )}

      {/* 성분 가이드 섹션 */}
      {ingredients.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-text mt-6 mb-3">
            피부 기준 성분가이드
          </p>

          <div className="bg-card border-1.5 border-line rounded-2xl p-5 mb-4">
            <span className="inline-block text-xs font-bold text-primary-text bg-primary-soft px-2.5 py-1 rounded-full mb-2.5">
              {primaryConcern}
            </span>
            <p className="text-sm font-bold text-ink mb-1 leading-relaxed">
              추가하시면 좋은 성분: <span className="text-primary-text">{ingredients.join(" · ")}</span>
            </p>
            <p className="text-xs text-ink-2 leading-relaxed">
              나이아신아마이드는 다른 성분과 궁합을 타는 편이니, 처음엔 가볍게 시작해보시고 피부 반응을 보면서 횟수를 조절해보시는 것도 방법이에요.
            </p>
          </div>
        </>
      )}

      {/* 성분 경고 카드 */}
      {warning && (
        <div
          className={cn(
            "rounded-2xl p-5 mb-4 border-1.5 flex gap-3",
            warning.level === "warning"
              ? "bg-warn-bg border-warn-border"
              : "bg-warn-bg border-warn-border"
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--warn)" }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--warn)" }}>
              {warning.title}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {warning.message}
            </p>
          </div>
        </div>
      )}

      {/* 현재 사용 성분 카드 */}
      {activeIngredients && activeIngredients.length > 0 && (
        <div className="bg-primary-soft rounded-2xl p-4.5 mb-6">
          <p className="text-xs leading-relaxed text-primary-fg">
            <span className="font-bold">지금 쓰고 계신 성분</span> — {activeIngredients.join(" · ")}
          </p>
          <p className="text-xs leading-relaxed text-primary-fg mt-2">
            레티놀은 효과보다 <span className="font-bold">사용 간격</span>이 더 중요한 성분이에요. 호빵이 스킨저널에서 얼마나 자주, 어떤 간격으로 쓰고 계신지 함께 기록해보시면 도움이 될 거예요.
          </p>
        </div>
      )}

      {/* 온보딩 모드: 완주 동기 카드 + CTA */}
      {mode === "onboarding" && (
        <>
          {/* 완주 동기 카드 */}
          <div className="rounded-2xl p-6 mb-6 text-white" style={{ backgroundColor: "#042C53" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#9CC3EE" }}>
              기록을 시작하면
            </p>

            <div className="space-y-3.5">
              <div className="flex gap-4 pb-3.5 border-b border-white/8">
                <div className="text-xs font-bold flex-shrink-0 w-16" style={{ color: "#9CC3EE" }}>
                  Day 30
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  뭐가 나한테 맞았는지 보여요
                </div>
              </div>

              <div className="flex gap-4 pb-3.5 border-b border-white/8">
                <div className="text-xs font-bold flex-shrink-0 w-16" style={{ color: "#9CC3EE" }}>
                  Month 6
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  새던 돈이 줄어들어요
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-xs font-bold flex-shrink-0 w-16" style={{ color: "#9CC3EE" }}>
                  Year 1
                </div>
                <div className="text-sm font-bold text-white leading-relaxed">
                  이건 나만의 데이터가 돼요
                </div>
              </div>
            </div>
          </div>

          {/* 철학 문구 */}
          <p className="text-xs text-ink-3 text-center leading-relaxed mb-6">
            남의 데이터 그만 보고,
            <br />
            내 데이터로 나만의 디지털 에스테틱을 체험해보세요.
          </p>

          {/* CTA 버튼 */}
          <button
            onClick={onCTAClick}
            className="w-full bg-primary text-primary-fg font-bold text-base rounded-2xl px-6 py-4.5 shadow-lg hover:opacity-90 transition-opacity mb-3"
          >
            나만의 디지털 에스테틱 체험하기
          </button>
          <p className="text-xs text-ink-3 text-center leading-relaxed">
            광고 없이, 협찬 없이 —
            <br />
            처음부터 끝까지 당신의 이야기만 들어요
          </p>
        </>
      )}

      {/* 모드별 하단 텍스트 */}
      {mode === "revisit" && (
        <>
          <p className="text-xs text-ink-3 text-center leading-relaxed mb-4">
            당신의 피부에 정답은 없어요.
            <br />
            하지만 꾸준히 쌓인 기록은, 무엇이 당신에게
            <br />
            잘 맞았는지 스스로 알아가는 가장 좋은 단서가 돼요.
          </p>
          <button className="w-full text-center text-sm font-bold text-primary-text bg-card border-1.5 border-line rounded-2xl px-6 py-3.5 hover:bg-secondary transition-colors">
            설정 &gt; 내 정보 다시보기에서 언제든 확인하세요
          </button>
          <p className="text-xs text-ink-3 text-center mt-3">
            내 피부의 기록, Hoppy
          </p>
        </>
      )}
    </main>
  )
}
