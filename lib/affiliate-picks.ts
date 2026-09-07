/**
 * 호빵이 추천 픽 (어필리에이트) — 오늘 DO로 선정된 핵심 케어의 slot에 매핑해
 * 미니 배너 1개를 노출한다.
 *
 * ⚠️ 현재는 더미 데이터다. affiliateUrl은 올리브영 검색 링크(실동작)로 채워둔 자리표시자이며,
 *    추후 실제 파트너스 트래킹 URL로 교체한다. 문구/브랜드는 예시.
 */

import type { SlotType } from "@/lib/slot-mapping"

export interface AffiliatePick {
  /** 제품명 */
  title: string
  brand: string
  /** 한 줄 설명 — 왜 오늘 이걸 추천하는지 */
  description: string
  /** 클릭 시 새 창으로 열리는 링크 */
  affiliateUrl: string
}

const oliveYoungSearch = (q: string) =>
  `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(q)}`

/** slot → 대표 추천 픽 1개 (더미) */
export const AFFILIATE_PICKS: Partial<Record<SlotType, AffiliatePick>> = {
  sun_care: {
    brand: "라운드랩",
    title: "자작나무 수분 선크림 SPF50+ PA++++",
    description: "백탁 없이 가볍게 밀착되는 데일리 선크림",
    affiliateUrl: oliveYoungSearch("라운드랩 자작나무 선크림"),
  },
  hydration: {
    brand: "아누아",
    title: "어성초 77 수딩 토너",
    description: "자극받은 날 물광 충전용 저자극 진정 토너",
    affiliateUrl: oliveYoungSearch("아누아 어성초 토너"),
  },
  barrier: {
    brand: "에스트라",
    title: "아토베리어365 크림",
    description: "건조·미세먼지 날 장벽 회복에 집중한 고보습 크림",
    affiliateUrl: oliveYoungSearch("에스트라 아토베리어365 크림"),
  },
  exfoliation: {
    brand: "닥터지",
    title: "브라이트닝 필링 젤",
    description: "피부가 편안한 날, 주 1~2회 순한 각질 정돈",
    affiliateUrl: oliveYoungSearch("닥터지 필링 젤"),
  },
  active: {
    brand: "이니스프리",
    title: "레티놀 시카 흔적 앰플",
    description: "자극 없는 날 밤 루틴에 더하는 입문용 레티놀",
    affiliateUrl: oliveYoungSearch("이니스프리 레티놀 시카 앰플"),
  },
}

export function getAffiliatePick(slot: SlotType): AffiliatePick | null {
  return AFFILIATE_PICKS[slot] ?? null
}
