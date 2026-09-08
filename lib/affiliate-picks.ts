/**
 * 호빵이 추천 픽 (어필리에이트) — 오늘 DO로 선정된 핵심 케어의 slot + 연령대에 맞춰
 * 2~3개 제품을 "비교 큐레이션" 형태로 노출한다 (가성비 / 더마 / 프리미엄 / 민감성).
 *
 * ⚠️ 현재는 더미 데이터다. affiliateUrl은 oy() 헬퍼(올리브영 검색, 실동작)로 채운
 *    자리표시자이며, 실제 파트너스 트래킹 URL로 그대로 덮어쓰면 된다.
 *
 *    다국어 링크 분기: affiliateUrl에 문자열 대신 { ko, en } 객체를 넣으면
 *    ko(쿠팡 파트너스) / en(아마존 어소시에이트)로 자동 분기된다. 단일 문자열이면
 *    두 locale 공용으로 쓴다.  brand / title / description / tag 도 예시이므로 자유 교체.
 */

import type { SlotType } from "@/lib/slot-mapping"
import type { AgeGroup } from "@/lib/skin-weather"
import type { Locale } from "@/lib/i18n"

/** 큐레이션 성격 태그 — 사용자가 취향/피부타입으로 고르는 기준 */
export type CurationTag = "가성비" | "더마" | "민감성" | "프리미엄"

/** 단일 공용 URL 또는 locale별 URL */
export type LocalizedUrl = string | { ko: string; en: string }

export interface AffiliatePick {
  /** 큐레이션 태그 (선택) */
  tag?: CurationTag
  brand: string
  /** 제품명 (용량·SPF 등 포함 가능) */
  title: string
  /** 한 줄 추천 이유 — "오늘 날씨에 왜 이게 맞는지" (~25자 권장) */
  description: string
  /** 클릭 시 새 창(_blank)으로 열리는 링크. 문자열(공용) 또는 { ko, en } */
  affiliateUrl: LocalizedUrl
}

/** slot 하나당: default 배열 필수 + 연령대별 오버라이드 배열은 선택 */
type PickTable = { default: AffiliatePick[] } & Partial<Record<AgeGroup, AffiliatePick[]>>

const oy = (q: string) =>
  `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(q)}`

const toUrl = (s: string) => (s.startsWith("http") ? s : oy(s))

/**
 * 현재 locale에 맞는 최종 URL 문자열을 고른다.
 * 문자열이면 그대로, { ko, en }이면 해당 locale → 없으면 반대쪽으로 폴백.
 */
export function resolveAffiliateUrl(url: LocalizedUrl, locale: Locale): string {
  if (typeof url === "string") return url
  return url[locale] || url.ko || url.en
}

/** 항목 작성 헬퍼 — 5번째 인자에 실제 링크 문자열 또는 { ko, en } 를 바로 넣어도 됨 */
const p = (
  tag: CurationTag,
  brand: string,
  title: string,
  description: string,
  url: LocalizedUrl,
): AffiliatePick => ({
  tag,
  brand,
  title,
  description,
  affiliateUrl: typeof url === "string" ? toUrl(url) : { ko: toUrl(url.ko), en: toUrl(url.en) },
})

