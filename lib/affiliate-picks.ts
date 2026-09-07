/**
 * 호빵이 추천 픽 (어필리에이트) — 오늘 DO로 선정된 핵심 케어의 slot + 연령대에 매핑해
 * 미니 배너 1개를 노출한다.
 *
 * ⚠️ 현재는 더미 데이터다. affiliateUrl은 올리브영 검색 링크(실동작)로 채워둔 자리표시자이며,
 *    추후 실제 파트너스 트래킹 URL로 교체한다. 문구/브랜드는 예시.
 */

import type { SlotType } from "@/lib/slot-mapping"
import type { AgeGroup } from "@/lib/skin-weather"

export interface AffiliatePick {
  /** 제품명 */
  title: string
  brand: string
  /** 한 줄 설명 — 왜 오늘 이걸 추천하는지 */
  description: string
  /** 클릭 시 새 창으로 열리는 링크 */
  affiliateUrl: string
}

/** slot별 픽 테이블 — default는 필수, 연령대별 오버라이드는 선택 */
type PickTable = { default: AffiliatePick } & Partial<Record<AgeGroup, AffiliatePick>>

const oy = (q: string) =>
  `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(q)}`

export const AFFILIATE_PICKS: Partial<Record<SlotType, PickTable>> = {
  sun_care: {
    default: {
      brand: "라운드랩",
      title: "자작나무 수분 선크림 SPF50+ PA++++",
      description: "백탁 없이 가볍게 밀착되는 데일리 선크림",
      affiliateUrl: oy("라운드랩 자작나무 선크림"),
    },
    "4050": {
      brand: "라로슈포제",
      title: "안뗄리오스 UVMUNE400 크림",
      description: "건조함 없이 촉촉하게 마무리되는 고차단 선크림",
      affiliateUrl: oy("라로슈포제 안뗄리오스 크림"),
    },
    "60plus": {
      brand: "헤라",
      title: "선메이트 데일리 톤업 SPF50+",
      description: "메이크업 베이스 겸용, 화사하게 밀착되는 영양 선크림",
      affiliateUrl: oy("헤라 선메이트"),
    },
  },
  hydration: {
    default: {
      brand: "아누아",
      title: "어성초 77 수딩 토너",
      description: "자극받은 날 물광 충전용 저자극 진정 토너",
      affiliateUrl: oy("아누아 어성초 토너"),
    },
    "4050": {
      brand: "토리든",
      title: "다이브인 저분자 히알루론산 세럼",
      description: "속건조 채우는 5종 히알루론산 고보습 세럼",
      affiliateUrl: oy("토리든 다이브인 세럼"),
    },
    "60plus": {
      brand: "미샤",
      title: "타임레볼루션 나이트 리페어 앰플",
      description: "밤사이 수분·영양을 채우는 고농축 리페어 앰플",
      affiliateUrl: oy("미샤 타임레볼루션 나이트 리페어 앰플"),
    },
  },
  barrier: {
    default: {
      brand: "에스트라",
      title: "아토베리어365 크림",
      description: "건조·미세먼지 날 장벽 회복에 집중한 고보습 크림",
      affiliateUrl: oy("에스트라 아토베리어365 크림"),
    },
    "4050": {
      brand: "닥터자르트",
      title: "세라마이딘 크림",
      description: "세라마이드로 수분막을 밀폐하는 탄탄한 보습 크림",
      affiliateUrl: oy("닥터자르트 세라마이딘 크림"),
    },
    "60plus": {
      brand: "설화수",
      title: "자음생크림",
      description: "고영양 리치 텍스처로 수분 손실을 막는 안티에이징 크림",
      affiliateUrl: oy("설화수 자음생크림"),
    },
  },
  active: {
    default: {
      brand: "이니스프리",
      title: "레티놀 시카 흔적 앰플",
      description: "자극 없는 날 밤 루틴에 더하는 입문용 레티놀",
      affiliateUrl: oy("이니스프리 레티놀 시카 앰플"),
    },
    "4050": {
      brand: "닥터지",
      title: "레드 블레미쉬 비타C 세럼",
      description: "낮 항산화·톤 케어에 더하는 순한 비타민C 세럼",
      affiliateUrl: oy("닥터지 비타C 세럼"),
    },
    "60plus": {
      brand: "AHC",
      title: "텐 레볼루션 아이크림 포 페이스",
      description: "눈가·얼굴 겸용 펩타이드 탄력 아이크림",
      affiliateUrl: oy("AHC 아이크림 포 페이스"),
    },
  },
  exfoliation: {
    default: {
      brand: "닥터지",
      title: "브라이트닝 필링 젤",
      description: "피부가 편안한 날, 주 1~2회 순한 각질 정돈",
      affiliateUrl: oy("닥터지 필링 젤"),
    },
  },
}

export function getAffiliatePick(slot: SlotType, ageGroup: AgeGroup): AffiliatePick | null {
  const table = AFFILIATE_PICKS[slot]
  if (!table) return null
  return table[ageGroup] ?? table.default
}
