import type { Locale } from "@/lib/i18n"
import { t, interpolate } from "@/lib/i18n"

/**
 * 2026-07-27 최종 스펙: title/detail 순환 기반으로 카테고리별 감성·사용법을 번갈아 노출한다.
 * 같은 카테고리가 calendar에 등장한 횟수를 세어, 그 순서에 맞는 title/detail 배열을 순환 선택.
 * caution은 기존 정보성 문구(성분 설명)를 그대로 유지한다.
 *
 * lib/scheduling-engine.ts는 건드리지 않는다 — 이 파일은 화면에 보여줄 문구만
 * 담당하고, 어떤 카테고리·날짜인지는 기존 엔진(getRecipeForDay, dayFromJoinDate
 * 등)이 그대로 정한다.
 *
 * [2026-08-09] getCategoryCopy()/CONCERN_CATEGORIES 등 카테고리별 순환 로직은
 * 유일한 호출부였던 components/recipe-card.tsx(앱 어디서도 렌더되지 않던 죽은
 * 컴포넌트)와 함께 삭제됨. Concern/SupportId 타입, RoutineCopy 인터페이스,
 * getCompletionCopy()는 다른 살아있는 파일에서 계속 쓰여 남겨둔다.
 */

export interface RoutineCopy {
  title: string
  detail: string
  caution?: string
}

/** 체커의 오늘 피부 상태(symptom) 문항에서 넘어오는 관심사 */
export type Concern = "dry" | "flush" | "flaky" | "trouble" | "none"
/** 유저가 이미 갖고 있다고 답한 성분 id (콤마 구분 URL 파라미터) */
export type SupportId = "hya" | "cica" | "nia" | "cer"

/** 코스 마지막 날에 보여줄 완주 화면 문구 */
export function getCompletionCopy(totalDays: number, locale: Locale = "ko"): RoutineCopy {
  const completion = t("routine.completion", locale)
  const detail = interpolate(completion.detail_template, { totalDays: String(totalDays) })
  return {
    title: completion.title,
    detail,
  }
}