export const AFFILIATE_PICKS: Partial<Record<SlotType, PickTable>> = {
  sun_care: {
    default: [
      p("가성비", "조선미녀", "맑은 쌀 선크림 SPF50+ PA++++", "얇고 촉촉하게 발리는 저자극 데일리 선크림, 부담 없는 가격", "https://link.coupang.com/a/gRhJwU7tDM"),
      p("더마", "라운드랩", "자작나무 수분 선크림 SPF50+", "진정 성분 함유, 백탁 없이 밀착되는 데일리", "https://link.coupang.com/a/gRhTorvc4a"),
      p("프리미엄", "달바", "워터풀 에센스 선크림", "미스트 겸용, 촉촉하게 마무리되는 프리미엄 선에센스", "https://link.coupang.com/a/gRGFiXz9em"),
    ],
    "4050": [
      p("가성비", "AHC", "마스터즈 에어리치 선스틱 SPF50+", "손 안 대고 바르는 보송한 밀착 차단, 외출 시 덧바르기 최적", "https://link.coupang.com/a/gRHbx3P1DE"),
      p("더마", "라로슈포제", "안뗄리오스 UVMUNE400 크림", "고차단인데 건조함 없는 촉촉한 텍스처", "https://link.coupang.com/a/gRHhqhU900"),
      p("프리미엄", "헤라", "헤라 UV프로텍터 톤업 선크림 SPF50+", "톤업 + 영양, 메이크업 베이스 겸용", "https://link.coupang.com/a/gRHszIVdf2"),
    ],
    "60plus": [
      p("더마", "에스트라", "더마UV365 비타C 광채수분 선크림 SPF50+", "장벽 케어까지 겸하는 자극 최소화 선크림", "https://link.coupang.com/a/gRLlozuxYy"),
      p("프리미엄", "오휘", "오휘 데이쉴드 나이아신아마이드 5%", "고영양 안티에이징 선케어, 화사한 마무리", "https://link.coupang.com/a/gRLFL90sGO"),
    ],
  },

  hydration: {
    default: [
      p("가성비", "라운드랩", "1025 독도 토너", "자극받은 날 부담 없이 쓰는 대용량 진정 토너", "https://link.coupang.com/a/gRLKUVqNrw"),
      p("민감성", "아누아", "어성초 77 수딩 토너", "붉어짐·따가움 있는 날 물광 충전용 저자극 토너", "https://link.coupang.com/a/gRLTyZbxpA"),
      p("프리미엄", "닥터지", "레드 블레미쉬 시카 세럼", "진정 + 수분을 한 번에 잡는 시카 앰플", "https://link.coupang.com/a/gRL2Z9gbpA"),
    ],
    "4050": [
      p("가성비", "토리든", "다이브인 저분자 히알루론산 세럼", "속건조 채우는 5종 히알루론산 고보습 세럼", "https://link.coupang.com/a/gRL6m1TvQy"),
      p("더마", "토리든", "셀메이징 저분자 콜라겐 세럼", "속건조를 잡고 탄탄한 밀도감을 채우는 수분 탄력 세럼", "https://link.coupang.com/a/gRQ02h9J0u"),
      p("프리미엄", "에스티로더", "어드밴스드 나이트 리페어", "밤사이 수분·컨디션을 끌어올리는 스테디셀러 세럼", "https://link.coupang.com/a/gRMNwEZY1A"),
    ],
    "60plus": [
      p("더마", "미샤", "타임레볼루션 나이트 리페어 앰플", "밤사이 수분·영양을 채우는 고농축 리페어 앰플", "https://link.coupang.com/a/gRM0Gskb2y"),
      p("프리미엄", "설화수", "윤조 에센스", "수분·영양 흡수를 돕는 첫 단계 에센스", "https://link.coupang.com/a/gRM3qHM4sK"),
    ],
  },

  barrier: {
    default: [
      p("가성비", "일리윤", "세라마이드 아토 로션", "건조·미세먼지 날 부담 없이 장벽 밀폐", "https://link.coupang.com/a/gRNcx7kbkq"),
      p("더마", "에스트라", "아토베리어365 크림 플러스", "장벽 회복에 집중한 고보습 데일리 크림", "https://link.coupang.com/a/gRNk060rUy"),
      p("민감성", "라로슈포제", "시카플라스트 밤 B5+", "각질·트러블·건조 부위 집중 진정 밤", "https://link.coupang.com/a/gRNtMJzjd6"),
    ],
    "4050": [
      p("더마", "닥터자르트", "세라마이딘 크림", "세라마이드로 수분막을 밀폐하는 탄탄한 보습 크림", "https://link.coupang.com/a/gRNAvHzN80"),
      p("프리미엄", "아이오페", "슈퍼바이탈 크림 리치", "농축된 영양감으로 무너진 피부 장벽과 탄력을 밀착 케어", "https://link.coupang.com/a/gRNKKk4Bps"),
    ],
    "60plus": [
      p("더마", "제로이드", "인텐시브 리치 크림", "고보습 세라마이드로 수분 손실 차단", "https://link.coupang.com/a/gRN1FGpHeC"),
      p("프리미엄", "설화수", "자음생크림", "고영양 리치 텍스처의 안티에이징 크림", "https://link.coupang.com/a/gRN7T5R6vQ"),
    ],
  },

  active: {
    default: [
      p("가성비", "이니스프리", "레티놀 시카 흔적 앰플", "자극 없는 날 밤 루틴에 더하는 입문용 레티놀", "https://link.coupang.com/a/gROa8QQiu4"),
      p("민감성", "라로슈포제", "레티놀 B3 세럼", "민감 피부용 저농도 레티놀 + 나이아신아마이드", "https://link.coupang.com/a/gROdNSbfY4"),
      p("프리미엄", "닥터지", "비타민 C 부스터 브라이트닝 세럼", "낮 항산화·톤 케어용 순한 비타민C 세럼", "https://link.coupang.com/a/gROgSFjru8"),
    ],
    "4050": [
      p("더마", "닥터지", "비타민 C 부스터 브라이트닝 세럼", "낮 항산화·톤 케어에 더하는 순한 비타민C 세럼", "https://link.coupang.com/a/gROgSFjru8"),
      p("프리미엄", "AHC", "프리미어 앰플 포 페이스 라인 타이트닝", "처진 눈가와 라인을 탄탄하게 케어하는 고농축 탄력 앰플", "https://link.coupang.com/a/gROExpHnz2"),
    ],
    "60plus": [
      p("더마", "구달", "청귤 비타C 잡티 세럼", "순하게 톤·잡티 케어하는 데일리 비타민C", "https://link.coupang.com/a/gROJugcUxM"),
      p("프리미엄", "오휘", "더 퍼스트 제너츄어 아이 크림", "탄력·주름 집중 고영양 아이크림", "https://link.coupang.com/a/gROLFpcngy"),
    ],
  },

  exfoliation: {
    default: [
      p("가성비", "스킨푸드", "블랙슈가 퍼펙트 에센셜 스크럽", "피부 편안한 날 주 1회 순한 물리적 각질 정돈", "https://link.coupang.com/a/gROVScppdI"),
      p("더마", "닥터지", "브라이트닝 필링 젤", "문질러 쓰는 저자극 필링 젤, 주 1~2회", "https://link.coupang.com/a/gRQKgvbQlM"),
      p("프리미엄", "폴라초이스", "2% BHA 리퀴드", "모공·결 정돈용 화학적 각질제거, 편안한 날만", "https://link.coupang.com/a/gRQQMa7e1Y"),
    ],
  },
}

/** slot + 연령대에 맞는 추천 픽 목록 (없으면 default, 그것도 없으면 빈 배열) */
export function getAffiliatePicks(slot: SlotType, ageGroup: AgeGroup): AffiliatePick[] {
  const table = AFFILIATE_PICKS[slot]
  if (!table) return []
  return table[ageGroup] ?? table.default
}
